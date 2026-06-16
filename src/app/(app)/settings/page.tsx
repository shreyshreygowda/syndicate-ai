"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Check,
  ExternalLink,
  Plus,
  Trash2,
  Zap,
  Key,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PROVIDER_INFO, PROVIDER_ORDER } from "@/lib/provider-info";

interface ProviderStatus {
  configured: boolean;
  maskedKey?: string;
}

interface CustomModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  description?: string | null;
}

export default function SettingsPage() {
  const [providers, setProviders] = useState<
    Record<string, ProviderStatus>
  >({});
  const [modelsAvailable, setModelsAvailable] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [showAddModel, setShowAddModel] = useState(false);
  const [newModel, setNewModel] = useState({
    name: "",
    provider: "fireworks",
    modelId: "",
    description: "",
  });

  async function loadSettings() {
    setLoadError("");
    try {
      const settingsRes = await fetch("/api/settings");
      if (!settingsRes.ok) throw new Error("Could not load settings");
      const settings = await settingsRes.json();
      setProviders(settings.providers || {});
      setModelsAvailable(settings.modelsAvailable || 0);

      try {
        const customRes = await fetch("/api/custom-models");
        if (customRes.ok) {
          setCustomModels(await customRes.json());
        }
      } catch {
        // custom models are optional
      }
    } catch {
      setLoadError("Could not load settings. Try refreshing the page.");
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSaveKey(provider: string) {
    const apiKey = keys[provider];
    if (!apiKey?.trim()) return;

    setSaving(provider);
    setMessages((m) => ({ ...m, [provider]: "" }));

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey: apiKey.trim() }),
    });
    const data = await res.json();
    setSaving(null);

    if (!res.ok) {
      setMessages((m) => ({
        ...m,
        [provider]: data.error || "Failed to save",
      }));
      return;
    }

    setProviders(data.providers);
    setModelsAvailable(data.modelsAvailable);
    setKeys((k) => ({ ...k, [provider]: "" }));
    setMessages((m) => ({
      ...m,
      [provider]: data.test?.ok
        ? "Connected! Models are now available."
        : data.test?.message || "Saved, but connection test failed.",
    }));
    loadSettings();
  }

  async function handleTest(provider: string) {
    setTesting(provider);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, action: "test" }),
    });
    const data = await res.json();
    setTesting(null);
    setMessages((m) => ({
      ...m,
      [provider]: data.ok ? "Connection works!" : data.message,
    }));
  }

  async function handleRemove(provider: string) {
    if (!confirm("Remove this API key?")) return;
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, action: "remove" }),
    });
    setMessages((m) => ({ ...m, [provider]: "" }));
    loadSettings();
  }

  async function handleAddCustomModel() {
    if (!newModel.name || !newModel.modelId) return;

    const res = await fetch("/api/custom-models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newModel),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to add model");
      return;
    }

    setNewModel({ name: "", provider: "fireworks", modelId: "", description: "" });
    setShowAddModel(false);
    loadSettings();
  }

  async function handleDeleteCustom(id: string) {
    if (!confirm("Remove this custom model?")) return;
    await fetch(`/api/custom-models?id=${id}`, { method: "DELETE" });
    loadSettings();
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Setup</h1>
      <p className="text-sm text-syndicate-muted mb-2">
        Connect your AI services to start chatting. Each service needs its own
        free API key — like a password that lets this app talk to the AI.
      </p>
      <p className="text-xs text-syndicate-muted mb-8">
        {modelsAvailable > 0
          ? `${modelsAvailable} models ready to use`
          : "No models connected yet"}
      </p>

      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {modelsAvailable > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-800 text-sm">
            <Check className="w-4 h-4" />
            You&apos;re all set! Head to chat to try a model.
          </div>
          <Link href="/chat">
            <Button size="sm">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Start Chatting
            </Button>
          </Link>
        </div>
      )}

      <h2 className="text-sm font-bold uppercase tracking-widest text-syndicate-muted mb-4">
        Step 1 — Connect an AI Service
      </h2>

      <div className="space-y-4 mb-10">
        {PROVIDER_ORDER.map((id) => {
          const info = PROVIDER_INFO[id];
          const status = providers[id];
          const isConnected = status?.configured;

          return (
            <div
              key={id}
              className={cn(
                "bg-white border rounded-lg p-5",
                isConnected
                  ? "border-green-200"
                  : info.recommended
                    ? "border-syndicate-blue/30"
                    : "border-syndicate-light-gray"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{info.name}</h3>
                    {info.recommended && (
                      <span className="text-xs bg-syndicate-blue text-white px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                    {isConnected && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-syndicate-muted mt-1">
                    {info.description}
                  </p>
                </div>
              </div>

              {isConnected ? (
                <div className="flex items-center gap-3">
                  <code className="text-xs bg-syndicate-off-white px-2 py-1 rounded font-mono">
                    {status.maskedKey}
                  </code>
                  <button
                    onClick={() => handleTest(id)}
                    disabled={testing === id}
                    className="text-xs text-syndicate-blue hover:underline"
                  >
                    {testing === id ? "Testing…" : "Test connection"}
                  </button>
                  <button
                    onClick={() => handleRemove(id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <a
                    href={info.keyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-syndicate-blue hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Get your free API key from {info.name}
                  </a>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-syndicate-muted" />
                      <input
                        type="password"
                        value={keys[id] || ""}
                        onChange={(e) =>
                          setKeys((k) => ({ ...k, [id]: e.target.value }))
                        }
                        placeholder={`Paste your ${info.name} key here`}
                        className="w-full pl-9 pr-3 py-2.5 border border-syndicate-light-gray rounded-md text-sm focus:outline-none focus:border-syndicate-blue"
                      />
                    </div>
                    <Button
                      onClick={() => handleSaveKey(id)}
                      disabled={saving === id || !keys[id]?.trim()}
                      size="md"
                    >
                      {saving === id ? "Saving…" : "Connect"}
                    </Button>
                  </div>
                </div>
              )}

              {messages[id] && (
                <p
                  className={cn(
                    "text-xs mt-2",
                    messages[id].includes("Connected") ||
                      messages[id].includes("works")
                      ? "text-green-600"
                      : "text-red-600"
                  )}
                >
                  {messages[id]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="text-sm font-bold uppercase tracking-widest text-syndicate-muted mb-4">
        Step 2 — Add a Custom Model (Optional)
      </h2>

      <div className="bg-white border border-syndicate-light-gray rounded-lg p-5 mb-10">
        <p className="text-sm text-syndicate-muted mb-4">
          Want to use a specific model not listed? Add it here. You&apos;ll need
          the model&apos;s ID from your provider&apos;s documentation — or ask
          someone technical for help finding it.
        </p>

        {customModels.length > 0 && (
          <div className="space-y-2 mb-4">
            {customModels.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between px-3 py-2 bg-syndicate-off-white rounded-md"
              >
                <div>
                  <span className="font-medium text-sm">{m.name}</span>
                  <span className="text-xs text-syndicate-muted ml-2">
                    via {m.provider}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteCustom(m.id)}
                  className="text-syndicate-muted hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddModel ? (
          <div className="space-y-3 border-t border-syndicate-light-gray pt-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-syndicate-muted mb-1">
                Display Name
              </label>
              <input
                value={newModel.name}
                onChange={(e) =>
                  setNewModel({ ...newModel, name: e.target.value })
                }
                placeholder="e.g. My Special Model"
                className="w-full px-3 py-2 border border-syndicate-light-gray rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-syndicate-muted mb-1">
                Service
              </label>
              <select
                value={newModel.provider}
                onChange={(e) =>
                  setNewModel({ ...newModel, provider: e.target.value })
                }
                className="w-full px-3 py-2 border border-syndicate-light-gray rounded-md text-sm"
              >
                <option value="fireworks">Fireworks AI</option>
                <option value="openrouter">OpenRouter</option>
                <option value="groq">Groq</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-syndicate-muted mb-1">
                Model ID
              </label>
              <input
                value={newModel.modelId}
                onChange={(e) =>
                  setNewModel({ ...newModel, modelId: e.target.value })
                }
                placeholder="e.g. accounts/fireworks/models/kimi-k2-instruct"
                className="w-full px-3 py-2 border border-syndicate-light-gray rounded-md text-sm font-mono"
              />
              <p className="text-xs text-syndicate-muted mt-1">
                Copy this from your provider&apos;s model list or docs
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCustomModel}>Add Model</Button>
              <Button variant="secondary" onClick={() => setShowAddModel(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setShowAddModel(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Custom Model
          </Button>
        )}
      </div>

      <div className="bg-syndicate-off-white border border-syndicate-light-gray rounded-lg p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-syndicate-blue" />
          <h3 className="font-bold text-sm">Quick Start Guide</h3>
        </div>
        <ol className="text-sm text-syndicate-slate space-y-2 list-decimal list-inside">
          <li>
            Click &quot;Get your free API key&quot; above for{" "}
            <strong>Fireworks AI</strong> (recommended)
          </li>
          <li>Create a free account and copy your API key</li>
          <li>Paste it here and click <strong>Connect</strong></li>
          <li>Go to <strong>Chat</strong> and pick a model from the dropdown</li>
          <li>Type a message — you&apos;re done!</li>
        </ol>
      </div>
    </div>
  );
}
