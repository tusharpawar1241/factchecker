import axios from "axios";

// ─── Key helpers ──────────────────────────────────────────────────────────────

function getKeys() {
  return {
    groq: process.env.GROQ_API_KEY,
    tavily: process.env.TAVILY_API_KEY,
    jina: process.env.JINA_API_KEY,
  };
}

// ─── Groq helper ────────────────────────────────────────────────────────────

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function groqWithRetry(prompt, retries = 2) {
  const { groq } = getKeys();
  if (!groq) throw new Error("Groq API key not set.");

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Authorization": `Bearer ${groq}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    const raw = res.data.choices[0].message.content.replace(/```json|```/g, "").trim();
    return JSON.parse(raw);
  } catch (err) {
    const is429 = err.response?.status === 429 || err.message?.includes("429");
    if (is429 && retries > 0) {
      await delay(2000 + Math.random() * 2000);
      return groqWithRetry(prompt, retries - 1);
    }
    throw err;
  }
}

// ─── Phase 1 – Deconstruction ─────────────────────────────────────────────────

async function deconstruct(claim, log) {
  log({ phase: "planning", message: `Deconstructing claim into search queries…` });

  const prompt = `You are an investigative journalist. A user submitted this news claim:
"${claim}"

Break this into exactly 3 specific, objective, and distinct search queries that would help verify it from different angles.
Return ONLY a valid JSON object with a single key "queries" containing an array of 3 strings. Example: {"queries": ["query1", "query2", "query3"]}`;

  try {
    const result = await groqWithRetry(prompt);
    const queries = result.queries || [];
    queries.forEach((q, i) => log({ phase: "planning", message: `Query ${i + 1}: "${q}"` }));
    return queries.slice(0, 3);
  } catch (e) {
    log({ phase: "error", message: `Planning failed: ${e.message}. Using fallback query.` });
    return [claim];
  }
}

// ─── Phase 2 – Live Search via Tavily ────────────────────────────────────────

async function search(queries, log) {
  const { tavily } = getKeys();
  if (!tavily) throw new Error("Tavily API key not set.");

  const allSources = [];

  for (const query of queries) {
    log({ phase: "searching", message: `Searching: "${query}"…` });
    try {
      const res = await axios.post(
        "https://api.tavily.com/search",
        { api_key: tavily, query, max_results: 3, search_depth: "advanced" },
        { timeout: 15000 }
      );
      const results = res.data.results || [];
      results.forEach((r) => {
        allSources.push({ url: r.url, title: r.title || r.url, snippet: r.content || "" });
        try {
          const host = new URL(r.url).hostname.replace("www.", "");
          log({ phase: "searching", message: `Found source: ${host}` });
        } catch { /* ignore */ }
      });
    } catch (e) {
      log({ phase: "error", message: `Search failed for "${query}": ${e.message}` });
    }
  }

  // Deduplicate by URL
  const seen = new Set();
  return allSources.filter((s) => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}

// ─── Phase 3 – Deep Scrape via Jina Reader ────────────────────────────────────

async function scrape(sources, log) {
  const { jina } = getKeys();
  
  const scrapeSource = async (source) => {
    let host = source.url;
    try { host = new URL(source.url).hostname.replace("www.", ""); } catch { /* ignore */ }
    log({ phase: "scraping", message: `Agent is reading article from ${host}…` });

    try {
      const headers = { Accept: "text/plain" };
      if (jina) headers["Authorization"] = `Bearer ${jina}`;

      const res = await axios.get(`https://r.jina.ai/${source.url}`, {
        headers,
        timeout: 45000,
        responseType: "text",
      });

      const content = typeof res.data === "string" ? res.data.slice(0, 4000) : JSON.stringify(res.data).slice(0, 4000);
      return { url: source.url, title: source.title, content };
    } catch (e) {
      log({ phase: "error", message: `Failed to read ${host}: ${e.message}` });
      // Use snippet as fallback
      if (source.snippet) {
        return { url: source.url, title: source.title, content: source.snippet };
      }
      return null;
    }
  };

  const results = await Promise.all(sources.map(scrapeSource));
  return results.filter((r) => r !== null);
}

// ─── Phase 4 + 5 – Analysis & Verdict ────────────────────────────────────────

async function analyzeAndVerdict(claim, scrapedDocs, sources, log) {
  log({ phase: "analyzing", message: `Cross-referencing ${scrapedDocs.length} sources for contradictions…` });

  if (scrapedDocs.length === 0) {
    log({ phase: "error", message: "No content was scraped. Returning unverified verdict." });
    return {
      truthScore: 0,
      label: "UNVERIFIED",
      summary: "No content could be scraped to analyze.",
      keyFindings: [],
      contradictions: [],
      sources,
    };
  }

  const generateBlock = (docs) =>
    docs.map((d, i) => `--- SOURCE ${i + 1} ---\nURL: ${d.url}\nTITLE: ${d.title}\nCONTENT:\n${d.content}`).join("\n\n");

  let docsBlock = generateBlock(scrapedDocs);

  if (docsBlock.length > 25000) {
    log({ phase: "analyzing", message: `Evidence too large (${docsBlock.length} chars). Pruning sources…` });
    let prunedDocs = [...scrapedDocs];
    while (docsBlock.length > 25000 && prunedDocs.length > 1) {
      prunedDocs.pop();
      docsBlock = generateBlock(prunedDocs);
    }
    if (docsBlock.length > 25000) {
      docsBlock = docsBlock.slice(0, 25000);
    }
  }

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

  log({ phase: "analyzing", message: `Passing batch evidence to Groq (Llama 3.3 70B) for final verdict…` });

  let parsed;
  try {
    parsed = await groqWithRetry(prompt);
    log({ phase: "verdict", message: `Verdict: ${parsed.label} (${parsed.truthScore}% truth score)` });
    if (parsed.contradictions?.length) {
      parsed.contradictions.forEach((c) => log({ phase: "analyzing", message: `Contradiction found: ${c}` }));
    }
  } catch (e) {
    log({ phase: "error", message: `Failed to parse Groq verdict: ${e.message}` });
    parsed = {
      truthScore: 50,
      label: "UNVERIFIED",
      summary: "The analysis could not be fully completed due to a parsing error.",
      keyFindings: [],
      contradictions: [],
    };
  }

  return { ...parsed, sources };
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { claim } = req.body;
  if (!claim) {
    return res.status(400).json({ error: "Claim is required" });
  }

  // Set headers for SSE (Server-Sent Events)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const log = (entry) => {
    res.write(`data: ${JSON.stringify({ type: "log", data: entry })}\n\n`);
  };

  try {
    const queries = await deconstruct(claim, log);
    const sources = await search(queries, log);
    const scraped = await scrape(sources, log);
    const verdict = await analyzeAndVerdict(claim, scraped, sources, log);

    res.write(`data: ${JSON.stringify({ type: "verdict", data: verdict })}\n\n`);
  } catch (error) {
    log({ phase: "error", message: `Pipeline failed: ${error.message}` });
    res.write(`data: ${JSON.stringify({ type: "error", data: error.message })}\n\n`);
  } finally {
    res.end();
  }
}
