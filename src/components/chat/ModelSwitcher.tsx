"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModelInfo } from "@/types";

interface ModelSwitcherProps {
  models: ModelInfo[];
  selectedProvider: string;
  selectedModel: string;
  onSelect: (provider: string, model: string) => void;
  compareMode?: boolean;
  selectedModels?: { provider: string; model: string }[];
  onCompareSelect?: (models: { provider: string; model: string }[]) => void;
}

export function ModelSwitcher({
  models,
  selectedProvider,
  selectedModel,
  onSelect,
  compareMode = false,
  selectedModels = [],
  onCompareSelect,
}: ModelSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = models.find(
    (m) => m.id === selectedModel && m.provider === selectedProvider
  );

  const grouped = models.reduce(
    (acc, model) => {
      if (!acc[model.provider]) acc[model.provider] = [];
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, ModelInfo[]>
  );

  const providerLabels: Record<string, string> = {
    fireworks: "Fireworks AI",
    openrouter: "OpenRouter",
    groq: "Groq",
  };

  function handleCompareToggle(provider: string, model: string) {
    if (!onCompareSelect) return;
    const exists = selectedModels.some(
      (m) => m.provider === provider && m.model === model
    );
    if (exists) {
      onCompareSelect(
        selectedModels.filter(
          (m) => !(m.provider === provider && m.model === model)
        )
      );
    } else if (selectedModels.length < 4) {
      onCompareSelect([...selectedModels, { provider, model }]);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-syndicate-light-gray rounded-md bg-white hover:border-syndicate-blue transition-colors"
      >
        <Globe className="w-3.5 h-3.5 text-syndicate-blue" />
        <span className="font-medium">
          {compareMode
            ? `${selectedModels.length} models selected`
            : current?.name || "Select model"}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-syndicate-muted" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-syndicate-light-gray rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {Object.entries(grouped).map(([provider, providerModels]) => (
            <div key={provider}>
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-syndicate-muted bg-syndicate-off-white border-b border-syndicate-light-gray">
                {providerLabels[provider] || provider}
                <span className="ml-2 text-syndicate-blue">US</span>
              </div>
              {providerModels.map((model) => {
                const isSelected = compareMode
                  ? selectedModels.some(
                      (m) =>
                        m.provider === model.provider && m.model === model.id
                    )
                  : model.id === selectedModel &&
                    model.provider === selectedProvider;

                return (
                  <button
                    key={`${model.provider}-${model.id}`}
                    onClick={() => {
                      if (compareMode) {
                        handleCompareToggle(model.provider, model.id);
                      } else {
                        onSelect(model.provider, model.id);
                        setOpen(false);
                      }
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 hover:bg-syndicate-off-white transition-colors border-b border-syndicate-light-gray/50 last:border-0",
                      isSelected && "bg-syndicate-blue/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isSelected && "text-syndicate-blue"
                        )}
                      >
                        {model.name}
                      </span>
                      {compareMode && (
                        <span
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center text-xs",
                            isSelected
                              ? "bg-syndicate-blue border-syndicate-blue text-white"
                              : "border-syndicate-light-gray"
                          )}
                        >
                          {isSelected ? "✓" : ""}
                        </span>
                      )}
                    </div>
                    {model.description && (
                      <p className="text-xs text-syndicate-muted mt-0.5">
                        {model.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {models.length === 0 && (
            <div className="px-3 py-4 text-sm text-syndicate-muted text-center">
              No models configured. Add API keys to .env
            </div>
          )}
        </div>
      )}
    </div>
  );
}
