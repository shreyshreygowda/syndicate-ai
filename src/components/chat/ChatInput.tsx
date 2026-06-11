"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface AttachedFile {
  id: string;
  filename: string;
  size: number;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  onUpload: (file: File) => Promise<void>;
  onRemoveDocument: (id: string) => void;
  documents: AttachedFile[];
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onUpload,
  onRemoveDocument,
  documents,
  disabled,
  placeholder = "Message Syndicate AI…",
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return (
    <div className="border-t border-syndicate-light-gray bg-white p-4">
      {documents.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-syndicate-off-white border border-syndicate-light-gray rounded-md text-xs"
            >
              <FileText className="w-3.5 h-3.5 text-syndicate-blue" />
              <span className="font-medium">{doc.filename}</span>
              <span className="text-syndicate-muted">
                {formatSize(doc.size)}
              </span>
              <button
                onClick={() => onRemoveDocument(doc.id)}
                className="text-syndicate-muted hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".txt,.md,.csv,.json,.pdf,.html"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled || uploading}
          className="p-2 text-syndicate-slate hover:text-syndicate-blue hover:bg-syndicate-off-white rounded-md transition-colors disabled:opacity-50"
          title="Attach document"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none border border-syndicate-light-gray rounded-lg px-4 py-2.5 text-sm",
            "focus:outline-none focus:border-syndicate-blue focus:ring-1 focus:ring-syndicate-blue/20",
            "disabled:opacity-50 placeholder:text-syndicate-muted"
          )}
        />

        <Button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          size="md"
          className="px-3"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
