"use client";

import { useState, useEffect } from "react";
import { ChatHome } from "@/components/chat/ChatHome";

interface ChatIndexPageProps {
  onNewChat: () => Promise<void>;
}

export function ChatIndexPage({ onNewChat }: ChatIndexPageProps) {
  const [hasModels, setHasModels] = useState(true);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((d) => setHasModels((d.models?.length ?? 0) > 0))
      .catch(() => setHasModels(false));
  }, []);

  return <ChatHome onNewChat={onNewChat} hasModels={hasModels} />;
}
