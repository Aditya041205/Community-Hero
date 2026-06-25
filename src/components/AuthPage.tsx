import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { motion } from "motion/react";
import { ShieldAlert, Zap, ShieldCheck } from "lucide-react";

export default function AuthPage() {
  const { loginWithGoogle, error: authError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setFormError(result.error || "Google authentication failed.");
      }
    } catch (err) {
      setFormError("Google sign-in encountered an unexpected error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 z-10 relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow behind container */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-2xl shadow-lg text-white mb-3">
            <Zap size={28} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight text-center">CivicConnect Ai</h2>
          <p className="text-xs text-slate-450 mt-1 text-center">Join the hyper-local community reporting engine</p>
        </div>

        {/* Informative Security Message */}
        <div className="mb-6 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex items-start gap-3">
          <ShieldCheck size={18} className="text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-white">Passwordless Verification</span>
            <p className="mt-0.5 text-slate-400">
              For security, CivicConnect uses verified Google authentication. Your account profile is synchronized dynamically using OAuth 2.0.
            </p>
          </div>
        </div>

        {/* Form Validation Errors */}
        {(formError || authError) && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/35 text-red-400 rounded-xl text-xs flex items-start gap-2.5 whitespace-pre-line">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{formError || authError}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 rounded-xl text-sm font-bold flex items-center justify-center space-x-3 transition duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transform"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.87 3C6.18 7.56 8.84 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.45c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.38-4.87 3.38-8.5z" />
              <path fill="#FBBC05" d="M5.26 14.44c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.39 7.56C.5 9.34 0 11.31 0 13.4s.5 4.06 1.39 5.84l3.87-3z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.9 1.09-3.16 0-5.82-2.52-6.74-5.52l-3.87 3C3.37 20.33 7.35 23 12 23z" />
            </svg>
          )}
          <span>{isSubmitting ? "Authenticating Account..." : "Continue with Google"}</span>
        </button>

        <p className="text-[10px] text-slate-500 text-center mt-6">
          By signing in, you agree to our civic reporting standards and guidelines.
        </p>
      </motion.div>
    </div>
  );
}
