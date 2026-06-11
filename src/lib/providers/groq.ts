import type { ChatMessage, ModelInfo, StreamChunk } from "@/types";
import type { LLMProvider } from "./types";

const GROQ_MODELS: ModelInfo[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "groq",
    description: "Meta Llama 3.3 70B on Groq LPU",
    region: "US",
    contextWindow: 128000,
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "groq",
    description: "Fast Llama 3.1 8B on Groq",
    region: "US",
    contextWindow: 128000,
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    provider: "groq",
    description: "Mistral Mixtral 8x7B on Groq",
    region: "US",
    contextWindow: 32768,
  },
];

export class GroqProvider implements LLMProvider {
  id = "groq";
  name = "Groq";
  region = "US";

  isConfigured(): boolean {
    return !!process.env.GROQ_API_KEY;
  }

  listModels(): ModelInfo[] {
    return this.isConfigured() ? GROQ_MODELS : [];
  }

  async *chat(
    messages: ChatMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncGenerator<StreamChunk> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
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
      throw new Error(`Groq API error: ${response.status} — ${error}`);
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
