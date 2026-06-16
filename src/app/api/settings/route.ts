import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, initDatabase } from "@/lib/db";
import {
  getProviderStatus,
  setApiKey,
  removeApiKey,
} from "@/lib/settings";
import { PROVIDER_INFO } from "@/lib/provider-info";
import { testFireworksConnection } from "@/lib/providers/fireworks";
import { testOpenRouterConnection } from "@/lib/providers/openrouter";
import { testGroqConnection } from "@/lib/providers/groq";
import { getAllModels, hasAnyProviderConfigured } from "@/lib/providers";

const TEST_FNS: Record<
  string,
  () => Promise<{ ok: boolean; message: string }>
> = {
  fireworks: testFireworksConnection,
  openrouter: testOpenRouterConnection,
  groq: testGroqConnection,
};

initDatabase();

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    providers: getProviderStatus(),
    providerInfo: PROVIDER_INFO,
    modelsAvailable: getAllModels().length,
    anyConfigured: hasAnyProviderConfigured(),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { provider, apiKey, action } = body;

  if (!provider || !["fireworks", "openrouter", "groq"].includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  if (action === "remove") {
    removeApiKey(provider);
    return NextResponse.json({ success: true, providers: getProviderStatus() });
  }

  if (action === "test") {
    const testFn = TEST_FNS[provider];
    const result = await testFn();
    return NextResponse.json(result);
  }

  if (!apiKey || typeof apiKey !== "string" || apiKey.length < 8) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 400 });
  }

  setApiKey(provider, apiKey.trim());

  const testFn = TEST_FNS[provider];
  const testResult = await testFn();

  return NextResponse.json({
    success: true,
    test: testResult,
    providers: getProviderStatus(),
    modelsAvailable: getAllModels().length,
  });
}
