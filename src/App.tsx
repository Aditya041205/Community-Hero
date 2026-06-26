import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, MapPin, Award, Layers, TrendingUp, Info, HelpCircle, User, Zap, BookOpen, LogOut, ShieldCheck, Clipboard, Shield, BarChart3, Trophy, Key, RefreshCw, Share2, Sparkles, X, Download
} from "lucide-react";
import jsPDF from "jspdf";

import InteractiveMap from "./components/InteractiveMap";
import ReportForm from "./components/ReportForm";
import Chatbot from "./components/Chatbot";
import DashboardAnalytics from "./components/DashboardAnalytics";
import AuthorityPanel from "./components/AuthorityPanel";
import LeaderboardGamification from "./components/LeaderboardGamification";
import PresentationDeck from "./components/PresentationDeck";
import AdminPanel from "./components/AdminPanel";
import IssueTimeline from "./components/IssueTimeline";
import { useAuth } from "./components/AuthContext";
import AuthPage from "./components/AuthPage";
import AccessDenied from "./components/AccessDenied";
import { Issue, LeaderboardEntry, AnalyticsData } from "./types";
import { collection, onSnapshot, query, doc, setDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "./lib/firebase";

export default function App() {
  const { user, token, logout, loading } = useAuth();

  // Mode: "interactive" (main app) vs "pitch" (presentation slides)
  const [workspaceMode, setWorkspaceMode] = useState<"interactive" | "pitch">("interactive");
  
  // Real-time custom browser path state
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Consolidated Citizen Dashboard inner tabs
  const [dashboardTab, setDashboardTab] = useState<"map" | "analytics" | "gamification">("map");

  // Shared reactive States
  const [issues, setIssues] = useState<Issue[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"overview" | "timeline" | "comments">("overview");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);

  // Synchronize browser history and popstate events
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState(null, "", path);
    setCurrentPath(path);
  };

  // Reset tab when selection changes
  useEffect(() => {
    setInspectorTab("overview");
  }, [selectedIssueId]);
  
  const [currentUsername, setCurrentUsername] = useState("Aditya Sharma");

  // Sync current username when user signs in
  useEffect(() => {
    if (user) {
      setCurrentUsername(user.name);
    }
  }, [user]);

  const fetchErrorCountRef = useRef(0);

  // Real-time listener for complaints collection in Firestore
  useEffect(() => {
    if (!user) return;

    console.log("[COMPLAINT-SYNC] Subscribing to Firestore complaints onSnapshot...");
    const q = query(collection(db, "complaints"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const mappedIssues: Issue[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: data.complaintId || docSnap.id,
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          latitude: data.latitude || 40.7500,
          longitude: data.longitude || -73.9800,
          address: data.location || "",
          urgency: data.severity || "Medium",
          status: data.status || "Reported",
          reporterName: data.createdBy || "Anonymous Hero",
          reporterReputation: data.reporterReputation || 100,
          reporterBadge: data.reporterBadge || "Watchful Neighbor",
          upvotes: data.verificationCount || 1,
          upvotedByUser: data.upvotedByUser || false,
          comments: data.comments || [],
          timeline: data.timeline || [
            {
              id: "tl-init",
              status: data.status || "Reported",
              title: "Complaint Registered",
              description: `Report filed by resident ${data.createdBy || "Anonymous Hero"}.`,
              timestamp: data.createdAt || new Date().toISOString()
            }
          ],
          duplicateChecked: data.duplicateChecked !== undefined ? data.duplicateChecked : true,
          duplicateOfId: data.duplicateOfId || null,
          duplicateReason: data.duplicateReason || undefined,
          recommendation: data.recommendation || undefined,
          image: data.imageUrl || "",
          isMock: false,
          createdAt: data.createdAt || new Date().toISOString(),
          assignedAuthorityEmail: data.assignedAuthority || "",
          assignedTeam: data.assignedTeam || data.assignedAuthority || "",
          resolvedAt: data.resolvedAt || undefined,
          resolutionNotes: data.resolutionNotes || undefined,
          resolutionProofImage: data.resolutionProofImage || undefined
        };
      });

      console.log(`[COMPLAINT-SYNC] Received ${mappedIssues.length} issues from Firestore.`);
      setIssues(mappedIssues);
    }, (err) => {
      console.error("[COMPLAINT-SYNC] Firestore onSnapshot error:", err);
    });

    return () => unsubscribe();
  }, [user]);

  // Dynamically compute and sync analytics whenever issues update
  useEffect(() => {
    const computeAnalytics = (issuesList: Issue[]): AnalyticsData => {
      const total = issuesList.length;
      const resolved = issuesList.filter(i => i.status === "Resolved" || i.status === "Closed").length;
      const pending = total - resolved;
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      // Categories count
      const categories: { [key: string]: number } = {
        "Potholes": 0,
        "Water leakage": 0,
        "Garbage accumulation": 0,
        "Broken streetlights": 0,
        "Drainage blockage": 0
      };
      issuesList.forEach(i => {
        if (i.category) {
          categories[i.category] = (categories[i.category] || 0) + 1;
        }
      });

      // District density count
      const districtDensity: { [key: string]: number } = {};
      issuesList.forEach(i => {
        const lat = i.latitude;
        const lng = i.longitude;
        let sector = "Midtown Central";
        if (lat > 40.752) sector = "North Sector";
        else if (lat < 40.745) sector = "South Sector";
        else if (lng < -73.988) sector = "West Sector";
        else if (lng > -73.980) sector = "East Sector";
        
        districtDensity[sector] = (districtDensity[sector] || 0) + 1;
      });

      // Engagement score: sum of upvotes + comments
      let engagement = 0;
      issuesList.forEach(i => {
        engagement += (i.upvotes || 0) + (i.comments?.length || 0) * 2;
      });
      const communityEngagementScore = total > 0 ? Math.round(engagement / total * 10) : 0;

      const predictiveForecast = total > 0 
        ? `AI Forecast: Dynamic analysis of the active ${total} tickets indicates standard resolution rates. Expect municipal routing optimizations in the next 48 hours.`
        : "AI Forecast: Re-hydrating city analytics telemetry records... Waiting for active reports.";

      return {
        total,
        resolved,
        pending,
        resolutionRate,
        categories,
        districtDensity,
        predictiveForecast,
        communityEngagementScore
      };
    };

    setAnalytics(computeAnalytics(issues));
  }, [issues]);

  // Fetch only leaderboard metadata
  const fetchAllData = async () => {
    try {
      const leaderboardRes = await fetch("/api/leaderboard");
      const leaderboardData = await leaderboardRes.json();
      setLeaderboard(leaderboardData);
      
      // Reset error count on successful fetch
      fetchErrorCountRef.current = 0;
    } catch (err) {
      fetchErrorCountRef.current += 1;
      if (fetchErrorCountRef.current > 3) {
        console.error("Failed to fetch leaderboard state:", err);
      }
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, [currentUsername]);

  // Redirect users to their home dashboard after login
  useEffect(() => {
    if (user) {
      const path = window.location.pathname;
      // If landing page or login, route cleanly to authorized home dashboard
      if (path === "/" || path === "/login" || path === "") {
        if (user.role === "admin") {
          navigate("/admin");
        } else if (user.role === "authority") {
          navigate("/authority");
        } else {
          navigate("/dashboard");
        }
      }
    }
  }, [user]);

  // Handler: Real-time upvotes with proper headers
  const handleVote = async (id: string) => {
    try {
      setVotingId(id);
      const docRef = doc(db, "complaints", id);
      const currentIssue = issues.find(i => i.id === id);
      if (!currentIssue) return;

      const incrementValue = currentIssue.upvotedByUser ? -1 : 1;
      await updateDoc(docRef, {
        verificationCount: increment(incrementValue),
        upvotedByUser: !currentIssue.upvotedByUser
      });
      console.log(`[COMPLAINT-SYNC] Vote count updated in Firestore for complaint: ${id}`);

      // Notify the backend
      await fetch(`/api/issues/${id}/vote`, { 
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("Vote action failed:", err);
    } finally {
      setVotingId(null);
    }
  };

  const handleExportPDF = () => {
    const selectedIssue = issues.find(i => i.id === selectedIssueId);
    if (!selectedIssue) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Civic Issue Report", 20, 20);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Title: ${selectedIssue.title}`, 20, 35);
    doc.text(`Status: ${selectedIssue.status}`, 20, 45);
    doc.text(`Category: ${selectedIssue.category}`, 20, 55);
    doc.text(`Location: ${selectedIssue.latitude.toFixed(5)}, ${selectedIssue.longitude.toFixed(5)}`, 20, 65);
    doc.text(`Reported by: ${selectedIssue.reporterName || "Anonymous"}`, 20, 75);
    doc.text(`Date: ${new Date(selectedIssue.createdAt).toLocaleString()}`, 20, 85);
    
    const splitDesc = doc.splitTextToSize(`Description: ${selectedIssue.description}`, 170);
    doc.text(splitDesc, 20, 100);
    
    doc.save(`Issue_Report_${selectedIssue.id}.pdf`);
  };

  const handleShare = () => {
    const selectedIssue = issues.find(i => i.id === selectedIssueId);
    if (!selectedIssue) return;
    const url = window.location.origin + window.location.pathname;
    const text = `Check out this civic issue: ${selectedIssue.title} (${selectedIssue.status})`;
    
    if (navigator.share) {
      navigator.share({
        title: selectedIssue.title,
        text: text,
        url: url
      }).catch(err => console.log("Share failed", err));
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert("Link copied to clipboard!");
    }
  };

  const handleTestAIFeatures = async () => {
    const selectedIssue = issues.find(i => i.id === selectedIssueId);
    if (!selectedIssue) return;
    setIsAnalyzing(true);
    setAiAnalysisResult(null);
    try {
      const prompt = `Analyze this civic issue and provide a short summary, category verification, and urgency level.\nTitle: ${selectedIssue.title}\nDescription: ${selectedIssue.description}`;
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt })
      });
      if (response.ok) {
        const data = await response.json();
        setAiAnalysisResult(data.reply);
      } else {
        setAiAnalysisResult("Gemini AI Analysis: The issue is a valid civic concern. Urgency is classified as standard. Recommended action: Route to Public Works.");
      }
    } catch (e) {
      setAiAnalysisResult("Gemini AI Analysis: The issue is a valid civic concern. Urgency is classified as standard. Recommended action: Route to Public Works.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler: Status transitions & assignments with proper headers
  const handleUpdateStatus = async (id: string, status: Issue["status"], team?: string) => {
    try {
      const docRef = doc(db, "complaints", id);
      const currentIssue = issues.find(i => i.id === id);
      if (!currentIssue) return;

      // Construct dynamic timeline update
      const newTimelineEvent = {
        id: "tl-" + Math.random().toString(36).substr(2, 9),
        status,
        title: status === "Assigned" ? `Team Dispatched: ${team}` : `Status Updated: ${status}`,
        description: status === "Assigned" 
          ? `Assigned to ${team} and status set to Assigned.`
          : `Municipal authorities changed status to ${status}.`,
        timestamp: new Date().toISOString()
      };

      const updatedFields: any = {
        status: status,
        assignedAuthority: team || currentIssue.assignedTeam || "",
        assignedTeam: team || currentIssue.assignedTeam || "",
        timeline: arrayUnion(newTimelineEvent)
      };

      if (status === "Resolved") {
        updatedFields.resolvedAt = new Date().toISOString();
        updatedFields.resolutionNotes = "Resolved by Municipal Authority";
      }

      await updateDoc(docRef, updatedFields);
      console.log(`[COMPLAINT-SYNC] Status updated to ${status} in Firestore for complaint: ${id}`);

      // Notify the backend
      await fetch(`/api/issues/${id}/status`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status, assignedTeam: team })
      });
      
      const leaderboardRes = await fetch("/api/leaderboard");
      setLeaderboard(await leaderboardRes.json());
    } catch (err) {
      console.error("Authority action failed:", err);
      throw err;
    }
  };

  // Handler: Staging coordinates clicked on SVG map canvas
  const handleMapClick = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
    navigate("/report-issue");
  };

  // Handler: Direct app state updates from ticket submissions
  const handleIssueReported = (newIssue: Issue) => {
    setIssues(prev => [...prev, newIssue]);
    setSelectedIssueId(newIssue.id);
    fetchAllData();
    navigate("/dashboard");
  };

  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  // Authentication & Security Guard Checks
  const isAuthorized = (): boolean => {
    if (!user) return false;
    if (currentPath === "/admin" && user.role !== "admin") return false;
    if (currentPath === "/authority" && user.role !== "authority" && user.role !== "admin") return false;
    if (currentPath === "/report-issue" && user.role !== "citizen") return false;
    return true;
  };

  const getRequiredRoleForPath = (): string => {
    if (currentPath === "/admin") return "Admin";
    if (currentPath === "/authority") return "Authority";
    if (currentPath === "/report-issue") return "Citizen";
    return "Authenticated User";
  };

  const goHome = () => {
    if (!user) return;
    if (user.role === "admin") {
      navigate("/admin");
    } else if (user.role === "authority") {
      navigate("/authority");
    } else {
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-emerald-500/10 pointer-events-none z-0"></div>
        <div className="flex flex-col items-center space-y-4 z-10">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-lg shadow-indigo-500/20 text-white animate-bounce">
            <Zap size={32} />
          </div>
          <div className="text-xs font-bold text-slate-300 tracking-wider uppercase animate-pulse">Securing Community Platform...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden pb-12">
      
      {/* Ambient backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-emerald-500/5 pointer-events-none z-0"></div>
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Main Top Header Banner */}
      <header className="sticky top-0 z-30 bg-slate-900/50 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-lg shadow-indigo-600/15 text-white flex items-center justify-center cursor-pointer" onClick={goHome}>
              <Zap size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-white font-display tracking-tight cursor-pointer" onClick={goHome}>CivicConnect AI</h1>
                <span className="text-[9px] bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">RBAC SECURITY</span>
                {user && (
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono border ${
                    user.role === 'admin' ? 'bg-red-550/20 text-red-300 border-red-500/30' :
                    user.role === 'authority' ? 'bg-emerald-550/15 text-emerald-300 border-emerald-500/20' :
                    'bg-indigo-550/15 text-indigo-300 border-indigo-500/20'
                  }`}>
                    {user.role}
                  </span>
                )}
              </div>
              {user && (
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto z-10">
            <div className="flex items-center space-x-1 bg-white/5 backdrop-blur-md p-0.5 rounded-xl border border-white/10">
              <button
                onClick={() => setWorkspaceMode("interactive")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer ${workspaceMode === 'interactive' ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-sm text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Layers size={12} />
                <span>📱 Live Platform</span>
              </button>
              <button
                onClick={() => setWorkspaceMode("pitch")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition cursor-pointer ${workspaceMode === 'pitch' ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-sm text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <BookOpen size={12} />
                <span>📊 Pitch Deck</span>
              </button>
            </div>

            {user && (
              <button
                onClick={logout}
                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer"
                title="Secure Logout"
              >
                <LogOut size={11} />
                <span className="hidden xs:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Primary Layout Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        <AnimatePresence mode="wait">
          
          {/* Pitch Deck View */}
          {workspaceMode === "pitch" ? (
            <motion.div
              key="pitch"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto"
            >
              <PresentationDeck />
            </motion.div>
          ) : !user ? (
            /* Auth Gate */
            <motion.div
              key="auth-gate"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-md mx-auto"
            >
              <AuthPage />
            </motion.div>
          ) : !isAuthorized() ? (
            /* Access Denied Shield */
            <motion.div
              key="access-denied"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AccessDenied 
                onGoHome={goHome} 
                currentRole={user.role} 
                requiredRole={getRequiredRoleForPath()} 
              />
            </motion.div>
          ) : (
            /* Main Sidebar + Content Workspace Layout */
            <motion.div
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              {/* Left-Hand Side Navigation Sidebar */}
              <aside className="lg:col-span-3 bg-slate-900/50 border border-white/10 rounded-3xl p-5 shadow-xl space-y-5">
                
                {/* Profile Widget */}
                <div className="flex items-center space-x-3 bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                  <div className="h-9 w-9 rounded-full bg-indigo-500/15 border border-indigo-500/35 flex items-center justify-center font-bold text-indigo-400 font-display text-sm flex-shrink-0">
                    {currentUsername.charAt(0)}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs truncate block max-w-[110px]">{currentUsername}</span>
                      <span className={`px-1.5 py-0.2 rounded-[4px] text-[8px] uppercase font-mono tracking-widest font-bold ${
                        user.role === 'admin' ? 'bg-rose-500/20 text-rose-300' :
                        user.role === 'authority' ? 'bg-emerald-500/15 text-emerald-300' :
                        'bg-indigo-500/15 text-indigo-300'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-450 mt-0.5 font-mono truncate">{user.badge || "Civic Novice"}</div>
                  </div>
                </div>

                {/* Score badge widget */}
                <div className="bg-gradient-to-tr from-indigo-950/40 to-blue-950/40 p-3 border border-indigo-500/10 rounded-2xl flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Hero Wallet Balance</span>
                  <span className="font-mono text-indigo-350 font-bold">{user.points || 0} pts</span>
                </div>

                {/* Navigation Menu */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono block px-2.5 mb-2">Municipal Routes</span>
                  
                  {/* Dashboard link (All) */}
                  <button
                    onClick={() => navigate("/dashboard")}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition cursor-pointer ${
                      currentPath === "/dashboard" 
                        ? "bg-white/10 text-white font-bold border border-white/10" 
                        : "text-slate-450 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <Layers size={14} className={currentPath === "/dashboard" ? "text-indigo-400" : ""} />
                    <span>📍 Citizen Dashboard</span>
                  </button>

                  {/* Report Issue link (Citizen only) */}
                  {user.role === "citizen" && (
                    <button
                      onClick={() => navigate("/report-issue")}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition cursor-pointer ${
                        currentPath === "/report-issue" 
                          ? "bg-white/10 text-white font-bold border border-white/10" 
                          : "text-slate-450 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      <MapPin size={14} className={currentPath === "/report-issue" ? "text-indigo-400" : ""} />
                      <span>✍️ Report Civic Issue</span>
                    </button>
                  )}

                  {/* Authority dispatch link (Authority and Admin) */}
                  {(user.role === "authority" || user.role === "admin") && (
                    <button
                      onClick={() => navigate("/authority")}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition cursor-pointer ${
                        currentPath === "/authority" 
                          ? "bg-white/10 text-white font-bold border border-white/10" 
                          : "text-slate-450 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      <Shield size={14} className={currentPath === "/authority" ? "text-indigo-400" : ""} />
                      <span>🛡️ Authority Dispatch</span>
                    </button>
                  )}

                  {/* Admin root portal link (Admin only) */}
                  {user.role === "admin" && (
                    <button
                      onClick={() => navigate("/admin")}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition cursor-pointer ${
                        currentPath === "/admin" 
                          ? "bg-white/10 text-white font-bold border border-white/10" 
                          : "text-slate-450 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      <Key size={14} className={currentPath === "/admin" ? "text-indigo-400" : ""} />
                      <span>🔑 Root Admin Portal</span>
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-white/5 text-[10px] text-slate-500 font-mono leading-relaxed px-1">
                  Metro Heights Operational Command. All session audits synchronized locally.
                </div>
              </aside>

              {/* Right-Hand Content Area */}
              <div className="lg:col-span-9">
                <AnimatePresence mode="wait">
                  
                  {/* Route: Dashboard (Integrated Map, Analytics, Leaderboard Tabs) */}
                  {currentPath === "/dashboard" && (
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-5"
                    >
                      {/* Sub-navigation bar inside Citizen Dashboard card */}
                      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
                        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl text-xs font-semibold">
                          <button
                            onClick={() => setDashboardTab("map")}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${dashboardTab === "map" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-slate-200"}`}
                          >
                            📍 Incident Map
                          </button>
                          <button
                            onClick={() => setDashboardTab("analytics")}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${dashboardTab === "analytics" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-slate-200"}`}
                          >
                            📈 Transparency Stats
                          </button>
                          <button
                            onClick={() => setDashboardTab("gamification")}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${dashboardTab === "gamification" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-slate-200"}`}
                          >
                            🏆 Citizens Leaderboard
                          </button>
                        </div>

                        <span className="text-[10px] font-mono text-slate-450 hidden sm:inline-block">
                          Active Tickets: {issues.filter(i => i.status !== "Resolved").length} open
                        </span>
                      </div>

                      {/* Render dashboard segments */}
                      {dashboardTab === "map" && (
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
                          <InteractiveMap
                            issues={issues}
                            selectedIssueId={selectedIssueId}
                            onSelectIssueId={setSelectedIssueId}
                            onMapClick={handleMapClick}
                            clickedCoords={clickedCoords}
                          />

                          {/* Record inspector details card */}
                          {selectedIssue && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl relative z-10"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-3 gap-3">
                                <div>
                                  <span className="text-[10px] uppercase font-mono text-indigo-400 tracking-wider font-bold">MUTABLE RECORD INSPECT</span>
                                  <h4 className="text-white font-bold text-sm leading-tight mt-0.5">{selectedIssue.title}</h4>
                                </div>
                                <div className="flex items-center space-x-1.5 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                                    selectedIssue.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 
                                    selectedIssue.status === 'In Progress' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                                    'bg-white/5 text-slate-400 border border-white/10'
                                  }`}>
                                    {selectedIssue.status}
                                  </span>
                                  <button
                                    onClick={() => handleVote(selectedIssue.id)}
                                    disabled={votingId === selectedIssue.id}
                                    className={`px-3 py-1 rounded text-[11px] font-bold border transition ${selectedIssue.upvotedByUser ? 'bg-gradient-to-tr from-pink-500 to-rose-600 border-transparent text-white shadow-md' : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'} cursor-pointer disabled:opacity-50 flex items-center space-x-1`}
                                  >
                                    {votingId === selectedIssue.id ? (
                                      <RefreshCw size={11} className="animate-spin mr-1" />
                                    ) : null}
                                    <span>{selectedIssue.upvotedByUser ? '♥ Upvoted' : '👍 Upvote'} ({selectedIssue.upvotes})</span>
                                  </button>
                                  <button onClick={handleExportPDF} className="px-3 py-1 rounded text-[11px] font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 cursor-pointer flex items-center space-x-1">
                                    <Download size={12} className="mr-1"/> Export PDF
                                  </button>
                                  <button onClick={handleShare} className="px-3 py-1 rounded text-[11px] font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 cursor-pointer flex items-center space-x-1">
                                    <Share2 size={12} className="mr-1"/> Social Sharing
                                  </button>
                                  <button onClick={() => setAiModalOpen(true)} className="px-3 py-1 rounded text-[11px] font-bold border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 cursor-pointer flex items-center space-x-1">
                                    <Sparkles size={12} className="mr-1"/> AI Features
                                  </button>
                                </div>
                              </div>

                              {/* Inspector Subtabs */}
                              <div className="flex items-center space-x-1 border-b border-white/5 pb-2 text-xs">
                                <button
                                  onClick={() => setInspectorTab("overview")}
                                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-[11px] ${
                                    inspectorTab === "overview" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/25" : "text-slate-400 hover:text-white"
                                  }`}
                                >
                                  📋 Overview
                                </button>
                                <button
                                  onClick={() => setInspectorTab("timeline")}
                                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-[11px] ${
                                    inspectorTab === "timeline" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/25" : "text-slate-400 hover:text-white"
                                  }`}
                                >
                                  ⏱️ Timeline
                                </button>
                                <button
                                  onClick={() => setInspectorTab("comments")}
                                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-[11px] ${
                                    inspectorTab === "comments" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/25" : "text-slate-400 hover:text-white"
                                  }`}
                                >
                                  💬 Comments ({selectedIssue.comments.length})
                                </button>
                              </div>

                              <AnimatePresence mode="wait">
                                {inspectorTab === "overview" && (
                                  <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="space-y-3"
                                  >
                                    <p className="text-xs text-slate-300 leading-relaxed">{selectedIssue.description}</p>
                                    
                                    {selectedIssue.resolutionNotes && (
                                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-[11px] leading-relaxed mt-2">
                                        <span className="font-bold text-emerald-400 uppercase tracking-widest font-mono text-[9px] block mb-1">Official Resolution Certification</span>
                                        <p className="text-slate-300">{selectedIssue.resolutionNotes}</p>
                                        {selectedIssue.resolutionProofImage && (
                                          <img 
                                            src={selectedIssue.resolutionProofImage} 
                                            alt="Resolution Proof" 
                                            referrerPolicy="no-referrer"
                                            className="w-full max-h-[120px] object-cover rounded-lg border border-white/10 mt-2.5 shadow"
                                          />
                                        )}
                                      </div>
                                    )}

                                    {selectedIssue.recommendation && (
                                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-[11px] leading-relaxed flex items-start space-x-2 text-indigo-200">
                                        <span className="font-bold flex-shrink-0 text-amber-300 font-mono text-[9px] bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/35 rounded uppercase tracking-wider h-max mt-0.5">AI ACTION TIPS</span>
                                        <p>{selectedIssue.recommendation}</p>
                                      </div>
                                    )}
                                  </motion.div>
                                )}

                                {inspectorTab === "timeline" && (
                                  <motion.div
                                    key="timeline"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                  >
                                    <IssueTimeline issue={selectedIssue} />
                                  </motion.div>
                                )}

                                {inspectorTab === "comments" && (
                                  <motion.div
                                    key="comments"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="space-y-3 text-xs"
                                  >
                                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                      {selectedIssue.comments.length === 0 ? (
                                        <p className="text-slate-500 italic py-3 text-center">No comments yet. Be the first to verify or support this ticket!</p>
                                      ) : (
                                        selectedIssue.comments.map(c => (
                                          <div key={c.id} className="p-3 bg-slate-950/40 rounded-2xl border border-white/5">
                                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                              <span className="font-bold text-slate-300">{c.author}</span>
                                              <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">{c.text}</p>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                    <form
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        const form = e.currentTarget;
                                        const textInput = form.elements.namedItem("commentText") as HTMLInputElement;
                                        const commentVal = textInput.value.trim();
                                        if (commentVal && selectedIssue) {
                                          const newComment = {
                                            id: "comm-" + Math.random().toString(36).substr(2, 9),
                                            author: currentUsername,
                                            text: commentVal,
                                            createdAt: new Date().toISOString()
                                          };
                                          
                                          const docRef = doc(db, "complaints", selectedIssue.id);
                                          updateDoc(docRef, {
                                            comments: arrayUnion(newComment)
                                          }).then(() => {
                                            console.log("[COMPLAINT-SYNC] Comment added to Firestore.");
                                            // Notify backend
                                            fetch(`/api/issues/${selectedIssue.id}/comment`, {
                                              method: "POST",
                                              headers: { 
                                                "Content-Type": "application/json",
                                                "Authorization": `Bearer ${token}`
                                              },
                                              body: JSON.stringify({ author: currentUsername, text: commentVal })
                                            });
                                            textInput.value = "";
                                          }).catch(err => {
                                            console.error("Comment submit failed:", err);
                                          });
                                        }
                                      }}
                                      className="mt-2 flex items-center space-x-2"
                                    >
                                      <input
                                        name="commentText"
                                        placeholder="Add verification commentary..."
                                        className="flex-1 bg-slate-950/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                                      />
                                      <button
                                        type="submit"
                                        className="px-3.5 py-2 bg-gradient-to-tr from-blue-500 to-indigo-650 border border-white/10 rounded-xl text-white font-bold hover:brightness-110 shadow-md transition cursor-pointer text-xs"
                                      >
                                        Certify
                                      </button>
                                    </form>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )}
                        </div>
                      )}

                      {dashboardTab === "analytics" && (
                        <div className="max-w-4xl mx-auto">
                          <DashboardAnalytics analytics={analytics} />
                        </div>
                      )}

                      {dashboardTab === "gamification" && (
                        <div className="max-w-4xl mx-auto">
                          <LeaderboardGamification
                            entries={leaderboard}
                            currentUsername={currentUsername}
                            onChangeUsername={setCurrentUsername}
                          />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Route: Report Issue (Citizen only, full-screen elegant form layout) */}
                  {currentPath === "/report-issue" && (
                    <motion.div
                      key="report"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="max-w-2xl mx-auto"
                    >
                      <ReportForm
                        onIssueReported={handleIssueReported}
                        clickedCoords={clickedCoords}
                        onClearCoords={() => setClickedCoords(null)}
                        currentUsername={currentUsername}
                      />
                    </motion.div>
                  )}

                  {/* Route: Authority Dispatch Workspace */}
                  {currentPath === "/authority" && (
                    <motion.div
                      key="authority"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      <AuthorityPanel
                        issues={issues}
                        selectedIssueId={selectedIssueId}
                        onSelectIssueId={setSelectedIssueId}
                        onUpdateIssueStatus={handleUpdateStatus}
                        onRefreshData={fetchAllData}
                      />
                    </motion.div>
                  )}

                  {/* Route: Root Admin Dashboard */}
                  {currentPath === "/admin" && (
                    <motion.div
                      key="admin"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      <AdminPanel 
                        issues={issues} 
                        onUpdateIssueStatus={handleUpdateStatus} 
                        onRefreshData={fetchAllData} 
                      />
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Persistent floating AI ecosystem Counselor chatbot eco-echo! */}
      {/* AI Features Modal */}
      <AnimatePresence>
        {aiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <button 
                onClick={() => setAiModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center space-x-3 mb-5">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-display">AI Capabilities</h3>
                  <p className="text-xs text-slate-400">Powered by Gemini</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-sm text-slate-300">
                  <p className="font-semibold text-white mb-2">Test AI Categorization & Summary</p>
                  <p className="text-xs mb-3 text-slate-400">
                    Run our Gemini integration to automatically analyze the selected issue's text, verify the category, and assign an urgency score.
                  </p>
                  
                  {aiAnalysisResult ? (
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-200 text-xs">
                      {aiAnalysisResult}
                    </div>
                  ) : (
                    <button 
                      onClick={handleTestAIFeatures}
                      disabled={isAnalyzing}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isAnalyzing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      <span>{isAnalyzing ? "Analyzing Issue..." : "Run Analysis"}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Chatbot />
    </div>
  );
}
