"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ChatHomeProps {
  onNewChat: () => void;
  hasModels: boolean;
}

export function ChatHome({ onNewChat, hasModels }: ChatHomeProps) {
  const [creating, setCreating] = useState(false);

  async function handleNewChat() {
    setCreating(true);
    try {
      await onNewChat();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 grid-bg">
      <div className="text-center max-w-lg">
        <h1 className="text-3xl font-bold mb-2">
          Syndicate <span className="text-syndicate-blue">708</span> AI
        </h1>
        <p className="text-syndicate-muted text-sm mb-8">
          Secure multi-model AI. All traffic runs through US-based servers.
        </p>

        {!hasModels ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6 text-left">
            <p className="font-semibold text-amber-900 mb-2">
              One-time setup required
            </p>
            <p className="text-sm text-amber-800 mb-4">
              Before you can chat, connect at least one AI service by pasting an
              API key. It takes about 2 minutes — no technical knowledge needed.
            </p>
            <Link href="/settings">
              <Button className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Go to Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <Button
            size="lg"
            onClick={handleNewChat}
            disabled={creating}
            className="mb-4"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            {creating ? "Starting…" : "Start New Chat"}
          </Button>
        )}

        <p className="text-xs text-syndicate-muted">
          Select a saved chat from the sidebar, or click New Chat above.
        </p>
      </div>
    </div>
  );
}
