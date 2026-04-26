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
  planning:  { icon: Brain,        color: "text-purple-600 dark:text-purple-400",  bg: "bg-purple-500/5 dark:bg-purple-400/10", border: "border-purple-500/10 dark:border-purple-400/20", label: "PLAN" },
  searching: { icon: Search,       color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-500/5 dark:bg-blue-400/10",   border: "border-blue-500/10 dark:border-blue-400/20",   label: "SEARCH" },
  scraping:  { icon: FileSearch,   color: "text-teal-600 dark:text-teal-400",    bg: "bg-teal-500/5 dark:bg-teal-400/10",   border: "border-teal-500/10 dark:border-teal-400/20",   label: "SCRAPE" },
  analyzing: { icon: Brain,        color: "text-amber-600 dark:text-yellow-400",  bg: "bg-amber-500/5 dark:bg-yellow-400/10", border: "border-amber-500/10 dark:border-yellow-400/20", label: "ANALYZE" },
  verdict:   { icon: BarChart3,    color: "text-green-600 dark:text-green-400",   bg: "bg-green-500/5 dark:bg-green-400/10",  border: "border-green-500/10 dark:border-green-400/20",  label: "VERDICT" },
  error:     { icon: AlertTriangle, color: "text-red-600 dark:text-red-400",    bg: "bg-red-500/5 dark:bg-red-400/10",    border: "border-red-500/10 dark:border-red-400/20",    label: "ERROR" },
};

const ResearchLogs: React.FC<ResearchLogsProps> = ({ logs, isRunning }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="glass-panel flex flex-col
      bg-white/40 dark:bg-[#1A1A1A]/70
      backdrop-blur-3xl rounded-[2.5rem]
      border-2 border-white/70 dark:border-white/10 dark:border
      shadow-[0_20px_60px_rgba(0,0,0,0.05)]
      dark:shadow-[0_30px_80px_-20px_rgba(33,150,243,0.4),inset_0_2px_5px_rgba(255,255,255,0.1)]
      overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-8 py-6 border-b border-white/50 dark:border-white/5 bg-white/20 dark:bg-[#1A1A1A]/40">
        <div className="p-2.5 bg-white/50 dark:bg-white/5 rounded-xl backdrop-blur-md
          border border-white/80 dark:border-white/10
          shadow-sm dark:shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.1)] text-indigo-500 dark:text-[#2196F3]">
          <Terminal className="w-5 h-5 dark:drop-shadow-[0_0_8px_rgba(33,150,243,0.6)]" />
        </div>
        <span className="text-base font-bold tracking-wide text-gray-800 dark:text-white">Evidence Board</span>
        
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
              className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/30 gap-4"
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
                  "flex items-start gap-4 p-5 rounded-[1.5rem] border backdrop-blur-2xl transition-all",
                  "shadow-[0_10px_25px_rgba(0,0,0,0.03),inset_0_2px_5px_rgba(255,255,255,0.8)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.05)]",
                  meta.bg, meta.border
                )}
              >
                {/* Icon badge — light: frosted pill with color glow */}
                <div className={cn(
                  "p-3 rounded-xl bg-white/70 dark:bg-white/5",
                  "shadow-[0_6px_14px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]",
                  meta.color
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", meta.color)}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-white/30">{entry.timestamp}</span>
                  </div>
                  <p className={cn(
                    "font-medium leading-relaxed drop-shadow-sm",
                    entry.phase === "error" ? "text-red-700 dark:text-red-200" : "text-slate-700 dark:text-white/80",
                    entry.phase === "verdict" && "text-green-700 dark:text-green-200 font-bold"
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
            className="flex items-center gap-4 p-5 rounded-[1.5rem]
              bg-gradient-to-br from-[#33C6CC]/10 to-[#8A2BE2]/5 dark:bg-[#1A1A1A]/80
              border border-[#33C6CC]/20 dark:border-[#2196F3]/30
              backdrop-blur-2xl
              shadow-[0_12px_30px_rgba(51,198,204,0.1),inset_0_3px_6px_rgba(255,255,255,0.9)]
              dark:shadow-[0_10px_30px_-5px_rgba(33,150,243,0.4),inset_0_2px_5px_rgba(255,255,255,0.1)]"
          >
            {/* Loading spinner badge — liquid teal gel in light */}
            <div className="relative flex items-center justify-center p-3 rounded-xl
              bg-white/70 dark:bg-transparent
              shadow-[0_6px_14px_rgba(51,198,204,0.15),inset_0_2px_4px_rgba(255,255,255,0.9)] dark:shadow-none
              text-[#33C6CC] dark:text-[#2196F3]">
              <div className="absolute inset-0 border-2 border-transparent dark:border-[#2196F3]/50 rounded-xl dark:shadow-[0_0_15px_rgba(33,150,243,0.5),inset_0_0_10px_rgba(33,150,243,0.5)]"></div>
              <Search className="w-5 h-5 animate-spin dark:opacity-0" />
              <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-transparent hidden dark:flex dark:text-[#2196F3] dark:drop-shadow-[0_0_5px_rgba(33,150,243,0.8)] animate-pulse">44</div>
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
