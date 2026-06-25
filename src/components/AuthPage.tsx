import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, KeyRound, ShieldAlert, Zap, HelpCircle, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const { register, login, loginWithGoogle, forgotPassword, error: authError } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showForgot, setShowForgot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleTabChange = (tab: "login" | "register") => {
    setActiveTab(tab);
    setFormError(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!email || !password) {
      setFormError("Please fill out all required fields.");
      setIsSubmitting(false);
      return;
    }

    if (activeTab === "register" && !name) {
      setFormError("Please enter your name to register.");
      setIsSubmitting(false);
      return;
    }

    try {
      let result;
      if (activeTab === "login") {
        result = await login(email, password);
      } else {
        result = await register(name, email, password);
      }
      
      if (!result.success) {
        setFormError(result.error || "Authentication failed. Check your inputs.");
      }
    } catch (err) {
      setFormError("A server communication error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      // Simulate OAuth flow by logging in with a default demo Google user
      const googleEmail = "google.hero@gmail.com";
      const googleName = "Google Hero Partner";
      const googleId = "google_auth_123456";
      
      const result = await loginWithGoogle(googleEmail, googleName, googleId);
      if (!result.success) {
        setFormError(result.error || "Google authentication failed.");
      }
    } catch (err) {
      setFormError("Google sign-in error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);
    if (!forgotEmail) return;

    try {
      const message = await forgotPassword(forgotEmail);
      setForgotMessage(message);
    } catch (err) {
      setForgotMessage("Failed to request password reset.");
    }
  };

  // Hackathon Demo Shortcut
  const handleQuickLogin = async (role: "citizen" | "authority" | "admin") => {
    setFormError(null);
    setIsSubmitting(true);
    let targetEmail = "";
    if (role === "citizen") targetEmail = "citizen@communityhero.ai";
    else if (role === "authority") targetEmail = "officer@communityhero.ai";
    else if (role === "admin") targetEmail = "admin@communityhero.ai";

    try {
      const result = await login(targetEmail, "password123");
      if (!result.success) {
        setFormError(result.error || `Failed to login as ${role}`);
      }
    } catch (err) {
      setFormError("Demo login error.");
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

        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-2xl shadow-lg text-white mb-3">
            <Zap size={28} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight text-center">CivicConnect Ai</h2>
          <p className="text-xs text-slate-400 mt-1 text-center">Join the hyper-local community reporting engine</p>
        </div>

        <AnimatePresence mode="wait">
          {!showForgot ? (
            <motion.div
              key="auth-tabs"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Tab Switcher */}
              <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/5 mb-6">
                <button
                  type="button"
                  onClick={() => handleTabChange("login")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === "login" 
                      ? "bg-gradient-to-r from-blue-500/80 to-indigo-600/80 text-white shadow" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("register")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === "register" 
                      ? "bg-gradient-to-r from-blue-500/80 to-indigo-600/80 text-white shadow" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Form Validation Errors */}
              {(formError || authError) && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-start gap-2">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span>{formError || authError}</span>
                </div>
              )}

              {/* Standard Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {activeTab === "register" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        placeholder="Aditya Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      placeholder="citizen@communityhero.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
                    {activeTab === "login" && (
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition duration-200 flex items-center justify-center space-x-2 mt-6 cursor-pointer"
                >
                  <span>{activeTab === "login" ? "Sign In to Dashboard" : "Register and Enter"}</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Social Login Separator */}
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-wider">Or Continue With</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2.5 transition duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.87 3C6.18 7.56 8.84 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.45c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.38-4.87 3.38-8.5z" />
                  <path fill="#FBBC05" d="M5.26 14.44c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.39 7.56C.5 9.34 0 11.31 0 13.4s.5 4.06 1.39 5.84l3.87-3z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.9 1.09-3.16 0-5.82-2.52-6.74-5.52l-3.87 3C3.37 20.33 7.35 23 12 23z" />
                </svg>
                <span>Sign In with Google</span>
              </button>

              {/* Demo Pre-sets for Hackathon Evaluators */}
              <div className="mt-8 pt-5 border-t border-white/5">
                <div className="flex items-center space-x-1.5 mb-3 justify-center">
                  <HelpCircle size={13} className="text-amber-400" />
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Demo Quick Access Roles</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleQuickLogin("citizen")}
                    className="py-1.5 px-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 rounded-lg text-center transition cursor-pointer"
                  >
                    Citizen
                  </button>
                  <button
                    onClick={() => handleQuickLogin("authority")}
                    className="py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 rounded-lg text-center transition cursor-pointer"
                  >
                    Authority
                  </button>
                  <button
                    onClick={() => handleQuickLogin("admin")}
                    className="py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-[10px] font-bold text-rose-400 rounded-lg text-center transition cursor-pointer"
                  >
                    Admin
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 text-center mt-2 font-medium">Click any button above to immediately login with default mock credentials.</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center space-x-2 text-indigo-400 mb-4 cursor-pointer" onClick={() => { setShowForgot(false); setForgotMessage(null); }}>
                <KeyRound size={16} />
                <span className="text-xs font-semibold">Back to Login</span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">Reset Password</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Enter your registered email below and we will dispatch a demo reset code securely mapped to your community record.
              </p>

              {forgotMessage && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs leading-relaxed">
                  {forgotMessage}
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      placeholder="citizen@communityhero.ai"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer"
                >
                  Send Recovery Dispatch
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
