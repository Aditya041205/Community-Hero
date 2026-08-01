import React, { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Issue } from "../types";
import { MapPin, Maximize, Target, Navigation2, Search, Filter } from "lucide-react";

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface InteractiveMapProps {
  issues?: Issue[];
  onLocationClick?: (lat: number, lng: number) => void;
  clickedCoords?: { lat: number, lng: number } | null;
  selectedIssueId?: string | null;
  onSelectIssueId?: (issueId: string) => void;
  isDashboard?: boolean;
  draggableMarker?: boolean;
  onMarkerDragEnd?: (lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

// Custom icons based on status
const getStatusColor = (status: string) => {
  if (status === "Assigned") return "#f97316"; // orange-500
  if (status === "In Progress") return "#3b82f6"; // blue-500
  if (status === "Resolved") return "#22c55e"; // green-500
  if (status === "Archived" || status === "Closed") return "#1e293b"; // slate-800
  return "#ef4444"; // Pending -> red-500
};

const createCustomIcon = (status: string) => {
  const color = getStatusColor(status);
  const markerHtml = `
    <div style="background-color: ${color}; width: 1.5rem; height: 1.5rem; border-radius: 9999px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">
      <div style="width: 0.5rem; height: 0.5rem; background-color: white; border-radius: 9999px;"></div>
    </div>
  `;

  return L.divIcon({
    html: markerHtml,
    className: "custom-leaflet-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const pulsingIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center h-8 w-8">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 border-2 border-white shadow-lg"></span>
    </div>
  `,
  className: "pulsing-leaflet-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Component to handle map clicks
function MapEvents({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component to recenter map
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function InteractiveMap({
  issues = [],
  onLocationClick,
  clickedCoords,
  selectedIssueId,
  onSelectIssueId,
  isDashboard = true,
  draggableMarker = false,
  onMarkerDragEnd,
  onMapClick
}: InteractiveMapProps) {
  const [center, setCenter] = useState<[number, number]>(clickedCoords ? [clickedCoords.lat, clickedCoords.lng] : [28.6139, 77.2090]); // Default New Delhi

  useEffect(() => {
    if (clickedCoords && !isDashboard) {
      setCenter([clickedCoords.lat, clickedCoords.lng]);
    }
  }, [clickedCoords?.lat, clickedCoords?.lng, isDashboard]); // Center when clickedCoords changes


  const [zoom, setZoom] = useState(12);
  const [layer, setLayer] = useState<"street" | "satellite">("street");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterUrgency, setFilterUrgency] = useState<string>("All");
  
  const mapRef = useRef<L.Map>(null);

  const tileLayers = {
    street: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
  };

  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter: [number, number] = [position.coords.latitude, position.coords.longitude];
          setCenter(newCenter);
          setZoom(17);
          if (onLocationClick) {
            onLocationClick(position.coords.latitude, position.coords.longitude);
          }
          if (onMapClick) {
            onMapClick(position.coords.latitude, position.coords.longitude);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Location permission denied. Please select the location manually.");
        }
      );
    }
  };

  const handleFullscreen = () => {
    const mapElement = document.getElementById("leaflet-map-container");
    if (!mapElement) return;
    if (!document.fullscreenElement) {
      mapElement.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  console.log("[DEBUG] Map rendered.");
  const filteredIssues = issues.filter(i => {
    const matchStatus = filterStatus === "All" || i?.status === filterStatus || (filterStatus === "Pending" && i?.status === "Reported"); // Handle Reported as Pending
    const matchCategory = filterCategory === "All" || i?.category === filterCategory;
    const matchUrgency = filterUrgency === "All" || i?.urgency === filterUrgency;
    return matchStatus && matchCategory && matchUrgency;
  });

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-lg border border-slate-800" id="leaflet-map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", background: "#0f172a", zIndex: 0 }}
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution={layer === "street" ? '&copy; OpenStreetMap' : 'Tiles &copy; Esri'}
          url={tileLayers[layer]}
        />
        
        <MapEvents onMapClick={onMapClick || onLocationClick} />
        <MapController center={center} zoom={zoom} />

        {isDashboard ? (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={40}
            showCoverageOnHover={false}
          >
            {filteredIssues.map(issue => {
              if (!issue) return null;
              const lat = issue.latitude ?? issue.location?.lat;
              const lng = issue.longitude ?? issue.location?.lng;
              if (lat === undefined || lng === undefined || lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
                return null; // Skip marker if coordinates are missing
              }
              return (
              <Marker
                key={issue?.id}
                position={[lat, lng]}
                icon={createCustomIcon(issue?.status)}
                eventHandlers={{
                  click: () => onSelectIssueId && onSelectIssueId(issue?.id)
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[200px]">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 text-sm max-w-[150px] truncate">{issue.title}</h3>
                    </div>
                    <p className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 inline-block mb-2">{issue?.category}</p>
                    <p className="text-[10px] text-slate-500 mb-3">{new Date(issue.createdAt).toLocaleDateString()}</p>
                    
                    <div className="flex flex-col gap-1.5 mb-3">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-semibold text-slate-700">{issue?.status}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Priority:</span>
                        <span className="font-semibold uppercase text-slate-700">{issue.urgency}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Reporter:</span>
                        <span className="font-semibold text-slate-700 truncate max-w-[90px]">{issue.reporterName || issue.author || "Anonymous"}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.google.com/maps?q=${issue?.latitude || issue?.location?.lat || 0},${issue?.longitude || issue?.location?.lng || 0}`, '_blank');
                        }}
                        className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors"
                      >
                        <MapPin size={12} /> View on Google Maps
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${issue?.latitude || issue?.location?.lat || 0},${issue?.longitude || issue?.location?.lng || 0}`, '_blank');
                        }}
                        className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors"
                      >
                        <Navigation2 size={12} /> Navigate
                      </button>
                    </div>
                    {onSelectIssueId && (
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           onSelectIssueId(issue?.id);
                         }}
                         className="w-full mt-2 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded flex items-center justify-center transition-colors"
                       >
                         View Details
                       </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
            })}
          </MarkerClusterGroup>
        ) : (
          <>
            {clickedCoords && (
              <Marker 
                position={[clickedCoords.lat, clickedCoords.lng]} 
                icon={pulsingIcon}
                draggable={draggableMarker}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    if (onMarkerDragEnd) {
                      onMarkerDragEnd(position.lat, position.lng);
                    }
                  }
                }}
              >
                <Popup>Selected Location</Popup>
              </Marker>
            )}
          </>
        )}
      </MapContainer>

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setLayer(l => l === "street" ? "satellite" : "street")}
          className="bg-slate-900/90 p-2 rounded-xl text-white shadow-lg border border-slate-700 hover:bg-slate-800 transition-colors"
          title="Toggle Map Style"
        >
          <MapPin size={18} />
        </button>
        <button
          type="button"
          onClick={locateUser}
          className="bg-indigo-600/90 p-2 rounded-xl text-white shadow-lg border border-indigo-500 hover:bg-indigo-500 transition-colors"
          title="Locate Me"
        >
          <Target size={18} />
        </button>
        <button
          type="button"
          onClick={handleFullscreen}
          className="bg-slate-900/90 p-2 rounded-xl text-white shadow-lg border border-slate-700 hover:bg-slate-800 transition-colors hidden sm:block"
          title="Fullscreen"
        >
          <Maximize size={18} />
        </button>
      </div>

      {isDashboard && (
        <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-2 shadow-xl flex gap-2">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-2 py-1 outline-none"
          >
            <option value="All">All Complaints</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      )}
      
      {/* Legend */}
      {isDashboard && (
        <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-xl text-xs max-w-[200px]">
          <h4 className="text-white font-bold mb-2 pb-1 border-b border-slate-700 uppercase tracking-wider text-[10px]">Status Legend</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span><span className="text-slate-300">Pending</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></span><span className="text-slate-300">Assigned</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span><span className="text-slate-300">In Progress</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></span><span className="text-slate-300">Resolved</span></div>
            <div className="flex items-center gap-2 col-span-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-800 shadow-sm border border-slate-600"></span><span className="text-slate-300">Archived</span></div>
          </div>
        </div>
      )}
      
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .leaflet-popup-content {
          margin: 12px;
        }
        .leaflet-container a.leaflet-popup-close-button {
          padding: 6px;
          color: #64748b;
        }
        .leaflet-container a.leaflet-popup-close-button:hover {
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}
