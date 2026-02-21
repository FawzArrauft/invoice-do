import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * GET - List all pabrik
 */
export async function GET() {
  try {
    const sb = supabaseServer();

    const { data, error } = await sb
      .from("pabrik")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);

    const mapped =
      data?.map((row) => ({
        id: row.id,
        name: row.name,
        tujuan: row.tujuan || "",
        jenis: row.jenis || "",
        ongkir: row.ongkir || 0,
        berat: row.berat || 0,
        kuli: row.kuli || 0,
        uang_makan: row.uang_makan || 0,
        createdAt: row.created_at,
      })) || [];

    return NextResponse.json({ data: mapped });
  } catch (err) {
    console.error("Failed to fetch pabrik:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch pabrik" },
      { status: 500 },
    );
  }
}

/**
 * POST - Create new pabrik
 * Body: { name, tujuan, jenis, ongkir, berat, kuli, uang_makan }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, tujuan, jenis, ongkir, berat, kuli, uang_makan } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nama pabrik wajib diisi" },
        { status: 400 },
      );
    }

    const sb = supabaseServer();

    const { data, error } = await sb
      .from("pabrik")
      .insert([
        {
          name: name.trim(),
          tujuan: tujuan || "",
          jenis: jenis || "",
          ongkir: Number(ongkir) || 0,
          berat: Number(berat) || 0,
          kuli: Number(kuli) || 0,
          uang_makan: Number(uang_makan) || 0,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      data: {
        id: data.id,
        name: data.name,
        tujuan: data.tujuan,
        jenis: data.jenis,
        ongkir: data.ongkir,
        berat: data.berat,
        kuli: data.kuli,
        uang_makan: data.uang_makan,
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    console.error("Failed to create pabrik:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create pabrik" },
      { status: 500 },
    );
  }
}

/**
 * PUT - Update pabrik
 * Body: { id, name, tujuan, jenis, ongkir, berat, kuli, uang_makan }
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, tujuan, jenis, ongkir, berat, kuli, uang_makan } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Pabrik ID is required" },
        { status: 400 },
      );
    }

    const sb = supabaseServer();

    const { data, error } = await sb
      .from("pabrik")
      .update({
        name: name?.trim() || "",
        tujuan: tujuan || "",
        jenis: jenis || "",
        ongkir: Number(ongkir) || 0,
        berat: Number(berat) || 0,
        kuli: Number(kuli) || 0,
        uang_makan: Number(uang_makan) || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      data: {
        id: data.id,
        name: data.name,
        tujuan: data.tujuan,
        jenis: data.jenis,
        ongkir: data.ongkir,
        berat: data.berat,
        kuli: data.kuli,
        uang_makan: data.uang_makan,
      },
    });
  } catch (err) {
    console.error("Failed to update pabrik:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update pabrik" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Delete pabrik by id query param
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Pabrik ID is required" },
        { status: 400 },
      );
    }

    const sb = supabaseServer();

    const { error } = await sb.from("pabrik").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete pabrik:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete pabrik" },
      { status: 500 },
    );
  }
}
