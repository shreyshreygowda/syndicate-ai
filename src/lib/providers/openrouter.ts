import type { ChatMessage, ModelInfo, StreamChunk } from "@/types";
import type { LLMProvider } from "./types";
import { getApiKey } from "@/lib/settings";
import { streamOpenAICompatible } from "./stream";

export const OPENROUTER_MODELS: ModelInfo[] = [
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "openrouter",
    description: "Anthropic's latest Sonnet",
    region: "US",
    contextWindow: 200000,
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "openrouter",
    description: "Fast and capable Claude",
    region: "US",
    contextWindow: 200000,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openrouter",
    description: "OpenAI's flagship model",
    region: "US",
    contextWindow: 128000,
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openrouter",
    description: "Fast and affordable GPT",
    region: "US",
    contextWindow: 128000,
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek Chat",
    provider: "openrouter",
    description: "DeepSeek via OpenRouter",
    region: "US",
    contextWindow: 64000,
  },
];

export class OpenRouterProvider implements LLMProvider {
  id = "openrouter";
  name = "OpenRouter";
  region = "US";

  isConfigured(): boolean {
    return !!getApiKey("openrouter");
  }

  listModels(): ModelInfo[] {
    return this.isConfigured() ? OPENROUTER_MODELS : [];
  }

  async *chat(
    messages: ChatMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncGenerator<StreamChunk> {
    const apiKey = getApiKey("openrouter");
    if (!apiKey) {
      throw new Error(
        "OpenRouter is not connected. Go to Setup and add your API key."
      );
    }

    yield* streamOpenAICompatible(
      "https://openrouter.ai/api/v1",
      apiKey,
      messages,
      model,
      options,
      {
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "Syndicate 708 AI",
      }
    );
  }
}

export async function testOpenRouterConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  const apiKey = getApiKey("openrouter");
  if (!apiKey) return { ok: false, message: "No API key saved" };

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) return { ok: true, message: "Connected successfully" };
    return { ok: false, message: `Connection failed (${response.status})` };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Connection failed",
    };
  }
}
