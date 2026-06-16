import type { ModelInfo } from "@/types";
import type { LLMProvider } from "./types";
import { FireworksProvider } from "./fireworks";
import { OpenRouterProvider } from "./openrouter";
import { GroqProvider } from "./groq";
import { db } from "@/lib/db";
import { customModels } from "@/lib/db/schema";
import { getApiKey } from "@/lib/settings";

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

function getCustomModelList(): ModelInfo[] {
  const customs = db.select().from(customModels).all();
  return customs
    .filter((m) => getProvider(m.provider)?.isConfigured())
    .map((m) => ({
      id: m.modelId,
      name: m.name,
      provider: m.provider,
      description: m.description || "Custom model",
      region: "US",
    }));
}

export function getAllModels(): ModelInfo[] {
  const builtIn = providers.flatMap((p) => p.listModels());
  const custom = getCustomModelList();
  return [...builtIn, ...custom];
}

export function getModel(
  providerId: string,
  modelId: string
): ModelInfo | undefined {
  return getAllModels().find(
    (m) => m.id === modelId && m.provider === providerId
  );
}

export function getDefaultModel(): { provider: string; model: string } {
  const all = getAllModels();
  if (all.length > 0) {
    return { provider: all[0].provider, model: all[0].id };
  }
  return {
    provider: "fireworks",
    model: "accounts/fireworks/models/kimi-k2-instruct",
  };
}

export function hasAnyProviderConfigured(): boolean {
  return getConfiguredProviders().length > 0;
}

export { type LLMProvider } from "./types";
