"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Plus, Copy, Trash2, Share2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SavedPrompt } from "@/lib/db/schema";

const CATEGORIES = [
  "general",
  "company-overview",
  "process",
  "analysis",
  "writing",
  "code",
];

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [selected, setSelected] = useState<SavedPrompt | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    category: "general",
    isShared: false,
  });
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchPrompts();
  }, []);

  async function fetchPrompts() {
    const res = await fetch("/api/prompts");
    const data = await res.json();
    setPrompts(data);
  }

  function startNew() {
    setSelected(null);
    setEditing(true);
    setForm({
      title: "",
      description: "",
      content: "",
      category: "general",
      isShared: false,
    });
  }

  function startEdit(prompt: SavedPrompt) {
    setSelected(prompt);
    setEditing(true);
    setForm({
      title: prompt.title,
      description: prompt.description || "",
      content: prompt.content,
      category: prompt.category || "general",
      isShared: prompt.isShared ?? false,
    });
  }

  async function handleSave() {
    if (!form.title || !form.content) return;

    if (selected) {
      await fetch("/api/prompts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, ...form }),
      });
    } else {
      await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setEditing(false);
    setSelected(null);
    fetchPrompts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this prompt?")) return;
    await fetch(`/api/prompts?id=${id}`, { method: "DELETE" });
    setSelected(null);
    setEditing(false);
    fetchPrompts();
  }

  function copyToClipboard(content: string) {
    navigator.clipboard.writeText(content);
  }

  const filtered =
    filter === "all"
      ? prompts
      : prompts.filter((p) => p.category === filter);

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-syndicate-light-gray bg-white flex flex-col">
        <div className="p-4 border-b border-syndicate-light-gray flex items-center justify-between">
          <h2 className="font-bold text-sm uppercase tracking-widest">
            Saved Prompts
          </h2>
          <Button size="sm" onClick={startNew}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            New
          </Button>
        </div>

        <div className="px-3 py-2 flex flex-wrap gap-1">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-2 py-1 text-xs rounded-md",
              filter === "all"
                ? "bg-syndicate-blue text-white"
                : "text-syndicate-muted hover:bg-syndicate-off-white"
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-2 py-1 text-xs rounded-md capitalize",
                filter === cat
                  ? "bg-syndicate-blue text-white"
                  : "text-syndicate-muted hover:bg-syndicate-off-white"
              )}
            >
              {cat.replace("-", " ")}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-syndicate-muted text-sm">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No prompts yet
            </div>
          ) : (
            filtered.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => {
                  setSelected(prompt);
                  setEditing(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-md mb-0.5 transition-colors",
                  selected?.id === prompt.id
                    ? "bg-syndicate-blue/10 text-syndicate-blue"
                    : "hover:bg-syndicate-off-white"
                )}
              >
                <div className="font-medium text-sm truncate">
                  {prompt.title}
                </div>
                <div className="text-xs text-syndicate-muted capitalize">
                  {prompt.category?.replace("-", " ")}
                  {prompt.isShared && " • Shared"}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {editing ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {selected ? "Edit Prompt" : "New Prompt"}
            </h3>
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-syndicate-muted mb-1.5">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-syndicate-light-gray rounded-md text-sm focus:outline-none focus:border-syndicate-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-syndicate-muted mb-1.5">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-syndicate-light-gray rounded-md text-sm focus:outline-none focus:border-syndicate-blue"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace("-", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-syndicate-muted mb-1.5">
                  Description
                </label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-syndicate-light-gray rounded-md text-sm focus:outline-none focus:border-syndicate-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-syndicate-muted mb-1.5">
                  Prompt Content
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  rows={12}
                  className="w-full px-3 py-2 border border-syndicate-light-gray rounded-md text-sm font-mono focus:outline-none focus:border-syndicate-blue"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isShared}
                  onChange={(e) =>
                    setForm({ ...form, isShared: e.target.checked })
                  }
                  className="rounded border-syndicate-light-gray"
                />
                Share with Syndicate 708 team
              </label>
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save Prompt</Button>
                <Button
                  variant="secondary"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : selected ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">{selected.title}</h3>
                <p className="text-sm text-syndicate-muted capitalize">
                  {selected.category?.replace("-", " ")}
                  {selected.isShared && " • Shared with team"}
                </p>
                {selected.description && (
                  <p className="text-sm mt-1">{selected.description}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => copyToClipboard(selected.content)}
                  className="p-2 text-syndicate-muted hover:text-syndicate-blue rounded-md hover:bg-syndicate-off-white"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startEdit(selected)}
                  className="p-2 text-syndicate-muted hover:text-syndicate-blue rounded-md hover:bg-syndicate-off-white"
                  title="Edit"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="p-2 text-syndicate-muted hover:text-red-500 rounded-md hover:bg-syndicate-off-white"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <pre className="bg-syndicate-charcoal text-white p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
              {selected.content}
            </pre>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-syndicate-muted">
            <div className="text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                Select a prompt or create a new one
              </p>
              <p className="text-xs mt-1">
                Save process prompts for standardized AI workflows
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
