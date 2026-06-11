export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description?: string;
  region?: string;
  contextWindow?: number;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyEnv: string;
  region: string;
}
