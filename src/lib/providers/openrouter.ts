import type { ChatMessage, ModelInfo, StreamChunk } from "@/types";
import type { LLMProvider } from "./types";

const OPENROUTER_MODELS: ModelInfo[] = [
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "openrouter",
    description: "Anthropic Claude Sonnet 4 via OpenRouter",
    region: "US",
    contextWindow: 200000,
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "openrouter",
    description: "Anthropic Claude 3.5 Sonnet via OpenRouter",
    region: "US",
    contextWindow: 200000,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openrouter",
    description: "OpenAI GPT-4o via OpenRouter",
    region: "US",
    contextWindow: 128000,
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openrouter",
    description: "OpenAI GPT-4o Mini via OpenRouter",
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
    return !!process.env.OPENROUTER_API_KEY;
  }

  listModels(): ModelInfo[] {
    return this.isConfigured() ? OPENROUTER_MODELS : [];
  }

  async *chat(
    messages: ChatMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncGenerator<StreamChunk> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
          "X-Title": "Syndicate 708 AI",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 4096,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} — ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") {
          yield { content: "", done: true };
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || "";
          if (content) yield { content, done: false };
        } catch {
          // skip malformed chunks
        }
      }
    }
    yield { content: "", done: true };
  }
}
