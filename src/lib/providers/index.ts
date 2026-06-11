import type { ModelInfo } from "@/types";
import type { LLMProvider } from "./types";
import { FireworksProvider } from "./fireworks";
import { OpenRouterProvider } from "./openrouter";
import { GroqProvider } from "./groq";

const providers: LLMProvider[] = [
  new FireworksProvider(),
  new OpenRouterProvider(),
  new GroqProvider(),
];

export function getProvider(id: string): LLMProvider | undefined {
  return providers.find((p) => p.id === id);
}

export function getAllProviders(): LLMProvider[] {
  return providers;
}

export function getConfiguredProviders(): LLMProvider[] {
  return providers.filter((p) => p.isConfigured());
}

export function getAllModels(): ModelInfo[] {
  return providers.flatMap((p) => p.listModels());
}

export function getModel(providerId: string, modelId: string): ModelInfo | undefined {
  const provider = getProvider(providerId);
  return provider?.listModels().find((m) => m.id === modelId);
}

export function getDefaultModel(): { provider: string; model: string } {
  const configured = getConfiguredProviders();
  if (configured.length === 0) {
    return {
      provider: "fireworks",
      model: "accounts/fireworks/models/kimi-k2-instruct",
    };
  }
  const first = configured[0];
  const models = first.listModels();
  return {
    provider: first.id,
    model: models[0]?.id || "",
  };
}

export { type LLMProvider } from "./types";
