import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getAllModels, getConfiguredProviders } from "@/lib/providers";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const models = getAllModels();
  const providers = getConfiguredProviders().map((p) => ({
    id: p.id,
    name: p.name,
    region: p.region,
  }));

  return NextResponse.json({ models, providers });
}
