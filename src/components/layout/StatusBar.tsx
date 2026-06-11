"use client";

import { Lock, Server, Shield } from "lucide-react";

interface StatusBarProps {
  provider?: string;
  model?: string;
}

export function StatusBar({ provider, model }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-syndicate-charcoal text-white text-xs font-mono">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-green-400" />
          TLS 1.3
        </span>
        <span className="flex items-center gap-1.5">
          <Server className="w-3 h-3 text-syndicate-blue" />
          US-East
        </span>
        <span className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-syndicate-blue" />
          AES-256
        </span>
      </div>
      <div className="flex items-center gap-3 text-syndicate-muted">
        {provider && (
          <span>
            API: <span className="text-white">{provider}</span>
          </span>
        )}
        {model && (
          <span className="truncate max-w-xs">
            Model: <span className="text-white">{model.split("/").pop()}</span>
          </span>
        )}
        <span>SYNDICATE 708 • EST. 2014</span>
      </div>
    </div>
  );
}
