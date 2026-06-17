import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
import { rateLimit } from "@/lib/rate-limit";

const { auth } = NextAuth(authConfig);

function requestIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/docs/architecture") return true;
  if (pathname === "/login" || pathname === "/register" || pathname === "/forbidden") {
    return true;
  }
  if (pathname === "/api/health") return true;
  if (pathname.startsWith("/api/attachments/")) return true;
  if (pathname.startsWith("/share/")) return true;
  if (pathname.startsWith("/api/share/")) return true;
  if (pathname.startsWith("/api/auth") || pathname === "/api/register") {
    return true;
  }
  return false;
}

function redirectTo(req: NextRequest, pathname: string, search?: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = search ?? "";
  return NextResponse.redirect(url);
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (
    req.method === "POST" &&
    pathname.startsWith("/api/auth") &&
    !rateLimit(`auth:${requestIp(req)}`, 20, 60_000)
  ) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  if (!isLoggedIn && !isPublicPath(pathname)) {
    if (isApi) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const params = new URLSearchParams();
    params.set("callbackUrl", pathname);
    return redirectTo(req, "/login", `?${params.toString()}`);
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    const callback = req.nextUrl.searchParams.get("callbackUrl");
    if (callback?.startsWith("/") && !callback.startsWith("//")) {
      const [path, query] = callback.split("?");
      return redirectTo(req, path, query ? `?${query}` : "");
    }
    return redirectTo(req, "/dashboard");
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
