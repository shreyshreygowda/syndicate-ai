import { getSession, AUTH_DISABLED } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { initDatabase } from "@/lib/db";

initDatabase();

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <AppShell
      userName={session?.user?.name ?? "Guest"}
      authDisabled={AUTH_DISABLED}
    >
      {children}
    </AppShell>
  );
}
