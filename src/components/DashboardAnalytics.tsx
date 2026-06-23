import React from "react";
import { 
  TrendingUp, CheckCircle, Clock, Cpu, BarChart2
} from "lucide-react";
import { AnalyticsData } from "../types";

interface DashboardAnalyticsProps {
  analytics: AnalyticsData | null;
}

export default function DashboardAnalytics({ analytics }: DashboardAnalyticsProps) {
  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-lg relative z-10">
        <TrendingUp className="animate-pulse mb-2 text-indigo-400" size={32} />
        <p className="text-xs">Re-hydrating city analytics telemetry records...</p>
      </div>
    );
  }

  // Find the max category count to compute proportional bar lengths
  const counts = Object.values(analytics.categories);
  const maxCount = counts.length > 0 ? Math.max(...counts) : 1;

  return (
    <div className="space-y-6 relative z-10">
      {/* 4 Summary Dashboard Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total issues reported */}
        <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl flex items-center space-x-3 shadow-md hover:bg-white/10 hover:border-white/20 transition relative">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/25 text-indigo-300">
            <BarChart2 size={18} />
          </div>
          <div>
            <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[8px]">TOTAL ISSUES</span>
            <span className="text-lg md:text-xl font-bold text-white font-display">{analytics.total}</span>
          </div>
        </div>

        {/* Total issues resolved */}
        <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl flex items-center space-x-3 shadow-md hover:bg-white/10 hover:border-white/20 transition relative">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/25 text-emerald-300">
            <CheckCircle size={18} />
          </div>
          <div>
            <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[8px]">RESOLVED</span>
            <span className="text-lg md:text-xl font-bold text-emerald-300 font-display">{analytics.resolved}</span>
          </div>
        </div>

        {/* Active pending issues */}
        <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl flex items-center space-x-3 shadow-md hover:bg-white/10 hover:border-white/20 transition relative">
          <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/25 text-orange-300">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[8px]">PENDING</span>
            <span className="text-lg md:text-xl font-bold text-orange-300 font-display">{analytics.pending}</span>
          </div>
        </div>

        {/* Engagement points index score weight */}
        <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl flex items-center space-x-3 shadow-md hover:bg-white/10 hover:border-white/20 transition relative">
          <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/25 text-amber-300">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[8px]">ENGAGEMENT SCORE</span>
            <span className="text-lg md:text-xl font-bold text-amber-300 font-display">{analytics.communityEngagementScore}</span>
          </div>
        </div>
      </div>

      {/* AI Predictive Analytics Console Block */}
      <div className="p-5 bg-gradient-to-tr from-slate-900/40 via-indigo-950/20 to-emerald-950/15 backdrop-blur-xl border border-white/10 rounded-3xl shadow-lg text-xs leading-relaxed relative overflow-hidden">
        <div className="flex items-center space-x-2 border-b border-white/10 pb-2 mb-2">
          <Cpu size={14} className="text-indigo-400 animate-pulse" />
          <span className="font-bold text-slate-100 font-display">Predictive AI Municipal Planner</span>
          <span className="text-[8px] bg-indigo-500/20 border border-indigo-500/35 text-indigo-300 font-mono font-semibold px-2 py-0.5 rounded uppercase tracking-wider">GEMINI FORECAST</span>
        </div>
        <p className="text-slate-300 font-medium leading-relaxed">{analytics.predictiveForecast}</p>
        <div className="text-[9px] text-slate-500 font-mono mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
          <span>Active Grid Division Matrix: Sector density calculated 2dsphere</span>
          <span>Risk Index: SAFE LEVEL B</span>
        </div>
      </div>

      {/* 2 Custom animated SVG charts side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart A: Common civil failures block (Horizontal Bar Graph) */}
        <div className="p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-lg relative flex flex-col justify-between">
          <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider mb-4 border-b border-white/10 pb-2 flex items-center justify-between">
            <span>Common Civic Failures</span>
            <span className="text-[9px] font-mono text-slate-500">SORTED BY COUNT</span>
          </h4>
          
          <div className="space-y-3.5 pr-2">
            {Object.entries(analytics.categories).map(([category, count]) => {
              const barWidth = `${(count / maxCount) * 100}%`;
              return (
                <div key={category} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-semibold block truncate max-w-[170px]">{category}</span>
                    <span className="font-mono bg-slate-950/40 border border-white/5 px-2 py-0.5 rounded text-[10px] text-indigo-300 font-semibold">{count} reported</span>
                  </div>
                  {/* Outer Bar rail */}
                  <div className="w-full h-2 rounded bg-slate-950/45 overflow-hidden">
                    {/* Inner color-coded bar block */}
                    <div
                      className="h-full bg-gradient-to-r from-blue-550 to-indigo-500 rounded transition-all duration-1000"
                      style={{ width: barWidth }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart B: Neighborhood area hotspots count donut gauge */}
        <div className="p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-lg relative flex flex-col justify-between">
          <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider mb-4 border-b border-white/10 pb-2 flex items-center justify-between">
            <span>District Density Hotspots</span>
            <span className="text-[9px] font-mono text-slate-500">MUNICIPAL RADIAL GAUGE</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Visual SVG circular block representation */}
            <div className="relative flex justify-center">
              <svg viewBox="0 0 160 160" className="w-32 h-32 text-slate-400">
                {/* Background tracks */}
                <circle cx="80" cy="80" r="65" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                <circle cx="80" cy="80" r="48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />

                {/* Inner active dials proportional to coordinates densities */}
                {/* Midtown (cyan) */}
                <circle cx="80" cy="80" r="65" fill="none" stroke="#0ea5e9" strokeWidth="12"
                  strokeDasharray={`${(analytics.districtDensity["Midtown Hub"] / analytics.total) * 408} 408`}
                  strokeLinecap="round" transform="rotate(-90 80 80)"
                />
                
                {/* Downtown (violet) */}
                <circle cx="80" cy="80" r="48" fill="none" stroke="#a78bfa" strokeWidth="10"
                  strokeDasharray={`${(analytics.districtDensity["Downtown Village"] / analytics.total) * 301} 301`}
                  strokeLinecap="round" transform="rotate(30 80 80)"
                />

                {/* Center label */}
                <text x="80" y="85" textAnchor="middle" fill="#fff" fontFamily="Space Grotesk" fontSize="16" fontWeight="bold">
                  {analytics.resolutionRate}%
                </text>
                <text x="80" y="98" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold" letterSpacing="0.05em">
                  RESOLVED
                </text>
              </svg>
            </div>

            {/* Labels side column */}
            <div className="space-y-2 text-xs">
              {Object.entries(analytics.districtDensity).map(([district, value], index) => {
                const colorClass = index === 0 ? 'bg-cyan-500' : index === 1 ? 'bg-purple-400' : 'bg-slate-500';
                return (
                  <div key={district} className="p-2.5 bg-slate-950/40 backdrop-blur-sm border border-white/5 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
                      <span className="font-semibold text-slate-300">{district}</span>
                    </div>
                    <span className="font-mono text-white font-bold">{value} items</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
