import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const convo = await db
    .select()
    .from(conversations)
    .where(eq(conversations.shareToken, token))
    .get();

  if (!convo || !convo.isShared) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, convo.id))
    .orderBy(asc(messages.createdAt));

  return NextResponse.json({
    conversation: {
      id: convo.id,
      title: convo.title,
      model: convo.model,
      provider: convo.provider,
      createdAt: convo.createdAt,
    },
    messages: msgs,
  });
}
