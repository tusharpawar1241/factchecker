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
  truthScore: number;
  label: "TRUE" | "MOSTLY TRUE" | "MISLEADING" | "MOSTLY FALSE" | "FALSE" | "UNVERIFIED";
  summary: string;
  keyFindings: string[];
  contradictions: string[];
  sources: Source[];
}

export type LogCallback = (entry: Omit<LogEntry, "id" | "timestamp">) => void;

// ─── Key helpers (No-ops, retained for compatibility) ──────────────────────

export function getKeys() {
  return { groq: "", tavily: "", jina: "" };
}

export function saveKeys(keys: { groq: string; tavily: string; jina: string }) {}

export function missingKeys(): string[] {
  return [];
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export async function runResearch(claim: string, log: LogCallback): Promise<ResearchVerdict> {
  log({ phase: "planning", message: "Connecting to secure backend..." });

  const response = await fetch("/api/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ claim }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `HTTP Error ${response.status}`);
  }

  if (!response.body) {
    throw new Error("No response body received.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  return new Promise((resolve, reject) => {
    let resolvedVerdict: ResearchVerdict | null = null;

    function processStream() {
      reader.read().then(({ done, value }) => {
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          let boundary = buffer.indexOf("\n\n");
          while (boundary !== -1) {
            const chunk = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            if (chunk.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(chunk.slice(6));
                if (parsed.type === "log") {
                  log(parsed.data);
                } else if (parsed.type === "verdict") {
                  resolvedVerdict = parsed.data;
                } else if (parsed.type === "error") {
                  reject(new Error(parsed.data));
                  return;
                }
              } catch (e) {
                console.error("Failed to parse chunk", chunk);
              }
            }
            boundary = buffer.indexOf("\n\n");
          }
        }

        if (done) {
          if (resolvedVerdict) {
            resolve(resolvedVerdict);
          } else {
            reject(new Error("Stream ended without returning a verdict."));
          }
        } else {
          processStream();
        }
      }).catch(err => {
        reject(err);
      });
    }

    processStream();
  });
}
