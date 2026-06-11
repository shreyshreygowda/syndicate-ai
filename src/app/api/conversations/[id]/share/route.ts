import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export async function POST(
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

  const shareToken = convo.shareToken || uuid();

  await db
    .update(conversations)
    .set({ shareToken, isShared: true, updatedAt: new Date() })
    .where(eq(conversations.id, id));

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return NextResponse.json({
    shareToken,
    shareUrl: `${baseUrl}/share/${shareToken}`,
  });
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

  await db
    .update(conversations)
    .set({ shareToken: null, isShared: false, updatedAt: new Date() })
    .where(
      and(eq(conversations.id, id), eq(conversations.userId, session.user.id))
    );

  return NextResponse.json({ success: true });
}
