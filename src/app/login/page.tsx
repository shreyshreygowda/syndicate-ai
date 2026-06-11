"use client";

import { useState, useEffect, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Lock, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((d) => {
        if (d.needsSetup) router.push("/setup");
      });
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      totpCode: show2FA ? totpCode : undefined,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (!show2FA) {
        setShow2FA(true);
        setError("Enter your 2FA code if enabled, or check credentials");
      } else {
        setError("Invalid credentials or 2FA code");
      }
      return;
    }

    router.push("/chat");
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-6" />
          <h1 className="text-2xl font-bold">Secure AI Workflow</h1>
          <p className="text-sm text-syndicate-muted mt-2">
            US-hosted • Encrypted • Private
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-syndicate-light-gray rounded-lg p-6 shadow-sm"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-syndicate-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-syndicate-light-gray rounded-md text-sm focus:outline-none focus:border-syndicate-blue focus:ring-1 focus:ring-syndicate-blue/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-syndicate-muted mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-syndicate-light-gray rounded-md text-sm focus:outline-none focus:border-syndicate-blue focus:ring-1 focus:ring-syndicate-blue/20"
              />
            </div>

            {show2FA && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-syndicate-muted mb-1.5">
                  2FA Code
                </label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-2.5 border border-syndicate-light-gray rounded-md text-sm font-mono focus:outline-none focus:border-syndicate-blue focus:ring-1 focus:ring-syndicate-blue/20"
                />
              </div>
            )}
          </div>

          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-syndicate-muted font-mono">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            TLS 1.3
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            2FA Ready
          </span>
        </div>
      </div>
    </div>
  );
}
