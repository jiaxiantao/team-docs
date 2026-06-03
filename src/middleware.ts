import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/docs/architecture") return true;
  if (pathname === "/login" || pathname === "/register") return true;
  if (pathname.startsWith("/api/auth") || pathname === "/api/register") {
    return true;
  }
  return false;
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (!isLoggedIn && !isPublicPath(pathname)) {
    if (isApi) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
