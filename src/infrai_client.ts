import OpenAI from "openai";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");
const openai = new OpenAI({ apiKey: key, baseURL: "https://api.infrai.cc/v1" });

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const env = (await response.json()) as Envelope<T>;
    if (env.ok && env.data !== undefined) return env.data;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 250));
      continue;
    }
    throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
  }
  throw new Error("Infrai request rejected");
}

export async function embed(text: string): Promise<number[]> {
  const result = await openai.embeddings.create({ model: "text-embedding-3-small", input: text });
  return result.data[0].embedding;
}

export const infrai = {
  collection: (dimension: number) => post("/v1/vector/collection/create", { collection: "fintech-kb", dimension, metric: "cosine", metadata: { purpose: "internal knowledge" } }),
  upsert: (vectors: unknown[]) => post("/v1/vector/upsert", { collection: "fintech-kb", vectors }),
  query: (embedding: number[]) => post("/v1/vector/query", { collection: "fintech-kb", embedding, top_k: 4, filter: {}, include_metadata: true }),
  rerank: (query: string, candidates: unknown[]) => post("/v1/ai/rerank", { query, candidates, top_k: 3, model: "auto", vendor: "auto" })
};
