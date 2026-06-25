import React from "react";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

interface AccessDeniedProps {
  onGoHome: () => void;
  requiredRole?: string;
  currentRole?: string;
}

export default function AccessDenied({ onGoHome, requiredRole, currentRole }: AccessDeniedProps) {
  return (
    <div id="access-denied-page" className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 relative">
      {/* Background radial soft red glow */}
      <div className="absolute w-80 h-80 bg-red-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-400 mb-6 animate-pulse">
          <ShieldAlert size={36} />
        </div>

        <h2 className="text-2xl font-bold text-white font-display tracking-tight mb-2">
          Access Denied
        </h2>
        
        <p className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-4">
          Error 403: Forbidden Scope
        </p>

        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          Your account is registered as a <strong className="text-indigo-300 font-semibold">{currentRole}</strong>, 
          which does not possess permissions to access this administrative terminal. 
          {requiredRole && (
            <span> This resource requires <strong className="text-red-400 font-semibold">{requiredRole}</strong> privileges.</span>
          )}
        </p>

        <div className="space-y-2.5">
          <button
            onClick={onGoHome}
            className="w-full py-3 bg-gradient-to-tr from-indigo-500 to-indigo-700 hover:from-indigo-650 hover:to-indigo-750 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Home size={14} />
            <span>Return to Authorized Dashboard</span>
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
