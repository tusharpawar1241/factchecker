import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LogEntry {
  id: string;
  timestamp: string;
  phase: "planning" | "searching" | "scraping" | "analyzing" | "verdict" | "error";
  message: string;
}

export interface Source {
  url: string;
  title: string;
  snippet: string;
}

export interface ResearchVerdict {
  truthScore: number; // 0-100
  label: "TRUE" | "MOSTLY TRUE" | "MISLEADING" | "MOSTLY FALSE" | "FALSE" | "UNVERIFIED";
  summary: string;
  keyFindings: string[];
  contradictions: string[];
  sources: Source[];
}

export type LogCallback = (entry: Omit<LogEntry, "id" | "timestamp">) => void;

// ─── Key helpers ──────────────────────────────────────────────────────────────

export function getKeys() {
  return {
    gemini: localStorage.getItem("gemini_key") || import.meta.env.VITE_GEMINI_API_KEY || "",
    tavily: localStorage.getItem("tavily_key") || import.meta.env.VITE_TAVILY_API_KEY || "",
    jina:   localStorage.getItem("jina_key")   || import.meta.env.VITE_JINA_API_KEY   || "",
  };
}

export function saveKeys(keys: { gemini: string; tavily: string; jina: string }) {
  if (keys.gemini) localStorage.setItem("gemini_key", keys.gemini);
  if (keys.tavily) localStorage.setItem("tavily_key", keys.tavily);
  if (keys.jina)   localStorage.setItem("jina_key",   keys.jina);
}

export function missingKeys(): string[] {
  const k = getKeys();
  const missing: string[] = [];
  if (!k.gemini) missing.push("GEMINI");
  if (!k.tavily) missing.push("TAVILY");
  return missing;
}

// ─── Gemini helper ────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function genAI() {
  const { gemini } = getKeys();
  if (!gemini) throw new Error("Gemini API key not set.");
  return new GoogleGenerativeAI(gemini).getGenerativeModel({ model: "gemini-2.0-flash" });
}

async function geminiWithRetry<T>(prompt: string, retries = 2): Promise<T> {
  try {
    const result = await genAI().generateContent(prompt);
    const raw = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(raw) as T;
  } catch (err: any) {
    const is429 = err.message?.includes("429") || err.message?.includes("Quota");
    if (is429 && retries > 0) {
      await delay(2000 + Math.random() * 2000);
      return geminiWithRetry(prompt, retries - 1);
    }
    throw err;
  }
}

// ─── Phase 1 – Deconstruction ─────────────────────────────────────────────────

async function deconstruct(claim: string, log: LogCallback): Promise<string[]> {
  log({ phase: "planning", message: `Deconstructing claim into search queries…` });

  const prompt = `You are an investigative journalist. A user submitted this news claim:
"${claim}"

Break this into exactly 3 specific, objective, and distinct search queries that would help verify it from different angles.
Return ONLY a valid JSON array of 3 strings. Example: ["query1", "query2", "query3"]`;

  try {
    const queries = await geminiWithRetry<string[]>(prompt);
    queries.forEach((q, i) => log({ phase: "planning", message: `Query ${i + 1}: "${q}"` }));
    return queries;
  } catch (e: any) {
    log({ phase: "error", message: `Planning failed (Rate Limit?). Using fallback query.` });
    return [claim];
  }
}

// ─── Phase 2 – Live Search via Tavily ────────────────────────────────────────

async function search(queries: string[], log: LogCallback): Promise<Source[]> {
  const { tavily } = getKeys();
  if (!tavily) throw new Error("Tavily API key not set.");

  const allSources: Source[] = [];

  for (const query of queries) {
    log({ phase: "searching", message: `Searching: "${query}"…` });
    try {
      const res = await axios.post(
        "https://api.tavily.com/search",
        { api_key: tavily, query, max_results: 3, search_depth: "advanced" },
        { timeout: 15000 }
      );
      const results: any[] = res.data.results || [];
      results.forEach(r => {
        allSources.push({ url: r.url, title: r.title || r.url, snippet: r.content || "" });
        try {
          const host = new URL(r.url).hostname.replace("www.", "");
          log({ phase: "searching", message: `Found source: ${host}` });
        } catch { /* ignore */ }
      });
    } catch (e: any) {
      log({ phase: "error", message: `Search failed for "${query}": ${e.message}` });
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  return allSources.filter(s => { if (seen.has(s.url)) return false; seen.add(s.url); return true; });
}

// ─── Phase 3 – Deep Scrape via Jina Reader ────────────────────────────────────

async function scrape(sources: Source[], log: LogCallback): Promise<{ url: string; title: string; content: string }[]> {
  const { jina } = getKeys();
  const scraped: { url: string; title: string; content: string }[] = [];

  for (const source of sources) {
    let host = source.url;
    try { host = new URL(source.url).hostname.replace("www.", ""); } catch { /* ignore */ }
    log({ phase: "scraping", message: `Agent is reading article from ${host}…` });

    try {
      const headers: Record<string, string> = { Accept: "text/plain" };
      if (jina) headers["Authorization"] = `Bearer ${jina}`;

      const res = await axios.get(`https://r.jina.ai/${source.url}`, {
        headers,
        timeout: 20000,
        responseType: "text",
      });

      const content = typeof res.data === "string" ? res.data.slice(0, 5000) : JSON.stringify(res.data).slice(0, 5000);
      scraped.push({ url: source.url, title: source.title, content });
    } catch (e: any) {
      log({ phase: "error", message: `Failed to read ${host}: ${e.message}` });
      // Use snippet as fallback
      if (source.snippet) {
        scraped.push({ url: source.url, title: source.title, content: source.snippet });
      }
    }
  }

  return scraped;
}

// ─── Phase 4 + 5 – Analysis & Verdict ────────────────────────────────────────

async function analyzeAndVerdict(
  claim: string,
  scrapedDocs: { url: string; title: string; content: string }[],
  sources: Source[],
  log: LogCallback
): Promise<ResearchVerdict> {
  log({ phase: "analyzing", message: `Cross-referencing ${scrapedDocs.length} sources for contradictions…` });

  if (scrapedDocs.length === 0) {
    log({ phase: "error", message: "No content was scraped. Returning unverified verdict." });
    return {
      truthScore: 0, label: "UNVERIFIED", summary: "No content could be scraped to analyze.",
      keyFindings: [], contradictions: [], sources,
    };
  }

  const docsBlock = scrapedDocs.map((d, i) =>
    `--- SOURCE ${i + 1} ---\nURL: ${d.url}\nTITLE: ${d.title}\nCONTENT:\n${d.content}`
  ).join("\n\n");

  const prompt = `You are a senior fact-checker at a world-class investigative journalism outlet. 
Analyze the following scraped sources in relation to this claim: "${claim}"

${docsBlock}

Your tasks:
1. Find any direct contradictions between sources (e.g., different dates, different actors, conflicting numbers).
2. Check if the claim is supported, refuted, exaggerated, or taken out of context.
3. Assess the authority/credibility of sources found.
4. Produce a final verdict.

Return ONLY valid JSON with this exact schema:
{
  "truthScore": <integer 0-100>,
  "label": <one of: "TRUE" | "MOSTLY TRUE" | "MISLEADING" | "MOSTLY FALSE" | "FALSE" | "UNVERIFIED">,
  "summary": "<2-3 sentence plain-language summary of findings>",
  "keyFindings": ["<specific finding 1>", "<specific finding 2>", "<specific finding 3>"],
  "contradictions": ["<contradiction or context issue 1>", "<contradiction or context issue 2>"]
}

truthScore rules: 0-20=FALSE, 21-40=MOSTLY FALSE, 41-60=MISLEADING or UNVERIFIED, 61-80=MOSTLY TRUE, 81-100=TRUE.`;

  log({ phase: "analyzing", message: `Passing batch evidence to Gemini 2.0 Flash for final verdict…` });

  let parsed: Omit<ResearchVerdict, "sources">;
  try {
    parsed = await geminiWithRetry<Omit<ResearchVerdict, "sources">>(prompt);
    log({ phase: "verdict", message: `Verdict: ${parsed.label} (${parsed.truthScore}% truth score)` });
    if (parsed.contradictions?.length) {
      parsed.contradictions.forEach(c => log({ phase: "analyzing", message: `Contradiction found: ${c}` }));
    }
  } catch (e: any) {
    log({ phase: "error", message: `Failed to parse Gemini verdict: ${e.message}` });
    parsed = {
      truthScore: 50, label: "UNVERIFIED",
      summary: "The analysis could not be fully completed due to a parsing error.",
      keyFindings: [], contradictions: [],
    };
  }

  return { ...parsed, sources };
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export async function runResearch(claim: string, log: LogCallback): Promise<ResearchVerdict> {
  // Phase 1
  const queries = await deconstruct(claim, log);

  // Throttling for Free Tier
  log({ phase: "planning", message: "Cooling down API (4s delay)..." });
  await delay(4000);

  // Phase 2
  const sources = await search(queries, log);

  // Phase 3
  const scraped = await scrape(sources, log);

  // Throttling for Free Tier before final analysis
  log({ phase: "analyzing", message: "Cooling down API (4s delay)..." });
  await delay(4000);

  // Phase 4 + 5
  return analyzeAndVerdict(claim, scraped, sources, log);
}
