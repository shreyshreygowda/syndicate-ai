import { NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";

initDatabase();

export async function GET() {
  const existing = await db.select().from(users).get();
  return NextResponse.json({ needsSetup: !existing });
}

export async function POST(request: Request) {
  const existing = await db.select().from(users).get();
  if (existing) {
    return NextResponse.json({ error: "Already set up" }, { status: 400 });
  }

  const { email, password, name } = await request.json();
  if (!email || !password || !name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = {
    id: uuid(),
    email,
    name,
    passwordHash,
    totpSecret: null,
    totpEnabled: false,
    isAdmin: true,
    createdAt: new Date(),
  };

  await db.insert(users).values(user);

  return NextResponse.json({ success: true });
}
