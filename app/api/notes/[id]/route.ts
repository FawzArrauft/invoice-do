import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// PUT update a note
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, phone, description } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Nama dan nomor telepon wajib diisi" },
        { status: 400 }
      );
    }

    const sb = supabaseServer();
    const { error } = await sb
      .from("order_notes")
      .update({ name, phone, description: description || "" })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update note";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE a note
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sb = supabaseServer();
    const { error } = await sb
      .from("order_notes")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete note";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
