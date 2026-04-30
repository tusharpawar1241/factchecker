import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      app_name: "Verifai",
      app_subtitle: "Deep Research Agent",
      title_part1: "Is it ",
      title_part2: "actually true?",
      intro_text: "Paste a headline, claim, or viral post. The agent will search, scrape, and cross-reference multiple sources in real time.",
      placeholder: "Paste a headline, claim, or URL...",
      researching: "Researching…",
      deep_research: "Deep Research",
      error_label: "Error:",
      synthesizing_1: "Synthesizing evidence...",
      synthesizing_2: "Verdict will appear here.",
      footer_1: "Verifai • Powered by Groq (Llama 3.1) + Tavily + Jina",
      footer_2: "Local Privacy First",
      evidence_board: "Evidence Board",
      live: "Live",
      complete: "Complete",
      awaiting: "Awaiting research task...",
      score: "Score",
      final_verdict: "Final Fact-Check Verdict",
      key_findings: "Key Findings",
      contradictions: "Contradictions Found",
      cited_sources: "Cited Sources",
      download_pdf: "Download Research Report",
      claim_analysed: "Claim Analysed:",
      verdict: "Verdict:",
      summary: "Summary:",
      api_setup: "API Setup",
      api_subtitle: "Verifai needs API keys to run the deep research pipeline. Keys are stored locally in your browser and never sent to any server.",
      missing_keys: "Missing required keys: ",
      groq_label: "Groq API Key",
      tavily_label: "Tavily Search API Key",
      jina_label: "Jina Reader API Key",
      required: "(required)",
      optional: "(optional)",
      save_keys: "Save Keys & Launch Verifai",
      saved: "Saved! Launching…",
      groq_hint_1: "Get it at ",
      groq_hint_2: " — super fast inference.",
      tavily_hint_1: "Get it at ",
      tavily_hint_2: " — free 1,000 searches/month.",
      jina_hint: "Optional — enhances scraping quality. Get at jina.ai"
    }
  },
  hi: {
    translation: {
      app_name: "वेरिफाई (Verifai)",
      app_subtitle: "डीप रिसर्च एजेंट",
      title_part1: "क्या यह ",
      title_part2: "सच में सच है?",
      intro_text: "कोई हेडलाइन, दावा या वायरल पोस्ट पेस्ट करें। एजेंट वास्तविक समय में कई स्रोतों से खोज, स्क्रैप और क्रॉस-रेफरेंस करेगा।",
      placeholder: "कोई हेडलाइन, दावा या URL पेस्ट करें...",
      researching: "रिसर्च हो रही है…",
      deep_research: "डीप रिसर्च",
      error_label: "त्रुटि:",
      synthesizing_1: "प्रमाण संश्लेषित हो रहे हैं...",
      synthesizing_2: "परिणाम यहाँ दिखाई देगा।",
      footer_1: "वेरिफाई • Groq (Llama 3.1) + Tavily + Jina द्वारा संचालित",
      footer_2: "स्थानीय गोपनीयता सर्वोपरि",
      evidence_board: "प्रमाण बोर्ड",
      live: "लाइव",
      complete: "पूर्ण",
      awaiting: "रिसर्च कार्य की प्रतीक्षा है...",
      score: "स्कोर",
      final_verdict: "अंतिम तथ्य-जांच परिणाम",
      key_findings: "मुख्य निष्कर्ष",
      contradictions: "विरोधाभास मिले",
      cited_sources: "उद्धृत स्रोत",
      download_pdf: "रिसर्च रिपोर्ट डाउनलोड करें",
      claim_analysed: "दावे का विश्लेषण:",
      verdict: "परिणाम:",
      summary: "सारांश:",
      api_setup: "API सेटअप",
      api_subtitle: "वेरिफाई को डीप रिसर्च पाइपलाइन चलाने के लिए API कुंजियों की आवश्यकता है। कुंजियाँ आपके ब्राउज़र में स्थानीय रूप से संग्रहीत होती हैं और कभी भी किसी सर्वर पर नहीं भेजी जाती हैं।",
      missing_keys: "आवश्यक कुंजियाँ गायब हैं: ",
      groq_label: "Groq API कुंजी",
      tavily_label: "Tavily Search API कुंजी",
      jina_label: "Jina Reader API कुंजी",
      required: "(आवश्यक)",
      optional: "(वैकल्पिक)",
      save_keys: "कुंजियाँ सहेजें और वेरिफाई शुरू करें",
      saved: "सहेजा गया! शुरू हो रहा है…",
      groq_hint_1: "इसे ",
      groq_hint_2: " पर प्राप्त करें - अत्यंत तेज़ अनुमान।",
      tavily_hint_1: "इसे ",
      tavily_hint_2: " पर प्राप्त करें - 1,000 मुफ़्त खोजें/माह।",
      jina_hint: "वैकल्पिक - स्क्रैपिंग गुणवत्ता बढ़ाता है। jina.ai पर प्राप्त करें"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
