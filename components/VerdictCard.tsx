import React from "react";
import {
  CheckCircle2, XCircle, AlertTriangle, HelpCircle, ExternalLink, ListChecks, GitCompareArrows, Quote, Download
} from "lucide-react";
import { cn } from "../lib/utils";
import type { ResearchVerdict } from "../services/researcher";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";

interface VerdictCardProps {
  verdict: ResearchVerdict;
  headline: string;
}

type Label = ResearchVerdict["label"];

const LABEL_META: Record<Label, { icon: React.ElementType; glow: string; text: string; bg: string; border: string; gradient: string }> = {
  "TRUE":         { icon: CheckCircle2,   glow: "shadow-[0_0_40px_rgba(34,197,94,0.1)] dark:shadow-[0_0_40px_rgba(34,197,94,0.3)]", text: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", border: "border-green-500/20 dark:border-green-500/30", gradient: "from-green-500 to-emerald-400" },
  "MOSTLY TRUE":  { icon: CheckCircle2,   glow: "shadow-[0_0_40px_rgba(16,185,129,0.1)] dark:shadow-[0_0_40px_rgba(16,185,129,0.3)]", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20 dark:border-emerald-500/30", gradient: "from-emerald-500 to-teal-400" },
  "MISLEADING":   { icon: AlertTriangle,  glow: "shadow-[0_0_40px_rgba(234,179,8,0.1)] dark:shadow-[0_0_40px_rgba(234,179,8,0.3)]", text: "text-amber-600 dark:text-yellow-400", bg: "bg-amber-500/10", border: "border-amber-500/20 dark:border-yellow-500/30", gradient: "from-yellow-500 to-orange-400" },
  "MOSTLY FALSE": { icon: XCircle,        glow: "shadow-[0_0_40px_rgba(249,115,22,0.1)] dark:shadow-[0_0_40px_rgba(249,115,22,0.3)]", text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20 dark:border-orange-500/30", gradient: "from-orange-500 to-red-400" },
  "FALSE":        { icon: XCircle,        glow: "shadow-[0_0_40px_rgba(239,68,68,0.1)] dark:shadow-[0_0_40px_rgba(239,68,68,0.3)]", text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", border: "border-red-500/20 dark:border-red-500/30", gradient: "from-red-500 to-pink-500" },
  "UNVERIFIED":   { icon: HelpCircle,     glow: "shadow-[0_0_40px_rgba(161,161,170,0.1)] dark:shadow-[0_0_40px_rgba(161,161,170,0.3)]", text: "text-slate-600 dark:text-zinc-400", bg: "bg-slate-500/10 dark:bg-zinc-500/10", border: "border-slate-500/20 dark:border-zinc-500/30", gradient: "from-zinc-500 to-slate-400" },
};

const VerdictCard: React.FC<VerdictCardProps> = ({ verdict, headline }) => {
  const meta = LABEL_META[verdict.label] ?? LABEL_META["UNVERIFIED"];
  const Icon = meta.icon;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const ts = new Date().toLocaleString();

    doc.setFontSize(22); doc.setTextColor(99, 102, 241);
    doc.text("Verifai Deep Research Report", 14, 20);
    doc.setFontSize(9); doc.setTextColor(120);
    doc.text(`Generated: ${ts}`, 14, 27);

    doc.setFontSize(13); doc.setTextColor(0); doc.setFont("helvetica", "bold");
    doc.text("Claim Analysed:", 14, 37);
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    doc.text(doc.splitTextToSize(headline, 182), 14, 44);

    let y = 44 + (doc.splitTextToSize(headline, 182).length * 6) + 8;

    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(0);
    doc.text("Verdict:", 14, y);
    doc.setFontSize(18);
    const scoreColor: [number, number, number] =
      verdict.truthScore >= 75 ? [34, 197, 94] :
      verdict.truthScore >= 40 ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(...scoreColor);
    doc.text(`${verdict.label}  (${verdict.truthScore}% Truth Score)`, 14, y + 9);

    y += 20; doc.setTextColor(0); doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("Summary:", 14, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(doc.splitTextToSize(verdict.summary, 182), 14, y + 7);

    y += 7 + (doc.splitTextToSize(verdict.summary, 182).length * 5.5) + 8;

    if (verdict.keyFindings.length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("Key Findings:", 14, y);
      autoTable(doc, {
        startY: y + 4,
        body: verdict.keyFindings.map((f, i) => [`${i + 1}.`, f]),
        theme: "plain",
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 8 } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    if (verdict.contradictions.length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(0);
      doc.text("Contradictions / Context Issues:", 14, y);
      autoTable(doc, {
        startY: y + 4,
        body: verdict.contradictions.map((c, i) => [`${i + 1}.`, c]),
        theme: "plain",
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 8 } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    if (verdict.sources.length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(0);
      doc.text("Sources:", 14, y);
      autoTable(doc, {
        startY: y + 4,
        head: [["#", "Title", "URL"]],
        body: verdict.sources.map((s, i) => [i + 1, s.title, s.url]),
        theme: "striped",
        headStyles: { fillColor: [63, 81, 181] },
        styles: { fontSize: 8, overflow: "linebreak" },
        columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 60 } },
      });
    }

    doc.save(`Verifai_${headline.slice(0, 25).replace(/\s/g, "_")}.pdf`);
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (verdict.truthScore / 100) * circumference;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
      className={cn(
        "glass-panel rounded-[2.5rem] backdrop-blur-3xl p-8 flex flex-col gap-8",
        meta.bg, meta.border, meta.glow,
        /* Light: specular bordered frosted panel elevated off warm desk */
        "bg-white/40 dark:bg-[#1A1A1A]/70",
        "border-2 border-white/70 dark:border-white/10 dark:border",
        "shadow-[0_20px_60px_rgba(0,0,0,0.05)]",
        "dark:shadow-[0_30px_80px_-20px_rgba(33,150,243,0.4),inset_0_2px_5px_rgba(255,255,255,0.1)]"
      )}
    >
      {/* Top Section: Glowing Gauge & Label */}
      <div className="flex flex-col items-center text-center gap-4 relative">
        
        {/* Glowing Circular Gauge */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <circle cx="64" cy="64" r="40" fill="none" strokeWidth="8" className="stroke-slate-200 dark:stroke-white/10" />
            <motion.circle 
              cx="64" cy="64" r="40" 
              className={cn("fill-none transition-all duration-1000", verdict.truthScore >= 75 ? "stroke-emerald-500 dark:stroke-[#2196F3] dark:drop-shadow-[0_0_10px_rgba(33,150,243,0.8)]" : verdict.truthScore >= 40 ? "stroke-amber-500" : "stroke-red-500")}
              strokeWidth="8" 
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ strokeDasharray: circumference }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-black tabular-nums drop-shadow-sm", meta.text)}>
              {verdict.truthScore}
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest mt-0.5">Score</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Icon className={cn("w-6 h-6 drop-shadow-md", meta.text)} />
            <h2 className={cn("text-3xl font-black tracking-tight drop-shadow-md", meta.text)}>
              {verdict.label}
            </h2>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-white/60">Final Fact-Check Verdict</p>
        </div>
      </div>

      {/* Summary: frosted inset tray */}
      <div className="relative p-6 rounded-[1.5rem]
        bg-white/30 dark:bg-white/5
        border-2 border-white/60 dark:border-white/5 dark:border
        shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.05)]
        backdrop-blur-xl">
        <Quote className="absolute top-4 left-4 w-8 h-8 text-[#1C1C1E]/10 dark:text-white/10" />
        <p className="relative z-10 text-slate-700 dark:text-white/90 text-[15px] font-medium leading-relaxed indent-6">
          {verdict.summary}
        </p>
      </div>

      <div className="space-y-6">
        {/* Key Findings */}
        {verdict.keyFindings.length > 0 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">
              <ListChecks className="w-4 h-4" /> Key Findings
            </div>
            <ul className="space-y-3">
              {verdict.keyFindings.map((f, i) => (
                <li key={i} className="flex gap-4 text-sm text-slate-700 dark:text-white/80 p-4 rounded-2xl bg-white/60 dark:bg-slate-800/50 border border-white/70 dark:border-white/5 shadow-[0_4px_10px_rgba(0,0,0,0.02),inset_1px_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.1)]">
                  <div className={cn("flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br text-xs font-black text-white shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.5)]", meta.gradient)}>
                    {i + 1}
                  </div>
                  <span className="pt-0.5 font-medium">{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Contradictions */}
        {verdict.contradictions.length > 0 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4 mt-6">
              <GitCompareArrows className="w-4 h-4" /> Contradictions Found
            </div>
            <ul className="space-y-3">
              {verdict.contradictions.map((c, i) => (
                <li key={i} className="flex gap-4 text-sm text-orange-800 dark:text-orange-200 p-4 rounded-2xl bg-orange-500/10 dark:bg-orange-900/20 border border-orange-500/20 dark:border-orange-500/10 shadow-[0_4px_10px_rgba(249,115,22,0.05),inset_1px_1px_2px_rgba(255,255,255,0.6)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.1)]">
                  <AlertTriangle className="w-6 h-6 text-orange-500 dark:text-orange-400 shrink-0 drop-shadow-sm" />
                  <span className="font-medium pt-0.5">{c}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Cited Sources */}
        {verdict.sources.length > 0 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <div className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4 mt-6">
              Cited Sources
            </div>
            <ul className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {verdict.sources.map((s, i) => {
                let host = s.url;
                try { host = new URL(s.url).hostname.replace("www.", ""); } catch { /* ignore */ }
                return (
                  <li key={i}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-4 group p-4 rounded-2xl bg-white/60 dark:bg-slate-800/50 border border-white/70 dark:border-white/5 hover:bg-white/80 dark:hover:bg-slate-700/50 transition-all shadow-[0_4px_10px_rgba(0,0,0,0.02),inset_1px_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_1px_1px_2px_rgba(255,255,255,0.1)]">
                      <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-500/20 dark:group-hover:bg-indigo-500/40 transition-colors shadow-inner">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-300 truncate tracking-wide">{host}</div>
                        <div className="text-[11px] text-slate-500 dark:text-white/50 truncate font-medium">{s.title}</div>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </div>

      {/* Download PDF Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleDownloadPDF}
        className={cn(
          "gel-btn w-full py-4 rounded-[2.5rem] text-[15px] font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]",
          /* Light: purple gel capsule with luminescence shadow */
          "bg-gradient-to-br from-[#A855F7] to-[#7C3AED]",
          "dark:bg-[#2196F3] dark:bg-none dark:from-[#2196F3] dark:to-[#1565C0]",
          "border border-purple-300/50 dark:border-white/20",
          "shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)] drop-shadow-[0_10px_15px_rgba(124,58,237,0.4)]",
          "dark:shadow-[0_10px_25px_-5px_rgba(33,150,243,0.6),inset_0_1px_0_rgba(255,255,255,0.4)] dark:drop-shadow-none",
          "text-white dark:text-white/80"
        )}
      >
        <Download className="w-4 h-4" />
        Download Research Report
      </motion.button>

    </motion.div>
  );
};

export default VerdictCard;
