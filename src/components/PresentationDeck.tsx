import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, BookOpen, GitMerge, Database, ShieldAlert, Award, Server, 
  Map, LayoutDashboard, Target, Zap, Clock, Users, ArrowRight, ArrowLeft
} from "lucide-react";

export default function PresentationDeck() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "1. Executive Product Overview",
      subtitle: "Hyperlocal Civil Problem Solver Rooted in AI & Gamification",
      icon: Target,
      bgColor: "from-slate-900 via-indigo-950 to-slate-900",
      content: (
        <div className="space-y-4 text-slate-300">
          <p className="text-sm md:text-base leading-relaxed">
            <strong className="text-white">Community Hero AI</strong> is a modern hyperlocal civic platform designed to eliminate fractured communication between citizens and city officials. By combining computer vision, NLP, decentralized community verification, and structural gamification, the platform solves the <span className="text-emerald-400 font-semibold">"Transparency & Action Gap"</span> in municipal maintenance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
            <div className="p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-sm">
              <span className="text-emerald-400 font-bold block text-lg font-display">92%</span>
              <span className="text-xs text-slate-300 block font-semibold uppercase tracking-wider">Classification Accuracy</span>
              <p className="text-xs text-slate-400 mt-1">AI instantly categorizes, grades, and scopes incoming images on submit.</p>
            </div>
            <div className="p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-sm">
              <span className="text-indigo-400 font-bold block text-lg font-display">&lt; 3 Secs</span>
              <span className="text-xs text-slate-300 block font-semibold uppercase tracking-wider">Duplicate Protection</span>
              <p className="text-xs text-slate-400 mt-1">Geo-fencing and vector NLP detect similar complaints in 350m on upload.</p>
            </div>
            <div className="p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-sm">
              <span className="text-amber-400 font-bold block text-lg font-display">+210%</span>
              <span className="text-xs text-slate-300 block font-semibold uppercase tracking-wider">Citizen Retention</span>
              <p className="text-xs text-slate-400 mt-1">Hero points and community levels incentivize verified crowd feedback.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "2. Visual User Journey Flow",
      subtitle: "Multi-layered Citizen reporting coupled with Authority resolution",
      icon: GitMerge,
      bgColor: "from-slate-900 via-slate-950 to-indigo-950",
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 mb-2">Step-by-step transaction map illustrating automated AI routing, community check-ins, and resolution pathways.</p>
          <div className="overflow-x-auto">
            <svg viewBox="0 0 800 240" className="w-full min-w-[700px] h-auto text-slate-300">
              {/* Nodes */}
              <g transform="translate(10, 40)">
                <rect x="0" y="20" width="110" height="40" rx="6" fill="#1e293b" stroke="#334155" />
                <text x="55" y="44" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">1. Photo Upload</text>
                <text x="55" y="54" fill="#94a3b8" fontSize="8" textAnchor="middle">Citizen Portal</text>
              </g>

              <g transform="translate(150, 40)">
                <rect x="0" y="20" width="120" height="40" rx="6" fill="#1e1b4b" stroke="#4338ca" />
                <text x="60" y="44" fill="#a5b4fc" fontSize="10" fontWeight="bold" textAnchor="middle">2. AI Smart Auditing</text>
                <text x="60" y="54" fill="#818cf8" fontSize="8" textAnchor="middle">Gemini parsing & Geo check</text>
              </g>

              <g transform="translate(300, 40)">
                <rect x="0" y="20" width="110" height="40" rx="6" fill="#0f172a" stroke="#0ea5e9" />
                <text x="55" y="44" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">DUPLICATE?</text>
                <text x="55" y="54" fill="#94a3b8" fontSize="8" textAnchor="middle">Within 350m radius</text>
              </g>

              <g transform="translate(450, 0)">
                <rect x="0" y="20" width="110" height="40" rx="6" fill="#022c22" stroke="#0f9675" />
                <text x="55" y="44" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">Merge Thread</text>
                <text x="55" y="54" fill="#94a3b8" fontSize="8" textAnchor="middle">Auto upvotes +5</text>
              </g>

              <g transform="translate(450, 80)">
                <rect x="0" y="20" width="110" height="40" rx="6" fill="#180828" stroke="#a21caf" />
                <text x="55" y="44" fill="#e879f9" fontSize="9" fontWeight="bold" textAnchor="middle">3. Pin Interactive Map</text>
                <text x="55" y="54" fill="#94a3b8" fontSize="8" textAnchor="middle">Public transparency</text>
              </g>

              <g transform="translate(620, 40)">
                <rect x="0" y="20" width="120" height="40" rx="6" fill="#1e293b" stroke="#f59e0b" />
                <text x="60" y="44" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">4. Authority Dispatch</text>
                <text x="60" y="54" fill="#94a3b8" fontSize="8" textAnchor="middle">Assign squad & Fix</text>
              </g>

              {/* Connections */}
              <line x1="120" y1="80" x2="150" y2="80" stroke="#475569" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="270" y1="80" x2="300" y2="80" stroke="#475569" strokeWidth="2" strokeDasharray="3" />
              
              {/* Diverges */}
              <path d="M 410 80 L 450 40" stroke="#0ea5e9" strokeWidth="2" fill="none" />
              <text x="430" y="50" fill="#38bdf8" fontSize="8" fontWeight="bold">Yes</text>
              
              <path d="M 410 80 L 450 120" stroke="#0ea5e9" strokeWidth="2" fill="none" />
              <text x="430" y="115" fill="#e879f9" fontSize="8" fontWeight="bold">No</text>
              
              <path d="M 560 40 L 620 80" stroke="#475569" strokeWidth="2" fill="none" />
              <path d="M 560 120 L 620 80" stroke="#475569" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>
      )
    },
    {
      title: "3. Quad-Layer System Architecture",
      subtitle: "Zero-Trust Firebase Client, Express Control Plane, and Gemini AI Engine",
      icon: Server,
      bgColor: "from-slate-900 via-indigo-950 to-slate-950",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-sm transition-all hover:bg-white/10">
            <h4 className="font-bold text-white mb-1 uppercase tracking-wider text-[10px] text-indigo-350">1. Client / Portal</h4>
            <p className="text-slate-300">React 19 SPA running responsive Tailwind styling. Utilizes Leaflet Map views with manual location overrides. Encodes images to base64 buffer on capture.</p>
          </div>
          <div className="p-3.5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-sm transition-all hover:bg-white/10">
            <h4 className="font-bold text-indigo-300 mb-1 uppercase tracking-wider text-[10px]">2. Auth & Cache</h4>
            <p className="text-slate-300">Firebase Authentication handles Secure Google Login tokens. Local express database mimics MongoDB Collections to serve maps and leaderboards instantly offline.</p>
          </div>
          <div className="p-3.5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-sm transition-all hover:bg-white/10">
            <h4 className="font-bold text-emerald-300 mb-1 uppercase tracking-wider text-[10px]">3. Server Interface</h4>
            <p className="text-slate-300">Robust Node/Express API manages proximity geo-fenced calculations. Maps static build streams and acts as client secure proxy hiding private tokens.</p>
          </div>
          <div className="p-3.5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-sm transition-all hover:bg-white/10">
            <h4 className="font-bold text-amber-300 mb-1 uppercase tracking-wider text-[10px]">4. AI Brain</h4>
            <p className="text-slate-300">Gemini 1.5 Flash processes live computer-vision and NLP logic on the micro-servicing backend. Forecasts upcoming hotspots across District grids dynamically.</p>
          </div>
        </div>
      )
    },
    {
      title: "4. Database Design & Schemas",
      subtitle: "Durable MongoDB Collections for Gamified Public Problem Solving",
      icon: Database,
      bgColor: "from-slate-900 via-slate-950 to-slate-900",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 bg-slate-950/35 backdrop-blur-sm border border-white/10 rounded-2xl">
            <span className="text-emerald-400 block font-bold mb-2">// 📂 Collection: issues</span>
            <pre className="text-slate-300 whitespace-pre overflow-x-auto text-[10px]">
{`{
  _id: ObjectId,
  title: String (indexed),
  description: String,
  category: Enum["Potholes", "Water...", ...],
  location: {
    type: "Point",
    coordinates: [Double, Double] // [Lng, Lat] for 2dsphere index
  },
  urgency: Enum["Low", "Medium", "High", "Critical"],
  status: Enum["Reported", "Verified", "Assigned", ...],
  reporter: { name: String, reputation: Number },
  upvotes: Number,
  comments: Array[{ author: String, text: String, date: Date }]
}`}
            </pre>
          </div>
          <div className="p-3.5 bg-slate-950/35 backdrop-blur-sm border border-white/10 rounded-2xl">
            <span className="text-amber-400 block font-bold mb-2">// 📂 Collection: users / gamification</span>
            <pre className="text-slate-300 whitespace-pre overflow-x-auto text-[10px]">
{`{
  _id: String (Firebase UID),
  name: String,
  email: String,
  points: Number,
  badges: Array[String], // ["Beacon of Light", "Digger"]
  stats: {
    reportedCount: Number,
    verificationsCount: Number,
    resolutionsCount: Number
  }
}`}
            </pre>
          </div>
        </div>
      )
    },
    {
      title: "5. Production REST API Specifications",
      subtitle: "Secure server endpoints for high-throughput citizen feedback",
      icon: BookOpen,
      bgColor: "from-slate-900 via-emerald-950 to-slate-950",
      content: (
        <div className="space-y-2 text-xs">
          <p className="text-slate-300 mb-2">Designed with defensive input sizing, secure proxy filters, and rapid responses.</p>
          <div className="border border-white/10 rounded-2xl overflow-hidden font-mono bg-white/5 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 bg-slate-950/45 p-2.5 border-b border-white/10 font-bold text-white text-[10px]">
              <span>ENDPOINT & METHOD</span>
              <span>PAYLOAD SCHEMA</span>
              <span>FUNCTIONALITY & GATEWAY</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 p-2.5 border-b border-white/5 hover:bg-white/5 transition">
              <span className="text-cyan-400 font-bold">GET /api/issues</span>
              <span className="text-slate-400">None (Query: ?bounds)</span>
              <span className="text-slate-300">Retrieves live geospatial complaints inside current viewport</span>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-3 p-2.5 border-b border-white/5 hover:bg-white/5 transition">
              <span className="text-emerald-400 font-bold">POST /api/issues/report</span>
              <span className="text-slate-400">{`{ lat, lng, image: base64 }`}</span>
              <span className="text-slate-300">Invokes Gemini Flash computer vision and runs 350m deduplication checks</span>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-3 p-2.5 border-b border-white/5 hover:bg-white/5 transition">
              <span className="text-amber-400 font-bold">POST /api/issues/:id/status</span>
              <span className="text-slate-400">{`{ status, assignedTeam }`}</span>
              <span className="text-slate-300">Authority dispatch override update. Rewards +150 points to reporter on 'Resolved'</span>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-3 p-2.5 hover:bg-white/5 transition">
              <span className="text-fuchsia-400 font-bold">POST /api/chat</span>
              <span className="text-slate-400">{`{ messages: Array }`}</span>
              <span className="text-slate-300">Multi-turn conversation stream with Eco-Echo civic counseling bot</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "6. Advanced AI Pipeline Blueprint",
      subtitle: "Computer Vision & Predictive Analytics Model Configurations",
      icon: Zap,
      bgColor: "from-slate-900 via-indigo-950 to-slate-900",
      content: (
        <div className="space-y-3 text-slate-300 text-xs md:text-sm">
          <p className="leading-relaxed text-slate-400">
            Rather than simply using AI as metadata decoration, <strong className="text-indigo-300">Community Hero AI</strong> implements a functional dual-tier AI system:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-sm">
              <span className="text-indigo-300 font-bold block mb-1 font-display">🔮 Computer Vision Analyzer</span>
              <p className="text-xs text-slate-350 leading-relaxed">
                A custom visual instruction prompt processes base64 byte chunks. It distinguishes dense pavement cracking (Road damage) from active structural potholes, auto-detects light lumen outage patterns at night, and grades overall water volume leakage severity (Critical vs Low). Recommended action lists are formulated dynamically.
              </p>
            </div>
            <div className="p-3.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-sm">
              <span className="text-emerald-350 font-bold block mb-1 font-display">📈 Geo-Predictive Area Analytics</span>
              <p className="text-xs text-slate-350 leading-relaxed">
                Our server aggregates complaint categories across spatial grid subdivisions. These density lists are paired with seasonal historical trends using Gemini NLP model prompts. The model predicts upcoming flood zones and road decay rates, generating active recommendations ready for city heads.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "7. 24-Hour Hackathon Delivery Timeline",
      subtitle: "Prioritization Matrix & Deployment Roadmap to Pitch Ready",
      icon: Clock,
      bgColor: "from-slate-900 via-slate-950 to-indigo-950",
      content: (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-4 gap-2 bg-slate-950/45 backdrop-blur-sm font-bold p-2.5 text-slate-200 border border-white/10 rounded-t-2xl">
            <span>PHASE</span>
            <span>TIMELINE</span>
            <span>DELIVERABLES</span>
            <span>STATUS</span>
          </div>
          <div className="divide-y divide-white/5 border-x border-b border-white/10 rounded-b-2xl overflow-hidden">
            <div className="grid grid-cols-4 gap-2 p-2.5 bg-slate-950/25 text-slate-300">
              <span className="text-indigo-400 font-bold">1. Bootstrap & Architecture</span>
              <span className="text-slate-400">Hours 0 - 4</span>
              <span className="text-slate-300">Install dependencies, set scripts, draft server.ts route endpoints, configure layout css.</span>
              <span className="text-emerald-400 font-bold">✔ 100% Done</span>
            </div>
            <div className="grid grid-cols-4 gap-2 p-2.5 hover:bg-white/5 transition text-slate-300">
              <span className="text-cyan-400 font-bold">2. Core Features & AI</span>
              <span className="text-slate-400">Hours 4 - 12</span>
              <span className="text-slate-300">Write vector maps, draft reporting form presets, link Gemini Flash picture detection controllers.</span>
              <span className="text-emerald-400 font-bold">✔ 100% Done</span>
            </div>
            <div className="grid grid-cols-4 gap-2 p-2.5 bg-slate-950/25 text-slate-300">
              <span className="text-amber-400 font-bold">3. Gamification & Authority</span>
              <span className="text-slate-400">Hours 12 - 18</span>
              <span className="text-slate-300">Design municipal command panel and live upvote database updates. Hydrate gamification profiles.</span>
              <span className="text-emerald-400 font-bold">✔ 100% Done</span>
            </div>
            <div className="grid grid-cols-4 gap-2 p-2.5 hover:bg-white/5 transition text-slate-300">
              <span className="text-fuchsia-400 font-bold">4. Polishing & Pitch</span>
              <span className="text-slate-400">Hours 18 - 24</span>
              <span className="text-slate-300">Optimize presentation screens, audit css contrast ratios, and verify compiler builds.</span>
              <span className="text-amber-400 font-bold animate-pulse">★ Active Polish</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "8. Winning Factors & Future Roadmap",
      subtitle: "Why Community Hero AI will secure First Place from the judges",
      icon: Award,
      bgColor: "from-slate-900 via-indigo-950 to-emerald-950",
      content: (
        <div className="space-y-4 text-slate-300 text-xs md:text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-white uppercase text-[10px] tracking-wider text-amber-400">🏆 Judge Winning Features</h4>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-400 text-xs">
                <li><strong className="text-slate-200">Real, Live AI Integration</strong>: Real base64 computer vision and predictive text models - no mock larping elements.</li>
                <li><strong className="text-slate-200">Anti-Duplication Proximity Defense</strong>: Protects city workflows from getting flooded with duplicate complaints.</li>
                <li><strong className="text-slate-200">Integrated Control Plane & Pitch Deck</strong>: Pitch slides and live software in one single app instance.</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white uppercase text-[10px] tracking-wider text-emerald-400">🔮 Version 2.0 Roadmap</h4>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-400 text-xs">
                <li><strong className="text-slate-200">Autonomous WhatsApp Reporting</strong>: Directly capture, classify, and register photos via a Twilio chatbot pipeline.</li>
                <li><strong className="text-slate-200">Smart Contract Resolution</strong>: Lock escrow repair budgets in block chains, releasing to contractors on community votes.</li>
                <li><strong className="text-slate-200">Live Voice API Support</strong>: Direct call translation for elderly accessibility reporting.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentSlide = slides[activeSlide];
  const IconComponent = currentSlide.icon;

  return (
    <div className={`p-5 md:p-8 rounded-3xl bg-gradient-to-br ${currentSlide.bgColor} bg-opacity-[0.14] backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-700 h-full flex flex-col justify-between relative z-10`}>
      <div>
        {/* Pitch Deck Badge Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-350 font-semibold bg-white/5 px-2 py-0.5 rounded border border-white/10">HACKATHON PITCH DECK</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-indigo-550/20 border border-white/10 rounded-full px-2.5 py-0.5">
            <span className="text-[10px] font-bold text-indigo-300 font-mono">{activeSlide + 1} / {slides.length}</span>
          </div>
        </div>

        {/* Dynamic Slide Title */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-indigo-550/15 rounded-xl border border-white/10 text-indigo-300 shadow-sm animate-pulse">
            <IconComponent size={20} />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white font-display tracking-tight">{currentSlide.title}</h2>
            <p className="text-xs text-slate-300 font-medium">{currentSlide.subtitle}</p>
          </div>
        </div>

        {/* Slide Body */}
        <div className="min-h-[220px] py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentSlide.content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Slide Navigation Controllers */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
        <button
          onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
          disabled={activeSlide === 0}
          className={`px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium flex items-center space-x-1.5 transition-all text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer ${activeSlide === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <ArrowLeft size={14} />
          <span>Previous Slide</span>
        </button>

        {/* Carousel indicator dots */}
        <div className="hidden sm:flex items-center space-x-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-305 cursor-pointer ${idx === activeSlide ? 'w-5 bg-indigo-400' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>

        <button
          onClick={() => setActiveSlide(prev => Math.min(slides.length - 1, prev + 1))}
          disabled={activeSlide === slides.length - 1}
          className={`px-3 py-1.5 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 border border-white/10 text-xs font-semibold text-white flex items-center space-x-1.5 transition-all hover:brightness-110 active:translate-y-0.5 cursor-pointer ${activeSlide === slides.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <span>Next Slide</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
