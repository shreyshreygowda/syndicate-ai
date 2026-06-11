import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { documents, conversations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import {
  extractText,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/documents";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const conversationId = formData.get("conversationId") as string;

  if (!file || !conversationId) {
    return NextResponse.json(
      { error: "Missing file or conversationId" },
      { status: 400 }
    );
  }

  const convo = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, session.user.id)
      )
    )
    .get();

  if (!convo) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const mimeType = file.type || "text/plain";
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${mimeType}` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const content = await extractText(buffer, mimeType, file.name);

  const doc = {
    id: uuid(),
    conversationId,
    userId: session.user.id,
    filename: file.name,
    mimeType,
    size: file.size,
    content,
    createdAt: new Date(),
  };

  await db.insert(documents).values(doc);

  return NextResponse.json({
    id: doc.id,
    filename: doc.filename,
    mimeType: doc.mimeType,
    size: doc.size,
    createdAt: doc.createdAt,
  });
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

  const doc = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, session.user.id)))
    .get();

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(documents).where(eq(documents.id, id));
  return NextResponse.json({ success: true });
}
