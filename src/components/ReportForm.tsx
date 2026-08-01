import React, { useState, useEffect } from "react";
import { Upload, Camera, Sparkles, MapPin, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { Issue } from "../types";
import { useAuth } from "./AuthContext";
import InteractiveMap from "./InteractiveMap";
import { db, storage } from "../lib/firebase";
import { collection, addDoc, updateDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";


const TEST_PHOTO_PRESETS = [
  {
    name: "Urban Pothole",
    category: "Potholes",
    label: "Paved Road Crack",
    data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  },
  {
    name: "Clogged Sewer Drain",
    category: "Drainage blockage",
    label: "Leaves Compacted",
    data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88B9RAgAEfQIA3v8L7AAAAABJRU5ErkJggg=="
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
  const { user, token } = useAuth();
  
  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState("Garbage accumulation");
  
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<any | null>(null);

  const categories = [
    "Garbage accumulation", "Potholes", "Water leakage", 
    "Street light issues", "Drainage blockage", "Abandoned vehicles",
    "Fallen trees", "Vandalism/Graffiti", "Noise complaint", "Other"
  ];

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      if (res.ok) {
        const data = await res.json();
        setAddress(data.display_name || "");
        setCity(data.address?.city || data.address?.town || data.address?.village || "");
        setStateName(data.address?.state || "");
        setCountry(data.address?.country || "");
      }
    } catch (err) {
      console.warn("Reverse geocoding failed");
    }
  };

  useEffect(() => {
    if (clickedCoords) {
      setLat(clickedCoords.lat.toFixed(6));
      setLng(clickedCoords.lng.toFixed(6));
      reverseGeocode(clickedCoords.lat, clickedCoords.lng);
    }
  }, [clickedCoords]);

  const handleLocationUpdate = (latitude: number, longitude: number) => {
    setLat(latitude.toFixed(6));
    setLng(longitude.toFixed(6));
    reverseGeocode(latitude, longitude);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          setImage(event.target.result);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSelectPreset = (data: string, cat: string) => {
    setImage(data);
    setCategory(cat);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorStatus(null);
    setReportResult(null);

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude) || lat === "" || lng === "") {
      setErrorStatus("Please select a location on the map.");
      setSubmitting(false);
      return;
    }

    try {
      // 1. Save complaint to Firestore immediately with status "Pending AI"
      const docRef = await addDoc(collection(db, "complaints"), {
        title: title || `Issue related to ${category}`,
        description: description || `Automatically reported ${category} via system.`,
        category: category || "Unknown",
        severity: "Medium",
        status: "Pending AI",
        createdAt: new Date().toISOString(),
        createdBy: currentUsername,
        reportedBy: user?.uid || "anonymous",
        reporterName: currentUsername,
        latitude: latitude,
        longitude: longitude,
        location: { lat: latitude, lng: longitude, address: "" },
        address: "",
        city: "",
        state: "",
        country: "",
        imageUrl: null,
        image: null,
        upvotes: 0,
        verified: false,
        isMock: false,
        recommendation: "",
        duplicateOfId: null,
        duplicateReason: "",
      });

      // 2. Run independent tasks in parallel
      (async () => {
        try {
          // A. Image Upload
          const uploadPromise = async () => {
            if (!image) return null;
            try {
              const imageRef = ref(storage, `complaints/${docRef.id}_${Date.now()}`);
              await uploadString(imageRef, image, "data_url");
              return await getDownloadURL(imageRef);
            } catch (err) {
              console.error("Image upload failed", err);
              return null;
            }
          };

          // B. Reverse Geocoding with 5s timeout
          const geocodePromise = async () => {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000);
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { signal: controller.signal });
              clearTimeout(timeoutId);
              if (res.ok) {
                const data = await res.json();
                return {
                  address: data.display_name || "",
                  city: data.address?.city || data.address?.town || data.address?.village || "",
                  state: data.address?.state || "",
                  country: data.address?.country || ""
                };
              }
            } catch (err) {
              console.warn("Reverse geocoding timeout or failed", err);
            }
            return { address: "", city: "", state: "", country: "" };
          };

          // C. AI Analysis with 15s timeout
          const aiPromise = async () => {
            const payload = {
              title: title || `Issue related to ${category}`,
              description: description || `Automatically reported ${category} via system.`,
              category,
              latitude,
              longitude,
              image,
              reporterName: currentUsername
            };
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 15000);
              const res = await fetch("/api/issues/report", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload),
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              if (res.ok) {
                const responseData = await res.json();
                return responseData.issue;
              }
            } catch (err) {
              console.warn("AI Analysis timeout or failed", err);
            }
            return {
              title: title || `Issue related to ${category}`,
              description: description || `Automatically reported ${category} via system.`,
              category: "Unknown",
              urgency: "Medium",
              recommendation: "",
              duplicateOfId: null,
              duplicateReason: ""
            };
          };

          const [uploadedUrl, geoData, aiData] = await Promise.all([
            uploadPromise(),
            geocodePromise(),
            aiPromise()
          ]);

          // Update Firestore
          await updateDoc(docRef, {
            title: aiData.title || title || `Issue related to ${category}`,
            description: aiData.description || description || `Automatically reported ${category} via system.`,
            category: aiData.category || "Unknown",
            severity: aiData.urgency || "Medium",
            recommendation: aiData.recommendation || "",
            duplicateOfId: aiData.duplicateOfId || null,
            duplicateReason: aiData.duplicateReason || "",
            status: "Pending",
            address: geoData.address,
            city: geoData.city,
            state: geoData.state,
            country: geoData.country,
            location: { lat: latitude, lng: longitude, address: geoData.address },
            imageUrl: uploadedUrl || null,
            image: uploadedUrl || null,
          });
        } catch (err) {
          console.error("Background tasks failed", err);
        }
      })();

      // Show success, then wait, then redirect
      setReportResult({ 
        title: title || "Issue Reported", 
        urgency: "Medium",
        duplicateOfId: null,
        duplicateReason: "",
        recommendation: ""
      });
      
      setTitle("");
      setDescription("");
      setImage(null);
      
      setTimeout(() => {
        onIssueReported({ id: docRef.id, title, category, status: "Pending AI" } as any);
      }, 2000);

    } catch (error: any) {
      setErrorStatus(error.message || "Failed to submit report");
      setSubmitting(false);
    }
    // We do NOT call setSubmitting(false) on success because we want the spinner/disabled state to remain while redirecting.
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl h-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
      
      <div className="mb-5 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Report an Issue</h2>
          <p className="text-[11px] text-slate-400 mt-1">Leverage AI to automatically route concerns directly to the optimal municipal dispatcher.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
        <div className="space-y-2">
          <label className="block font-medium text-slate-350">Evidence Photo (Optional)</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {TEST_PHOTO_PRESETS.map(preset => (
              <button
                type="button"
                key={preset.name}
                onClick={() => handleSelectPreset(preset.data, preset.category)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] transition-all cursor-pointer ${image === preset.data ? 'bg-indigo-550/20 border-indigo-400 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
              >
                <Camera size={14} className="mb-1 text-indigo-400" />
                <span className="font-semibold block truncate w-full text-center">{preset.name}</span>
              </button>
            ))}
          </div>

          <div className="relative border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white/5 hover:bg-white/10">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {image ? (
              <div className="space-y-2">
                <img src={image} className="h-14 w-auto object-cover opacity-85 mx-auto rounded" alt="Evidence" />
                <p className="text-[10px] text-slate-400">Photo successfully staged.</p>
              </div>
            ) : (
              <div className="space-y-1 text-slate-300">
                <Upload size={18} className="mx-auto text-slate-400" />
                <p className="text-xs">Drag/Drop or Select an image</p>
              </div>
            )}
          </div>
        </div>

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

        <div className="space-y-1.5">
          <label className="block font-medium text-slate-300">Select Location</label>
          <div className="h-64 rounded-xl overflow-hidden border border-white/10 relative z-0">
             <InteractiveMap 
               isDashboard={false}
               draggableMarker={true}
               onMarkerDragEnd={handleLocationUpdate}
               onMapClick={handleLocationUpdate}
               clickedCoords={lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null}
             />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Latitude"
              className="w-1/2 bg-slate-950/45 border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center"
            />
            <input
              type="text"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="Longitude"
              className="w-1/2 bg-slate-950/45 border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center"
            />
          </div>
          {address && (
            <p className="text-[10px] text-slate-400 mt-1 flex items-start gap-1">
               <MapPin size={12} className="text-indigo-400 shrink-0 mt-0.5" />
               <span>{address}</span>
            </p>
          )}
        </div>

        <div className="space-y-2 pt-1 border-t border-white/10">
          <label className="block font-medium text-slate-300">Details</label>
          <input
            type="text"
            placeholder="Issue Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          />
          <textarea
            placeholder="Describe the issue..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !!reportResult}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 border border-white/10 text-white rounded-xl font-bold font-display hover:brightness-110 active:translate-y-0.5 disabled:opacity-50 shadow-md shadow-indigo-500/15 transition flex items-center justify-center space-x-1.5 cursor-pointer z-10 relative"
        >
          {submitting ? (
            <>
              <RefreshCw className="animate-spin" size={14} />
              <span>Submitting Complaint...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-amber-300" />
              <span>Submit Report</span>
            </>
          )}
        </button>
      </form>

      {errorStatus && (
        <div className="mt-4 p-3 bg-red-950/45 border border-red-900/50 rounded-xl text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>Error: {errorStatus}</span>
        </div>
      )}
      {reportResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 p-3 border rounded-xl text-xs leading-relaxed space-y-1 ${reportResult.duplicateOfId ? 'bg-cyan-950/45 border-cyan-800/80 text-cyan-300' : 'bg-emerald-950/45 border-emerald-900/50 text-emerald-300'}`}
        >
          <div className="flex items-center space-x-2 font-bold font-display">
            <span>✅ Complaint submitted successfully</span>
          </div>
          <p className="text-[11px] text-slate-350">
            Redirecting to dashboard...
          </p>
        </motion.div>
      )}
    </div>
  );
}
