import React, { useEffect, useRef } from "react";
import { Terminal, Search, FileSearch, Brain, BarChart3, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";
import type { LogEntry } from "../services/researcher";
import { motion, AnimatePresence } from "framer-motion";

interface ResearchLogsProps {
  logs: LogEntry[];
  isRunning: boolean;
}

const PHASE_META: Record<LogEntry["phase"], { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  planning:  { icon: Brain,        color: "text-purple-400",  bg: "bg-purple-400/10", border: "border-purple-400/20", label: "PLAN" },
  searching: { icon: Search,       color: "text-blue-400",    bg: "bg-blue-400/10",   border: "border-blue-400/20",   label: "SEARCH" },
  scraping:  { icon: FileSearch,   color: "text-teal-400",    bg: "bg-teal-400/10",   border: "border-teal-400/20",   label: "SCRAPE" },
  analyzing: { icon: Brain,        color: "text-yellow-400",  bg: "bg-yellow-400/10", border: "border-yellow-400/20", label: "ANALYZE" },
  verdict:   { icon: BarChart3,    color: "text-green-400",   bg: "bg-green-400/10",  border: "border-green-400/20",  label: "VERDICT" },
  error:     { icon: AlertTriangle, color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/20",    label: "ERROR" },
};

const ResearchLogs: React.FC<ResearchLogsProps> = ({ logs, isRunning }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex flex-col bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0px_1px_1px_rgba(255,255,255,0.1)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5 bg-white/[0.02]">
        <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-[inset_0px_1px_1px_rgba(255,255,255,0.1)]">
          <Terminal className="w-5 h-5 text-indigo-300" />
        </div>
        <span className="text-base font-bold tracking-wide text-white drop-shadow-md">Evidence Board</span>
        
        {isRunning && (
          <span className="ml-auto flex items-center gap-2 text-xs font-bold text-teal-400 tracking-wider uppercase bg-teal-400/10 px-3 py-1.5 rounded-full border border-teal-400/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            Live
          </span>
        )}
        {!isRunning && logs.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-green-400 uppercase tracking-wider bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">
            <CheckCircle2 className="w-4 h-4" />
            Complete
          </span>
        )}
      </div>

      {/* Log entries */}
      <div className="p-6 space-y-4 font-sans text-sm">
        <AnimatePresence>
          {logs.length === 0 && !isRunning && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-white/30 gap-4"
            >
              <Terminal className="w-12 h-12 opacity-20" />
              <span className="font-medium tracking-wide">Awaiting research task...</span>
            </motion.div>
          )}

          {logs.map((entry, index) => {
            const meta = PHASE_META[entry.phase];
            const Icon = meta.icon;
            return (
              <motion.div 
                key={entry.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-2xl border backdrop-blur-md transition-all shadow-[0_4px_20px_rgba(0,0,0,0.1),inset_0px_1px_1px_rgba(255,255,255,0.05)]",
                  meta.bg, meta.border
                )}
              >
                <div className={cn("p-2 rounded-xl bg-white/10 shadow-inner", meta.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", meta.color)}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] font-mono text-white/30">{entry.timestamp}</span>
                  </div>
                  <p className={cn(
                    "font-medium leading-relaxed drop-shadow-sm",
                    entry.phase === "error" ? "text-red-200" : "text-white/80",
                    entry.phase === "verdict" && "text-green-200 font-bold"
                  )}>
                    {entry.message}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isRunning && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
          >
            <div className="p-2 rounded-xl bg-white/5 text-teal-400">
              <Search className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex gap-1.5 items-center pt-1">
              {[0, 1, 2].map(i => (
                <motion.span 
                  key={i} 
                  animate={{ y: [0, -5, 0] }} 
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(45,212,191,0.6)]" 
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ResearchLogs;
