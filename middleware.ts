import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  const userRole = req.cookies.get("user-role")?.value;

  const pathname = req.nextUrl.pathname;

  // Public routes yang tidak perlu auth
  const isLogin = pathname.startsWith("/login");
  const isApiLogin = pathname.startsWith("/api/login");
  const isPublicApi = pathname.startsWith("/api/public");
  const isHealthCheck = pathname.startsWith("/api/health");

  // Skip untuk public routes
  if (isLogin || isApiLogin || isPublicApi || isHealthCheck) {
    return NextResponse.next();
  }

  // Redirect ke login jika tidak ada token
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Tambahkan role ke header untuk API routes
  const response = NextResponse.next();
  if (userRole) {
    response.headers.set("x-user-role", userRole);
  }

  return response;
}

export const config = {
  // Melindungi semua halaman dan API kecuali static assets
  matcher: [
    "/",
    "/reports/:path*",
    "/invoices/:path*",
    "/muatan/:path*",
    "/api/:path*",
  ],
};
