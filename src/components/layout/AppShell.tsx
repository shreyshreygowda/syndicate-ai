"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ChatIndexPage } from "@/components/chat/ChatIndexPage";
import type { Conversation } from "@/lib/db/schema";

interface AppShellProps {
  children: React.ReactNode;
  userName: string;
  authDisabled?: boolean;
}

export function AppShell({ children, userName, authDisabled }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const isChatHome = pathname === "/chat";
  const isCompareRoute = pathname.startsWith("/compare");

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, pathname]);

  const handleNewChat = useCallback(async () => {
    const createComparison = isCompareRoute;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        createComparison
          ? { title: "Model Comparison", isComparison: true, singleton: true }
          : {}
      ),
    });
    const convo = await res.json();
    await fetchConversations();

    if (createComparison) {
      sessionStorage.setItem("s708_compare_convo_id", convo.id);
      router.push("/compare");
      return;
    }

    router.push(`/chat/${convo.id}`);
  }, [fetchConversations, isCompareRoute, router]);

  async function handleDeleteChat(id: string) {
    if (!confirm("Delete this conversation? This cannot be undone.")) return;

    const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete conversation.");
      return;
    }

    await fetchConversations();

    // If we deleted the chat we're viewing, go home
    if (pathname === `/chat/${id}` || pathname === "/compare") {
      if (pathname === "/compare") {
        sessionStorage.removeItem("s708_compare_convo_id");
      }
      router.push("/chat");
    }
  }

  async function handleShareChat(id: string) {
    const res = await fetch(`/api/conversations/${id}/share`, {
      method: "POST",
    });
    const data = await res.json();
    setShareUrl(data.shareUrl);
    navigator.clipboard.writeText(data.shareUrl);
  }

  async function handleRenameChat(id: string, title: string) {
    const res = await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      alert("Failed to rename conversation.");
      return;
    }
    await fetchConversations();
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        conversations={conversations}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onShareChat={handleShareChat}
        onRenameChat={handleRenameChat}
        userName={userName}
        authDisabled={authDisabled}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {isChatHome ? (
          <ChatIndexPage onNewChat={handleNewChat} />
        ) : (
          children
        )}
      </main>

      {shareUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-2">Share Link Copied</h3>
            <p className="text-sm text-syndicate-muted mb-4">
              Anyone with this link can view the conversation.
            </p>
            <input
              readOnly
              value={shareUrl}
              className="w-full px-3 py-2 border border-syndicate-light-gray rounded-md text-sm font-mono bg-syndicate-off-white mb-4"
            />
            <button
              onClick={() => setShareUrl(null)}
              className="w-full py-2 bg-syndicate-blue text-white rounded-md text-sm font-medium hover:bg-syndicate-blue-dark"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
