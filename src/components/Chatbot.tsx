import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, RefreshCw, User, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  role: "user" | "model";
  message: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      message: "Hey there! I am Eco-Echo, your personal municipal helper. Ask me how to earn points, what issues are active, or ask me to check a report!"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [fetching, setFetching] = useState(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to latest answers
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim()) return;

    const userMessage: Message = { role: "user", message: msgText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setFetching(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });

      if (!response.ok) {
        throw new Error("Community Advisor is offline.");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "model", message: data.response }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: "model",
        message: "Apologies, my civic telemetry linkage was interrupted! Rest assured our works dispatch crews remain on high alert."
      }]);
    } finally {
      setFetching(false);
    }
  };

  const handleQuickQuestion = (phrase: string) => {
    handleSendMessage(phrase);
  };

  const helperChips = [
    "How to earn Hero Points?",
    "Check Bryant Park leak main",
    "Where is the highest priority pothole?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Circle Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(p => !p)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="h-12 w-12 rounded-full bg-indigo-600 border border-indigo-500 shadow-2xl text-slate-100 flex items-center justify-center cursor-pointer relative z-50 focus:outline-none"
      >
        <span className="absolute -top-1 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </motion.button>

      {/* Floating Chat Panel Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-16 right-0 w-[310px] sm:w-[360px] h-[450px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden z-50"
          >
            {/* Box Header */}
            <div className="p-3.5 bg-slate-900/45 backdrop-blur-md border-b border-white/10 flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 rounded-full bg-indigo-600 border border-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10 animate-pulse">
                  <span className="text-[10px] font-bold text-white">E</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-display">Eco-Echo: Municipal Guide</h4>
                  <div className="flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    <span className="text-[9px] text-slate-300 font-medium">Active AI Assistant</span>
                  </div>
                </div>
              </div>
              <HelpCircle size={14} className="text-slate-400" />
            </div>

            {/* Scrollable message Thread stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/20 text-xs">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar icon */}
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 border ${msg.role === 'user' ? 'bg-indigo-900/60 border-indigo-700/50' : 'bg-white/10 border-white/20'}`}>
                      {msg.role === 'user' ? <User size={10} className="text-indigo-300" /> : <span className="text-[9px] font-bold text-slate-300">E</span>}
                    </div>

                    {/* Speech Text bubbles */}
                    <div className={`p-2.5 rounded-xl border leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 border-white/10 text-white rounded-tr-none shadow-sm' : 'bg-slate-900/60 backdrop-blur-md border-white/5 text-slate-200 rounded-tl-none'}`}>
                      <p>{msg.message}</p>
                    </div>
                  </div>
                </div>
              ))}

              {fetching && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2 bg-slate-900/40 backdrop-blur-md border border-white/5 p-2 rounded-xl rounded-tl-none text-slate-400">
                    <RefreshCw className="animate-spin" size={12} />
                    <span>Eco-Echo is consulting city records...</span>
                  </div>
                </div>
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Quick guide helper chips */}
            {messages.length < 3 && (
              <div className="px-3 py-1.5 bg-slate-950/45 border-t border-white/10 flex items-center space-x-1.5 overflow-x-auto text-[9px] whitespace-nowrap">
                {helperChips.map(chip => (
                  <button
                    key={chip}
                    onClick={() => handleQuickQuestion(chip)}
                    className="px-2 py-1 rounded bg-slate-900/40 backdrop-blur-sm border border-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Box input texting bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputMessage); }}
              className="p-2.5 bg-slate-900/40 backdrop-blur-md border-t border-white/10 flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder="Ask Eco-Echo details..."
                value={inputMessage}
                disabled={fetching}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-slate-950/45 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
              <button
                type="submit"
                disabled={fetching || !inputMessage.trim()}
                className="p-2 bg-gradient-to-tr from-blue-500 to-indigo-600 border border-white/10 text-white rounded-xl hover:brightness-110 disabled:opacity-40 transition cursor-pointer shadow-md shadow-indigo-500/10"
              >
                <Send size={12} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
