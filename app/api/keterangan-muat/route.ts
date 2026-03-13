import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// GET all keterangan_muat (optionally filter by truck_id)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const truckId = searchParams.get("truck_id");

    const sb = supabaseServer();
    let query = sb
      .from("keterangan_muat")
      .select("*, trucks(nopol), order_notes(name, phone)")
      .order("created_at", { ascending: false });

    if (truckId) {
      query = query.eq("truck_id", truckId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch keterangan muat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST create a new keterangan_muat
export async function POST(req: Request) {
  try {
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
    const { data, error } = await sb
      .from("keterangan_muat")
      .insert({
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
      })
      .select("*, trucks(nopol), order_notes(name, phone)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create keterangan muat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
