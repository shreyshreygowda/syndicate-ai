"use client";

import { useState, useEffect } from "react";
import { ChatView } from "@/components/chat/ChatView";
import type { ModelInfo } from "@/types";

const COMPARE_SESSION_KEY = "s708_compare_convo_id";

export default function ComparePage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const modelsRes = await fetch("/api/models");
      const modelsData = await modelsRes.json();
      setModels(modelsData.models || []);

      const existingId = sessionStorage.getItem(COMPARE_SESSION_KEY);
      if (existingId) {
        const check = await fetch(`/api/conversations/${existingId}`);
        if (check.ok) {
          setConversationId(existingId);
          setLoading(false);
          return;
        }
        sessionStorage.removeItem(COMPARE_SESSION_KEY);
      }

      const convoRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Model Comparison",
          isComparison: true,
        }),
      });
      const convo = await convoRes.json();
      sessionStorage.setItem(COMPARE_SESSION_KEY, convo.id);
      setConversationId(convo.id);
      setLoading(false);
    }
    init();
  }, []);

  if (loading || !conversationId) {
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
      conversationId={conversationId}
      initialMessages={[]}
      initialDocuments={[]}
      initialProvider={models[0]?.provider || "fireworks"}
      initialModel={models[0]?.id || ""}
      models={models}
      compareMode
    />
  );
}
