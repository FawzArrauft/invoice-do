import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/auth/check
 * Returns whether the current user has a valid session.
 * Used by the login page to auto-redirect if already authenticated.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const role = cookieStore.get("user-role")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    // Decode JWT to check expiry (without external lib)
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return NextResponse.json({ authenticated: false });
      }
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp || Date.now() >= payload.exp * 1000 - 30000) {
        // Token expired — let middleware handle refresh on next protected request
        return NextResponse.json({ authenticated: false });
      }
    } catch {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      role: role || "viewer",
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
