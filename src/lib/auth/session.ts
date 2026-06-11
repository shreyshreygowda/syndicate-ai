import { auth } from "./index";
import { db, initDatabase } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const AUTH_DISABLED = process.env.DISABLE_AUTH === "true";

const GUEST_EMAIL = "guest@syndicate708.local";
const GUEST_ID = "guest-user-s708";

export async function getSession() {
  if (!AUTH_DISABLED) {
    return auth();
  }

  initDatabase();

  let user = await db
    .select()
    .from(users)
    .where(eq(users.email, GUEST_EMAIL))
    .get();

  if (!user) {
    const passwordHash = await bcrypt.hash("guest-not-used", 12);
    try {
      await db.insert(users).values({
        id: GUEST_ID,
        email: GUEST_EMAIL,
        name: "Guest",
        passwordHash,
        totpSecret: null,
        totpEnabled: false,
        isAdmin: true,
        createdAt: new Date(),
      });
    } catch {
      // Another request may have created the guest user concurrently
    }
    user = await db
      .select()
      .from(users)
      .where(eq(users.email, GUEST_EMAIL))
      .get();
  }

  if (!user) throw new Error("Failed to create guest user");

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin ?? true,
      totpEnabled: false,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}
