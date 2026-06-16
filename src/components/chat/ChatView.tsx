"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ModelSwitcher } from "./ModelSwitcher";
import { StatusBar } from "@/components/layout/StatusBar";
import { Button } from "@/components/ui/Button";
import { Settings } from "lucide-react";
import type { ModelInfo } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string | null;
  provider?: string | null;
}

interface Document {
  id: string;
  filename: string;
  size: number;
}

interface ChatViewProps {
  conversationId: string;
  initialMessages: Message[];
  initialDocuments: Document[];
  initialProvider: string;
  initialModel: string;
  models: ModelInfo[];
  compareMode?: boolean;
}

export function ChatView({
  conversationId,
  initialMessages,
  initialDocuments,
  initialProvider,
  initialModel,
  models: initialModels,
  compareMode = false,
}: ChatViewProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [models, setModels] = useState<ModelInfo[]>(initialModels);
  const [provider, setProvider] = useState(initialProvider);
  const [model, setModel] = useState(initialModel);
  const [compareModels, setCompareModels] = useState<
    { provider: string; model: string }[]
  >([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState<
    Record<string, string>
  >({});
  const streamAccumulator = useRef<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((d) => {
        if (d.models?.length) {
          setModels(d.models);
          const currentValid = d.models.some(
            (m: ModelInfo) => m.id === model && m.provider === provider
          );
          if (!currentValid) {
            const first = d.models[0];
            setProvider(first.provider);
            setModel(first.id);
          }
        }
      })
      .catch(() => {});
  }, [model, provider]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  async function handleSend(content: string) {
    if (models.length === 0) return;

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setStreamingContent({});
    streamAccumulator.current = {};

    try {
      const body: Record<string, unknown> = {
        conversationId,
        message: content,
        model,
        provider,
      };

      if (compareMode && compareModels.length > 0) {
        body.comparisonModels = compareModels;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Chat request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);

            if (parsed.type === "chunk") {
              const key = `${parsed.provider}:${parsed.model}`;
              streamAccumulator.current[key] =
                (streamAccumulator.current[key] || "") + parsed.content;
              setStreamingContent({ ...streamAccumulator.current });
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
              throw e;
            }
          }
        }
      }

      const res = await fetch(`/api/conversations/${conversationId}`);
      const data = await res.json();
      setMessages(data.messages);
      setStreamingContent({});
      streamAccumulator.current = {};
      router.refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "An error occurred";
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `**Error:** ${msg}`,
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversationId", conversationId);

    const res = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
    }

    const doc = await res.json();
    setDocuments((prev) => [...prev, doc]);
  }

  async function handleRemoveDocument(id: string) {
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleModelChange(newProvider: string, newModel: string) {
    setProvider(newProvider);
    setModel(newModel);
    await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: newProvider, model: newModel }),
    });
  }

  const showCompare = compareMode && compareModels.length > 0;
  const noModels = models.length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-syndicate-light-gray bg-white">
        <ModelSwitcher
          models={models}
          selectedProvider={provider}
          selectedModel={model}
          onSelect={handleModelChange}
          compareMode={compareMode}
          selectedModels={compareModels}
          onCompareSelect={setCompareModels}
        />
      </div>

      {noModels && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-amber-800">
            No AI models connected yet. Set up takes about 2 minutes.
          </p>
          <Link href="/settings">
            <Button size="sm">
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              Setup
            </Button>
          </Link>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-6 grid-bg">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold text-black mb-2">
              {compareMode ? "Compare Models" : "New Conversation"}
            </h2>
            <p className="text-syndicate-muted text-sm max-w-md">
              {noModels
                ? "Connect an AI service in Setup, then come back and send a message."
                : compareMode
                  ? "Select 2–4 models above, then send a message to compare responses side by side."
                  : "Pick a model above, attach documents if needed, and send a message."}
            </p>
          </div>
        )}

        {showCompare ? (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${compareModels.length}, 1fr)`,
            }}
          >
            {compareModels.map(({ provider: p, model: m }) => {
              const modelMsgs = messages.filter(
                (msg) =>
                  msg.role === "user" ||
                  (msg.role === "assistant" &&
                    msg.provider === p &&
                    msg.model === m)
              );
              const key = `${p}:${m}`;
              const streamingText = streamingContent[key];

              return (
                <div
                  key={key}
                  className="border border-syndicate-light-gray rounded-lg bg-white"
                >
                  <div className="px-3 py-2 border-b border-syndicate-light-gray bg-syndicate-off-white">
                    <span className="text-xs font-semibold uppercase tracking-widest text-syndicate-blue">
                      {models.find((mod) => mod.id === m && mod.provider === p)
                        ?.name || m}
                    </span>
                  </div>
                  <div className="p-3 min-h-[200px]">
                    {modelMsgs.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        role={msg.role}
                        content={msg.content}
                        model={msg.model}
                        provider={msg.provider}
                        models={models}
                      />
                    ))}
                    {streamingText && (
                      <MessageBubble
                        role="assistant"
                        content={streamingText}
                        model={m}
                        provider={p}
                        models={models}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                model={msg.model}
                provider={msg.provider}
                models={models}
              />
            ))}
            {Object.entries(streamingContent).map(([key, content]) => {
              const [p, m] = key.split(":");
              return (
                <MessageBubble
                  key={key}
                  role="assistant"
                  content={content}
                  model={m}
                  provider={p}
                  models={models}
                />
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={handleSend}
        onUpload={handleUpload}
        onRemoveDocument={handleRemoveDocument}
        documents={documents}
        disabled={
          streaming ||
          noModels ||
          (compareMode && compareModels.length === 0)
        }
        placeholder={
          noModels
            ? "Connect a model in Setup first…"
            : compareMode && compareModels.length === 0
              ? "Select models to compare first…"
              : undefined
        }
      />

      <StatusBar provider={provider} model={model} />
    </div>
  );
}
