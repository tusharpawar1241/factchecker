import React, { useState, useEffect } from "react";
import { Key, X, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { getKeys, saveKeys, missingKeys } from "../services/researcher";
import { motion, AnimatePresence } from "framer-motion";

interface ApiSetupGuideProps {
  onKeysSet: () => void;
}

const INPUT_CLS =
  "w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all shadow-[inset_0px_2px_4px_rgba(0,0,0,0.3)] pr-10";

const ApiSetupGuide: React.FC<ApiSetupGuideProps> = ({ onKeysSet }) => {
  const [keys, setKeys] = useState({ gemini: "", tavily: "", jina: "" });
  const [show, setShow] = useState({ gemini: false, tavily: false, jina: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const k = getKeys();
    setKeys({ gemini: k.gemini, tavily: k.tavily, jina: k.jina });
  }, []);

  const handleSave = () => {
    saveKeys(keys);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onKeysSet();
    }, 1200);
  };

  const toggle = (field: keyof typeof show) =>
    setShow(prev => ({ ...prev, [field]: !prev[field] }));

  const Field = ({
    id, label, placeholder, value, hint, required = false,
  }: {
    id: keyof typeof keys;
    label: string;
    placeholder: string;
    value: string;
    hint?: React.ReactNode;
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-bold text-white/60 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400/80 tracking-normal capitalize text-[10px]">(required)</span>}
        {!required && <span className="text-white/30 tracking-normal capitalize text-[10px]">(optional)</span>}
      </label>
      <div className="relative">
        <input
          type={show[id] ? "text" : "password"}
          className={INPUT_CLS}
          placeholder={placeholder}
          value={value}
          onChange={e => setKeys(prev => ({ ...prev, [id]: e.target.value }))}
        />
        <button
          type="button"
          onClick={() => toggle(id)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
        >
          {show[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-[11px] text-white/40 font-medium">{hint}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative">
      
      {/* Dynamic ambient blobs */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-indigo-600/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
        className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0px_1px_1px_rgba(255,255,255,0.1)] overflow-hidden relative z-10"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b border-white/10 px-8 py-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-md" />
          <div className="relative z-10 flex items-center gap-4 mb-3">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 shadow-[inset_0px_1px_1px_rgba(255,255,255,0.2)]">
              <Key className="w-6 h-6 text-indigo-300 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">API Setup Required</h1>
          </div>
          <p className="relative z-10 text-sm font-medium text-white/60 leading-relaxed">
            Verifai needs API keys to run the deep research pipeline. Keys are stored locally in your browser and never sent to any server.
          </p>
        </div>

        {/* Missing keys banner */}
        <AnimatePresence>
          {missingKeys().length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="mx-8 mt-6 flex items-start gap-3 bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-2xl px-5 py-4 shadow-[inset_0px_1px_1px_rgba(255,255,255,0.05)]"
            >
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm font-medium text-red-200">
                Missing required keys:{" "}
                <span className="font-bold tracking-wide">{missingKeys().join(", ")}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <div className="px-8 py-8 space-y-6">
          <Field
            id="gemini"
            label="Google Gemini API Key"
            placeholder="AIza…"
            value={keys.gemini}
            required
            hint={
              <>
                Get it at{" "}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-colors">
                  aistudio.google.com
                </a>
                {" "}— free tier available.
              </>
            }
          />
          <Field
            id="tavily"
            label="Tavily Search API Key"
            placeholder="tvly-…"
            value={keys.tavily}
            required
            hint={
              <>
                Get it at{" "}
                <a href="https://tavily.com" target="_blank" rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-colors">
                  tavily.com
                </a>
                {" "}— free 1,000 searches/month.
              </>
            }
          />
          <Field
            id="jina"
            label="Jina Reader API Key"
            placeholder="jina_…"
            value={keys.jina}
            hint="Optional — enhances scraping quality. Get at jina.ai"
          />

          <motion.button
            whileHover={{ scale: keys.gemini && keys.tavily ? 1.02 : 1 }}
            whileTap={{ scale: keys.gemini && keys.tavily ? 0.98 : 1 }}
            onClick={handleSave}
            disabled={!keys.gemini || !keys.tavily}
            className="w-full py-4 rounded-2xl font-bold text-sm transition-all
              bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400
              shadow-[0_0_20px_rgba(99,102,241,0.4),inset_0px_1px_1px_rgba(255,255,255,0.4)] border border-white/20
              disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 mt-4"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-white" />
                Saved! Launching…
              </>
            ) : (
              "Save Keys & Launch Verifai"
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

// Local component since AlertTriangle isn't imported from lucide above
const AlertTriangle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>
);

export default ApiSetupGuide;
