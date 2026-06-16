import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, initDatabase } from "@/lib/db";
import { customModels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getProvider } from "@/lib/providers";

initDatabase();

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const models = db.select().from(customModels).all();
  return NextResponse.json(models);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, provider, modelId, description } = body;

  if (!name || !provider || !modelId) {
    return NextResponse.json(
      { error: "Name, provider, and model ID are required" },
      { status: 400 }
    );
  }

  const llmProvider = getProvider(provider);
  if (!llmProvider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  if (!llmProvider.isConfigured()) {
    return NextResponse.json(
      {
        error: `${llmProvider.name} is not connected. Add its API key in Setup first.`,
      },
      { status: 400 }
    );
  }

  const model = {
    id: uuid(),
    name: name.trim(),
    provider,
    modelId: modelId.trim(),
    description: description?.trim() || null,
    createdAt: new Date(),
  };

  db.insert(customModels).values(model).run();
  return NextResponse.json(model);
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  db.delete(customModels).where(eq(customModels.id, id)).run();
  return NextResponse.json({ success: true });
}
