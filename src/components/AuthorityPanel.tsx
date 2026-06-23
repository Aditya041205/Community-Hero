import React, { useState } from "react";
import { Shield, Check, HelpCircle, Eye, CornerDownRight } from "lucide-react";
import { Issue } from "../types";

interface AuthorityPanelProps {
  issues: Issue[];
  onUpdateIssueStatus: (id: string, status: Issue["status"], team?: string) => void;
  selectedIssueId: string | null;
  onSelectIssueId: (id: string | null) => void;
}

export default function AuthorityPanel({
  issues,
  onUpdateIssueStatus,
  selectedIssueId,
  onSelectIssueId
}: AuthorityPanelProps) {
  const [chosenTeam, setChosenTeam] = useState("Midtown Road Paving Crew B");

  // Filter out resolved issues for dispatcher's active backlogs
  const activeBacklogs = issues.filter(i => i.status !== "Resolved" && i.status !== "Closed");
  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  const squadOptions = [
    "Midtown Road Paving Crew B",
    "Rapid Water Infrastructure Support",
    "Eco-Clean Sanitation Squad",
    "Electrical Utilities Technician"
  ];

  const handleAssignTeam = () => {
    if (selectedIssueId) {
      // Advance status to 'Assigned' and link squad
      onUpdateIssueStatus(selectedIssueId, "Assigned", chosenTeam);
    }
  };

  const handleVerify = () => {
    if (selectedIssueId) {
      onUpdateIssueStatus(selectedIssueId, "Verified");
    }
  };

  const handleResolve = () => {
    if (selectedIssueId) {
      onUpdateIssueStatus(selectedIssueId, "Resolved");
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-lg flex flex-col justify-between relative z-10">
      <div className="flex items-center space-x-2 border-b border-white/10 pb-3.5 mb-4">
        <Shield size={18} className="text-amber-400 animate-pulse" />
        <h3 className="font-bold text-white font-display text-sm md:text-base">City Authority Control Cabin</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Active Backlog Column */}
        <div className="lg:col-span-2 space-y-2 lg:border-r border-white/10 pr-0 lg:pr-4">
          <span className="text-[10px] block font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Civic Complaints</span>
          {activeBacklogs.length === 0 ? (
            <div className="p-4 bg-slate-950/25 text-slate-400 border border-white/5 text-center rounded-xl text-xs py-12 shadow-inner">
              <Check className="mx-auto text-emerald-400 mb-2" size={24} />
              <p>City backlog cleared! All issues resolved.</p>
            </div>
          ) : (
            <div className="max-h-[310px] overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
              {activeBacklogs.map(issue => {
                const isActive = selectedIssueId === issue.id;
                return (
                  <button
                    key={issue.id}
                    onClick={() => onSelectIssueId(isActive ? null : issue.id)}
                    className={`w-full p-2.5 rounded-xl text-left border flex items-center justify-between text-xs transition-all cursor-pointer ${isActive ? 'bg-indigo-650/20 border-indigo-400 text-white shadow-sm' : 'bg-slate-950/25 border-white/5 text-slate-300 hover:bg-white/5'}`}
                  >
                    <div className="truncate max-w-[170px]">
                      <span className="font-bold block truncate text-slate-200">{issue.title}</span>
                      <span className="text-[9px] text-slate-400 font-mono italic block mt-0.5">{issue.category}</span>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider ${issue.urgency === 'Critical' ? 'bg-red-500/20 text-red-300 border border-red-500/35' : 'bg-white/5 border border-white/10 text-slate-300'}`}>
                        {issue.urgency}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Complaint Dispatcher Control Center */}
        <div className="lg:col-span-3 flex flex-col justify-between py-1">
          {selectedIssue ? (
            <div className="space-y-4">
              {/* Core Details */}
              <div className="space-y-2 bg-slate-950/30 border border-white/5 rounded-xl p-3.5 text-xs text-slate-200">
                <div className="flex items-center justify-between font-bold border-b border-white/5 pb-2">
                  <span className="text-white text-sm font-display truncate max-w-[200px]">{selectedIssue.title}</span>
                  <span className="text-[10px] bg-indigo-500/20 border border-indigo-400/25 text-indigo-300 font-mono px-1.5 rounded">{selectedIssue.status}</span>
                </div>
                <p className="text-slate-300 mt-1 leading-relaxed">{selectedIssue.description}</p>
                <div className="pt-2 flex justify-between font-mono text-[9px] text-slate-400 border-t border-white/5">
                  <span>Reporter: {selectedIssue.reporterName}</span>
                  <span>Votes: {selectedIssue.upvotes}</span>
                </div>
              </div>

              {/* Real Gemini Smart Recommendation System Slot */}
              <div className="bg-gradient-to-tr from-slate-900/40 via-indigo-950/15 to-blue-950/15 border border-white/5 rounded-xl p-3.5 text-xs space-y-1.5 shadow-md">
                <div className="flex items-center space-x-1.5 border-b border-white/10 pb-1.5 mb-1 font-bold text-indigo-300">
                  <CornerDownRight size={12} />
                  <span className="font-display">AI Smart Dispatch Recommendation</span>
                </div>
                <p className="text-slate-300 italic font-medium leading-relaxed">
                  {selectedIssue.recommendation || "AI analysis recommends deploying a rapid response site survey before sending heavy machinery. Verify coordinates validity on Hudson river limits."}
                </p>
              </div>

              {/* Action grid controllers */}
              <div>
                <span className="text-[10px] block font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Discharge Actions</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-semibold">
                  {/* Verify button */}
                  <button
                    onClick={handleVerify}
                    disabled={selectedIssue.status !== "Reported"}
                    className="p-2.5 bg-slate-950/45 hover:bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white flex items-center justify-center space-x-1.5 transition-all text-center disabled:opacity-30 cursor-pointer focus:outline-none"
                  >
                    <Eye size={12} className="text-cyan-400 animate-pulse" />
                    <span>Verify Issue</span>
                  </button>

                  {/* Complete fix button */}
                  <button
                    onClick={handleResolve}
                    className="p-2.5 bg-gradient-to-tr from-emerald-600 to-green-500 border border-white/10 text-white rounded-xl hover:brightness-110 flex items-center justify-center space-x-1.5 transition-all text-center cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    <Check size={12} strokeWidth={2.5} />
                    <span>Mark Resolved</span>
                  </button>

                  {/* Manual squad deployment modal trigger */}
                  <button
                    onClick={handleAssignTeam}
                    className="p-2.5 bg-gradient-to-tr from-indigo-600 to-blue-500 border border-white/10 rounded-xl text-white hover:brightness-110 transition-all text-center cursor-pointer font-bold shadow-md shadow-indigo-500/10"
                  >
                    Deploy Selected
                  </button>
                </div>

                {/* Squad Picker Dropdown */}
                <div className="mt-2 text-xs">
                  <select
                    value={chosenTeam}
                    onChange={(e) => setChosenTeam(e.target.value)}
                    className="w-full bg-slate-950/45 border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 cursor-pointer font-medium"
                  >
                    {squadOptions.map(opt => (
                      <option key={opt} value={opt} className="bg-slate-950 text-slate-200">{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/25 border border-white/10 border-dashed rounded-2xl text-center py-24 text-slate-400 shadow-inner flex flex-col justify-center items-center">
              <HelpCircle size={28} className="text-slate-500 animate-bounce mb-2" />
              <p className="text-xs max-w-sm leading-relaxed">Select any reported complaint ticket from the backlog sidebar to evaluate actions and view AI recommendations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
