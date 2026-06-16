import { ChatView } from "@/components/chat/ChatView";
import { getAllModels } from "@/lib/providers";
import { db } from "@/lib/db";
import { conversations, messages, documents } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { notFound } from "next/navigation";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user) notFound();

  const { id } = await params;

  const convo = await db
    .select()
    .from(conversations)
    .where(
      and(eq(conversations.id, id), eq(conversations.userId, session.user.id))
    )
    .get();

  if (!convo) notFound();

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  const docs = await db
    .select({
      id: documents.id,
      filename: documents.filename,
      size: documents.size,
    })
    .from(documents)
    .where(eq(documents.conversationId, id));

  const models = getAllModels();

  const typedMessages = msgs.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
    model: m.model,
    provider: m.provider,
  }));

  const comparisonModels = convo.comparisonModels
    ? (JSON.parse(convo.comparisonModels) as { provider: string; model: string }[])
    : [];

  return (
    <ChatView
      conversationId={id}
      initialTitle={convo.title}
      initialMessages={typedMessages}
      initialDocuments={docs}
      initialProvider={convo.provider}
      initialModel={convo.model}
      initialComparisonModels={comparisonModels}
      models={models}
      compareMode={convo.isComparison ?? false}
    />
  );
}
