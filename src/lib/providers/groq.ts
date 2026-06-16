import type { ChatMessage, ModelInfo, StreamChunk } from "@/types";
import type { LLMProvider } from "./types";
import { getApiKey } from "@/lib/settings";
import { streamOpenAICompatible } from "./stream";

export const GROQ_MODELS: ModelInfo[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "groq",
    description: "Fast Llama on Groq hardware",
    region: "US",
    contextWindow: 128000,
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "groq",
    description: "Very fast, good for quick tasks",
    region: "US",
    contextWindow: 128000,
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    provider: "groq",
    description: "Mistral Mixtral on Groq",
    region: "US",
    contextWindow: 32768,
  },
];

export class GroqProvider implements LLMProvider {
  id = "groq";
  name = "Groq";
  region = "US";

  isConfigured(): boolean {
    return !!getApiKey("groq");
  }

  listModels(): ModelInfo[] {
    return this.isConfigured() ? GROQ_MODELS : [];
  }

  async *chat(
    messages: ChatMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncGenerator<StreamChunk> {
    const apiKey = getApiKey("groq");
    if (!apiKey) {
      throw new Error(
        "Groq is not connected. Go to Setup and add your API key."
      );
    }

    yield* streamOpenAICompatible(
      "https://api.groq.com/openai/v1",
      apiKey,
      messages,
      model,
      options
    );
  }
}

export async function testGroqConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  const apiKey = getApiKey("groq");
  if (!apiKey) return { ok: false, message: "No API key saved" };

  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
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
