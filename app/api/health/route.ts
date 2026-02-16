import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Health check endpoint untuk UptimeRobot
 * - Verifikasi koneksi database Supabase
 * - Mencegah Supabase project idle/sleep (free tier)
 * - Public endpoint (tidak perlu auth)
 */
export async function GET() {
  try {
    const sb = supabaseServer();

    // Query ringan untuk keep Supabase active
    // Hanya mengecek koneksi, tidak load data besar
    const { error } = await sb.from("trucks").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          status: "error",
          message: "Database connection failed",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check error:", error);

    return NextResponse.json(
      {
        ok: false,
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
