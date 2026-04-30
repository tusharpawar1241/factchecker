import React, { useState, useEffect } from "react";
import { Key, X, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { getKeys, saveKeys, missingKeys } from "../services/researcher";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface ApiSetupGuideProps {
  onKeysSet: () => void;
}

const INPUT_CLS =
  "w-full bg-black/5 dark:bg-white/5 backdrop-blur-xl border-t border-l border-black/10 dark:border-white/5 border-b border-r border-white/60 dark:border-white/10 rounded-2xl px-5 py-4 text-sm text-[#1C1C1E] dark:text-white placeholder-[#8E8E93] dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]/40 dark:focus:ring-[#2196F3]/50 transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.07)] dark:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.05)] pr-12";

const ApiSetupGuide: React.FC<ApiSetupGuideProps> = ({ onKeysSet }) => {
  const [keys, setKeys] = useState({ groq: "", tavily: "", jina: "" });
  const [show, setShow] = useState({ groq: false, tavily: false, jina: false });
  const [saved, setSaved] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const k = getKeys();
    setKeys({ groq: k.groq, tavily: k.tavily, jina: k.jina });
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
      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-500 dark:text-red-400/80 tracking-normal capitalize text-[10px]">{t('required')}</span>}
        {!required && <span className="text-slate-400 dark:text-white/30 tracking-normal capitalize text-[10px]">{t('optional')}</span>}
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
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {show[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-[11px] text-slate-500 dark:text-white/40 font-medium">{hint}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative">
      
      {/* Dynamic ambient blobs */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-indigo-600/10 dark:bg-indigo-600/30 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-purple-600/10 dark:bg-purple-600/30 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
        className="glass-panel w-full max-w-lg
          bg-white/40 dark:bg-[#1A1A1A]/70
          backdrop-blur-3xl
          border-2 border-white/70 dark:border-white/10 dark:border
          rounded-[2.5rem]
          shadow-[0_20px_60px_rgba(0,0,0,0.05)]
          dark:shadow-[0_30px_80px_-20px_rgba(33,150,243,0.4),inset_0_2px_5px_rgba(255,255,255,0.1)]
          overflow-hidden relative z-10"
      >
        {/* Header */}
        <div className="bg-[#33C6CC]/10 dark:bg-[#2196F3]/10 border-b border-white/40 dark:border-white/5 px-8 py-8 relative overflow-hidden shadow-[inset_0_-1px_2px_rgba(0,0,0,0.02)]">
          <div className="absolute inset-0 bg-white/30 dark:bg-white/5 backdrop-blur-2xl" />
          <div className="relative z-10 flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/60 dark:bg-[#2A2A2A]/80 rounded-2xl border border-white/60 dark:border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.05),inset_2px_2px_6px_rgba(255,255,255,0.8)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.4),0_0_10px_rgba(33,150,243,0.1),inset_1px_1px_2px_rgba(255,255,255,0.1)]">
                <Key className="w-6 h-6 text-[#33C6CC] dark:text-[#2196F3] drop-shadow-md" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">{t('api_setup')}</h1>
            </div>
            <div className="flex gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
          <p className="relative z-10 text-sm font-medium text-slate-500 dark:text-white/60 leading-relaxed">
            {t('api_subtitle')}
          </p>
        </div>

        {/* Missing keys banner */}
        <AnimatePresence>
          {missingKeys().length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="mx-8 mt-6 flex items-start gap-3 bg-red-500/5 dark:bg-red-500/10 backdrop-blur-md border border-red-500/20 dark:border-red-500/30 rounded-2xl px-5 py-4 shadow-[inset_0px_1px_1px_rgba(255,255,255,0.05)]"
            >
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-sm font-medium text-red-700 dark:text-red-200">
                {t('missing_keys')}
                <span className="font-bold tracking-wide">{missingKeys().join(", ")}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <div className="px-8 py-8 space-y-6">
          <Field
            id="groq"
            label={t('groq_label')}
            placeholder="gsk_…"
            value={keys.groq}
            required
            hint={
              <>
                {t('groq_hint_1')}
                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-colors">
                  console.groq.com
                </a>
                {t('groq_hint_2')}
              </>
            }
          />
          <Field
            id="tavily"
            label={t('tavily_label')}
            placeholder="tvly-…"
            value={keys.tavily}
            required
            hint={
              <>
                {t('tavily_hint_1')}
                <a href="https://tavily.com" target="_blank" rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-colors">
                  tavily.com
                </a>
                {t('tavily_hint_2')}
              </>
            }
          />
          <Field
            id="jina"
            label={t('jina_label')}
            placeholder="jina_…"
            value={keys.jina}
            hint={t('jina_hint')}
          />

          <motion.button
            whileHover={{ scale: keys.groq && keys.tavily ? 1.02 : 1 }}
            whileTap={{ scale: keys.groq && keys.tavily ? 0.98 : 1 }}
            onClick={handleSave}
            disabled={!keys.groq || !keys.tavily}
            className="gel-btn w-full py-4 rounded-[2.5rem] font-bold text-[15px] transition-all
              bg-gradient-to-br from-[#A855F7] to-[#7C3AED]
              dark:bg-[#2196F3] dark:hover:bg-[#1e88e5] dark:bg-none
              shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)] drop-shadow-[0_10px_15px_rgba(124,58,237,0.4)]
              dark:shadow-[0_10px_25px_-5px_rgba(33,150,243,0.6),inset_0_1px_0_rgba(255,255,255,0.4)] dark:drop-shadow-none
              border border-purple-300/50 dark:border-white/20
              disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-white" />
                {t('saved')}
              </>
            ) : (
              t('save_keys')
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
