import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * GET - List all muatan truk options (with cargo_type, freight_cost)
 */
export async function GET() {
  try {
    const sb = supabaseServer();

    const { data, error } = await sb
      .from("muatan_truk")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);

    const mapped =
      data?.map((row) => ({
        id: row.id,
        name: row.name,
        cargo_type: row.cargo_type || "",
        freight_cost: row.freight_cost || 0,
        createdAt: row.created_at,
      })) || [];

    return NextResponse.json({ data: mapped });
  } catch (err) {
    console.error("Failed to fetch muatan truk:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch muatan truk" },
      { status: 500 },
    );
  }
}

/**
 * POST - Create new muatan truk option
 * Body: { name, cargo_type, freight_cost }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, cargo_type, freight_cost } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nama muatan truk wajib diisi" },
        { status: 400 },
      );
    }

    const sb = supabaseServer();

    const { data, error } = await sb
      .from("muatan_truk")
      .insert([{
        name: name.trim(),
        cargo_type: cargo_type || "",
        freight_cost: Number(freight_cost) || 0,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      data: {
        id: data.id,
        name: data.name,
        cargo_type: data.cargo_type || "",
        freight_cost: data.freight_cost || 0,
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    console.error("Failed to create muatan truk:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create muatan truk" },
      { status: 500 },
    );
  }
}

/**
 * PUT - Update muatan truk option
 * Body: { id, name, cargo_type, freight_cost }
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, cargo_type, freight_cost } = body;

    if (!id || !name?.trim()) {
      return NextResponse.json(
        { error: "ID dan nama wajib diisi" },
        { status: 400 },
      );
    }

    const sb = supabaseServer();

    const { data, error } = await sb
      .from("muatan_truk")
      .update({
        name: name.trim(),
        cargo_type: cargo_type || "",
        freight_cost: Number(freight_cost) || 0,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      data: {
        id: data.id,
        name: data.name,
        cargo_type: data.cargo_type || "",
        freight_cost: data.freight_cost || 0,
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    console.error("Failed to update muatan truk:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update muatan truk" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Delete muatan truk option
 * Query: ?id=xxx
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID wajib diisi" },
        { status: 400 },
      );
    }

    const sb = supabaseServer();

    const { error } = await sb
      .from("muatan_truk")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete muatan truk:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete muatan truk" },
      { status: 500 },
    );
  }
}
