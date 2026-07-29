import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, RefreshCw, User, HelpCircle, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Issue } from "../types";

// Add Speech Recognition Types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  role: "user" | "model";
  message: string;
}

interface ChatbotProps {
  issues?: Issue[];
  users?: any[];
  currentUser?: any;
  stats?: any;
}

export default function Chatbot({ issues = [], users = [], currentUser, stats }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [fetching, setFetching] = useState(false);
  
  // Voice feature states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Supports Hindi, English, and Hinglish well
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInputMessage(finalTranscript);
          handleSendMessage(finalTranscript);
        } else if (interimTranscript) {
          setInputMessage(interimTranscript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          setSpeechSupported(false);
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis.cancel();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto scroll to latest answers
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN'; // Works for Hindi and English
    window.speechSynthesis.speak(utterance);
  };

  const toggleListen = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInputMessage("");
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Could not start speech recognition", err);
      }
    }
  };

  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim()) return;
    
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const userMessage: Message = { role: "user", message: msgText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setFetching(true);

    try {
      const lightweightIssues = issues.map(i => ({
        id: i.id,
        title: i.title,
        category: i.category,
        urgency: i.urgency,
        status: i.status,
        address: i.address,
        reporterName: i.reporterName,
        upvotes: i.upvotes,
        resolvedAt: i.resolvedAt
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: updatedMessages, 
          issues: lightweightIssues,
          users,
          currentUser,
          stats
        })
      });

      if (!response.ok) {
        throw new Error("Community Advisor is offline.");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "model", message: data.response }]);
      speakText(data.response);
    } catch (err: any) {
      console.error(err);
      const errorMsg = "I couldn't find that information.";
      setMessages(prev => [...prev, {
        role: "model",
        message: errorMsg
      }]);
      speakText(errorMsg);
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
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    if (voiceEnabled) window.speechSynthesis.cancel();
                    setVoiceEnabled(!voiceEnabled);
                  }}
                  className="text-slate-400 hover:text-white transition"
                  title={voiceEnabled ? "Mute Voice Responses" : "Enable Voice Responses"}
                >
                  {voiceEnabled ? <Volume2 size={16} className="text-emerald-400" /> : <VolumeX size={16} />}
                </button>
                <HelpCircle size={14} className="text-slate-400" />
              </div>
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
              {isListening && !fetching && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2 bg-slate-900/40 backdrop-blur-md border border-red-500/30 p-2 rounded-xl rounded-tl-none text-red-400">
                    <Mic className="animate-pulse" size={12} />
                    <span>Listening...</span>
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
              className="p-2.5 bg-slate-900/40 backdrop-blur-md border-t border-white/10 flex items-center space-x-2 relative"
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={isListening ? "Listening..." : "Ask Eco-Echo details..."}
                  value={inputMessage}
                  disabled={fetching || isListening}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className={`w-full bg-slate-950/45 border ${isListening ? 'border-red-500/50' : 'border-white/10'} rounded-xl pl-3 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors`}
                />
                
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleListen}
                    disabled={fetching}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                      isListening 
                        ? 'bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse' 
                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                    title={isListening ? "Stop Listening" : "Start Voice Input"}
                  >
                    {isListening ? <Mic size={14} /> : <MicOff size={14} />}
                  </button>
                )}
              </div>
              
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

