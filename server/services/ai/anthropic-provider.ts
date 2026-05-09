import type { AIProvider, AICompletionOptions, AICompletionResult } from "./provider";

export class AnthropicProvider implements AIProvider {
  name = "anthropic";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: this.apiKey });

    const systemMsg = options.messages.find(m => m.role === "system");
    const chatMessages = options.messages
      .filter(m => m.role !== "system")
      .map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    if (chatMessages.length === 0) {
      chatMessages.push({ role: "user", content: "Hola" });
    }

    const response = await client.messages.create({
      model: options.model || "claude-sonnet-4-20250514",
      max_tokens: options.maxTokens || 1024,
      system: systemMsg?.content,
      messages: chatMessages,
    });

    const textBlock = response.content.find(b => b.type === "text");
    return {
      content: textBlock?.text || "",
      model: response.model,
      provider: "anthropic",
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      isMock: false,
    };
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}
