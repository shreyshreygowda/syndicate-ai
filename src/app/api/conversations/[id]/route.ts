import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { conversations, messages, documents } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const convo = await db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.id, id), eq(conversations.userId, session.user.id))
    )
    .get();

  if (!convo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  const docs = await db
    .select({
      id: documents.id,
      filename: documents.filename,
      mimeType: documents.mimeType,
      size: documents.size,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(eq(documents.conversationId, id));

  return NextResponse.json({ conversation: convo, messages: msgs, documents: docs });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const convo = await db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.id, id), eq(conversations.userId, session.user.id))
    )
    .get();

  if (!convo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title.trim() || "New Chat";
  if (body.model !== undefined) updates.model = body.model;
  if (body.provider !== undefined) updates.provider = body.provider;
  if (body.comparisonModels !== undefined) {
    updates.comparisonModels = JSON.stringify(body.comparisonModels);
  }

  await db
    .update(conversations)
    .set(updates)
    .where(eq(conversations.id, id));

  const updated = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .get();

  return NextResponse.json({ success: true, conversation: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const convo = await db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.id, id), eq(conversations.userId, session.user.id))
    )
    .get();

  if (!convo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(documents).where(eq(documents.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));

  return NextResponse.json({ success: true });
}
