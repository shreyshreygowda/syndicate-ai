"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChatIndexPage() {
  const router = useRouter();

  useEffect(() => {
    async function createAndRedirect() {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const convo = await res.json();
      router.replace(`/chat/${convo.id}`);
    }
    createAndRedirect();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-syndicate-muted text-sm">Starting new chat…</div>
    </div>
  );
}
