import type { ChatMessage, ModelInfo, StreamChunk } from "@/types";
import type { LLMProvider } from "./types";
import { getApiKey } from "@/lib/settings";
import { streamOpenAICompatible } from "./stream";

export const FIREWORKS_MODELS: ModelInfo[] = [
  {
    id: "accounts/fireworks/models/kimi-k2-instruct",
    name: "Kimi K2",
    provider: "fireworks",
    description: "Moonshot AI — great for long documents",
    region: "US",
    contextWindow: 128000,
  },
  {
    id: "accounts/fireworks/models/deepseek-v3",
    name: "DeepSeek V3",
    provider: "fireworks",
    description: "Strong reasoning and coding",
    region: "US",
    contextWindow: 128000,
  },
  {
    id: "accounts/fireworks/models/qwen2p5-72b-instruct",
    name: "Qwen 2.5 72B",
    provider: "fireworks",
    description: "Alibaba Qwen — multilingual",
    region: "US",
    contextWindow: 32768,
  },
  {
    id: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "fireworks",
    description: "Meta Llama — general purpose",
    region: "US",
    contextWindow: 131072,
  },
  {
    id: "accounts/fireworks/models/mixtral-8x22b-instruct",
    name: "Mixtral 8x22B",
    provider: "fireworks",
    description: "Mistral Mixtral — fast and capable",
    region: "US",
    contextWindow: 65536,
  },
];

export class FireworksProvider implements LLMProvider {
  id = "fireworks";
  name = "Fireworks AI";
  region = "US";

  isConfigured(): boolean {
    return !!getApiKey("fireworks");
  }

  listModels(): ModelInfo[] {
    return this.isConfigured() ? FIREWORKS_MODELS : [];
  }

  async *chat(
    messages: ChatMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncGenerator<StreamChunk> {
    const apiKey = getApiKey("fireworks");
    if (!apiKey) {
      throw new Error(
        "Fireworks is not connected. Go to Setup and add your API key."
      );
    }

    yield* streamOpenAICompatible(
      "https://api.fireworks.ai/inference/v1",
      apiKey,
      messages,
      model,
      options
    );
  }
}

export async function testFireworksConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  const apiKey = getApiKey("fireworks");
  if (!apiKey) return { ok: false, message: "No API key saved" };

  try {
    const response = await fetch(
      "https://api.fireworks.ai/inference/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 5,
        }),
      }
    );

    if (response.ok) return { ok: true, message: "Connected successfully" };
    const err = await response.text();
    return { ok: false, message: `Connection failed: ${err.slice(0, 150)}` };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Connection failed",
    };
  }
}
