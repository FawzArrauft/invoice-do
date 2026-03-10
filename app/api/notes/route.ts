import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// GET all notes
export async function GET() {
  try {
    const sb = supabaseServer();
    const { data, error } = await sb
      .from("order_notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch notes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST create a new note
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, description } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Nama dan nomor telepon wajib diisi" },
        { status: 400 }
      );
    }

    const sb = supabaseServer();
    const { data, error } = await sb
      .from("order_notes")
      .insert({ name, phone, description: description || "" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create note";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
