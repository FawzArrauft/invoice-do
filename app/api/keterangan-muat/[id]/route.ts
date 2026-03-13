import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// PUT update a keterangan_muat
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      truck_id,
      note_id,
      order: orderText,
      tgl_muat,
      tgl_bongkar,
      balen,
      tgl_muat_balen,
      balen_do,
      tgl_bongkar_balen,
      tempat_bongkar,
    } = body;

    if (!truck_id) {
      return NextResponse.json(
        { error: "Nopol (truck) wajib dipilih" },
        { status: 400 }
      );
    }

    const sb = supabaseServer();
    const { error } = await sb
      .from("keterangan_muat")
      .update({
        truck_id,
        note_id: note_id || null,
        order: orderText || "",
        tgl_muat: tgl_muat || "",
        tgl_bongkar: tgl_bongkar || "",
        balen: balen || "",
        tgl_muat_balen: tgl_muat_balen || "",
        balen_do: balen_do || "",
        tgl_bongkar_balen: tgl_bongkar_balen || "",
        tempat_bongkar: tempat_bongkar || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update keterangan muat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE a keterangan_muat
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sb = supabaseServer();
    const { error } = await sb
      .from("keterangan_muat")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete keterangan muat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
