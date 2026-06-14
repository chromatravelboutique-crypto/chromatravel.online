import type { AIProvider, AICompletionOptions, AICompletionResult } from "./provider";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    const messages = options.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const body = {
      model: options.model || "gpt-4o",
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature ?? 0.7,
      messages,
      ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);

    const response = await res.json() as {
      choices: { message: { content: string } }[];
      model: string;
      usage?: { total_tokens?: number };
    };

    const choice = response.choices[0];
    return {
      content: choice?.message?.content || "",
      model: response.model,
      provider: "openai",
      tokensUsed: response.usage?.total_tokens,
      isMock: false,
    };
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
