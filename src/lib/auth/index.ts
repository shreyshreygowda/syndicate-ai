import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { authConfig } from "./config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      isAdmin: boolean;
      totpEnabled: boolean;
    };
  }
  interface User {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
    totpEnabled: boolean;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .get();

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        if (user.totpEnabled && user.totpSecret) {
          const totpCode = credentials.totpCode as string;
          if (!totpCode) return null;

          const isValid = authenticator.verify({
            token: totpCode,
            secret: user.totpSecret,
          });
          if (!isValid) return null;
        } else if (
          process.env.REQUIRE_2FA === "true" &&
          !user.totpEnabled
        ) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin ?? false,
          totpEnabled: user.totpEnabled ?? false,
        };
      },
    }),
  ],
});
