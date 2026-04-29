<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Verifai

**Intelligent, Secure, and Real-Time Fact-Checking Agent**
</div>

---

## 🌟 The Vision
In an era of rampant misinformation, **Verifai** serves as your ultimate truth-seeking companion. We built Verifai to empower journalists, researchers, and everyday users to instantly verify claims using autonomous AI research agents. It doesn't just give you an answer; it shows you the evidence, analyzes the sources, and delivers a comprehensive, unbiased verdict.

## 💡 Key Features
- **Real-Time Research Pipeline:** Harnesses autonomous search agents (Tavily & Jina) to instantly scour the web for credible sources.
- **Advanced AI Reasoning:** Powered by **Groq (Llama 3.1 70B)** for lightning-fast, highly accurate claim analysis and synthesis.
- **Streaming Intelligence:** Watch the agent's thought process and evidence gathering in real-time with continuous data streaming.
- **Liquid Glassmorphism UI:** A stunning, premium user interface built with React and Framer Motion, offering fluid, organic animations.
- **Enterprise-Grade Security:** 100% secure architecture with a Vercel serverless proxy backend ensuring no API keys are ever exposed to the client.
- **Report Generation:** Easily export verified fact-checks and research summaries as PDF reports.

## 🛠️ Technology Stack
- **Frontend Framework:** React 19 + Vite
- **Styling & UI:** Tailwind CSS, Framer Motion (Glassmorphism design language), Lucide React
- **Backend Infrastructure:** Vercel Serverless Functions (`/api/verify.js`)
- **LLM Engine:** Groq API (Llama 3.1 70B)
- **Search & Scraping:** Tavily Search API, Jina AI
- **Utilities:** jsPDF (for exporting analysis)

## 🔒 Security First Architecture
We prioritize security. Unlike typical hackathon projects that expose API keys in the frontend, Verifai uses a **Secure Backend Proxy**. All API-dependent research logic (Tavily, Jina, and Groq) has been migrated to a serverless Vercel function. The frontend simply communicates via secure POST requests using a stream-based response model, ensuring keys remain completely hidden from the browser.

## 🚀 Run Locally

**Prerequisites:**  
- Node.js (v18+)
- API Keys for Groq, Tavily, and Jina

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd factchecker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your API keys:
   ```env
   GROQ_API_KEY=your_groq_api_key
   TAVILY_API_KEY=your_tavily_api_key
   JINA_API_KEY=your_jina_api_key
   ```
   *(Note: Adjust the variable names based on your project's specific configuration)*

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Visit `http://localhost:5173` in your browser.

## 🔮 What's Next
- **Multi-Modal Verification:** Analyzing images and video for deepfakes.
- **Browser Extension:** Seamlessly verify claims directly while reading news articles.
- **Community Consensus:** Crowdsourced human reviews alongside AI verdicts.

---
<div align="center">
Built with 🩵 for Truth and Transparency.
</div>
