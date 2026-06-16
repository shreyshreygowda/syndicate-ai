import { db } from "./db";
import { appSettings } from "./db/schema";
import { eq } from "drizzle-orm";

const ENV_KEY_MAP: Record<string, string> = {
  fireworks: "FIREWORKS_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  groq: "GROQ_API_KEY",
};

const PLACEHOLDER_PATTERN = /x{4,}|your[_-]?key|sk-xxx|fw_xxx|gsk_xxx/i;

function isRealKey(key: string | undefined): key is string {
  if (!key || key.trim().length < 8) return false;
  return !PLACEHOLDER_PATTERN.test(key);
}

export function getApiKey(provider: string): string | undefined {
  const settingKey = `api_key_${provider}`;
  const row = db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, settingKey))
    .get();

  if (row?.value && isRealKey(row.value)) {
    return row.value;
  }

  const envVar = ENV_KEY_MAP[provider];
  if (envVar && isRealKey(process.env[envVar])) {
    return process.env[envVar];
  }

  return undefined;
}

export function setApiKey(provider: string, apiKey: string) {
  const settingKey = `api_key_${provider}`;
  db.insert(appSettings)
    .values({ key: settingKey, value: apiKey })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: apiKey },
    })
    .run();
}

export function removeApiKey(provider: string) {
  db.delete(appSettings)
    .where(eq(appSettings.key, `api_key_${provider}`))
    .run();
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}

export function getProviderStatus(): Record<
  string,
  { configured: boolean; maskedKey?: string }
> {
  const providers = ["fireworks", "openrouter", "groq"];
  const status: Record<string, { configured: boolean; maskedKey?: string }> = {};

  for (const p of providers) {
    const key = getApiKey(p);
    status[p] = {
      configured: !!key,
      maskedKey: key ? maskApiKey(key) : undefined,
    };
  }

  return status;
}

import { PROVIDER_INFO, PROVIDER_ORDER } from "./provider-info";

export { PROVIDER_INFO, PROVIDER_ORDER } from "./provider-info";
