import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Issue } from "../types";
import { CheckCircle2, Search, MapPin, Download, Printer, FileText, Filter, Calendar, Map, CheckCircle, Clock, Trophy, Award, Building, User, Activity } from "lucide-react";
import jsPDF from "jspdf";

interface ResolvedComplaintsPageProps {
  onViewOnMap: (lat: number, lng: number) => void;
}

export default function ResolvedComplaintsPage({ onViewOnMap }: ResolvedComplaintsPageProps) {
  const { user } = useAuth();
  const [resolvedIssues, setResolvedIssues] = useState<Issue[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<"All Time" | "Today" | "This Week" | "This Month">("All Time");

  useEffect(() => {
    if (!user) return;

    // Use Firestore onSnapshot for real-time synchronization
    const q = query(
      collection(db, "complaints"),
      where("status", "==", "Resolved")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let issues: Issue[] = snapshot.docs.map(docSnap => {
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
          status: data.status || "Resolved",
          reporterName: data.createdBy || "Anonymous Hero",
          reporterEmail: data.createdByEmail || undefined,
          reporterReputation: data.reporterReputation || 100,
          reporterBadge: data.reporterBadge || "Watchful Neighbor",
          upvotes: data.verificationCount || 1,
          upvotedByUser: data.upvotedByUser || false,
          comments: data.comments || [],
          timeline: data.timeline || [],
          duplicateChecked: data.duplicateChecked !== undefined ? data.duplicateChecked : true,
          duplicateOfId: data.duplicateOfId || null,
          image: data.imageUrl || "",
          isMock: false,
          createdAt: data.createdAt || new Date().toISOString(),
          assignedAuthorityEmail: data.assignedAuthority || data.assignedTeam || "",
          assignedTeam: data.assignedTeam || data.assignedAuthority || "",
          resolvedAt: data.resolvedAt || data.updatedAt || undefined,
          completedBy: data.completedBy || undefined,
          resolutionNotes: data.resolutionNotes || undefined,
          resolutionProofImage: data.resolutionProofImage || undefined
        } as Issue;
      });

      // Role-based filtering
      if (user.role === "citizen") {
        issues = issues.filter(i => i.reporterEmail === user.email || i.reporterName === user.name);
      } else if (user.role === "authority") {
        issues = issues.filter(i => i.assignedAuthorityEmail === user.email || i.assignedTeam === user.email);
      }
      // Admin sees everything.

      // Sort by resolvedAt descending
      issues.sort((a, b) => {
        const dateA = a.resolvedAt ? new Date(a.resolvedAt).getTime() : new Date(a.createdAt).getTime();
        const dateB = b.resolvedAt ? new Date(b.resolvedAt).getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      setResolvedIssues(issues);
    });

    return () => unsubscribe();
  }, [user]);

  // Filtering
  const filteredIssues = resolvedIssues.filter(issue => {
    // Search
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      issue.id.toLowerCase().includes(searchLower) ||
      issue.title.toLowerCase().includes(searchLower) ||
      issue.reporterName.toLowerCase().includes(searchLower) ||
      (issue.reporterEmail || "").toLowerCase().includes(searchLower) ||
      issue.category.toLowerCase().includes(searchLower) ||
      (issue.address || "").toLowerCase().includes(searchLower);

    if (!matchSearch) return false;

    // Time Filter
    if (timeFilter !== "All Time") {
      const resolvedAt = issue.resolvedAt ? new Date(issue.resolvedAt) : new Date(issue.createdAt);
      const now = new Date();
      if (timeFilter === "Today") {
        if (resolvedAt.toDateString() !== now.toDateString()) return false;
      } else if (timeFilter === "This Week") {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (resolvedAt < oneWeekAgo) return false;
      } else if (timeFilter === "This Month") {
        if (resolvedAt.getMonth() !== now.getMonth() || resolvedAt.getFullYear() !== now.getFullYear()) return false;
      }
    }

    return true;
  });

  // Calculate stats
  const totalResolved = filteredIssues.length;
  const resolvedToday = filteredIssues.filter(i => {
    const resolvedAt = i.resolvedAt ? new Date(i.resolvedAt) : new Date(i.createdAt);
    return resolvedAt.toDateString() === new Date().toDateString();
  }).length;
  
  // Avg resolution time
  let totalHours = 0;
  let validTimesCount = 0;
  filteredIssues.forEach(i => {
    if (i.resolvedAt && i.createdAt) {
      const ms = new Date(i.resolvedAt).getTime() - new Date(i.createdAt).getTime();
      if (ms > 0) {
        totalHours += ms / (1000 * 60 * 60);
        validTimesCount++;
      }
    }
  });
  const avgResolutionTime = validTimesCount > 0 ? (totalHours / validTimesCount).toFixed(1) + " hours" : "N/A";

  // Top Authority & Category
  const authorityCount: Record<string, number> = {};
  const categoryCount: Record<string, number> = {};
  filteredIssues.forEach(i => {
    if (i.assignedTeam) {
      authorityCount[i.assignedTeam] = (authorityCount[i.assignedTeam] || 0) + 1;
    }
    if (i.category) {
      categoryCount[i.category] = (categoryCount[i.category] || 0) + 1;
    }
  });

  const topAuthority = Object.keys(authorityCount).sort((a, b) => authorityCount[b] - authorityCount[a])[0] || "None";
  const topCategory = Object.keys(categoryCount).sort((a, b) => categoryCount[b] - categoryCount[a])[0] || "None";

  // Export handlers
  const handleExportCSV = () => {
    const headers = ["ID", "Title", "Category", "Status", "Reporter Name", "Reporter Email", "Assigned Authority", "Created At", "Resolved At"];
    const rows = filteredIssues.map(i => [
      i.id,
      i.title.replace(/,/g, " "),
      i.category,
      i.status,
      i.reporterName.replace(/,/g, " "),
      i.reporterEmail || "",
      i.assignedTeam?.replace(/,/g, " ") || "",
      new Date(i.createdAt).toLocaleString(),
      i.resolvedAt ? new Date(i.resolvedAt).toLocaleString() : ""
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `resolved_complaints_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Resolved Complaints Report", 20, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    doc.text(`Total Records: ${filteredIssues.length}`, 20, 36);
    
    let y = 50;
    filteredIssues.slice(0, 50).forEach((issue, index) => { // Limit to 50 for performance
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. [${issue.id}] ${issue.title}`, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(`Category: ${issue.category} | Authority: ${issue.assignedTeam || "N/A"}`, 25, y + 6);
      doc.text(`Resolved: ${issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleDateString() : "Unknown"}`, 25, y + 12);
      y += 20;
    });

    doc.save(`resolved_complaints_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-display tracking-tight">Resolved Issues</h1>
              <p className="text-slate-400 text-sm">Permanent archive of completed civic actions.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium text-white transition flex items-center gap-2">
            <FileText size={16} /> <span className="hidden sm:inline">CSV</span>
          </button>
          <button onClick={handleExportPDF} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium text-white transition flex items-center gap-2">
            <Download size={16} /> <span className="hidden sm:inline">PDF</span>
          </button>
          <button onClick={handlePrint} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium text-white transition flex items-center gap-2">
            <Printer size={16} /> <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center">
          <CheckCircle size={20} className="text-emerald-400 mb-2" />
          <span className="text-2xl font-bold text-white font-mono">{totalResolved}</span>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Total Resolved</span>
        </div>
        <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center">
          <Activity size={20} className="text-blue-400 mb-2" />
          <span className="text-2xl font-bold text-white font-mono">{resolvedToday}</span>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Resolved Today</span>
        </div>
        <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center">
          <Clock size={20} className="text-amber-400 mb-2" />
          <span className="text-xl font-bold text-white font-mono mt-0.5">{avgResolutionTime}</span>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Avg Resolution Time</span>
        </div>
        <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center hidden md:flex">
          <Trophy size={20} className="text-purple-400 mb-2" />
          <span className="text-sm font-bold text-white mt-1 truncate w-full">{topAuthority}</span>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Top Authority</span>
        </div>
        <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center hidden md:flex">
          <Award size={20} className="text-indigo-400 mb-2" />
          <span className="text-sm font-bold text-white mt-1 truncate w-full">{topCategory}</span>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Top Category</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by ID, name, email, category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
          {(["All Time", "Today", "This Week", "This Month"] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeFilter(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${timeFilter === tf ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filteredIssues.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center border border-dashed border-white/10 rounded-3xl bg-white/5">
          <CheckCircle2 size={48} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white font-display mb-1">No Resolved Issues Found</h3>
          <p className="text-slate-400 text-sm max-w-sm">No complaints match your current search and filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map(issue => (
            <motion.div 
              key={issue.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-emerald-500/20 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/5"
            >
              <div className="p-5">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Column: Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {issue.status}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10">
                            {issue.category}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500">
                            ID: {issue.id}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white font-display leading-tight">{issue.title}</h3>
                      </div>
                      {/* AI Severity Badge */}
                      {issue.urgency && (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold uppercase text-slate-500">AI Severity</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded mt-0.5 border ${
                            issue.urgency === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            issue.urgency === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                            issue.urgency === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}>
                            {issue.urgency}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-xl border border-white/5">
                      {issue.description}
                    </p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2 text-slate-400">
                        <div className="flex items-center gap-2"><User size={14} className="text-slate-500" /> <span className="font-semibold text-slate-200">{issue.reporterName}</span></div>
                        {issue.reporterEmail && <div className="flex items-center gap-2 pl-5"> {issue.reporterEmail}</div>}
                        <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-500" /> <span className="truncate">{issue.address || `Lat: ${issue.latitude.toFixed(4)}, Lng: ${issue.longitude.toFixed(4)}`}</span></div>
                      </div>
                      <div className="space-y-2 text-slate-400">
                        <div className="flex items-center gap-2"><Building size={14} className="text-slate-500" /> Assigned: <span className="font-semibold text-slate-200">{issue.assignedTeam || "N/A"}</span></div>
                        <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-500" /> Created: <span className="text-slate-300">{new Date(issue.createdAt).toLocaleDateString()}</span></div>
                        <div className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Completed: <span className="text-emerald-400 font-medium">{issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleDateString() : "Unknown"}</span></div>
                      </div>
                    </div>

                    {/* Resolution Notes */}
                    {issue.resolutionNotes && (
                      <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl">
                        <h4 className="text-[10px] font-bold uppercase text-emerald-500 mb-1">Resolution Notes</h4>
                        <p className="text-sm text-emerald-100">{issue.resolutionNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Images & Actions */}
                  <div className="lg:w-64 flex flex-col space-y-3 shrink-0">
                    {/* Before Image */}
                    {issue.image && (
                      <div className="relative group rounded-xl overflow-hidden bg-slate-950 border border-white/10 aspect-video">
                        <img src={issue.image} alt="Before" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded">BEFORE</div>
                      </div>
                    )}
                    
                    {/* After Image */}
                    {issue.resolutionProofImage && (
                      <div className="relative group rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/30 aspect-video shadow-lg shadow-emerald-500/10">
                        <img src={issue.resolutionProofImage} alt="After" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-emerald-500/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">AFTER / PROOF</div>
                      </div>
                    )}

                    {!issue.image && !issue.resolutionProofImage && (
                      <div className="flex-1 flex items-center justify-center bg-slate-950 border border-white/5 rounded-xl aspect-video text-slate-600 text-xs font-mono">
                        No Evidence Photos
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2">
                      <button 
                        onClick={() => onViewOnMap(issue.latitude, issue.longitude)}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-white/10"
                      >
                        <Map size={14} /> View on Map
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
