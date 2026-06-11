import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // Temporarily bypass login — set DISABLE_AUTH=false to re-enable
  if (process.env.DISABLE_AUTH === "true") {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/setup") ||
    req.nextUrl.pathname.startsWith("/api/auth");
  const isSharePage = req.nextUrl.pathname.startsWith("/share");
  const isApiSetup = req.nextUrl.pathname === "/api/setup";
  const isApiShare = req.nextUrl.pathname.startsWith("/api/share");

  if (isSharePage || isApiShare || isApiSetup) {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (
    isLoggedIn &&
    (req.nextUrl.pathname.startsWith("/login") ||
      req.nextUrl.pathname.startsWith("/setup"))
  ) {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|logo.png).*)"],
};
