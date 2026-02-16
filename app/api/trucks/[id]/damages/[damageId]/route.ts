import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; damageId: string }> }
) {
  try {
    const { id, damageId } = await params;
    const sb = supabaseServer();

    const { error } = await sb
      .from("truck_damages")
      .delete()
      .eq("id", damageId)
      .eq("truck_id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete damage";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
