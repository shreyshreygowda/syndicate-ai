"use client";

import { useState, useEffect, useRef } from "react";
import { ChatView } from "@/components/chat/ChatView";
import type { ModelInfo } from "@/types";

const COMPARE_SESSION_KEY = "s708_compare_convo_id";

interface LoadedChat {
  conversationId: string;
  title: string;
  messages: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    model?: string | null;
    provider?: string | null;
  }[];
  documents: { id: string; filename: string; size: number }[];
  provider: string;
  model: string;
  comparisonModels: { provider: string; model: string }[];
}

export default function ComparePage() {
  const [chatData, setChatData] = useState<LoadedChat | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function init() {
      const modelsRes = await fetch("/api/models");
      const modelsData = await modelsRes.json();
      setModels(modelsData.models || []);

      let conversationId = sessionStorage.getItem(COMPARE_SESSION_KEY);

      async function loadConversation(id: string) {
        const check = await fetch(`/api/conversations/${id}`);
        if (!check.ok) return false;

        const data = await check.json();
        const comparisonModels = data.conversation.comparisonModels
          ? JSON.parse(data.conversation.comparisonModels)
          : [];

        setChatData({
          conversationId: id,
          title: data.conversation.title,
          messages: data.messages.map(
            (m: {
              id: string;
              role: string;
              content: string;
              model?: string | null;
              provider?: string | null;
            }) => ({
              id: m.id,
              role: m.role as "user" | "assistant" | "system",
              content: m.content,
              model: m.model,
              provider: m.provider,
            })
          ),
          documents: data.documents,
          provider: data.conversation.provider,
          model: data.conversation.model,
          comparisonModels,
        });

        return true;
      }

      if (conversationId) {
        const ok = await loadConversation(conversationId);
        if (ok) {
          setLoading(false);
          return;
        }
        sessionStorage.removeItem(COMPARE_SESSION_KEY);
        conversationId = null;
      }

      const allConversationsRes = await fetch(
        "/api/conversations?includeComparison=true"
      );
      const allConversations = (await allConversationsRes.json()) as {
        id: string;
        title: string;
        provider: string;
        model: string;
        isComparison?: boolean;
      }[];

      const existingComparison = allConversations.find(
        (c) => c.isComparison
      );

      let comparisonId = existingComparison?.id;
      if (!comparisonId) {
        const convoRes = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Model Comparison",
            isComparison: true,
            singleton: true,
          }),
        });
        const convo = await convoRes.json();
        comparisonId = convo.id;
      }

      if (!comparisonId) {
        throw new Error("Failed to initialize comparison conversation");
      }

      sessionStorage.setItem(COMPARE_SESSION_KEY, comparisonId);
      const ok = await loadConversation(comparisonId);
      if (!ok) {
        throw new Error("Failed to load comparison conversation");
      }

      setLoading(false);
    }
    init();
  }, []);

  if (loading || !chatData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-syndicate-muted text-sm">
          Setting up comparison view…
        </div>
      </div>
    );
  }

  return (
    <ChatView
      conversationId={chatData.conversationId}
      initialTitle={chatData.title}
      initialMessages={chatData.messages}
      initialDocuments={chatData.documents}
      initialProvider={chatData.provider}
      initialModel={chatData.model}
      initialComparisonModels={chatData.comparisonModels}
      models={models}
      compareMode
    />
  );
}
