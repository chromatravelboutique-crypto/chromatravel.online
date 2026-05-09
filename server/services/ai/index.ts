import type { AIProvider, AICompletionOptions, AICompletionResult, AIMessage } from "./provider";
import { MockAIProvider } from "./mock-provider";
import { AnthropicProvider } from "./anthropic-provider";
import { OpenAIProvider } from "./openai-provider";

export type { AIProvider, AICompletionOptions, AICompletionResult, AIMessage };

type ProviderName = "anthropic" | "openai" | "mock" | "none";

class AIService {
  private provider: AIProvider;
  private providerName: ProviderName;

  constructor() {
    this.providerName = this.resolveProviderName();
    this.provider = this.createProvider();
    console.log(`[AI] Provider: ${this.providerName} (available: ${this.provider.isAvailable()})`);
  }

  private resolveProviderName(): ProviderName {
    const envProvider = (process.env.AI_PROVIDER || "none").toLowerCase() as ProviderName;
    const enabled = process.env.AI_ENABLED === "true";

    if (!enabled || envProvider === "none") {
      return "mock";
    }

    if (envProvider === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
    if (envProvider === "openai" && process.env.OPENAI_API_KEY) return "openai";

    return "mock";
  }

  private createProvider(): AIProvider {
    switch (this.providerName) {
      case "anthropic":
        return new AnthropicProvider(process.env.ANTHROPIC_API_KEY!);
      case "openai":
        return new OpenAIProvider(process.env.OPENAI_API_KEY!);
      default:
        return new MockAIProvider();
    }
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    try {
      return await this.provider.complete(options);
    } catch (error: any) {
      console.error(`[AI] Provider ${this.providerName} failed:`, error.message);
      console.log("[AI] Falling back to mock provider");
      const fallback = new MockAIProvider();
      return fallback.complete(options);
    }
  }

  getStatus() {
    return {
      provider: this.providerName,
      available: this.provider.isAvailable(),
      isMock: this.providerName === "mock",
      envVarsNeeded: this.providerName === "mock" ? [
        "AI_ENABLED=true",
        "AI_PROVIDER=anthropic|openai",
        "ANTHROPIC_API_KEY or OPENAI_API_KEY",
      ] : [],
    };
  }

  getProviderName(): string {
    return this.providerName;
  }

  isMock(): boolean {
    return this.providerName === "mock";
  }
}

export const aiService = new AIService();
export default aiService;
