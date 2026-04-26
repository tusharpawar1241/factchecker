import React, { useState, useCallback, useRef } from "react";
import { Search, Settings, Shield, RefreshCw } from "lucide-react";
import { runResearch, missingKeys, getKeys, saveKeys, LogEntry, ResearchVerdict } from "../services/researcher";
import ResearchLogs from "./ResearchLogs";
import VerdictCard from "./VerdictCard";
import ApiSetupGuide from "./ApiSetupGuide";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Settings Drawer (Liquid Glass) ──────────────────────────────────────────
const SettingsDrawer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [keys, setKeys] = useState(() => getKeys());
  const [saved, setSaved] = useState(false);

  const handle = () => {
    saveKeys(keys);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  const Field = ({ id, label }: { id: keyof typeof keys; label: string }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</label>
      <input
        type="password"
        value={keys[id]}
        onChange={e => setKeys(p => ({ ...p, [id]: e.target.value }))}
        className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
          placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all
          shadow-[inset_0px_2px_4px_rgba(0,0,0,0.3)]"
        placeholder={`Enter ${label}…`}
      />
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" 
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div 
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="h-full w-80 bg-white/5 backdrop-blur-2xl border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.3)] p-6 flex flex-col gap-6 overflow-y-auto"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-white tracking-wide">API Keys</span>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">✕</button>
          </div>
          <Field id="gemini" label="Gemini" />
          <Field id="tavily" label="Tavily" />
          <Field id="jina" label="Jina (optional)" />
          <button onClick={handle}
            disabled={!keys.gemini || !keys.tavily}
            className="py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400
              shadow-[inset_0px_1px_1px_rgba(255,255,255,0.4),0_0_20px_rgba(99,102,241,0.4)] border border-white/20
              disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all transform active:scale-95">
            {saved ? "✓ Saved" : "Save Keys"}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [showSetup, setShowSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

    const missing = missingKeys();
    if (missing.length > 0) {
      setShowSetup(true);
      return;
    }

    setIsRunning(true);
    setVerdict(null);
    setError(null);
    setLogs([]);
    logCounterRef.current = 0;

    try {
      const result = await runResearch(claim.trim(), addLog);
      setVerdict(result);
    } catch (err: any) {
      const isRateLimit = err.message?.includes("429") || err.message?.includes("Quota exceeded");
      const msg = isRateLimit 
        ? "⚠️ Rate Limit Reached: The AI is cooling down. Please wait 60 seconds and try again."
        : (err.message || "Unknown error");
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

  if (showSetup) {
    return <ApiSetupGuide onKeysSet={() => setShowSetup(false)} />;
  }

  return (
    <div className="relative h-screen text-white flex flex-col overflow-y-auto overflow-x-hidden font-sans scrollbar-thin">
      
      {/* Dynamic ambient blobs for glassmorphism background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex items-center justify-between px-8 py-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-[inset_0px_1px_1px_rgba(255,255,255,0.2)]">
            <Shield className="w-6 h-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Verifai</h1>
            <p className="text-xs text-white/50 font-medium">Deep Research Agent</p>
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
                title="Start over"
                className="p-2.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl transition-all shadow-[inset_0px_1px_1px_rgba(255,255,255,0.1)] active:scale-95">
                <RefreshCw className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
          <button onClick={() => setShowSettings(true)} title="API Settings"
            className="p-2.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl transition-all shadow-[inset_0px_1px_1px_rgba(255,255,255,0.1)] active:scale-95">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </motion.header>

      {/* Settings Drawer */}
      {showSettings && <SettingsDrawer onClose={() => setShowSettings(false)} />}

      {/* Claim Input */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
        className="relative z-10 px-6 md:px-10 mt-12 pt-4 pb-8"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-center drop-shadow-lg">
            Is it <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-teal-400">actually true?</span>
          </h2>
          <p className="text-center text-white/60 text-sm mb-10 font-medium">
            Paste a headline, claim, or viral post. The agent will search, scrape, and cross-reference multiple sources in real time.
          </p>

          <form onSubmit={handleSubmit} className="flex gap-4 p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0px_1px_1px_rgba(255,255,255,0.1)]">
            <div className="flex-1 relative flex items-center">
              <Search className="absolute left-5 w-5 h-5 text-white/40 pointer-events-none" />
              <input
                type="text"
                value={claim}
                onChange={e => setClaim(e.target.value)}
                disabled={isRunning}
                placeholder="e.g. Government bans all social media by 2025…"
                className="w-full bg-transparent pl-14 pr-6 py-4 text-base
                  text-white placeholder-white/30 focus:outline-none transition-all disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={!claim.trim() || isRunning}
              className={cn(
                "px-8 py-4 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                "bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4),inset_0px_1px_1px_rgba(255,255,255,0.4)] border border-white/20 active:scale-95"
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

          {/* Missing keys inline alert */}
          <AnimatePresence>
            {missingKeys().length > 0 && !isRunning && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 flex items-center gap-3 text-sm text-white bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>API keys required ({missingKeys().join(", ")}).</span>
                <button onClick={() => setShowSettings(true)} className="ml-auto font-bold text-amber-300 hover:text-amber-200">Configure now →</button>
              </motion.div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "mt-6 text-sm backdrop-blur-md border rounded-2xl px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]",
                  error.includes("Rate Limit") 
                    ? "text-amber-200 bg-amber-500/10 border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.2)]" 
                    : "text-red-200 bg-red-500/10 border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.2)]"
                )}
              >
                {error.includes("Rate Limit") ? (
                  <div className="flex items-center gap-3">
                    <span className="shrink-0">⚠️</span>
                    <span className="font-medium">{error.replace("⚠️ ", "")}</span>
                  </div>
                ) : (
                  <p><span className="font-bold uppercase tracking-tight mr-2">Error:</span>{error}</p>
                )}
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
                  <div className="h-full flex flex-col items-center justify-center text-white/40 gap-4 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="p-4 rounded-full bg-white/5 border border-white/10"
                    >
                      <Shield className="w-10 h-10 opacity-50" />
                    </motion.div>
                    <p className="text-sm font-medium">Synthesizing evidence...<br/>Verdict will appear here.</p>
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
        className="relative z-10 mt-auto px-10 py-6 border-t border-white/5 flex items-center justify-between text-xs text-white/40 font-medium"
      >
        <span>Verifai • Powered by Gemini 2.0 Flash + Tavily + Jina</span>
        <span>Local Privacy First</span>
      </motion.footer>
    </div>
  );
};

export default Dashboard;
