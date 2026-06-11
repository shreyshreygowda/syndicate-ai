"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Shield, Check, AlertTriangle } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Check if 2FA is already enabled via session
  }, []);

  async function startSetup() {
    const res = await fetch("/api/auth/2fa/setup");
    const data = await res.json();
    setQrCode(data.qrCode);
    setSecret(data.secret);
  }

  async function confirmSetup() {
    if (!secret || !code) return;
    setError("");

    const res = await fetch("/api/auth/2fa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, code }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Setup failed");
      return;
    }

    setEnabled(true);
    setSuccess("2FA enabled successfully");
    setQrCode(null);
    setSecret(null);
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Security Settings</h1>
      <p className="text-sm text-syndicate-muted mb-8">
        Manage authentication and security for your Syndicate 708 AI instance
      </p>

      <div className="space-y-6">
        <div className="bg-white border border-syndicate-light-gray rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-syndicate-blue" />
            <h2 className="font-bold">Two-Factor Authentication</h2>
            {enabled && (
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" />
                Enabled
              </span>
            )}
          </div>

          <p className="text-sm text-syndicate-muted mb-4">
            Add an extra layer of security using a TOTP authenticator app
            (Google Authenticator, Authy, 1Password, etc.)
          </p>

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          {!qrCode ? (
            <Button onClick={startSetup} disabled={enabled}>
              {enabled ? "2FA Already Enabled" : "Set Up 2FA"}
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">
                Scan this QR code with your authenticator app:
              </p>
              {qrCode && (
                <Image
                  src={qrCode}
                  alt="2FA QR Code"
                  width={200}
                  height={200}
                  className="border border-syndicate-light-gray rounded-lg"
                />
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-syndicate-muted mb-1.5">
                  Enter verification code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-48 px-3 py-2 border border-syndicate-light-gray rounded-md text-sm font-mono focus:outline-none focus:border-syndicate-blue"
                />
              </div>
              <Button onClick={confirmSetup}>Verify & Enable</Button>
            </div>
          )}
        </div>

        <div className="bg-white border border-syndicate-light-gray rounded-lg p-6">
          <h2 className="font-bold mb-4">Security Status</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-syndicate-light-gray">
              <span>Encryption in Transit</span>
              <span className="text-green-600 font-medium">TLS 1.3</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-syndicate-light-gray">
              <span>API Keys Storage</span>
              <span className="text-green-600 font-medium">
                Server-side only (.env)
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-syndicate-light-gray">
              <span>Data Storage</span>
              <span className="text-green-600 font-medium">
                Local SQLite
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-syndicate-light-gray">
              <span>Search Engine Indexing</span>
              <span className="text-green-600 font-medium">
                Disabled (noindex)
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>LLM Traffic Routing</span>
              <span className="text-green-600 font-medium">
                US-based servers only
              </span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">Self-Hosted Deployment</p>
            <p className="text-amber-700 mt-1">
              For production use, deploy behind a reverse proxy with HTTPS
              (Caddy or nginx) and set REQUIRE_2FA=true in your environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
