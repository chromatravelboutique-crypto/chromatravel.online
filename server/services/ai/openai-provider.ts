import type { AIProvider, AICompletionOptions, AICompletionResult } from "./provider";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    // Use fetch directly instead of openai SDK
    const messages = options.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const response = await client.chat.completions.create({
      model: options.model || "gpt-4o",
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature ?? 0.7,
      messages,
      ...(options.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
    });

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
