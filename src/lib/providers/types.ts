import type { ChatMessage, ModelInfo, StreamChunk } from "@/types";

export interface LLMProvider {
  id: string;
  name: string;
  region: string;
  isConfigured(): boolean;
  listModels(): ModelInfo[];
  chat(
    messages: ChatMessage[],
    model: string,
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncGenerator<StreamChunk>;
}

export interface ProviderChatOptions {
  temperature?: number;
  maxTokens?: number;
}
