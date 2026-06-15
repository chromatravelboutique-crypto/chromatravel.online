/**
 * Direct Claude API caller for Fase 5 AI features.
 * Uses ANTHROPIC_API_KEY directly — does NOT require AI_ENABLED/AI_PROVIDER env vars.
 * Falls back to null when key is absent (graceful degradation).
 */
const MODEL = "claude-haiku-4-5-20251001";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeCallOptions {
  system?: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
  temperature?: number;
}

export async function callClaude(opts: ClaudeCallOptions): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[claude] ANTHROPIC_API_KEY not set — skipping AI call");
    return null;
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature,
      ...(opts.system ? { system: opts.system } : {}),
      messages: opts.messages,
    });
    const block = response.content.find((b) => b.type === "text");
    return (block as any)?.text ?? null;
  } catch (err: any) {
    console.error("[claude] API error:", err.message);
    return null;
  }
}

/** Parse JSON from Claude output, stripping markdown fences if present. */
export function parseJsonSafe<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) as T : null;
  } catch {
    return null;
  }
}
