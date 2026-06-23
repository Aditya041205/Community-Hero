import React from "react";
import { Award, User, Trophy, Star, Compass } from "lucide-react";
import { LeaderboardEntry } from "../types";

interface LeaderboardGamificationProps {
  entries: LeaderboardEntry[];
  currentUsername: string;
  onChangeUsername: (name: string) => void;
}

export default function LeaderboardGamification({
  entries,
  currentUsername,
  onChangeUsername
}: LeaderboardGamificationProps) {
  // Try to find if user is currently on the leaderboard
  const rawUserEntry = entries.find(u => u.name.toLowerCase() === currentUsername.toLowerCase());

  // Synthesize level based on points
  const pointsTotal = rawUserEntry ? rawUserEntry.points : 100;
  const computedLevel = Math.max(1, Math.floor(pointsTotal / 300));
  const remainingPoints = pointsTotal % 300;
  const levelPercentage = (remainingPoints / 300) * 100;

  const badgePool = [
    { name: "City Architect", desc: "For submitting highly detailed infrastructure reports.", icon: Trophy, color: "text-amber-300 border-amber-500/20 bg-amber-500/10" },
    { name: "Pothole Patrol", desc: "For reporting or upvoting road repair tickets.", icon: Star, color: "text-indigo-300 border-indigo-500/20 bg-indigo-500/10" },
    { name: "Green Guardian", desc: "For reporting garbage disposal anomalies.", icon: Compass, color: "text-emerald-300 border-emerald-500/20 bg-emerald-500/10" },
    { name: "Watchful Neighbor", desc: "Earned on establishing unique GPS coordinates.", icon: Award, color: "text-slate-300 border-white/10 bg-white/10" }
  ];

  return (
    <div className="space-y-6 relative z-10">
      {/* Top Split segment */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Profile Card */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col justify-between shadow-lg relative">
          <div>
            <span className="text-[10px] block font-semibold text-slate-400 uppercase tracking-wider mb-2.5">My Citizen Identity</span>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-11 w-11 rounded-xl bg-indigo-600/15 border border-indigo-400/25 text-indigo-300 flex items-center justify-center shadow-md">
                <User size={22} />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={currentUsername}
                  onChange={(e) => onChangeUsername(e.target.value)}
                  className="font-bold text-white font-display text-sm md:text-base border-b border-transparent hover:border-white/15 focus:border-indigo-400 bg-transparent focus:outline-none focus:ring-0 leading-tight pr-1 focus:bg-slate-950/20 px-1 rounded transition w-full"
                  title="Click to edit public citizen name"
                  placeholder="Change Name"
                />
                <span className="text-[10px] font-mono text-slate-400 block uppercase mt-0.5">Level {computedLevel} Civic Officer</span>
              </div>
            </div>

            {/* Level progression index bar */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>REPUTATION PROGRESS</span>
                <span className="font-mono text-indigo-300 font-bold">{pointsTotal} Hero Points</span>
              </div>
              <div className="w-full h-1.5 rounded bg-slate-950/45 overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 rounded transition-all duration-700"
                  style={{ width: `${levelPercentage}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 text-right">{300 - remainingPoints} points needed for Level {computedLevel + 1}</p>
            </div>
          </div>

          {/* User Badge Inventory catalog */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <span className="text-[10px] block font-semibold text-slate-400 uppercase tracking-wider mb-2.5">My Badge Inventory</span>
            <div className="grid grid-cols-2 gap-2">
              {badgePool.map(badge => {
                const isEarned = pointsTotal >= (badge.name === "City Architect" ? 1200 : badge.name === "Pothole Patrol" ? 800 : badge.name === "Green Guardian" ? 400 : 100);
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={badge.name}
                    className={`p-2 rounded-xl border flex items-center space-x-2 transition-all ${isEarned ? `${badge.color} border-white/10 shadow-sm` : 'opacity-25 bg-slate-950/15 border-white/5'}`}
                    title={badge.desc}
                  >
                    <BadgeIcon size={12} className={isEarned ? "animate-pulse" : ""} />
                    <span className="text-[10px] font-bold font-display truncate text-slate-200">{badge.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Global Leaderboard Column */}
        <div className="lg:col-span-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-lg relative">
          <span className="text-[10px] block font-semibold text-slate-400 uppercase tracking-wider mb-3">City Leaderboard Grid</span>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 text-xs scrollbar-none">
            {entries.map((entry, index) => {
              const rank = index + 1;
              const isMe = entry.name.toLowerCase() === currentUsername.toLowerCase();
              return (
                <div
                  key={entry.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${isMe ? 'bg-indigo-600/10 border-indigo-400/40 text-white shadow-inner' : 'bg-slate-950/25 border-white/5 text-slate-300 hover:bg-white/5'}`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    {/* Rank badge */}
                    <span className={`h-6 w-6 rounded-lg flex items-center justify-center font-bold text-[9px] font-mono shadow-sm ${rank === 1 ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-extrabold' : rank === 2 ? 'bg-slate-300 text-slate-950 font-extrabold' : rank === 3 ? 'bg-gradient-to-tr from-orange-600 to-amber-600 text-white font-extrabold' : 'bg-white/10 border border-white/5 text-slate-400'}`}>
                      #{rank}
                    </span>
                    <div className="truncate max-w-[130px]">
                      <span className={`font-bold block truncate ${isMe ? 'text-indigo-300' : 'text-slate-150'}`}>{entry.name}</span>
                      <span className="text-[8px] text-slate-400 uppercase font-mono block tracking-tight">{entry.badge}</span>
                    </div>
                  </div>

                  {/* Points column & Stats */}
                  <div className="flex items-center space-x-4 font-mono text-[10px]">
                    <div className="hidden sm:block text-right">
                      <span className="text-[8px] text-slate-400 block uppercase">ISSUES</span>
                      <span className="font-bold text-slate-200">{entry.issuesReported} reported</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-slate-450 block uppercase">POINTS</span>
                      <span className="font-bold text-indigo-350">{entry.points} pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
