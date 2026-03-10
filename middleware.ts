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

// Refresh access token using Supabase refresh token
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return null;

    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseAnonKey,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.access_token && data.refresh_token) {
      return { access_token: data.access_token, refresh_token: data.refresh_token };
    }
    return null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 1. Public routes — return early sebelum akses cookies
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/auth/check")
  ) {
    return NextResponse.next();
  }

  // 2. Auth check — baru akses cookie setelah memastikan bukan public
  const token = req.cookies.get("auth-token")?.value;
  const refreshToken = req.cookies.get("refresh-token")?.value;

  // Token still valid — continue as normal
  if (token && !isTokenExpired(token)) {
    return buildResponse(req, pathname);
  }

  // Token expired but refresh token available — try to refresh
  if (refreshToken) {
    const newTokens = await refreshAccessToken(refreshToken);
    if (newTokens) {
      const isProduction = process.env.NODE_ENV === "production";
      const cookieBase = {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax" as const,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      };

      const response = buildResponse(req, pathname);
      response.cookies.set("auth-token", newTokens.access_token, cookieBase);
      response.cookies.set("refresh-token", newTokens.refresh_token, cookieBase);
      return response;
    }
  }

  // No valid token and refresh failed — redirect to login
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect", pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("auth-token");
  response.cookies.delete("refresh-token");
  response.cookies.delete("user-role");
  return response;
}

function buildResponse(req: NextRequest, pathname: string) {
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

  // Set user-role header only for API routes
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
