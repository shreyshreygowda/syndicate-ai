"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  MessageSquare,
  BookOpen,
  Columns,
  Trash2,
  Share2,
  LogOut,
  Shield,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn, formatDate, truncate } from "@/lib/utils";
import type { Conversation } from "@/lib/db/schema";

interface SidebarProps {
  conversations: Conversation[];
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onShareChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  userName: string;
  authDisabled?: boolean;
}

export function Sidebar({
  conversations,
  onNewChat,
  onDeleteChat,
  onShareChat,
  onRenameChat,
  userName,
  authDisabled,
}: SidebarProps) {
  const pathname = usePathname();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const navItems = [
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/compare", label: "Compare", icon: Columns },
    { href: "/prompts", label: "Prompts", icon: BookOpen },
    { href: "/settings", label: "Setup", icon: Shield },
  ];

  function startRename(convo: Conversation) {
    setRenamingId(convo.id);
    setRenameDraft(convo.title);
  }

  async function saveRename(id: string) {
    const trimmed = renameDraft.trim() || "New Chat";
    await onRenameChat(id, trimmed);
    setRenamingId(null);
    setRenameDraft("");
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameDraft("");
  }

  function getChatHref(convo: Conversation) {
    return convo.isComparison ? `/chat/${convo.id}` : `/chat/${convo.id}`;
  }

  function isChatActive(convo: Conversation) {
    return pathname === `/chat/${convo.id}`;
  }

  return (
    <aside className="w-72 bg-white border-r border-syndicate-light-gray flex flex-col h-full">
      <div className="p-4 border-b border-syndicate-light-gray">
        <Logo size="sm" />
      </div>

      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-syndicate-blue text-white rounded-md text-sm font-medium hover:bg-syndicate-blue-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <nav className="px-3 pb-2 flex gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/chat"
              ? pathname === "/chat" || pathname.startsWith("/chat/")
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-colors",
                active
                  ? "text-syndicate-blue bg-syndicate-blue/5"
                  : "text-syndicate-muted hover:text-syndicate-slate hover:bg-syndicate-off-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 overflow-y-auto px-3">
        <div className="text-xs font-semibold uppercase tracking-widest text-syndicate-muted px-2 py-2">
          Saved Chats
        </div>
        {conversations.length === 0 ? (
          <p className="text-xs text-syndicate-muted px-2 py-4 text-center">
            No conversations yet
          </p>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((convo) => {
              const active = isChatActive(convo);
              const isRenaming = renamingId === convo.id;

              return (
                <div
                  key={convo.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredId(convo.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {isRenaming ? (
                    <div className="px-2 py-2 rounded-md bg-syndicate-off-white">
                      <input
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(convo.id);
                          if (e.key === "Escape") cancelRename();
                        }}
                        autoFocus
                        className="w-full text-sm border border-syndicate-blue rounded px-2 py-1 mb-1.5 focus:outline-none"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => saveRename(convo.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1 text-xs bg-syndicate-blue text-white rounded"
                        >
                          <Check className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={cancelRename}
                          className="px-2 py-1 text-xs text-syndicate-muted hover:bg-white rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={getChatHref(convo)}
                      className={cn(
                        "block px-3 py-2.5 rounded-md text-sm transition-colors",
                        active
                          ? "bg-syndicate-blue/10 text-syndicate-blue font-medium"
                          : "text-syndicate-slate hover:bg-syndicate-off-white"
                      )}
                    >
                      <div className="font-medium truncate pr-16 flex items-center gap-1.5">
                        <span className="truncate">
                          {truncate(convo.title, 26)}
                        </span>
                        {convo.isComparison && (
                          <span className="text-[10px] uppercase tracking-wider text-syndicate-blue bg-syndicate-blue/10 px-1 py-0.5 rounded shrink-0">
                            cmp
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-syndicate-muted mt-0.5">
                        {formatDate(convo.updatedAt)}
                      </div>
                    </Link>
                  )}
                  {hoveredId === convo.id && !isRenaming && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          startRename(convo);
                        }}
                        className="p-1 text-syndicate-muted hover:text-syndicate-blue rounded"
                        title="Rename"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onShareChat(convo.id);
                        }}
                        className="p-1 text-syndicate-muted hover:text-syndicate-blue rounded"
                        title="Share"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteChat(convo.id);
                        }}
                        className="p-1 text-syndicate-muted hover:text-red-500 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-syndicate-light-gray">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{userName}</div>
            <div className="text-xs text-syndicate-muted font-mono">
              US 708 • DEEP TECH
            </div>
          </div>
          {!authDisabled && (
            <button
              onClick={() => {
                import("next-auth/react").then(({ signOut }) =>
                  signOut({ callbackUrl: "/login" })
                );
              }}
              className="p-2 text-syndicate-muted hover:text-syndicate-slate rounded-md hover:bg-syndicate-off-white"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
