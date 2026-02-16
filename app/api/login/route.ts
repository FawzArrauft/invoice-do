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

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = supabaseAuth();

    // Login dengan Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Ambil role user dari tabel users
    const adminSb = supabaseAdmin();
    const { data: userData } = await adminSb
      .from("users")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    const role = userData?.role || "viewer";

    // Set cookies
    const res = NextResponse.json({
      ok: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role,
      },
    });

    // Auth token cookie
    res.cookies.set("auth-token", authData.session?.access_token || "ok", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Refresh token cookie
    if (authData.session?.refresh_token) {
      res.cookies.set("refresh-token", authData.session.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // User role cookie (untuk middleware)
    res.cookies.set("user-role", role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// Logout endpoint
export async function DELETE() {
  const res = NextResponse.json({ ok: true });

  // Clear all auth cookies
  res.cookies.delete("auth-token");
  res.cookies.delete("refresh-token");
  res.cookies.delete("user-role");

  return res;
}
