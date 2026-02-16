import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;

  const isLogin = req.nextUrl.pathname.startsWith("/login");
  const isApiLogin = req.nextUrl.pathname.startsWith("/api/login");

  if (!token && !isLogin && !isApiLogin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/reports", "/invoices/:path*", "/api/:path*"],
};
