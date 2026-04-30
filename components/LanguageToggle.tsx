import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('en') ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-3 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/80 dark:border-white/10 rounded-xl shadow-sm dark:shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.1)] text-indigo-500 dark:text-white/80 transition-all active:scale-95 flex items-center justify-center gap-2 font-bold text-sm uppercase"
      aria-label="Toggle language"
    >
      <Languages className="w-5 h-5" />
      {i18n.language.startsWith('en') ? 'EN' : 'HI'}
    </button>
  );
};

export default LanguageToggle;
