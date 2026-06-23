import React, { useState, useRef } from "react";
import { 
  Map as MapIcon, 
  Layers, 
  RotateCcw, 
  Eye, 
  Plus, 
  Minus, 
  Key, 
  Play, 
  Sparkles
} from "lucide-react";
import { Issue } from "../types";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

interface InteractiveMapProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssueId: (id: string | null) => void;
  onMapClick: (lat: number, lng: number) => void;
  clickedCoords?: { lat: number; lng: number } | null;
}

const getApiKey = () => {
  try {
    return (
      (typeof process !== "undefined" && process?.env?.GOOGLE_MAPS_PLATFORM_KEY) ||
      (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
      (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
      ""
    );
  } catch (e) {
    return "";
  }
};

const API_KEY = getApiKey();

const hasValidKey = Boolean(API_KEY) && /^AIzaSy[A-Za-z0-9_-]{33}$/.test(API_KEY.trim());

export default function InteractiveMap({
  issues,
  selectedIssueId,
  onSelectIssueId,
  onMapClick,
  clickedCoords
}: InteractiveMapProps) {
  // Toggle states
  const [mapAuthFailed, setMapAuthFailed] = useState<boolean>(false);
  const [useRealGoogleMap, setUseRealGoogleMap] = useState<boolean>(false);
  const [mapLayer, setMapLayer] = useState<"vector" | "satellite">("vector");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("All");
  const [activeUrgencyFilter, setActiveUrgencyFilter] = useState<string>("All");
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);

  React.useEffect(() => {
    const previousAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn("Google Maps auth failure detected. Falling back to simulator.");
      setMapAuthFailed(true);
      setUseRealGoogleMap(false);
      if (previousAuthFailure) {
        try {
          previousAuthFailure();
        } catch (e) {
          // ignore
        }
      }
    };
    return () => {
      (window as any).gm_authFailure = previousAuthFailure;
    };
  }, []);

  // Fallback simulator Zoom & Pan states (for vector map fallback)
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragOffsetStart, setDragOffsetStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMovedDuringDrag, setHasMovedDuringDrag] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Sector boundaries mapping (for mock SVG map fallback alignment with NYC coordinates):
  const lngMin = -74.015;
  const lngMax = -73.970;
  const latMin = 40.720;
  const latMax = 40.762;

  const latToPercent = (lat: number) => {
    const pct = ((latMax - lat) / (latMax - latMin)) * 100;
    return Math.max(5, Math.min(95, pct));
  };

  const lngToPercent = (lng: number) => {
    const pct = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    return Math.max(5, Math.min(95, pct));
  };

  // Click on SVG mock map
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (hasMovedDuringDrag) return;
    if (!mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const xLocal = e.clientX - rect.left;
    const yLocal = e.clientY - rect.top;

    const wrapperX = (xLocal - offset.x) / scale;
    const wrapperY = (yLocal - offset.y) / scale;

    const xPct = (wrapperX / rect.width) * 100;
    const yPct = (wrapperY / rect.height) * 100;

    const clickedLng = lngMin + (Math.max(0, Math.min(100, xPct)) / 100) * (lngMax - lngMin);
    const clickedLat = latMax - (Math.max(0, Math.min(100, yPct)) / 100) * (latMax - latMin);

    onMapClick(clickedLat, clickedLng);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setHasMovedDuringDrag(false);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffsetStart({ x: offset.x, y: offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      setHasMovedDuringDrag(true);
    }
    const maxOffset = (scale - 1) * 350;
    const nextX = dragOffsetStart.x + dx;
    const nextY = dragOffsetStart.y + dy;
    setOffset({
      x: scale === 1 ? 0 : Math.max(-maxOffset - 300, Math.min(300, nextX)),
      y: scale === 1 ? 0 : Math.max(-maxOffset - 200, Math.min(200, nextY))
    });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = 1.1;
    let nextScale = scale;
    if (e.deltaY < 0) {
      nextScale = Math.min(4, scale * zoomFactor);
    } else {
      nextScale = Math.max(1, scale / zoomFactor);
    }
    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const wrapperX = (cursorX - offset.x) / scale;
      const wrapperY = (cursorY - offset.y) / scale;
      const nextOffsetX = cursorX - wrapperX * nextScale;
      const nextOffsetY = cursorY - wrapperY * nextScale;
      if (nextScale === 1) {
        setOffset({ x: 0, y: 0 });
      } else {
        const maxOffset = (nextScale - 1) * 350;
        setOffset({
          x: Math.max(-maxOffset - 300, Math.min(300, nextOffsetX)),
          y: Math.max(-maxOffset - 200, Math.min(200, nextOffsetY))
        });
      }
    }
    setScale(nextScale);
  };

  const handleZoomIn = () => {
    setScale(prev => {
      const next = Math.min(4, prev + 0.5);
      if (next === prev) return prev;
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const wrapperX = (centerX - offset.x) / prev;
        const wrapperY = (centerY - offset.y) / prev;
        setOffset({
          x: centerX - wrapperX * next,
          y: centerY - wrapperY * next
        });
      }
      return next;
    });
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const next = Math.max(1, prev - 0.5);
      if (next === 1) {
        setOffset({ x: 0, y: 0 });
      } else if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const wrapperX = (centerX - offset.x) / prev;
        const wrapperY = (centerY - offset.y) / prev;
        setOffset({
          x: centerX - wrapperX * next,
          y: centerY - wrapperY * next
        });
      }
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Google Map Real interactions
  const handleGoogleMapClick = (e: any) => {
    if (e.detail?.latLng) {
      onMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
    } else if (e.latLng) {
      onMapClick(e.latLng.lat(), e.latLng.lng());
    }
  };

  // Run categorical and urgency filters on issues
  const filteredIssues = issues.filter(issue => {
    const catMatch = activeCategoryFilter === "All" || issue.category === activeCategoryFilter;
    const urgencyMatch = activeUrgencyFilter === "All" || issue.urgency === activeUrgencyFilter;
    return catMatch && urgencyMatch;
  });

  const categories = ["All", "Potholes", "Water leakage", "Garbage accumulation", "Broken streetlights", "Drainage blockage"];
  const urgencies = ["All", "Critical", "High", "Medium", "Low"];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Critical": return "bg-red-500 ring-red-400";
      case "High": return "bg-orange-500 ring-orange-400";
      case "Medium": return "bg-yellow-500 ring-yellow-400";
      default: return "bg-blue-500 ring-blue-400";
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-lg h-full flex flex-col justify-between relative z-10 w-full">
      
      {/* Map Control bar */}
      <div className="p-4 border-b border-white/10 bg-slate-950/25 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs md:text-sm">
        <div className="flex items-center space-x-2">
          <MapIcon size={16} className="text-indigo-400 animate-pulse" />
          <span className="font-semibold text-white font-display">
            {useRealGoogleMap ? "Interactive Google Map" : "Virtual Simulator Map"}
          </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${useRealGoogleMap ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'}`}>
            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 animate-pulse ${useRealGoogleMap ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
            {useRealGoogleMap ? "Live Google Map" : "Simulator Mode"}
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
          {/* Map Model Selector */}
          <div className="bg-slate-900/60 p-0.5 border border-white/10 rounded-lg flex space-x-0.5">
            <button
              onClick={() => setUseRealGoogleMap(true)}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition cursor-pointer ${useRealGoogleMap ? 'bg-indigo-650 border border-white/10 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Google Map
            </button>
            <button
              onClick={() => setUseRealGoogleMap(false)}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition cursor-pointer ${!useRealGoogleMap ? 'bg-indigo-650 border border-white/10 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Simulator
            </button>
          </div>

          <button
            onClick={() => setMapLayer(prev => prev === "vector" ? "satellite" : "vector")}
            className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-200 hover:text-white hover:bg-white/10 font-medium transition flex items-center space-x-1 cursor-pointer"
          >
            <Layers size={11} />
            <span className="capitalize">{mapLayer === "vector" ? "Satellite" : "Roads"}</span>
          </button>
          <button
            onClick={() => setShowHeatmap(p => !p)}
            className={`px-2.5 py-1.5 rounded-lg border font-medium transition flex items-center space-x-1 cursor-pointer ${showHeatmap ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'}`}
          >
            <Eye size={11} strokeWidth={2.5} />
            <span>Heatmap</span>
          </button>
        </div>
      </div>

      {/* Map Filter rail */}
      <div className="p-3 bg-white/5 backdrop-blur-md border-b border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] mr-1">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-3 py-0.5 rounded-full transition-all border text-[10px] cursor-pointer ${activeCategoryFilter === cat ? 'bg-gradient-to-tr from-blue-500 to-indigo-650 border-white/10 text-white font-semibold shadow-sm' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 justify-start md:justify-end">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px] mr-1">Urgency:</span>
          {urgencies.map(u => (
            <button
              key={u}
              onClick={() => setActiveUrgencyFilter(u)}
              className={`px-3 py-0.5 rounded-full transition-all border text-[10px] cursor-pointer ${activeUrgencyFilter === u ? 'bg-gradient-to-tr from-yellow-500 to-amber-600 border-white/10 text-white font-semibold shadow-sm' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'}`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Actual Map Canvas Area */}
      <div
        ref={mapContainerRef}
        className="relative flex-1 min-h-[350px] md:min-h-[460px] bg-slate-950 overflow-hidden"
      >
        {useRealGoogleMap && hasValidKey && !mapAuthFailed ? (
          /* Google Maps Live Container */
          <APIProvider apiKey={API_KEY} version="weekly" libraries={["marker"]}>
            <Map
              defaultCenter={{ lat: 40.7410, lng: -73.9920 }}
              defaultZoom={14}
              mapTypeId={mapLayer === "satellite" ? "satellite" : "roadmap"}
              mapId="DEMO_MAP_ID"
              gestureHandling="greedy"
              onClick={handleGoogleMapClick}
              clickableIcons={false}
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Hotspot density simulation heatmap circular layers */}
              {showHeatmap && (
                <>
                  {/* Midtown Hotspot */}
                  <AdvancedMarker position={{ lat: 40.7484, lng: -73.9857 }}>
                    <div 
                      className="relative flex items-center justify-center pointer-events-none -translate-x-1/2 -translate-y-1/2" 
                      style={{ width: "200px", height: "200px" }}
                    >
                      <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse blur-2xl font-sans" />
                      <div className="absolute w-24 h-24 bg-orange-500/30 rounded-full animate-ping blur-xl font-sans" />
                    </div>
                  </AdvancedMarker>
                  {/* Downtown Hotspot */}
                  <AdvancedMarker position={{ lat: 40.7306, lng: -73.9953 }}>
                    <div 
                      className="relative flex items-center justify-center pointer-events-none -translate-x-1/2 -translate-y-1/2" 
                      style={{ width: "160px", height: "160px" }}
                    >
                      <div className="absolute inset-0 bg-yellow-500/25 rounded-full animate-pulse blur-2xl font-sans" />
                      <div className="absolute w-16 h-16 bg-amber-500/30 rounded-full animate-ping blur-xl font-sans" />
                    </div>
                  </AdvancedMarker>
                  {/* East Port Hotspot */}
                  <AdvancedMarker position={{ lat: 40.7410, lng: -73.9740 }}>
                    <div 
                      className="relative flex items-center justify-center pointer-events-none -translate-x-1/2 -translate-y-1/2" 
                      style={{ width: "150px", height: "150px" }}
                    >
                      <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse blur-2xl font-sans" />
                      <div className="absolute w-16 h-16 bg-red-400/20 rounded-full animate-ping blur-lg font-sans" />
                    </div>
                  </AdvancedMarker>
                </>
              )}

              {/* Citizen Reported Issue Pins */}
              {filteredIssues.map(issue => {
                const isSelected = selectedIssueId === issue.id;
                return (
                  <AdvancedMarker
                    key={issue.id}
                    position={{ lat: issue.latitude, lng: issue.longitude }}
                    onClick={() => {
                      onSelectIssueId(isSelected ? null : issue.id);
                    }}
                  >
                    {/* Visual Marker Pin - With explicit sizing to prevent CF3 */}
                    <div 
                      className="relative group cursor-pointer"
                      style={{ width: '32px', height: '32px' }}
                    >
                      <div className={`map-pin-pulse relative flex items-center justify-center h-8 w-8 rounded-full shadow-lg border transition-all duration-300 ${isSelected ? 'scale-125 z-20 border-white ring-4' : 'border-slate-800 hover:scale-115 ring-2'} ${getUrgencyColor(issue.urgency)}`}>
                        <span className="text-[10px] font-bold text-white uppercase text-center font-display">
                          {issue.category.substring(0, 1)}
                        </span>
                        
                        {issue.duplicateOfId && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-450"></span>
                          </span>
                        )}
                      </div>

                      {/* Float Hover Mini Tooltip Card */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block z-30 bg-slate-950 border border-slate-750 text-slate-200 rounded-lg p-2.5 shadow-2xl min-w-[190px] text-[11px] leading-tight transition-all duration-300">
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className="text-white truncate max-w-[110px]">{issue.title}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${issue.status === 'Resolved' ? 'bg-emerald-950 border border-emerald-900 text-emerald-400' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}>
                            {issue.status}
                          </span>
                        </div>
                        <p className="text-slate-400 line-clamp-2 my-1">{issue.description}</p>
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                          <span>Upvotes: {issue.upvotes}</span>
                          <span>Urgency: <span className="font-bold uppercase">{issue.urgency}</span></span>
                        </div>
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* Pulsating user placement click sync pin */}
              {clickedCoords && (
                <AdvancedMarker position={clickedCoords}>
                  <div 
                    className="flex items-center justify-center animate-bounce z-50 -translate-x-1/2 -translate-y-full"
                    style={{ width: "36px", height: "36px" }}
                  >
                    <div className="h-9 w-9 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center shadow-lg relative ring-4 ring-indigo-500/30">
                      <span className="text-white font-bold text-xs">📍</span>
                      <span className="absolute -inset-1 rounded-full animate-ping border border-indigo-400 opacity-60 pointer-events-none" />
                    </div>
                  </div>
                </AdvancedMarker>
              )}
            </Map>
          </APIProvider>
        ) : useRealGoogleMap && !hasValidKey ? (
          /* API Key Required Splash Screen */
          <div className="absolute inset-0 bg-slate-950 flex items-center justify-center p-6 text-slate-300">
            <div className="max-w-md w-full bg-slate-900/90 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative z-10 space-y-4">
              <div className="flex items-center space-x-3 text-indigo-400 font-display">
                <Key className="h-6 w-6 animate-pulse" />
                <h3 className="text-base font-bold text-white">Google Maps API Key Required</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect the live Google Maps Platform to access real-time satellite imaging, fluid GPS panning, and real-world geolocation reports!
              </p>

              <div className="space-y-2 text-xs border-y border-white/5 py-3">
                <div className="flex items-start space-x-2">
                  <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">STEP 1</span>
                  <p className="text-slate-350">
                    Get a Google Maps API Key:{" "}
                    <a 
                      href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-400 underline hover:text-indigo-300 font-semibold font-sans"
                    >
                      Google Cloud Console
                    </a>
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">STEP 2</span>
                  <p className="text-slate-350">
                    Open <strong className="text-white">Settings</strong> (⚙️ gear icon, top-right of your screen).
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="bg-indigo-500/20 text-indigo-300 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">STEP 3</span>
                  <div className="text-slate-350">
                    Select <strong className="text-white">Secrets</strong>, add <code className="text-white font-mono bg-white/5 px-1 rounded text-[11px]">GOOGLE_MAPS_PLATFORM_KEY</code>, paste your API key, and press Enter.
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 gap-2 pt-2">
                <button
                  onClick={() => setUseRealGoogleMap(false)}
                  className="flex-1 px-4 py-2 bg-indigo-650 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer transition shadow"
                >
                  <Play size={12} />
                  <span>Use Simulated Map</span>
                </button>
              </div>
            </div>
            
            {/* Ambient background decoration */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent pointer-events-none select-none" />
          </div>
        ) : (
          /* Beautiful Interactive Mock Vector Map (Fallback Simulator) */
          <>
            <div
              className="absolute inset-0 select-none touch-none"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: "0 0",
                transition: isDragging ? "none" : "transform 0.1s ease-out"
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {/* SVG stylized map layout */}
              <svg
                viewBox="0 0 1000 600"
                className="w-full h-full absolute top-0 left-0 cursor-grab active:cursor-grabbing select-none"
                onClick={handleSvgClick}
              >
                {/* Layer 1: Background canvas */}
                {mapLayer === "vector" ? (
                  <rect width="1000" height="600" fill="#090d16" />
                ) : (
                  <g>
                    <rect width="1000" height="600" fill="#020e06" />
                    {/* Simulated satellite forest/park overlay and water bodies */}
                    <rect x="0" y="0" width="300" height="150" fill="#04200c" opacity="0.4" rx="40" />
                    <rect x="700" y="350" width="300" height="250" fill="#0b172a" opacity="0.6" />
                  </g>
                )}

                {/* Grid lines and roads block */}
                <g stroke={mapLayer === "vector" ? "#1e293b" : "#334155"} strokeWidth="5" opacity={mapLayer === "vector" ? "0.6" : "0.3"}>
                  {/* Horizontal expressways */}
                  <line x1="0" y1="120" x2="1000" y2="120" />
                  <line x1="0" y1="280" x2="1000" y2="280" />
                  <line x1="0" y1="440" x2="1000" y2="440" />

                  {/* Vertical boulevards */}
                  <line x1="200" y1="0" x2="200" y2="600" />
                  <line x1="450" y1="0" x2="450" y2="600" />
                  <line x1="750" y1="0" x2="750" y2="600" />

                  {/* Diagonals / backstreets */}
                  <line x1="0" y1="0" x2="1000" y2="600" strokeWidth="2.5" strokeDasharray="5" />
                  <line x1="1000" y1="0" x2="0" y2="600" strokeWidth="2.5" strokeDasharray="5" />
                </g>

                {/* Water body / Hudson River replication */}
                <path
                  d="M 1200 100 Q 1100 300 850 450 Q 700 550 550 700"
                  fill="none"
                  stroke={mapLayer === "vector" ? "#0f172a" : "#103c54"}
                  strokeWidth="110"
                  opacity="0.75"
                />

                {/* Localized labels */}
                <g fill="#4338ca" opacity="0.5" fontFamily="Space Grotesk" fontSize="12" fontWeight="bold">
                  <text x="220" y="80">Midtown District</text>
                  <text x="470" y="240">Downtown Village</text>
                  <text x="50" y="520">Riverdale Outskirts</text>
                  <text x="800" y="480">Central Port</text>
                </g>

                {/* Hotspot density simulation heatmap circular layers */}
                {showHeatmap && (
                  <g opacity="0.6">
                    {/* Hotspot 1: Midtown (Busy traffic, many potholes) */}
                    <circle cx="280" cy="180" r="140" fill="url(#heatGradient1)" />
                    {/* Hotspot 2: Downtown Village (High rain density, leaky pipe) */}
                    <circle cx="580" cy="320" r="100" fill="url(#heatGradient2)" />
                    {/* Hotspot 3: East port blockages */}
                    <circle cx="770" cy="220" r="90" fill="url(#heatGradient1)" />
                  </g>
                )}

                {/* Gradient definitions for glowing SVG effects */}
                <defs>
                  <radialGradient id="heatGradient1" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#f97316" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="heatGradient2" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#eab308" stopOpacity="0.75" />
                    <stop offset="70%" stopColor="#f97316" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>

              {/* Interactive Custom Pins Layer - Rendered as absolute divs on top of map to handle rich tooltips and clicks! */}
              {filteredIssues.map(issue => {
                const topPct = latToPercent(issue.latitude);
                const leftPct = lngToPercent(issue.longitude);
                const isSelected = selectedIssueId === issue.id;

                return (
                  <div
                    key={issue.id}
                    className="absolute group z-10"
                    style={{
                      top: `${topPct}%`,
                      left: `${leftPct}%`,
                      transform: `translate(-50%, -100%) scale(${1 / scale})`,
                      transformOrigin: "bottom center"
                    }}
                  >
                    {/* Visual Ring Marker Pin */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIssueId(isSelected ? null : issue.id);
                      }}
                      className={`map-pin-pulse relative flex items-center justify-center h-8 w-8 rounded-full shadow-lg border cursor-pointer transition-all duration-300 ${isSelected ? 'scale-125 z-20 border-white ring-4' : 'border-slate-800 hover:scale-115 ring-2'} ${getUrgencyColor(issue.urgency)}`}
                    >
                      {/* Microicon overlay */}
                      <span className="text-[10px] font-bold text-white uppercase text-center font-display">
                        {issue.category.substring(0, 1)}
                      </span>
                      
                      {/* Mini duplicate glow alert badge */}
                      {issue.duplicateOfId && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-455"></span>
                        </span>
                      )}
                    </button>

                    {/* Float Hover Mini Tooltip Card */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block hover:block z-35 bg-slate-950 border border-slate-750 text-slate-200 rounded-lg p-2.5 shadow-2xl min-w-[190px] text-[11px] leading-tight transition-all duration-300">
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span className="text-white truncate max-w-[110px]">{issue.title}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${issue.status === 'Resolved' ? 'bg-emerald-950 border border-emerald-950 text-emerald-400' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}>
                          {issue.status}
                        </span>
                      </div>
                      <p className="text-slate-400 line-clamp-2 my-1">{issue.description}</p>
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                        <span>Upvotes: {issue.upvotes}</span>
                        <span>Urgency: <span className="font-bold uppercase">{issue.urgency}</span></span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pulsating user placement click sync pin in Simulator */}
              {clickedCoords && (
                <div
                  className="absolute z-40 transition-transform duration-350 animate-bounce"
                  style={{
                    top: `${latToPercent(clickedCoords.lat)}%`,
                    left: `${lngToPercent(clickedCoords.lng)}%`,
                    transform: `translate(-50%, -100%) scale(${1 / scale})`,
                    transformOrigin: "bottom center"
                  }}
                >
                  <div className="h-9 w-9 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center shadow-lg relative ring-4 ring-indigo-500/30">
                    <span className="text-white font-bold text-xs">📍</span>
                    <span className="absolute -inset-1 rounded-full animate-ping border border-indigo-400 opacity-60 pointer-events-none animate-pulse" />
                  </div>
                </div>
              )}
            </div>

            {/* Floating instruction to help citizens customize pins - Simulator specific */}
            <div className="absolute top-2.5 left-2.5 bg-slate-900/95 border border-slate-700/50 rounded-lg p-2 max-w-[210px] text-[10px] text-slate-400 shadow-lg pointer-events-none z-20">
              <p className="font-semibold text-white leading-tight">📍 Interactive Placement Mode</p>
              <p className="mt-1">Click anywhere directly on the city grid canvas to automatically auto-fill coordinates inside the reporting panel. Scroll/pinch or drag to explore!</p>
            </div>

            {/* Floating Zoom Controls - Simulator specific */}
            <div className="absolute top-2.5 right-2.5 bg-slate-950/95 border border-white/10 rounded-2xl p-1.5 flex flex-col space-y-1.5 shadow-xl z-20">
              <button
                onClick={handleZoomIn}
                className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
                title="Zoom In"
              >
                <Plus size={14} className="text-indigo-400 font-bold" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-40"
                title="Zoom Out"
                disabled={scale <= 1}
              >
                <Minus size={14} className="text-indigo-400 font-bold" />
              </button>
              <button
                onClick={handleReset}
                className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
                title="Recenter and Reset Zoom"
              >
                <RotateCcw size={14} className="text-indigo-400 font-bold" />
              </button>
              {scale > 1 && (
                <span className="text-[9px] font-mono font-bold text-center text-slate-400 select-none pb-0.5">
                  {Math.round(scale * 100)}%
                </span>
              )}
            </div>

            {/* Helper to prompt setting key if simulator is being used */}
            {!hasValidKey && (
              <div className="absolute bottom-2.5 left-2.5 z-20">
                <button
                  onClick={() => setUseRealGoogleMap(true)}
                  className="px-2.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 border border-indigo-500/30 rounded-lg text-[10px] text-white font-semibold flex items-center space-x-1 shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <Sparkles size={11} className="text-amber-300 animate-pulse" />
                  <span>Connect Real Google Map</span>
                </button>
              </div>
            )}

            {mapAuthFailed && (
              <div className="absolute bottom-3 left-3 z-20 bg-slate-900/95 border border-red-500/30 rounded-xl p-2.5 max-w-[210px] text-[10px] text-red-200 shadow-xl backdrop-blur-md">
                <p className="font-semibold text-red-400 flex items-center gap-1">
                  <span>⚠️</span> Key Auth Failed
                </p>
                <p className="mt-1 text-slate-400 leading-normal font-sans">
                  The Google Maps credentials are incorrect or expired. Running in virtual simulation.
                </p>
              </div>
            )}
          </>
        )}

        {/* Legend block in bottom corner - Remains fixed across both map types */}
        <div className="absolute bottom-2.5 right-2.5 bg-slate-950/90 border border-slate-800/80 rounded-lg p-2.5 flex flex-col max-w-[210px] text-[10px] shadow-lg z-20">
          <p className="font-bold text-slate-300 text-center uppercase tracking-wider mb-1.5 text-[8px]">Complaint Urgency key</p>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex items-center space-x-1 px-1 py-0.5 rounded bg-slate-900">
              <span className="h-2 w-2 rounded-full bg-red-500 inline-block text-sans" />
              <span className="text-slate-400 font-semibold uppercase text-[8px] text-sans">Critical</span>
            </div>
            <div className="flex items-center space-x-1 px-1 py-0.5 rounded bg-slate-900">
              <span className="h-2 w-2 rounded-full bg-orange-500 inline-block text-sans" />
              <span className="text-slate-400 font-semibold uppercase text-[8px] text-sans">High</span>
            </div>
            <div className="flex items-center space-x-1 px-1 py-0.5 rounded bg-slate-900">
              <span className="h-2 w-2 rounded-full bg-yellow-500 inline-block text-sans" />
              <span className="text-slate-400 font-semibold uppercase text-[8px] text-sans">Medium</span>
            </div>
            <div className="flex items-center space-x-1 px-1 py-0.5 rounded bg-slate-900">
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block text-sans" />
              <span className="text-slate-400 font-semibold uppercase text-[8px] text-sans">Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
