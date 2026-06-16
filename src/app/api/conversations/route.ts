import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, initDatabase } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getDefaultModel } from "@/lib/providers";

initDatabase();

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convos = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, session.user.id))
    .orderBy(desc(conversations.updatedAt));

  // Hide comparison sessions from saved chat list
  const saved = convos.filter((c) => !c.isComparison);

  return NextResponse.json(saved);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const defaults = getDefaultModel();
  const now = new Date();

  const convo = {
    id: uuid(),
    userId: session.user.id,
    title: body.title || "New Chat",
    model: body.model || defaults.model,
    provider: body.provider || defaults.provider,
    isComparison: body.isComparison || false,
    comparisonModels: body.comparisonModels
      ? JSON.stringify(body.comparisonModels)
      : null,
    shareToken: null,
    isShared: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(conversations).values(convo);
  return NextResponse.json(convo);
}
