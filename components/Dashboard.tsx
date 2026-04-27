import React, { useState, useCallback, useRef } from "react";
import { Search, Shield, RefreshCw } from "lucide-react";
import { runResearch, LogEntry, ResearchVerdict } from "../services/researcher";
import ResearchLogs from "./ResearchLogs";
import VerdictCard from "./VerdictCard";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [claim, setClaim] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [verdict, setVerdict] = useState<ResearchVerdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logCounterRef = useRef(0);

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    const id = `log-${++logCounterRef.current}`;
    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => [...prev, { ...entry, id, timestamp }]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim() || isRunning) return;

    setIsRunning(true);
    setVerdict(null);
    setError(null);
    setLogs([]);
    logCounterRef.current = 0;

    try {
      const result = await runResearch(claim.trim(), addLog);
      setVerdict(result);
    } catch (err: any) {
      const msg = err.message || "Unknown error";
      setError(msg);
      addLog({ phase: "error", message: msg });
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setClaim("");
    setLogs([]);
    setVerdict(null);
    setError(null);
    logCounterRef.current = 0;
  };

  return (
    <div className="relative h-screen text-[#1C1C1E] dark:text-white flex flex-col overflow-y-auto overflow-x-hidden font-sans scrollbar-thin">
      
      {/* Soft ambient light bleed — light: diffused warm tones; dark: electric blue */}
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[55%] bg-[#33C6CC]/15 dark:bg-[#2196F3]/15 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[55%] bg-[#8A2BE2]/12 dark:bg-[#2196F3]/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex items-center justify-between px-8 py-6"
      >
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="p-3 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/80 dark:border-white/10 rounded-2xl shadow-sm dark:shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.1)] text-indigo-500 dark:text-[#2196F3]">
            <Shield className="w-6 h-6 dark:drop-shadow-[0_0_8px_rgba(33,150,243,0.6)]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#1C1C1E] dark:text-white">Verifai</h1>
            <p className="text-xs text-[#8E8E93] dark:text-white/50 font-medium">Deep Research Agent</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {(verdict || logs.length > 0) && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleReset}
                className="p-3 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/80 dark:border-white/10 rounded-xl shadow-sm dark:shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.1)] text-indigo-500 dark:text-white/80 transition-all active:scale-95">
                <RefreshCw className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Claim Input */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
        className="relative z-10 px-6 md:px-10 mt-12 pt-4 pb-8"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-center text-[#1C1C1E] dark:text-white">
            Is it <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8A2BE2] to-[#33C6CC]">actually true?</span>
          </h2>
          <p className="text-center text-[#8E8E93] dark:text-white/60 text-sm mb-10 font-medium">
            Paste a headline, claim, or viral post. The agent will search, scrape, and cross-reference multiple sources in real time.
          </p>

          {/* Colorful Ambient Glow & Search Bar */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-400 opacity-30 blur-2xl rounded-full dark:hidden"></div>
            <form onSubmit={handleSubmit} className="relative flex gap-3 p-2
              bg-white/40 dark:bg-[#1A1A1A]/60
              backdrop-blur-xl
              border-2 border-white/70 dark:border-white/10
              rounded-[3rem]
              shadow-[0_8px_32px_rgba(0,0,0,0.04)]
              dark:shadow-[0_30px_60px_-15px_rgba(33,150,243,0.3),inset_0_2px_5px_rgba(255,255,255,0.1)]
              text-gray-800 dark:text-white">
              <div className="flex-1 relative flex items-center">
                <Search className="absolute left-6 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="Paste a headline, claim, or URL..."
                  className="w-full bg-transparent border-none text-gray-800 dark:text-white placeholder-gray-400 pl-16 pr-6 py-4 text-[17px] focus:outline-none focus:ring-0"
                  disabled={isRunning}
                />
              </div>
            {/* Purple Liquid Gel Button */}
            <button
              type="submit"
              disabled={!claim.trim() || isRunning}
              className={cn(
                "px-8 py-4 rounded-[2.5rem] text-[15px] font-medium text-white transition-all whitespace-nowrap flex items-center gap-2",
                "bg-gradient-to-br from-[#A855F7] to-[#7C3AED]",
                "dark:from-[#2196F3] dark:to-[#1565C0]",
                "border border-purple-300/50 dark:border-white/20",
                "shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)] drop-shadow-[0_10px_15px_rgba(124,58,237,0.4)]",
                "dark:shadow-[0_10px_25px_-5px_rgba(33,150,243,0.6),inset_0_1px_0_rgba(255,255,255,0.4)] dark:drop-shadow-none",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "active:scale-[0.98]"
              )}
            >
              {isRunning ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Researching…
                </>
              ) : (
                "Deep Research"
              )}
            </button>
          </form>
          </div>

          {/* Error inline alert */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 text-sm backdrop-blur-2xl border rounded-2xl px-6 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.05),inset_2px_2px_4px_rgba(255,255,255,0.6)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_1px_1px_2px_rgba(255,255,255,0.1)] text-red-800 dark:text-red-200 bg-red-500/10 border-red-500/20"
              >
                <p><span className="font-bold uppercase tracking-tight mr-2">Error:</span>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Content */}
      <AnimatePresence>
        {(logs.length > 0 || verdict) && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
            className="relative z-10 flex-1 px-6 md:px-10 pb-10"
          >
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 h-full">

              {/* Logs pane (Evidence Board) */}
              <div className="flex-1 min-h-[400px]">
                <ResearchLogs logs={logs} isRunning={isRunning} />
              </div>

              {/* Verdict pane */}
              <div className="w-full lg:w-[480px]">
                {verdict ? (
                  <VerdictCard verdict={verdict} headline={claim} />
                ) : (
                  <div className="glass-panel h-full min-h-[300px] flex flex-col items-center justify-center gap-5 rounded-[2.5rem]
                    border border-white/60 dark:border-white/10
                    bg-white/40 dark:bg-[#1A1A1A]/70
                    backdrop-blur-3xl p-8 text-center
                    shadow-[0_20px_60px_rgba(0,0,0,0.05),inset_1px_1px_0_rgba(255,255,255,0.8)]
                    dark:shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_1px_1px_2px_rgba(255,255,255,0.1)]">
                    {/* Spinning shield — liquid gel pill with cyan glow in light */}
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="p-4 rounded-3xl
                        bg-gradient-to-br from-[#33C6CC]/20 to-[#8A2BE2]/10 dark:bg-[#2A2A2A]/80
                        border border-white/80 dark:border-white/10
                        shadow-[0_8px_20px_rgba(51,198,204,0.15),inset_0_2px_5px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_1px_1px_2px_rgba(255,255,255,0.1)]"
                    >
                      <Shield className="w-10 h-10 text-[#33C6CC] dark:text-white/30 drop-shadow-[0_0_6px_rgba(51,198,204,0.5)] dark:drop-shadow-none" />
                    </motion.div>
                    <p className="text-[15px] font-medium leading-relaxed text-gray-500 dark:text-white/40">Synthesizing evidence...<br/>Verdict will appear here.</p>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="relative z-10 mt-auto px-10 py-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-gray-400 dark:text-white/40 font-medium"
      >
        <span>Verifai • Powered by Groq (Llama 3.1) + Tavily + Jina</span>
        <span>Local Privacy First</span>
      </motion.footer>
    </div>
  );
};

export default Dashboard;
