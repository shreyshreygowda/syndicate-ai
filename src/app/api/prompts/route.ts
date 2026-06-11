import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { savedPrompts } from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prompts = await db
    .select()
    .from(savedPrompts)
    .where(
      or(
        eq(savedPrompts.userId, session.user.id),
        eq(savedPrompts.isShared, true)
      )
    )
    .orderBy(desc(savedPrompts.updatedAt));

  return NextResponse.json(prompts);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const now = new Date();

  const prompt = {
    id: uuid(),
    userId: session.user.id,
    title: body.title,
    description: body.description || null,
    content: body.content,
    category: body.category || "general",
    tags: body.tags ? JSON.stringify(body.tags) : null,
    isShared: body.isShared || false,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(savedPrompts).values(prompt);
  return NextResponse.json(prompt);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  const existing = await db
    .select()
    .from(savedPrompts)
    .where(eq(savedPrompts.id, id))
    .get();

  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.tags !== undefined) updateData.tags = JSON.stringify(updates.tags);
  if (updates.isShared !== undefined) updateData.isShared = updates.isShared;

  await db.update(savedPrompts).set(updateData).where(eq(savedPrompts.id, id));
  return NextResponse.json({ success: true });
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

  const existing = await db
    .select()
    .from(savedPrompts)
    .where(eq(savedPrompts.id, id))
    .get();

  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(savedPrompts).where(eq(savedPrompts.id, id));
  return NextResponse.json({ success: true });
}
