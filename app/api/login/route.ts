import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase client untuk auth (menggunakan anon key agar RLS berlaku)
function supabaseAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

// Supabase client dengan service role untuk mengambil data user
function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service);
}

// Simple in-memory rate limiter (per IP)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  record.count++;
  return record.count > MAX_ATTEMPTS;
}

function clearRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

export async function POST(req: Request) {
  try {
    // Rate limiting by IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
        { status: 429 },
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 },
      );
    }

    // Basic input validation
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Input tidak valid" },
        { status: 400 },
      );
    }

    if (email.length > 254 || password.length > 128) {
      return NextResponse.json(
        { error: "Input terlalu panjang" },
        { status: 400 },
      );
    }

    const supabase = supabaseAuth();

    // Login dengan Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (authError || !authData.user) {
      // Generic error message — don't reveal which field is wrong
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 },
      );
    }

    // Clear rate limit on successful login
    clearRateLimit(ip);

    // Ambil role user dari tabel users
    const adminSb = supabaseAdmin();
    const { data: userData } = await adminSb
      .from("users")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    const role = userData?.role || "viewer";

    // Set response — don't leak sensitive user data
    const res = NextResponse.json({
      ok: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role,
      },
    });

    // Secure cookie options
    const isProduction = process.env.NODE_ENV === "production";
    const cookieBase = {
      httpOnly: true,         // JS cannot read — prevents XSS cookie theft
      secure: isProduction,   // HTTPS only in production
      sameSite: "lax" as const, // Prevents CSRF
      path: "/",
    };

    // Auth token cookie
    res.cookies.set("auth-token", authData.session?.access_token || "", {
      ...cookieBase,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Refresh token cookie
    if (authData.session?.refresh_token) {
      res.cookies.set("refresh-token", authData.session.refresh_token, {
        ...cookieBase,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // User role cookie (untuk middleware)
    res.cookies.set("user-role", role, {
      ...cookieBase,
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}

// Logout endpoint
export async function DELETE() {
  const res = NextResponse.json({ ok: true });

  // Clear all auth cookies securely
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  res.cookies.set("auth-token", "", cookieOptions);
  res.cookies.set("refresh-token", "", cookieOptions);
  res.cookies.set("user-role", "", cookieOptions);

  return res;
}
