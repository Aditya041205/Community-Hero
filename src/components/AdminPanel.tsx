import React, { useState, useEffect } from "react";
import { UserProfile, UserRole } from "../types";
import { useAuth } from "./AuthContext";
import { motion } from "motion/react";
import { Users, Shield, Trash2, UserCheck, RefreshCw, AlertTriangle, Key } from "lucide-react";

export default function AdminPanel() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to change role.");
      }
    } catch (err) {
      alert("Network error updating role.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert("Self-deletion is blocked for administrator security.");
      return;
    }
    if (!confirm("Are you absolutely sure you want to delete this user from the system?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete user.");
      }
    } catch (err) {
      alert("Network error deleting user.");
    }
  };

  // Stats calculation
  const totalUsers = users.length;
  const totalCitizens = users.filter(u => u.role === "citizen").length;
  const totalAuthorities = users.filter(u => u.role === "authority").length;
  const totalAdmins = users.filter(u => u.role === "admin").length;

  return (
    <div className="space-y-6">
      {/* Admin Grid Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Registered</p>
            <h3 className="text-2xl font-bold text-white mt-1">{loading ? "..." : totalUsers}</h3>
          </div>
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Citizens</p>
            <h3 className="text-2xl font-bold text-white mt-1">{loading ? "..." : totalCitizens}</h3>
          </div>
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <UserCheck size={20} />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Authorities</p>
            <h3 className="text-2xl font-bold text-white mt-1">{loading ? "..." : totalAuthorities}</h3>
          </div>
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <Shield size={20} />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Admins</p>
            <h3 className="text-2xl font-bold text-white mt-1">{loading ? "..." : totalAdmins}</h3>
          </div>
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
            <Key size={20} />
          </div>
        </div>
      </div>

      {/* Main Admin Management Area */}
      <div className="bg-slate-900/40 border border-white/10 rounded-xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Central Identity Directory</h2>
            <p className="text-xs text-slate-400 mt-1">Manage user scopes, elevate municipal authority ranks, and audit security credentials</p>
          </div>
          <button
            onClick={fetchUsers}
            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-slate-300 flex items-center space-x-1.5 transition cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh Directory</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2 mb-4">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <RefreshCw className="animate-spin text-indigo-500" size={28} />
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Syncing Identity Records...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Name & Email</th>
                  <th className="pb-3">Account Scope (Role)</th>
                  <th className="pb-3">Hero Points & Badge</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/2">
                    <td className="py-3.5 pl-2">
                      <div className="font-semibold text-white">{user.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center space-x-1.5">
                        <select
                          value={user.role}
                          disabled={updatingId === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="citizen">Citizen</option>
                          <option value="authority">Authority</option>
                          <option value="admin">Admin</option>
                        </select>
                        {user.role === "admin" && (
                          <span className="p-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded text-[9px] uppercase font-bold tracking-wider">ROOT</span>
                        )}
                        {user.role === "authority" && (
                          <span className="p-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-[9px] uppercase font-bold tracking-wider">OFFICER</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <div className="text-white font-medium">{user.points} pts</div>
                      <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">{user.badge}</div>
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === currentUser?.id}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 rounded-lg transition cursor-pointer"
                        title="Revoke and Delete Account"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
