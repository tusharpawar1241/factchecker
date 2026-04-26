import { StateGraph, Annotation } from "@langchain/langgraph";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

export function getApiKeys() {
  return {
    gemini: localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '',
    tavily: localStorage.getItem('TAVILY_API_KEY') || import.meta.env.VITE_TAVILY_API_KEY || '',
    jina: localStorage.getItem('JINA_API_KEY') || import.meta.env.VITE_JINA_API_KEY || '',
  };
}

export const ResearchState = Annotation.Root({
  headline: Annotation<string>(),
  queries: Annotation<string[]>(),
  urls: Annotation<string[]>(),
  scrapedData: Annotation<{ url: string; content: string }[]>(),
  analysis: Annotation<string>(),
  verdict: Annotation<{ truthScore: number; summary: string; links: string[] }>(),
  onLog: Annotation<(msg: string) => void>(),
});

function getGeminiModel() {
  const keys = getApiKeys();
  if (!keys.gemini) throw new Error("GEMINI_API_KEY is missing");
  const genAI = new GoogleGenerativeAI(keys.gemini);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

async function planQueries(state: typeof ResearchState.State) {
  state.onLog?.("Planning search queries for: " + state.headline);
  const model = getGeminiModel();
  
  const prompt = `You are a research planner. Given the following headline, generate exactly 3 distinct, objective search queries to verify the claims. 
Headline: ${state.headline}
Return only a JSON array of strings. No markdown formatting outside of the JSON.`;
  
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    const queries = JSON.parse(cleaned);
    state.onLog?.(`Generated 3 queries: ${queries.join(', ')}`);
    return { queries };
  } catch (e) {
    state.onLog?.(`Failed to parse queries. Using fallback.`);
    return { queries: [state.headline] };
  }
}

async function searchTavily(state: typeof ResearchState.State) {
  const keys = getApiKeys();
  if (!keys.tavily) throw new Error("TAVILY_API_KEY is missing");
  
  let allUrls: string[] = [];
  
  for (const query of state.queries) {
    state.onLog?.(`Searching Tavily for: "${query}"...`);
    try {
      const response = await axios.post("https://api.tavily.com/search", {
        api_key: keys.tavily,
        query: query,
        max_results: 3,
      });
      const results = response.data.results || [];
      const urls = results.map((r: any) => r.url);
      allUrls.push(...urls);
    } catch (e) {
      console.error("Tavily error:", e);
      state.onLog?.(`Failed to search Tavily for: "${query}"`);
    }
  }
  
  // Deduplicate URLs
  allUrls = Array.from(new Set(allUrls));
  state.onLog?.(`Found ${allUrls.length} unique URLs to analyze.`);
  return { urls: allUrls };
}

async function scrapeJina(state: typeof ResearchState.State) {
  const scrapedData = [];
  const keys = getApiKeys();
  
  for (const url of state.urls) {
    let hostname = url;
    try { hostname = new URL(url).hostname; } catch(e) {}
    state.onLog?.(`Reading article from ${hostname}...`);
    try {
      const headers: Record<string, string> = {
        "Accept": "text/event-stream, application/json, text/plain, */*",
      };
      if (keys.jina && keys.jina.trim() !== "") {
        headers["Authorization"] = `Bearer ${keys.jina}`;
      }
      const response = await axios.get(`https://r.jina.ai/${url}`, { headers });
      scrapedData.push({ url, content: response.data.substring(0, 4000) }); // Limit to 4k chars to avoid token limits easily
    } catch (e) {
      console.error("Jina error for URL", url, e);
      state.onLog?.(`Failed to read article from ${hostname}`);
    }
  }
  return { scrapedData };
}

async function analyzeContent(state: typeof ResearchState.State) {
  state.onLog?.("Analyzing scraped content for contradictions and verifying dates...");
  const model = getGeminiModel();
  
  if (state.scrapedData.length === 0) {
     return { analysis: "No scraped content available to analyze." };
  }

  let contentDump = state.scrapedData.map(d => `URL: ${d.url}\nCONTENT: ${d.content}`).join("\n\n---\n\n");
  
  const prompt = `You are a deep research analyst. Analyze the following scraped articles related to the headline: "${state.headline}".
Find contradictions, verify dates, and check source authority.
Provide a detailed analysis.

Scraped Content:
${contentDump}`;
  
  const result = await model.generateContent(prompt);
  return { analysis: result.response.text() };
}

async function generateVerdict(state: typeof ResearchState.State) {
  state.onLog?.("Formulating final verdict...");
  const model = getGeminiModel();
  
  const prompt = `Based on the following analysis, provide a final verdict for the headline: "${state.headline}".
Output MUST be in strictly valid JSON format with the following keys:
- truthScore: a number from 0 to 100 representing the likelihood the headline is true.
- summary: a short summary of evidence and findings.
- links: an array of URLs used to verify this.

Analysis:
${state.analysis}

Urls available: ${state.urls.join(', ')}

Return ONLY JSON. No markdown ticks.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  let verdict;
  try {
     verdict = JSON.parse(cleaned);
  } catch (e) {
     state.onLog?.("Failed to parse verdict JSON. Using fallback.");
     verdict = { truthScore: 50, summary: "Could not formulate a proper verdict.", links: [] };
  }
  state.onLog?.("Research complete.");
  return { verdict };
}

export const researchGraph = new StateGraph(ResearchState)
  .addNode("planQueries", planQueries)
  .addNode("searchTavily", searchTavily)
  .addNode("scrapeJina", scrapeJina)
  .addNode("analyzeContent", analyzeContent)
  .addNode("generateVerdict", generateVerdict)
  .addEdge("__start__", "planQueries")
  .addEdge("planQueries", "searchTavily")
  .addEdge("searchTavily", "scrapeJina")
  .addEdge("scrapeJina", "analyzeContent")
  .addEdge("analyzeContent", "generateVerdict")
  .addEdge("generateVerdict", "__end__")
  .compile();

export async function runResearchAgent(headline: string, onLog: (msg: string) => void) {
  const initialState = {
    headline,
    queries: [],
    urls: [],
    scrapedData: [],
    analysis: "",
    verdict: { truthScore: 0, summary: "", links: [] },
    onLog,
  };
  
  const finalState = await researchGraph.invoke(initialState);
  return finalState.verdict;
}
