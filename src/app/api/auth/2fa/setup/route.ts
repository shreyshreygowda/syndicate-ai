import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { authenticator } from "otplib";
import QRCode from "qrcode";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(
    session.user.email,
    "Syndicate 708 AI",
    secret
  );

  const qrCode = await QRCode.toDataURL(otpauth);

  return NextResponse.json({ secret, qrCode });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { secret, code } = await request.json();
  if (!secret || !code) {
    return NextResponse.json({ error: "Missing secret or code" }, { status: 400 });
  }

  const isValid = authenticator.verify({ token: code, secret });
  if (!isValid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ totpSecret: secret, totpEnabled: true })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
