import React from "react";
import { TimelineEvent, Issue } from "../types";
import { motion } from "motion/react";
import { 
  Check, 
  Clock, 
  ShieldCheck, 
  User, 
  Wrench, 
  CheckCircle,
  HelpCircle
} from "lucide-react";

interface IssueTimelineProps {
  issue: Issue;
}

const STATUS_ORDER = ["Reported", "Verified", "Assigned", "In Progress", "Resolved"] as const;

// Helper to get status details
const getStatusDetails = (status: string) => {
  switch (status) {
    case "Reported":
      return {
        icon: User,
        colorClass: "from-blue-500 to-indigo-650",
        borderColor: "border-blue-500/30",
        bgLight: "bg-blue-500/10",
        textClass: "text-blue-400"
      };
    case "Verified":
      return {
        icon: ShieldCheck,
        colorClass: "from-cyan-500 to-blue-600",
        borderColor: "border-cyan-500/30",
        bgLight: "bg-cyan-500/10",
        textClass: "text-cyan-400"
      };
    case "Assigned":
      return {
        icon: Clock,
        colorClass: "from-amber-500 to-orange-600",
        borderColor: "border-amber-500/30",
        bgLight: "bg-amber-500/10",
        textClass: "text-amber-400"
      };
    case "In Progress":
      return {
        icon: Wrench,
        colorClass: "from-sky-500 to-blue-550",
        borderColor: "border-sky-500/30",
        bgLight: "bg-sky-500/10",
        textClass: "text-sky-400"
      };
    case "Resolved":
      return {
        icon: Check,
        colorClass: "from-emerald-500 to-teal-600",
        borderColor: "border-emerald-500/30",
        bgLight: "bg-emerald-500/10",
        textClass: "text-emerald-400"
      };
    case "Closed":
      return {
        icon: CheckCircle,
        colorClass: "from-slate-500 to-slate-700",
        borderColor: "border-slate-500/30",
        bgLight: "bg-slate-500/10",
        textClass: "text-slate-400"
      };
    default:
      return {
        icon: HelpCircle,
        colorClass: "from-slate-600 to-slate-800",
        borderColor: "border-slate-600/30",
        bgLight: "bg-slate-600/10",
        textClass: "text-slate-400"
      };
  }
};

export default function IssueTimeline({ issue }: IssueTimelineProps) {
  // Sort actual completed events earliest to latest
  const completedEvents = issue.timeline && issue.timeline.length > 0
    ? [...issue.timeline].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [
        {
          id: "initial-reported",
          status: "Reported" as const,
          title: "Issue Registered",
          description: `Ticket reported by community member ${issue.reporterName || "Anonymous"}. Coordinates logged successfully.`,
          timestamp: issue.createdAt
        }
      ];

  // If status is Resolved and we don't have a Resolved event in timeline, let's append one dynamically for safety
  const hasResolvedEvent = completedEvents.some(e => e.status === "Resolved");
  if (issue.status === "Resolved" && !hasResolvedEvent) {
    completedEvents.push({
      id: "dynamic-resolved",
      status: "Resolved" as const,
      title: "Issue Resolved",
      description: `Task resolved successfully. Team completed required site repairs.`,
      timestamp: issue.resolvedAt || new Date().toISOString()
    });
  }

  // Figure out future uncompleted statuses in standard lifecycle to show progress direction
  const lastCompletedStatus = completedEvents[completedEvents.length - 1]?.status;
  const lastIndex = STATUS_ORDER.indexOf(lastCompletedStatus as any);
  
  const pendingStatuses = lastIndex !== -1 
    ? STATUS_ORDER.slice(lastIndex + 1) 
    : [];

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
          Chronological Operations Feed
        </span>
        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
          Lifecycle: {issue.status}
        </span>
      </div>

      <div className="relative pl-2 pr-1 max-h-[280px] overflow-y-auto">
        {/* Continuous background line */}
        <div className="absolute left-[25px] top-6 bottom-6 w-0.5 bg-slate-800/80 pointer-events-none"></div>

        {/* 1. Completed History Events */}
        {completedEvents.map((event, index) => {
          const isLastEvent = index === completedEvents.length - 1 && pendingStatuses.length === 0;
          const details = getStatusDetails(event.status);
          const IconComponent = details.icon;

          return (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="relative pl-12 pb-6 last:pb-2 flex items-start group"
            >
              {/* Highlight connection line to next event */}
              {!isLastEvent && (
                <div className="absolute left-[25px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/50 to-slate-800/80 pointer-events-none"></div>
              )}

              {/* Status Circle */}
              <div className="absolute left-[8px] top-0.5 z-10">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${details.colorClass} p-[1px] shadow-lg flex items-center justify-center transition group-hover:scale-105 transform duration-150`}>
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                    <IconComponent size={15} className={details.textClass} />
                  </div>
                </div>
              </div>

              {/* Step Info Content Card */}
              <div className="flex-1 bg-slate-900/35 border border-white/5 rounded-2xl p-3.5 hover:border-white/10 transition">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                  <h5 className="text-white text-xs font-bold leading-tight flex items-center gap-1.5">
                    {event.title}
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono border ${details.borderColor} ${details.bgLight} ${details.textClass}`}>
                      {event.status}
                    </span>
                  </h5>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {event.description}
                </p>
              </div>
            </motion.div>
          );
        })}

        {/* 2. Pending Future Events (Visual Steps) */}
        {pendingStatuses.map((status, index) => {
          const isLastPending = index === pendingStatuses.length - 1;
          const details = getStatusDetails(status);
          const IconComponent = details.icon;

          return (
            <div 
              key={`pending-${status}`}
              className="relative pl-12 pb-6 last:pb-2 flex items-start opacity-45 grayscale-[30%] select-none group"
            >
              {/* Muted connection line */}
              {!isLastPending && (
                <div className="absolute left-[25px] top-8 bottom-0 w-0.5 border-l-2 border-dashed border-slate-850 pointer-events-none"></div>
              )}

              {/* Status Muted Circle */}
              <div className="absolute left-[8px] top-0.5 z-10">
                <div className="w-9 h-9 rounded-full border border-slate-700 bg-slate-950/70 flex items-center justify-center">
                  <IconComponent size={14} className="text-slate-500" />
                </div>
              </div>

              {/* Step Info Pending Card */}
              <div className="flex-1 border border-dashed border-slate-800/40 rounded-2xl p-3 bg-slate-950/20">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-slate-400 text-xs font-semibold leading-tight">
                    {status}
                  </h5>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                    Upcoming Step
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Requires further public works action and validation before advancement.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
