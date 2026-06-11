import type { ChatMessage, ModelInfo, StreamChunk } from "@/types";
import type { LLMProvider } from "./types";

const FIREWORKS_MODELS: ModelInfo[] = [
  {
    id: "accounts/fireworks/models/kimi-k2-instruct",
    name: "Kimi K2",
    provider: "fireworks",
    description: "Moonshot AI — Chinese-developed, US-hosted via Fireworks",
    region: "US",
    contextWindow: 128000,
  },
  {
    id: "accounts/fireworks/models/deepseek-v3",
    name: "DeepSeek V3",
    provider: "fireworks",
    description: "DeepSeek — Chinese-developed, US-hosted via Fireworks",
    region: "US",
    contextWindow: 128000,
  },
  {
    id: "accounts/fireworks/models/qwen2p5-72b-instruct",
    name: "Qwen 2.5 72B",
    provider: "fireworks",
    description: "Alibaba Qwen — Chinese-developed, US-hosted via Fireworks",
    region: "US",
    contextWindow: 32768,
  },
  {
    id: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "fireworks",
    description: "Meta Llama 3.3 70B Instruct",
    region: "US",
    contextWindow: 131072,
  },
  {
    id: "accounts/fireworks/models/mixtral-8x22b-instruct",
    name: "Mixtral 8x22B",
    provider: "fireworks",
    description: "Mistral Mixtral 8x22B Instruct",
    region: "US",
    contextWindow: 65536,
  },
];

export class FireworksProvider implements LLMProvider {
  id = "fireworks";
  name = "Fireworks AI";
  region = "US";

  isConfigured(): boolean {
    return !!process.env.FIREWORKS_API_KEY;
  }

  listModels(): ModelInfo[] {
    return this.isConfigured() ? FIREWORKS_MODELS : [];
  }

  async *chat(
    messages: ChatMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncGenerator<StreamChunk> {
    const apiKey = process.env.FIREWORKS_API_KEY;
    if (!apiKey) throw new Error("FIREWORKS_API_KEY not configured");

    const response = await fetch(
      "https://api.fireworks.ai/inference/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
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
      throw new Error(`Fireworks API error: ${response.status} — ${error}`);
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
