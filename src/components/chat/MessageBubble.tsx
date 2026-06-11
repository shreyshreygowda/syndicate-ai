"use client";

import { Markdown } from "./Markdown";
import { cn } from "@/lib/utils";
import type { ModelInfo } from "@/types";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  model?: string | null;
  provider?: string | null;
  models?: ModelInfo[];
}

export function MessageBubble({
  role,
  content,
  model,
  provider,
  models = [],
}: MessageBubbleProps) {
  if (role === "system") return null;

  const modelInfo = models.find(
    (m) => m.id === model && m.provider === provider
  );

  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3",
          role === "user"
            ? "bg-syndicate-blue text-white"
            : "bg-white border border-syndicate-light-gray"
        )}
      >
        {role === "assistant" && modelInfo && (
          <div className="text-xs font-semibold uppercase tracking-widest text-syndicate-blue mb-2">
            {modelInfo.name}
          </div>
        )}
        {role === "user" ? (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        ) : (
          <Markdown content={content} />
        )}
      </div>
    </div>
  );
}
