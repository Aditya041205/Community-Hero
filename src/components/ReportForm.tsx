import React, { useState } from "react";
import { Upload, Camera, Sparkles, MapPin, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { Issue } from "../types";

// High fidelity preset image placeholders representing common civil issues to make testing direct & beautiful!
const TEST_PHOTO_PRESETS = [
  {
    name: "Urban Pothole",
    category: "Potholes",
    label: "Paved Road Crack",
    // Small realistic base-64 representation of a pothole icon or low-res picture
    data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  },
  {
    name: "Clogged Sewer Drain",
    category: "Drainage blockage",
    label: "Leaves Compacted",
    data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88B9RAgAEfQIA3v8L7AAAAABJRU5ErkJggg=="
  },
  {
    name: "Gushing Pipe Leak",
    category: "Water leakage",
    label: "Water Main Burst",
    data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQ8BAn511e0AAAAASUVORK5CYII="
  },
  {
    name: "Overflowing Bin",
    category: "Garbage accumulation",
    label: "Trash Dump Backside",
    data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88J8hAgAEfAIB4d+vXAAAAABJRU5ErkJggg=="
  }
];

interface ReportFormProps {
  onIssueReported: (newIssue: Issue) => void;
  clickedCoords: { lat: number; lng: number } | null;
  onClearCoords: () => void;
  currentUsername: string;
}

export default function ReportForm({
  onIssueReported,
  clickedCoords,
  onClearCoords,
  currentUsername
}: ReportFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Potholes");
  const [lat, setLat] = useState(clickedCoords ? clickedCoords.lat.toString() : "40.7500");
  const [lng, setLng] = useState(clickedCoords ? clickedCoords.lng.toString() : "-73.9800");
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportResult, setReportResult] = useState<Issue | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Sync coords if the user clicked on the map
  React.useEffect(() => {
    if (clickedCoords) {
      setLat(clickedCoords.lat.toFixed(5));
      setLng(clickedCoords.lng.toFixed(5));
    }
  }, [clickedCoords]);

  // Handle manual file uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setErrorStatus(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run reporting transaction with Express backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorStatus(null);
    setReportResult(null);

    try {
      const response = await fetch("/api/issues/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined, // undefined forces Gemini auto-generation
          description: description.trim() || undefined,
          category,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          image,
          reporterName: currentUsername
        })
      });

      if (!response.ok) {
        throw new Error("Municipal Network rejected reporting ticket.");
      }

      const reportedIssue = await response.json();
      setReportResult(reportedIssue);
      onIssueReported(reportedIssue);
      
      // Clear reporting fields
      setTitle("");
      setDescription("");
      setImage(null);
      onClearCoords();
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "An error occurred compiling issue.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPreset = (presetData: string, presetCat: string) => {
    setImage(presetData);
    setCategory(presetCat);
    // Suggest autofilling title/desc empty to let Gemini showcase magic
    setTitle("");
    setDescription("");
  };

  const categories = ["Potholes", "Water leakage", "Garbage accumulation", "Broken streetlights", "Drainage blockage"];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-center space-x-2 border-b border-white/10 pb-3.5 mb-4">
        <Sparkles size={18} className="text-indigo-400" />
        <h3 className="font-bold text-white font-display text-sm md:text-base">AI-Powered Ticket Reporter</h3>
      </div>

      {clickedCoords && (
        <div className="mb-4 bg-indigo-950/40 border border-indigo-700/30 rounded-xl p-3 flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center space-x-2">
            <MapPin size={14} className="text-indigo-400 animate-bounce" />
            <span>Map Pin synced: {clickedCoords.lat.toFixed(4)}, {clickedCoords.lng.toFixed(4)}</span>
          </div>
          <button
            onClick={onClearCoords}
            className="text-[10px] text-slate-400 hover:text-white underline font-semibold cursor-pointer"
          >
            Reset Coords
          </button>
        </div>
      )}

      {/* Main reporting form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
        {/* Presets and Upload Center */}
        <div className="space-y-2">
          <label className="block font-medium text-slate-350">Evidence Photo (Optional - Triggers AI Analysis)</label>
          
          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            {TEST_PHOTO_PRESETS.map(preset => (
              <button
                type="button"
                key={preset.name}
                onClick={() => handleSelectPreset(preset.data, preset.category)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] transition-all cursor-pointer ${image === preset.data ? 'bg-indigo-550/20 border-indigo-400 text-indigo-300 shadow-md shadow-indigo-500/15' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}
              >
                <Camera size={14} className="mb-1 text-indigo-400" />
                <span className="font-semibold block truncate w-full text-center">{preset.name}</span>
                <span className="text-[8px] text-slate-500 block uppercase font-mono">{preset.label}</span>
              </button>
            ))}
          </div>

          {/* Core file drop zone */}
          <div className="relative border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white/5 hover:bg-white/10 transition-all">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {image ? (
              <div className="space-y-2">
                <div className="relative inline-block border border-white/20 rounded-lg overflow-hidden">
                  <img src={image} className="h-14 w-auto object-cover opacity-85" alt="Evidence" />
                  <span className="absolute bottom-0 right-0 bg-indigo-650 text-white font-mono text-[7px] px-1 py-0.5 rounded border border-white/10 shadow-sm">LOADED</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Photo successfully staged. Gemini Vision is primed!</p>
              </div>
            ) : (
              <div className="space-y-1 text-slate-300">
                <Upload size={18} className="mx-auto text-slate-400" />
                <p className="text-xs">Drag/Drop or Select an image</p>
                <p className="text-[9px] text-slate-500 font-medium">Supports standard JPG/PNG file buffers</p>
              </div>
            )}
          </div>
        </div>

        {/* Categories picker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block font-medium text-slate-300">Issue Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950/45 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
              ))}
            </select>
          </div>

          {/* Coordinate settings */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="block font-medium text-slate-300">Latitude</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-slate-950/45 border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-medium text-slate-300">Longitude</label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-slate-950/45 border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center"
              />
            </div>
          </div>
        </div>

        {/* Conditional Manual text fields */}
        <div className="space-y-3 pt-1 border-t border-white/10">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-tight">
            <span>Manual Description Override (Optional)</span>
            <span className="text-[10px] text-indigo-400 font-semibold text-right">Blank prompts Auto-Generate!</span>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="E.g., Pothole obstructing Broadway main lane"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
            />
            <textarea
              placeholder="Describe what repair crews should look out for..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 resize-none"
            />
          </div>
        </div>

        {/* Submit handle triggers */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 border border-white/10 text-white rounded-xl font-bold font-display hover:brightness-110 active:translate-y-0.5 disabled:opacity-50 shadow-md shadow-indigo-500/15 transition flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          {submitting ? (
            <>
              <RefreshCw className="animate-spin" size={14} />
              <span>Gemini is analyzing issue, please wait...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-amber-300" />
              <span>Submit Smart AI Report Ticket</span>
            </>
          )}
        </button>
      </form>

      {/* Verification alerts or duplicate alerts */}
      {errorStatus && (
        <div className="mt-4 p-3 bg-red-950/45 border border-red-900/50 rounded-xl text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>Error compiling report: {errorStatus}</span>
        </div>
      )}

      {reportResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 p-3 border rounded-xl text-xs leading-relaxed space-y-1 ${reportResult.duplicateOfId ? 'bg-cyan-950/45 border-cyan-800/80 text-cyan-300' : 'bg-emerald-950/45 border-emerald-900/50 text-emerald-300'}`}
        >
          <div className="flex items-center space-x-2 font-bold font-display">
            <span role="img" aria-label="Alert">
              {reportResult.duplicateOfId ? "🔄 Proximity Anti-Duplicate Triggered" : "🎉 Ticket Dispatched Successfully!"}
            </span>
          </div>
          <p className="text-[11px] text-slate-350">
            {reportResult.duplicateOfId 
              ? `Note: ${reportResult.duplicateReason}`
              : `Complaint identified as "${reportResult.title}" (Urgency: ${reportResult.urgency}). Gemini auto-assigned this to standard municipal teams for evaluation.`
            }
          </p>
          {reportResult.recommendation && (
            <p className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
              AI Recommendation: {reportResult.recommendation}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
