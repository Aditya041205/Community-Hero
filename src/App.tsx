import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, MapPin, Award, Layers, TrendingUp, Info, HelpCircle, User, Zap, BookOpen 
} from "lucide-react";

import InteractiveMap from "./components/InteractiveMap";
import ReportForm from "./components/ReportForm";
import Chatbot from "./components/Chatbot";
import DashboardAnalytics from "./components/DashboardAnalytics";
import AuthorityPanel from "./components/AuthorityPanel";
import LeaderboardGamification from "./components/LeaderboardGamification";
import PresentationDeck from "./components/PresentationDeck";
import { Issue, LeaderboardEntry, AnalyticsData } from "./types";

export default function App() {
  // Main Navigation toggles: "interactive" platform vs "pitch" slides
  const [workspaceMode, setWorkspaceMode] = useState<"interactive" | "pitch">("interactive");
  
  // App views: "map" (report/gps), "analytics" (transparency), "gamification" (leaderboard), "authority" (dispatcher)
  const [activeTab, setActiveTab] = useState<"map" | "analytics" | "gamification" | "authority">("map");

  // Shared reactive States
  const [issues, setIssues] = useState<Issue[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Custom changeable user profile session
  const [currentUsername, setCurrentUsername] = useState("Aditya Sharma");

  // Fetch all server data on mount
  const fetchAllData = async () => {
    try {
      const issuesRes = await fetch("/api/issues");
      const issuesData = await issuesRes.json();
      setIssues(issuesData);

      const leaderboardRes = await fetch("/api/leaderboard");
      const leaderboardData = await leaderboardRes.json();
      setLeaderboard(leaderboardData);

      const analyticsRes = await fetch("/api/analytics");
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Failed to fetch initial server state:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Poll data every 10 seconds for real-time notifications feel!
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, [currentUsername]);

  // Handler: Real-time upvotes
  const handleVote = async (id: string) => {
    try {
      const res = await fetch(`/api/issues/${id}/vote`, { method: "POST" });
      if (res.ok) {
        const updatedIssue = await res.json();
        // Update issues local state
        setIssues(prev => prev.map(i => i.id === id ? updatedIssue : i));
        // Refresh analytics dynamically
        const analyticsRes = await fetch("/api/analytics");
        setAnalytics(await analyticsRes.json());
      }
    } catch (err) {
      console.error("Vote action failed:", err);
    }
  };

  // Handler: Status transitions & assignments
  const handleUpdateStatus = async (id: string, status: Issue["status"], team?: string) => {
    try {
      const res = await fetch(`/api/issues/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, assignedTeam: team })
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues(prev => prev.map(i => i.id === id ? updated : i));
        
        // Refresh leaderboard points & analytics instantly
        const leaderboardRes = await fetch("/api/leaderboard");
        setLeaderboard(await leaderboardRes.json());
        const analyticsRes = await fetch("/api/analytics");
        setAnalytics(await analyticsRes.json());
      }
    } catch (err) {
      console.error("Authority action failed:", err);
    }
  };

  // Handler: Staging coordinates clicked on SVG map canvas
  const handleMapClick = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
    // Focus or show toast indicating coords recorded
  };

  // Handler: Direct app state hydrations from ticket submissions
  const handleIssueReported = (newIssue: Issue) => {
    setIssues(prev => [...prev, newIssue]);
    setSelectedIssueId(newIssue.id);
    
    // Refresh leaderboard points & analytics instantly
    fetchAllData();
  };

  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500 selection:text-white pb-10 relative overflow-x-hidden">
      
      {/* Visual background atmospheric glowing stars & frosted gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-emerald-500/10 pointer-events-none z-0"></div>
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-500/25 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Main Structural Header */}
      <header className="sticky top-0 z-30 bg-slate-900/40 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo Title Brand */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-lg shadow-indigo-600/15 text-white flex items-center justify-center">
              <Zap size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white font-display tracking-tight">Community Hero AI</h1>
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">HACKATHON MVP</span>
              </div>
              <p className="text-xs text-slate-450 mt-0.5 font-medium">Auto-detection • Geofence Deduplication • Predictive Municipal Analytics</p>
            </div>
          </div>

          {/* Interactive Platform Workspace vs Presentation Slide Deck Toggle */}
          <div className="flex items-center space-x-1.5 bg-white/5 backdrop-blur-md p-1 rounded-xl border border-white/10 self-start md:self-auto z-10">
            <button
              onClick={() => setWorkspaceMode("interactive")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${workspaceMode === 'interactive' ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-md shadow-indigo-500/15 text-white border border-white/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              <Layers size={13} />
              <span>📱 Live Interactive App</span>
            </button>
            <button
              onClick={() => {
                setWorkspaceMode("pitch");
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${workspaceMode === 'pitch' ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-md shadow-indigo-500/15 text-white border border-white/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              <BookOpen size={13} />
              <span>📊 Slide Pitch Deck</span>
            </button>
          </div>
        </div>
      </header>

      {/* Primary Container Stage */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        <AnimatePresence mode="wait">
          
          {/* Pitch Deck Segment */}
          {workspaceMode === "pitch" ? (
            <motion.div
              key="pitch"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-5xl mx-auto"
            >
              <PresentationDeck />
            </motion.div>
          ) : (
            /* Main Live Application Segment */
            <motion.div
              key="interactive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              
              {/* Profile banner & app workspace navigation */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl p-5 border border-white/10 rounded-3xl shadow-lg relative z-10">
                {/* Citizens Profile snippet */}
                <div className="flex items-center space-x-3.5">
                  <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-indigo-400">
                    {currentUsername.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                       <span className="font-bold text-white text-sm">{currentUsername}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-medium tracking-wide">
                      <Award size={12} className="text-indigo-400" />
                      <span>OFFICER RANK LEVEL {Math.max(1, Math.floor((leaderboard.find(u => u.name === currentUsername)?.points || 100) / 300))}</span>
                    </div>
                  </div>
                </div>

                {/* Section Specific View Toggles */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab("map")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'map' ? 'bg-white/10 border border-white/20 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    📍 Interactive Map & Reporter
                  </button>
                  <button
                    onClick={() => setActiveTab("analytics")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'analytics' ? 'bg-white/10 border border-white/20 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    📈 Transparency & AI Analytics
                  </button>
                  <button
                    onClick={() => setActiveTab("gamification")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'gamification' ? 'bg-white/10 border border-white/20 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    🏆 Citizens Gamification
                  </button>
                  <button
                    onClick={() => setActiveTab("authority")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'authority' ? 'bg-white/10 border border-white/20 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    🛡️ City Authority Panel (Dispatcher ({issues.filter(i => i.status !== "Resolved" && i.status !== "Closed").length}))
                  </button>
                </div>
              </div>

              {/* View Layout Switcher */}
              <div className="min-h-[500px]">
                {activeTab === "map" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    {/* Left Column: Interactive Vector Map + Mini Issues backlog list overlay */}
                    <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                      <InteractiveMap
                        issues={issues}
                        selectedIssueId={selectedIssueId}
                        onSelectIssueId={setSelectedIssueId}
                        onMapClick={handleMapClick}
                        clickedCoords={clickedCoords}
                      />
                      
                      {/* Selection metadata inspector footer container */}
                      {selectedIssue && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-3xl space-y-3 shadow-lg relative z-10"
                        >
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div>
                              <span className="text-[10px] uppercase font-mono text-indigo-400 tracking-wider font-bold">MUTABLE RECORD INSPECT</span>
                              <h4 className="text-white font-bold text-sm leading-tight mt-0.5">{selectedIssue.title}</h4>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${selectedIssue.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                                {selectedIssue.status}
                              </span>
                              <button
                                onClick={() => handleVote(selectedIssue.id)}
                                className={`px-3 py-1 rounded text-[11px] font-bold border transition ${selectedIssue.upvotedByUser ? 'bg-gradient-to-tr from-pink-500 to-rose-600 border-transparent text-white shadow-md' : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'} cursor-pointer`}
                              >
                                {selectedIssue.upvotedByUser ? '♥ Upvoted' : '👍 Upvote'} ({selectedIssue.upvotes})
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-slate-350 leading-relaxed">{selectedIssue.description}</p>
                          
                          {/* AI recommendations panel inner */}
                          {selectedIssue.recommendation && (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md rounded-2xl p-4 text-[11px] leading-relaxed flex items-start space-x-2 text-indigo-200">
                              <span className="font-bold flex-shrink-0 text-amber-300 font-mono text-[9px] bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/35 rounded uppercase tracking-wider h-max">AI ACTION TIPS</span>
                              <p>{selectedIssue.recommendation}</p>
                            </div>
                          )}

                          {/* Quick Comments list mock integration matching Verification requirements */}
                          <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                            <span className="text-[10px] block font-bold text-slate-400 uppercase tracking-widest">Verification Thread & Community Comments ({selectedIssue.comments.length})</span>
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                              {selectedIssue.comments.map(c => (
                                <div key={c.id} className="p-3 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5">
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                    <span className="font-bold text-slate-300">{c.author}</span>
                                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-slate-355 mt-1 leading-relaxed text-[11px]">{c.text}</p>
                                </div>
                              ))}
                            </div>
                            {/* Simple comment poster */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const textInput = form.elements.namedItem("commentText") as HTMLInputElement;
                                if (textInput.value.trim()) {
                                  fetch(`/api/issues/${selectedIssue.id}/comment`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ author: currentUsername, text: textInput.value })
                                  }).then(res => res.json()).then(updated => {
                                    setIssues(prev => prev.map(i => i.id === selectedIssue.id ? updated : i));
                                    textInput.value = "";
                                  });
                                }
                              }}
                              className="mt-2 flex items-center space-x-2"
                            >
                              <input
                                name="commentText"
                                placeholder="Add verification commentary..."
                                className="flex-1 bg-slate-950/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                              />
                              <button
                                type="submit"
                                className="px-3.5 py-2 bg-gradient-to-tr from-blue-500 to-indigo-650 border border-white/10 rounded-xl text-white font-bold hover:brightness-110 shadow-md transition cursor-pointer text-xs"
                              >
                                Certify
                              </button>
                            </form>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Right Column: Intelligent AI Image Analysis Form */}
                    <div className="lg:col-span-4 h-full">
                      <ReportForm
                        onIssueReported={handleIssueReported}
                        clickedCoords={clickedCoords}
                        onClearCoords={() => setClickedCoords(null)}
                        currentUsername={currentUsername}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "analytics" && (
                  <div className="max-w-4xl mx-auto">
                    <DashboardAnalytics analytics={analytics} />
                  </div>
                )}

                {activeTab === "gamification" && (
                  <div className="max-w-4xl mx-auto">
                    <LeaderboardGamification
                      entries={leaderboard}
                      currentUsername={currentUsername}
                      onChangeUsername={setCurrentUsername}
                    />
                  </div>
                )}

                {activeTab === "authority" && (
                  <div className="max-w-5xl mx-auto">
                    <AuthorityPanel
                      issues={issues}
                      selectedIssueId={selectedIssueId}
                      onSelectIssueId={setSelectedIssueId}
                      onUpdateIssueStatus={handleUpdateStatus}
                    />
                  </div>
                )}
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Persistent slide-out Ecosystem Bot Counselor eco-echo! */}
      <Chatbot />
    </div>
  );
}
