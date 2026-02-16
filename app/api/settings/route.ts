import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * GET - Ambil semua settings
 */
export async function GET() {
  const sb = supabaseServer();

  const { data, error } = await sb
    .from("settings")
    .select("*")
    .order("key");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Convert array ke object { key: value }
  const settings: Record<string, string> = {};
  data?.forEach((row) => {
    settings[row.key] = row.value;
  });

  return NextResponse.json({ data: settings });
}

/**
 * POST - Update atau create setting
 * Body: { key: string, value: string }
 */
export async function POST(req: Request) {
  const { key, value } = await req.json();

  if (!key) {
    return NextResponse.json({ error: "Key is required" }, { status: 400 });
  }

  const sb = supabaseServer();

  // Upsert: insert jika belum ada, update jika sudah ada
  const { data, error } = await sb
    .from("settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
