import { getSession } from "@/lib/auth/session";
import { db, initDatabase } from "@/lib/db";
import { conversations, messages, documents } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { getProvider } from "@/lib/providers";
import { buildDocumentContext } from "@/lib/documents";
import { generateTitle } from "@/lib/utils";
import type { ChatMessage } from "@/types";

initDatabase();

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const {
    conversationId,
    message,
    model,
    provider,
    comparisonModels,
  } = body;

  if (!conversationId || !message) {
    return new Response("Missing conversationId or message", { status: 400 });
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
    return new Response("Conversation not found", { status: 404 });
  }

  const userMessageId = uuid();
  await db.insert(messages).values({
    id: userMessageId,
    conversationId,
    role: "user",
    content: message,
    createdAt: new Date(),
  });

  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.conversationId, conversationId));

  const docContext = buildDocumentContext(docs);

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  const chatMessages: ChatMessage[] = history.map((m) => ({
    role: m.role as ChatMessage["role"],
    content: m.content,
  }));

  if (docContext && chatMessages.length === 1) {
    chatMessages.unshift({
      role: "system",
      content: `You are a helpful AI assistant for Syndicate 708.${docContext}`,
    });
  } else if (docContext) {
    const lastUser = chatMessages[chatMessages.length - 1];
    if (lastUser.role === "user") {
      lastUser.content += docContext;
    }
  }

  const activeProvider = provider || convo.provider;
  const activeModel = model || convo.model;

  const modelsToRun =
    comparisonModels && comparisonModels.length > 0
      ? comparisonModels
      : [{ provider: activeProvider, model: activeModel }];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const { provider: pId, model: mId } of modelsToRun) {
          const llmProvider = getProvider(pId);
          if (!llmProvider) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: `Provider ${pId} not found` })}\n\n`
              )
            );
            continue;
          }

          const assistantMessageId = uuid();
          let fullContent = "";

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "start", provider: pId, model: mId, messageId: assistantMessageId })}\n\n`
            )
          );

          for await (const chunk of llmProvider.chat(chatMessages, mId)) {
            if (chunk.content) {
              fullContent += chunk.content;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "chunk", provider: pId, model: mId, content: chunk.content })}\n\n`
                )
              );
            }
          }

          await db.insert(messages).values({
            id: assistantMessageId,
            conversationId,
            role: "assistant",
            content: fullContent,
            model: mId,
            provider: pId,
            createdAt: new Date(),
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", provider: pId, model: mId, messageId: assistantMessageId })}\n\n`
            )
          );
        }

        const isFirstMessage = history.length <= 1;
        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (isFirstMessage) {
          updates.title = generateTitle(message);
        }
        if (model) updates.model = model;
        if (provider) updates.provider = provider;

        await db
          .update(conversations)
          .set(updates)
          .where(eq(conversations.id, conversationId));

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
