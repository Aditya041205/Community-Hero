import React, { useState, useRef } from "react";
import { Shield, Check, HelpCircle, Eye, CornerDownRight, Upload, Image, AlertCircle, FileText, CheckCircle2, Award, BarChart3, Briefcase } from "lucide-react";
import { Issue } from "../types";
import { useAuth } from "./AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../lib/firebase";

interface AuthorityPanelProps {
  issues: Issue[];
  onUpdateIssueStatus: (id: string, status: Issue["status"], team?: string) => void;
  selectedIssueId: string | null;
  onSelectIssueId: (id: string | null) => void;
  onRefreshData?: () => void;
}

export default function AuthorityPanel({
  issues,
  onUpdateIssueStatus,
  selectedIssueId,
  onSelectIssueId,
  onRefreshData
}: AuthorityPanelProps) {
  const { user, token } = useAuth();
  const [chosenTeam, setChosenTeam] = useState("Midtown Road Paving Crew B");
  const [viewFilter, setViewFilter] = useState<"all" | "assigned">("all");
  
  // Resolution states
  const [resNotes, setResNotes] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [savingResolution, setSavingResolution] = useState(false);
  const [resSuccess, setResSuccess] = useState(false);
  const [resError, setResError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const squadOptions = [
    "Midtown Road Paving Crew B",
    "Rapid Water Infrastructure Support",
    "Eco-Clean Sanitation Squad",
    "Electrical Utilities Technician"
  ];

  // Filter complaints
  const filteredIssues = issues.filter(issue => {
    const isActive = issue.status !== "Resolved" && issue.status !== "Closed";
    if (viewFilter === "assigned") {
      // Deemed assigned if assignedTeam is set or matches authority email specifically
      return isActive && (
        issue.assignedAuthorityEmail === user?.email || 
        (issue.assignedTeam && issue.assignedTeam !== "")
      );
    }
    return isActive;
  });

  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  // File Upload Handlers (Drag & Drop & Browse to Base64)
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setResError("Unsupported file format. Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setResError("File size is too large. Max limit is 2MB.");
      return;
    }

    setUploadingProof(true);
    setResError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImage(reader.result as string);
      setUploadingProof(false);
    };
    reader.onerror = () => {
      setResError("Error reading image file.");
      setUploadingProof(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Resolution API call with notes and photo
  const handleResolveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueId) return;

    setSavingResolution(true);
    setResError(null);
    setResSuccess(false);

    try {
      const res = await fetch(`/api/issues/${selectedIssueId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          resolutionNotes: resNotes,
          resolutionProofImage: proofImage
        })
      });

      if (res.ok) {
        // Update Firestore directly so it persists and syncs in real-time
        try {
          const docRef = doc(db, "complaints", selectedIssueId);
          const newTimelineEvent = {
            id: "tl-" + Math.random().toString(36).substr(2, 9),
            status: "Resolved" as const,
            title: "Complaint Resolved",
            description: resNotes || "Municipal authorities successfully resolved this issue and provided certification.",
            timestamp: new Date().toISOString()
          };

          await updateDoc(docRef, {
            status: "Resolved",
            resolvedAt: new Date().toISOString(),
            resolutionNotes: resNotes || "Resolved by Municipal Authority",
            resolutionProofImage: proofImage || "",
            timeline: arrayUnion(newTimelineEvent)
          });
          console.log("[COMPLAINT-SYNC] Successfully resolved complaint in Firestore:", selectedIssueId);
        } catch (fErr: any) {
          console.error("Firestore resolution save failed:", fErr);
        }

        setResSuccess(true);
        setResNotes("");
        setProofImage(null);
        
        // Let main App component know to update
        if (onRefreshData) {
          onRefreshData();
        } else {
          // Fallback status updater
          onUpdateIssueStatus(selectedIssueId, "Resolved", selectedIssue?.assignedTeam);
        }

        setTimeout(() => {
          setResSuccess(false);
          onSelectIssueId(null);
        }, 2000);
      } else {
        const errData = await res.json();
        setResError(errData.error || "Failed to submit resolution logs.");
      }
    } catch (err) {
      setResError("Network error sending resolution details.");
    } finally {
      setSavingResolution(false);
    }
  };

  const handleAssignTeam = () => {
    if (selectedIssueId) {
      onUpdateIssueStatus(selectedIssueId, "Assigned", chosenTeam);
      if (onRefreshData) onRefreshData();
    }
  };

  const handleVerify = () => {
    if (selectedIssueId) {
      onUpdateIssueStatus(selectedIssueId, "Verified");
      if (onRefreshData) onRefreshData();
    }
  };

  const handleAdvanceToInProgress = () => {
    if (selectedIssueId) {
      onUpdateIssueStatus(selectedIssueId, "In Progress");
      if (onRefreshData) onRefreshData();
    }
  };

  // Precinct Metrics Calculations
  const resolvedIssuesCount = issues.filter(i => i.status === "Resolved" || i.status === "Closed").length;
  const activeIssuesCount = issues.filter(i => i.status !== "Resolved" && i.status !== "Closed").length;
  const highPriorityCount = issues.filter(i => (i.urgency === "High" || i.urgency === "Critical") && i.status !== "Resolved").length;
  const totalPrecinctTickets = issues.length;
  const resolutionRate = totalPrecinctTickets > 0 ? Math.round((resolvedIssuesCount / totalPrecinctTickets) * 100) : 100;

  return (
    <div id="authority-dashboard-root" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar: Backlog list & filters */}
      <div className="lg:col-span-1 bg-slate-900/60 border border-white/10 rounded-3xl p-4 flex flex-col h-full justify-between">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
            <Shield size={16} className="text-amber-400 animate-pulse" />
            <span className="font-bold text-white text-xs font-display tracking-wide uppercase">Operational Backlog</span>
          </div>

          {/* Scope filter toggles */}
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl text-[11px] font-semibold">
            <button
              onClick={() => setViewFilter("all")}
              className={`py-1.5 rounded-lg transition cursor-pointer ${viewFilter === "all" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              All Tickets ({issues.filter(i => i.status !== "Resolved" && i.status !== "Closed").length})
            </button>
            <button
              onClick={() => setViewFilter("assigned")}
              className={`py-1.5 rounded-lg transition cursor-pointer ${viewFilter === "assigned" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              Assigned ({issues.filter(i => i.status !== "Resolved" && i.status !== "Closed" && (i.assignedAuthorityEmail === user?.email || (i.assignedTeam && i.assignedTeam !== ""))).length})
            </button>
          </div>

          {/* Compact Issue List */}
          <div className="max-h-[350px] overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
            {filteredIssues.map(issue => {
              const isActive = selectedIssueId === issue.id;
              return (
                <button
                  key={issue.id}
                  onClick={() => {
                    onSelectIssueId(isActive ? null : issue.id);
                    setResNotes("");
                    setProofImage(null);
                    setResError(null);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left border flex items-center justify-between text-xs transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-600/25 border-indigo-400 text-white shadow-sm' 
                      : 'bg-slate-950/30 border-white/5 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="truncate max-w-[140px]">
                    <span className="font-bold block truncate text-slate-200">{issue.title}</span>
                    <span className="text-[9px] text-slate-400 font-mono italic block mt-0.5">{issue.category}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`px-1.5 py-0.2 rounded text-[8px] uppercase font-bold tracking-wider ${
                      issue.urgency === 'Critical' ? 'bg-red-500/20 text-red-300 border border-red-500/35' : 
                      issue.urgency === 'High' ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20' :
                      'bg-white/5 border border-white/10 text-slate-300'
                    }`}>
                      {issue.urgency}
                    </span>
                    <span className="text-[8px] font-mono text-slate-500">{issue.status}</span>
                  </div>
                </button>
              );
            })}

            {filteredIssues.length === 0 && (
              <div className="p-4 bg-slate-950/25 text-slate-400 border border-white/5 text-center rounded-xl text-[11px] py-16">
                <Check className="mx-auto text-emerald-400 mb-2" size={20} />
                <p className="font-semibold">Complaints cleared!</p>
                <p className="text-[9px] text-slate-500 mt-1">Select other filters or check map updates.</p>
              </div>
            )}
          </div>
        </div>

        {/* Mini Precinct Analytics Panel */}
        <div className="border-t border-white/10 pt-3 mt-4 space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <BarChart3 size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">My Area Precinct Stats</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="bg-slate-950/40 p-2 border border-white/5 rounded-xl">
              <span className="text-slate-400 block uppercase text-[8px]">Cleared Rate</span>
              <span className="text-white font-bold text-sm">{resolutionRate}%</span>
            </div>
            <div className="bg-slate-950/40 p-2 border border-white/5 rounded-xl">
              <span className="text-slate-400 block uppercase text-[8px]">Active Backlogs</span>
              <span className="text-white font-bold text-sm">{activeIssuesCount}</span>
            </div>
            <div className="bg-slate-950/40 p-2 border border-white/5 rounded-xl">
              <span className="text-slate-400 block uppercase text-[8px]">Critical/High</span>
              <span className="text-amber-400 font-bold text-sm">{highPriorityCount}</span>
            </div>
            <div className="bg-slate-950/40 p-2 border border-white/5 rounded-xl">
              <span className="text-slate-400 block uppercase text-[8px]">Resolved</span>
              <span className="text-emerald-400 font-bold text-sm">{resolvedIssuesCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Console Workspace */}
      <div className="lg:col-span-3 flex flex-col justify-between">
        {selectedIssue ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full">
            {/* Column 1: Ticket Details (7 cols) */}
            <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
              <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between font-bold border-b border-white/10 pb-3">
                  <div>
                    <span className="text-white text-sm font-display truncate max-w-[240px] block">{selectedIssue.title}</span>
                    <span className="text-[9px] text-slate-400 font-mono font-medium block mt-0.5">Address: {selectedIssue.address}</span>
                  </div>
                  <span className="text-[10px] bg-indigo-500/25 border border-indigo-400/25 text-indigo-300 font-mono px-2 py-0.5 rounded-lg">{selectedIssue.status}</span>
                </div>
                
                <div className="text-xs space-y-2.5">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold font-mono">Complaint Description</span>
                    <p className="text-slate-300 leading-relaxed mt-1">{selectedIssue.description}</p>
                  </div>

                  {selectedIssue.image && (
                    <div className="pt-2">
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold font-mono block mb-1">Citizen Photo Evidence</span>
                      <img 
                        src={selectedIssue.image} 
                        alt="Evidence" 
                        referrerPolicy="no-referrer"
                        className="w-full max-h-[160px] object-cover rounded-xl border border-white/10 shadow-md"
                      />
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/5 flex justify-between font-mono text-[9px] text-slate-400">
                    <span>Reporter: {selectedIssue.reporterName}</span>
                    <span>Experience Points: {selectedIssue.upvotes * 10}</span>
                  </div>
                </div>
              </div>

              {/* Action Controllers */}
              <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-4 shadow-lg space-y-3">
                <span className="text-[9px] block font-semibold text-slate-400 uppercase tracking-widest font-mono">Discharge Action Protocol</span>
                
                <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
                  {/* 1. Verify Ticket */}
                  <button
                    onClick={handleVerify}
                    disabled={selectedIssue.status !== "Reported"}
                    className="p-2.5 bg-slate-950/50 hover:bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1.5 transition-all text-center disabled:opacity-30 cursor-pointer"
                  >
                    <Eye size={14} className="text-cyan-400" />
                    <span>Verify Issue</span>
                  </button>

                  {/* 2. Advance to In Progress */}
                  <button
                    onClick={handleAdvanceToInProgress}
                    disabled={selectedIssue.status !== "Assigned" && selectedIssue.status !== "Verified"}
                    className="p-2.5 bg-slate-950/50 hover:bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1.5 transition-all text-center disabled:opacity-30 cursor-pointer"
                  >
                    <FileText size={14} className="text-amber-400" />
                    <span>Start Repair</span>
                  </button>

                  {/* 3. Squad Assignment */}
                  <button
                    onClick={handleAssignTeam}
                    disabled={selectedIssue.status === "Closed" || selectedIssue.status === "Resolved"}
                    className="p-2.5 bg-indigo-650/15 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-300 hover:text-white flex flex-col items-center justify-center gap-1.5 transition-all text-center disabled:opacity-30 cursor-pointer"
                  >
                    <Briefcase size={14} className="text-indigo-400" />
                    <span>Deploy Crew</span>
                  </button>
                </div>

                {/* Squad Picker Selector */}
                <div className="text-[11px] flex gap-2 items-center pt-1">
                  <span className="text-[9px] font-mono text-slate-400 uppercase flex-shrink-0">Selected Crew:</span>
                  <select
                    value={chosenTeam}
                    onChange={(e) => setChosenTeam(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none cursor-pointer text-xs"
                  >
                    {squadOptions.map(opt => (
                      <option key={opt} value={opt} className="bg-slate-950 text-slate-200">{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Column 2: Resolution & Physical Proof Form (5 cols) */}
            <div className="md:col-span-5">
              <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-5 shadow-xl h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 border-b border-white/10 pb-2.5 mb-4">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span className="font-bold text-white text-xs font-display uppercase tracking-wide">Resolution & Physical Proof</span>
                  </div>

                  <form onSubmit={handleResolveComplaint} className="space-y-4 text-xs">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1 uppercase tracking-widest text-[9px] font-mono">Resolution Notes</label>
                      <textarea
                        required
                        value={resNotes}
                        onChange={(e) => setResNotes(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs resize-none"
                        placeholder="Detail physical works completed (e.g., Repaved potholes on lane A, cleared garbage dump, etc.)..."
                      />
                    </div>

                    {/* Proof drag & drop block */}
                    <div>
                      <label className="text-slate-400 font-bold block mb-1 uppercase tracking-widest text-[9px] font-mono">Resolution Proof Image</label>
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={triggerFileSelect}
                        className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 bg-slate-950/40 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[110px]"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        
                        {uploadingProof ? (
                          <span className="text-[10px] text-slate-400 font-mono">Processing photo data...</span>
                        ) : proofImage ? (
                          <div className="space-y-1.5 w-full">
                            <img 
                              src={proofImage} 
                              alt="Proof preview" 
                              referrerPolicy="no-referrer"
                              className="w-full max-h-[80px] object-cover rounded-lg border border-white/15"
                            />
                            <span className="text-[9px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                              <Check size={10} />
                              <span>Photo Evidence Ready</span>
                            </span>
                          </div>
                        ) : (
                          <>
                            <Upload size={18} className="text-indigo-400 mb-1 animate-bounce" />
                            <span className="text-[10px] font-bold text-slate-300">Drag & Drop or Browse</span>
                            <span className="text-[9px] text-slate-500 mt-0.5">PNG, JPG up to 2MB</span>
                          </>
                        )}
                      </div>
                    </div>

                    {resError && (
                      <div className="p-2.5 bg-red-500/15 border border-red-500/25 text-red-400 rounded-xl text-[10px] flex items-center gap-1">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>{resError}</span>
                      </div>
                    )}

                    {resSuccess && (
                      <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 rounded-xl text-[10px] flex items-center gap-1">
                        <Award size={12} className="flex-shrink-0" />
                        <span>Resolution verified! Bumping reporter reputation.</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={savingResolution || resSuccess}
                      className="w-full py-2.5 bg-gradient-to-tr from-emerald-600 to-green-500 disabled:opacity-50 text-white rounded-xl hover:brightness-110 font-bold shadow-md shadow-emerald-500/10 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <CheckCircle2 size={13} />
                      <span>{savingResolution ? "Saving Resolution..." : "Complete & File Resolution"}</span>
                    </button>
                  </form>
                </div>

                <div className="bg-indigo-950/15 border border-white/5 rounded-xl p-3 text-[11px] mt-4 space-y-1 leading-relaxed">
                  <div className="flex items-center space-x-1.5 font-bold text-indigo-300">
                    <CornerDownRight size={10} />
                    <span>Dispatcher Protocol Advice</span>
                  </div>
                  <p className="text-slate-400 italic">
                    {selectedIssue.recommendation || "Paving Crew recommends double-coating bituminous binder before physical validation. Log all materials on resolution notes."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-white/10 border-dashed rounded-3xl text-center py-32 text-slate-450 shadow-inner flex flex-col justify-center items-center h-full">
            <HelpCircle size={36} className="text-slate-650 animate-bounce mb-3" />
            <p className="text-xs max-w-sm leading-relaxed font-bold">Dispatcher Evaluation Terminal</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">Select any active reported complaint ticket from the backlog sidebar to start actions, update progress stages, and log resolution certifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
