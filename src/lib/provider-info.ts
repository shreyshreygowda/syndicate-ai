export const PROVIDER_INFO = {
  fireworks: {
    name: "Fireworks AI",
    description: "Best for Kimi, DeepSeek, and Qwen (US-hosted)",
    keyUrl: "https://fireworks.ai/account/api-keys",
    keyPrefix: "fw_",
    recommended: true,
  },
  openrouter: {
    name: "OpenRouter",
    description: "Access Claude, GPT-4o, and more through one key",
    keyUrl: "https://openrouter.ai/keys",
    keyPrefix: "sk-or-",
    recommended: false,
  },
  groq: {
    name: "Groq",
    description: "Ultra-fast Llama and Mixtral models",
    keyUrl: "https://console.groq.com/keys",
    keyPrefix: "gsk_",
    recommended: false,
  },
} as const;

export const PROVIDER_ORDER = ["fireworks", "openrouter", "groq"] as const;

export type ProviderId = (typeof PROVIDER_ORDER)[number];
