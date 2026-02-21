import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple JWT expiry check without external library
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true;
    // Add 30s buffer for clock skew
    return Date.now() >= (payload.exp * 1000) - 30000;
  } catch {
    return true;
  }
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 1. Public routes — return early sebelum akses cookies
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/api/health")
  ) {
    return NextResponse.next();
  }

  // 2. Auth check — baru akses cookie setelah memastikan bukan public
  const token = req.cookies.get("auth-token")?.value;

  if (!token || isTokenExpired(token)) {
    // Clear invalid/expired cookies and redirect
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("auth-token");
    response.cookies.delete("refresh-token");
    response.cookies.delete("user-role");
    return response;
  }

  // 3. Build response with security headers
  const response = NextResponse.next();

  // Prevent MIME-type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  // XSS filter
  response.headers.set("X-XSS-Protection", "1; mode=block");
  // Restrict referrer leakage
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Prevent browser features abuse
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  // HSTS — force HTTPS (only in production)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  // 4. Set user-role header only for API routes
  if (pathname.startsWith("/api")) {
    const userRole = req.cookies.get("user-role")?.value;
    if (userRole) {
      response.headers.set("x-user-role", userRole);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2|ttf)$).*)",
  ],
};
