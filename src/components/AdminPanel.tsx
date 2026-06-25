import React, { useState, useEffect } from "react";
import { UserProfile, UserRole, Issue } from "../types";
import { useAuth } from "./AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Shield, 
  Trash2, 
  UserCheck, 
  RefreshCw, 
  AlertTriangle, 
  Key, 
  Ban, 
  Unlock, 
  Plus, 
  Edit, 
  Clipboard, 
  Settings, 
  Save, 
  MapPin, 
  CheckCircle2, 
  X,
  Briefcase
} from "lucide-react";

interface AdminPanelProps {
  issues?: Issue[];
  onUpdateIssueStatus?: (id: string, status: Issue["status"], team?: string) => void;
  onRefreshData?: () => void;
}

export default function AdminPanel({ issues = [], onUpdateIssueStatus, onRefreshData }: AdminPanelProps) {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<"directory" | "authorities" | "complaints" | "settings">("directory");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Add/Edit Authority Modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [editingAuth, setEditingAuth] = useState<UserProfile | null>(null);
  const [authForm, setAuthForm] = useState({ name: "", email: "", badge: "Chief Dispatcher" });

  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    upvoteThreshold: 5,
    proximityRadius: 350,
    maintenanceMode: false,
    autoVerify: true,
    notificationBroadcasting: true
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to fetch platform users.");
      }
    } catch (err) {
      setError("Network error fetching users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        setSuccess(`Successfully updated role to ${newRole}`);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to change role.");
      }
    } catch (err) {
      setError("Network error updating role.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBlockToggle = async (userId: string, currentlyBlocked: boolean) => {
    setUpdatingId(userId);
    setError(null);
    setSuccess(null);
    const endpoint = currentlyBlocked ? "unblock" : "block";
    try {
      const res = await fetch(`/api/admin/users/${userId}/${endpoint}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        setSuccess(`User successfully ${currentlyBlocked ? "unblocked" : "blocked"}.`);
      } else {
        const errData = await res.json();
        setError(errData.error || `Failed to ${endpoint} user.`);
      }
    } catch (err) {
      setError(`Network error trying to ${endpoint} user.`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      setError("Self-deletion is blocked for administrator security.");
      setTimeout(() => setError(null), 5000);
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setSuccess("User successfully removed from system directory.");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to delete user.");
      }
    } catch (err) {
      setError("Network error deleting user.");
    }
  };

  const handleSaveAuthority = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      let res;
      if (editingAuth) {
        // Edit Mode
        res = await fetch(`/api/admin/authorities/${editingAuth.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(authForm)
        });
      } else {
        // Create Mode
        res = await fetch("/api/admin/authorities", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(authForm)
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (editingAuth) {
          setUsers(prev => prev.map(u => u.id === editingAuth.id ? data : u));
          setSuccess("Authority details updated successfully.");
        } else {
          setUsers(prev => [...prev, data]);
          setSuccess("New certified municipal official registered successfully.");
        }
        setAuthModalOpen(false);
        setEditingAuth(null);
        setAuthForm({ name: "", email: "", badge: "Chief Dispatcher" });
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to save authority profile.");
      }
    } catch (err) {
      setError("Network error saving authority.");
    }
  };

  const handleOpenEditAuth = (u: UserProfile) => {
    setEditingAuth(u);
    setAuthForm({
      name: u.name,
      email: u.email,
      badge: u.badge || "Chief Dispatcher"
    });
    setAuthModalOpen(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("Administrative configuration parameters saved successfully.");
    setTimeout(() => setSuccess(null), 3000);
  };

  // Stats calculations
  const totalUsers = users.length;
  const totalCitizens = users.filter(u => u.role === "citizen").length;
  const totalAuthorities = users.filter(u => u.role === "authority").length;
  const totalAdmins = users.filter(u => u.role === "admin").length;
  const blockedUsersCount = users.filter(u => u.isBlocked).length;

  const authoritySquads = [
    "Midtown Road Paving Crew B",
    "Rapid Water Infrastructure Support",
    "Eco-Clean Sanitation Squad",
    "Electrical Utilities Technician"
  ];

  return (
    <div id="admin-dashboard-root" className="space-y-6">
      {/* Admin Grid Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Members</p>
            <h3 className="text-xl md:text-2xl font-bold text-white mt-1">{loading ? "..." : totalUsers}</h3>
          </div>
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 hidden sm:block">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Officials</p>
            <h3 className="text-xl md:text-2xl font-bold text-emerald-400 mt-1">{loading ? "..." : totalAuthorities}</h3>
          </div>
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hidden sm:block">
            <Shield size={20} />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Blocked Accounts</p>
            <h3 className="text-xl md:text-2xl font-bold text-red-400 mt-1">{loading ? "..." : blockedUsersCount}</h3>
          </div>
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hidden sm:block">
            <Ban size={20} />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Admin Staff</p>
            <h3 className="text-xl md:text-2xl font-bold text-rose-400 mt-1">{loading ? "..." : totalAdmins}</h3>
          </div>
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 hidden sm:block">
            <Key size={20} />
          </div>
        </div>
      </div>

      {/* Admin Subtabs Layout */}
      <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-4 gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Settings className="text-indigo-400 animate-spin-slow" size={20} />
            <div>
              <h2 className="text-base font-bold text-white">Root System Admin Terminal</h2>
              <p className="text-xs text-slate-400 mt-0.5">Configure access levels, audit complaints, and manage municipal parameters</p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex flex-wrap gap-1 bg-slate-950/40 p-1 rounded-xl border border-white/5 text-xs font-semibold">
            <button
              onClick={() => setAdminTab("directory")}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${adminTab === "directory" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              👥 User Directory
            </button>
            <button
              onClick={() => setAdminTab("authorities")}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${adminTab === "authorities" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              🛡️ Authorities Management
            </button>
            <button
              onClick={() => setAdminTab("complaints")}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${adminTab === "complaints" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              📋 Complaint Assignment
            </button>
            <button
              onClick={() => setAdminTab("settings")}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${adminTab === "settings" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              ⚙️ Platform Settings
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-xs flex items-center gap-2 mb-4">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs flex items-center gap-2 mb-4">
            <CheckCircle2 size={15} />
            <span>{success}</span>
          </div>
        )}

        {/* Dynamic Tab Contents */}
        {loading && adminTab === "directory" ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="animate-spin text-indigo-500" size={28} />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing Identity Records...</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* 1. User Directory Tab */}
            {adminTab === "directory" && (
              <motion.div
                key="directory"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="overflow-x-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Account Directories</h3>
                  <button
                    onClick={fetchUsers}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-mono text-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={11} />
                    <span>FORCE RETRIEVE</span>
                  </button>
                </div>

                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 pl-2">Name & Email</th>
                      <th className="pb-3">Account Scope (Role)</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Points & Badge</th>
                      <th className="pb-3 text-right pr-2">Modifications</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/2 transition">
                        <td className="py-3 pl-2">
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{u.email}</div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center space-x-1.5">
                            <select
                              value={u.role}
                              disabled={updatingId === u.id || u.id === currentUser?.id}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              className="bg-slate-950/80 border border-white/10 rounded-lg px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                            >
                              <option value="citizen">Citizen</option>
                              <option value="authority">Authority</option>
                              <option value="admin">Admin</option>
                            </select>
                            {u.role === "admin" && (
                              <span className="px-1.5 py-0.2 bg-rose-500/15 border border-rose-500/25 text-rose-400 rounded text-[8px] uppercase font-mono tracking-wider">ROOT</span>
                            )}
                            {u.role === "authority" && (
                              <span className="px-1.5 py-0.2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 rounded text-[8px] uppercase font-mono tracking-wider">OFFICER</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 font-mono">
                          {u.isBlocked ? (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[9px] font-bold border border-red-500/25 uppercase">Blocked</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full text-[9px] font-bold border border-emerald-500/20 uppercase">Active</span>
                          )}
                        </td>
                        <td className="py-3 font-mono">
                          <div className="text-white font-semibold">{u.points} pts</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{u.badge}</div>
                        </td>
                        <td className="py-3 text-right pr-2">
                          <div className="flex items-center justify-end space-x-1.5">
                            {u.id !== currentUser?.id && (
                              deleteConfirmId === u.id ? (
                                <div className="flex items-center space-x-1 font-sans text-[10px]">
                                  <span className="text-red-400 font-bold mr-1">Confirm?</span>
                                  <button
                                    onClick={() => {
                                      setDeleteConfirmId(null);
                                      handleDeleteUser(u.id);
                                    }}
                                    className="px-2 py-1 bg-red-650 hover:bg-red-500 text-white font-bold rounded-md transition cursor-pointer text-[9px]"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-md transition cursor-pointer text-[9px]"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleBlockToggle(u.id, !!u.isBlocked)}
                                    disabled={updatingId === u.id || u.role === "admin"}
                                    className={`p-1.5 border rounded-lg transition cursor-pointer disabled:opacity-30 ${
                                      u.isBlocked 
                                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-450 hover:bg-emerald-500/20" 
                                        : "bg-red-500/10 border-red-500/25 text-red-450 hover:bg-red-500/20"
                                    }`}
                                    title={u.isBlocked ? "Unblock Account" : "Suspend/Block Account"}
                                  >
                                    {u.isBlocked ? <Unlock size={12} /> : <Ban size={12} />}
                                  </button>
                                  
                                  <button
                                    onClick={() => setDeleteConfirmId(u.id)}
                                    disabled={updatingId === u.id}
                                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition cursor-pointer"
                                    title="Revoke & Delete Profile"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            {/* 2. Authority Management Tab */}
            {adminTab === "authorities" && (
              <motion.div
                key="authorities"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Certified City Dispatchers & Officials</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Register accounts with restricted Authority Dashboards to handle dispatching and status logs</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingAuth(null);
                      setAuthForm({ name: "", email: "", badge: "Chief Dispatcher" });
                      setAuthModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-tr from-emerald-500 to-teal-650 hover:brightness-110 text-white border border-white/10 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-md"
                  >
                    <Plus size={13} />
                    <span>Register Official</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {users.filter(u => u.role === "authority").map((auth) => (
                    <div key={auth.id} className="bg-slate-950/25 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-white/10 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                            <Shield size={18} />
                          </div>
                          <div>
                            <h4 className="text-white text-xs font-bold">{auth.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{auth.email}</p>
                          </div>
                        </div>
                        <div className="flex space-x-1 items-center">
                          {deleteConfirmId === auth.id ? (
                            <div className="flex items-center space-x-1 font-sans text-[10px] bg-slate-950/60 p-1 border border-white/10 rounded-xl">
                              <span className="text-red-400 font-bold mr-1 pl-1">Delete?</span>
                              <button
                                onClick={() => {
                                  setDeleteConfirmId(null);
                                  handleDeleteUser(auth.id);
                                }}
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition cursor-pointer text-[9px]"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded transition cursor-pointer text-[9px]"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenEditAuth(auth)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg transition cursor-pointer"
                                title="Edit Official Profile"
                              >
                                <Edit size={11} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(auth.id)}
                                className="p-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-400 rounded-lg transition cursor-pointer"
                                title="Delete Official"
                              >
                                <Trash2 size={11} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Badge: <strong className="text-slate-300">{auth.badge}</strong></span>
                        <span>Experience: <strong className="text-slate-300">{auth.points} pts</strong></span>
                      </div>
                    </div>
                  ))}

                  {users.filter(u => u.role === "authority").length === 0 && (
                    <div className="col-span-2 text-center py-12 bg-slate-950/10 border border-dashed border-white/5 rounded-2xl text-slate-500">
                      <Shield size={24} className="mx-auto mb-2 text-slate-600" />
                      <p className="text-xs">No city officials registered yet. Create one to assign dispatcher tasks!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 3. Complaint Assignment Tab */}
            {adminTab === "complaints" && (
              <motion.div
                key="complaints"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Operational Ticket Registry</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">View all complaints submitted by citizens and directly assign dispatch squads to clear backlogs</p>
                </div>

                <div className="bg-slate-950/20 border border-white/5 rounded-2xl overflow-hidden mt-3 text-xs">
                  <div className="grid grid-cols-12 border-b border-white/10 bg-slate-950/40 p-3 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <span className="col-span-4">Issue Details</span>
                    <span className="col-span-2">Urgency</span>
                    <span className="col-span-2">Status</span>
                    <span className="col-span-3">Assigned Dispatch Squad</span>
                    <span className="col-span-1 text-right">Actions</span>
                  </div>

                  <div className="divide-y divide-white/5 max-h-[380px] overflow-y-auto">
                    {issues.map(issue => (
                      <div key={issue.id} className="grid grid-cols-12 p-3 items-center hover:bg-white/2 transition">
                        <div className="col-span-4 pr-3">
                          <span className="font-bold text-white block truncate">{issue.title}</span>
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{issue.address}</span>
                        </div>
                        <div className="col-span-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                            issue.urgency === 'Critical' ? 'bg-red-500/20 text-red-300 border border-red-500/25' : 
                            issue.urgency === 'High' ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20' : 
                            'bg-white/5 text-slate-400'
                          }`}>
                            {issue.urgency}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                            issue.status === 'Resolved' ? 'bg-emerald-500/15 text-emerald-450 border border-emerald-500/20' : 
                            'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {issue.status}
                          </span>
                        </div>
                        <div className="col-span-3 pr-2">
                          <select
                            value={issue.assignedTeam || ""}
                            onChange={(e) => {
                              if (onUpdateIssueStatus) {
                                onUpdateIssueStatus(issue.id, "Assigned", e.target.value);
                                if (onRefreshData) onRefreshData();
                              }
                            }}
                            className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-350 focus:outline-none w-full max-w-[180px] cursor-pointer"
                          >
                            <option value="">-- Unassigned --</option>
                            {authoritySquads.map(sq => (
                              <option key={sq} value={sq}>{sq}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            onClick={() => {
                              if (onUpdateIssueStatus) {
                                onUpdateIssueStatus(issue.id, "Resolved", issue.assignedTeam || "Ecosystem Action Team");
                                if (onRefreshData) onRefreshData();
                              }
                            }}
                            disabled={issue.status === "Resolved"}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-20 border border-emerald-500/20 text-emerald-400 rounded-lg transition cursor-pointer"
                            title="Directly Force Resolve"
                          >
                            <CheckCircle2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {issues.length === 0 && (
                      <p className="text-center text-slate-500 italic py-12">No complaint tickets logged on the platform currently.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. Settings Tab */}
            {adminTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="max-w-2xl"
              >
                <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">AI & Municipal Algorithmic Parameters</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1.5 uppercase tracking-wider text-[10px]">Auto-Verification Threshold</label>
                      <input
                        type="number"
                        value={settingsForm.upvoteThreshold}
                        onChange={(e) => setSettingsForm({ ...settingsForm, upvoteThreshold: parseInt(e.target.value) || 5 })}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Upvotes needed to advance status"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Upvote target for a complaint to automatically verify</p>
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1.5 uppercase tracking-wider text-[10px]">Geofence De-duplication Radius</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={settingsForm.proximityRadius}
                          onChange={(e) => setSettingsForm({ ...settingsForm, proximityRadius: parseInt(e.target.value) || 350 })}
                          className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 pr-10 text-white focus:outline-none focus:border-indigo-500"
                          placeholder="Meters radius"
                        />
                        <span className="absolute right-3 top-2 text-[10px] font-mono text-slate-500 uppercase">meters</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Proximity boundary to flags duplicated complaints</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between bg-slate-950/15 border border-white/5 rounded-xl p-3">
                      <div>
                        <span className="font-bold text-slate-350 block">AI Automated Classification & Grounding</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Use real-time Gemini to classify category and write dispatcher tips</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsForm.autoVerify}
                        onChange={(e) => setSettingsForm({ ...settingsForm, autoVerify: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/15 border border-white/5 rounded-xl p-3">
                      <div>
                        <span className="font-bold text-slate-350 block">Urgent Maintenance Overlay Mode</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Locks the system to authenticated municipal staff only</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsForm.maintenanceMode}
                        onChange={(e) => setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/15 border border-white/5 rounded-xl p-3">
                      <div>
                        <span className="font-bold text-slate-350 block">Simulate Real-time Socket Broadcasts</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Triggers client background polling to emulate push alerts</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsForm.notificationBroadcasting}
                        onChange={(e) => setSettingsForm({ ...settingsForm, notificationBroadcasting: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 bg-slate-950 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5">
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-gradient-to-tr from-indigo-500 to-indigo-700 hover:from-indigo-650 hover:to-indigo-750 text-white border border-white/10 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10 flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Save size={13} />
                      <span>Apply Parameters</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Register/Edit Authority Modal Overlay */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
          >
            <button
              onClick={() => {
                setAuthModalOpen(false);
                setEditingAuth(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1.5">
              <Shield size={18} className="text-emerald-400" />
              <span>{editingAuth ? "Edit City Official Profile" : "Register Municipal Official"}</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">Credentials will gain dispatcher dashboard permissions upon email matches.</p>

            <form onSubmit={handleSaveAuthority} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">Official Name</label>
                <input
                  type="text"
                  required
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Officer Marcus Vance"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">Certified Email</label>
                <input
                  type="email"
                  required
                  disabled={!!editingAuth}
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  placeholder="e.g. adityaksharma00412@gmail.com"
                />
                <p className="text-[9px] text-slate-500 mt-1">Must be adityaksharma00412@gmail.com for tests, or match officer suffix</p>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">Designation Badge</label>
                <input
                  type="text"
                  value={authForm.badge}
                  onChange={(e) => setAuthForm({ ...authForm, badge: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Lead Roads Inspector"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalOpen(false);
                    setEditingAuth(null);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-350 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-tr from-emerald-500 to-teal-600 hover:brightness-110 text-white border border-white/10 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  {editingAuth ? "Save Changes" : "Register Official"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
