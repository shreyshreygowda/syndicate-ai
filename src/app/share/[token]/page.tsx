"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { formatDate } from "@/lib/utils";

interface SharedData {
  conversation: {
    id: string;
    title: string;
    model: string;
    provider: string;
    createdAt: string;
  };
  messages: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    model?: string | null;
    provider?: string | null;
  }[];
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("This shared conversation was not found or has been revoked."));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center p-4">
        <div className="text-center">
          <Logo size="md" className="justify-center mb-4" />
          <p className="text-syndicate-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="text-syndicate-muted text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg">
      <header className="bg-syndicate-charcoal text-white px-6 py-4 flex items-center justify-between">
        <Logo size="sm" showText />
        <span className="text-xs font-mono text-syndicate-muted">
          Shared Conversation
        </span>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-1">{data.conversation.title}</h1>
        <p className="text-xs text-syndicate-muted mb-6">
          {formatDate(data.conversation.createdAt)}
        </p>

        <div className="bg-white border border-syndicate-light-gray rounded-lg p-6">
          {data.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              model={msg.model}
              provider={msg.provider}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
