"use client";

import { useState, useEffect } from "react";
import { ChatView } from "@/components/chat/ChatView";
import type { ModelInfo } from "@/types";

export default function ComparePage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const [modelsRes, convoRes] = await Promise.all([
        fetch("/api/models"),
        fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Model Comparison", isComparison: true }),
        }),
      ]);

      const modelsData = await modelsRes.json();
      const convo = await convoRes.json();

      setModels(modelsData.models);
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
