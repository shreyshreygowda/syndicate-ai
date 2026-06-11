"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Setup failed");
      return;
    }

    router.push("/login");
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-6" />
          <h1 className="text-2xl font-bold">Initial Setup</h1>
          <p className="text-sm text-syndicate-muted mt-2">
            Create the admin account for your Syndicate 708 AI instance
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
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-syndicate-light-gray rounded-md text-sm focus:outline-none focus:border-syndicate-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-syndicate-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-syndicate-light-gray rounded-md text-sm focus:outline-none focus:border-syndicate-blue"
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
                minLength={8}
                className="w-full px-3 py-2.5 border border-syndicate-light-gray rounded-md text-sm focus:outline-none focus:border-syndicate-blue"
              />
              <p className="text-xs text-syndicate-muted mt-1">
                Minimum 8 characters
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? "Creating…" : "Create Admin Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
