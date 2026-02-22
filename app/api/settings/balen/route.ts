import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * GET - List all balen options (with balen_cargo_type, balen_freight_cost)
 */
export async function GET() {
  try {
    const sb = supabaseServer();

    const { data, error } = await sb
      .from("balen")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);

    const mapped =
      data?.map((row) => ({
        id: row.id,
        name: row.name,
        balen_cargo_type: row.balen_cargo_type || "",
        balen_freight_cost: row.balen_freight_cost || 0,
        createdAt: row.created_at,
      })) || [];

    return NextResponse.json({ data: mapped });
  } catch (err) {
    console.error("Failed to fetch balen:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch balen" },
      { status: 500 },
    );
  }
}

/**
 * POST - Create new balen option
 * Body: { name, balen_cargo_type, balen_freight_cost }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, balen_cargo_type, balen_freight_cost } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nama balen wajib diisi" },
        { status: 400 },
      );
    }

    const sb = supabaseServer();

    const { data, error } = await sb
      .from("balen")
      .insert([{
        name: name.trim(),
        balen_cargo_type: balen_cargo_type || "",
        balen_freight_cost: Number(balen_freight_cost) || 0,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      data: {
        id: data.id,
        name: data.name,
        balen_cargo_type: data.balen_cargo_type || "",
        balen_freight_cost: data.balen_freight_cost || 0,
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    console.error("Failed to create balen:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create balen" },
      { status: 500 },
    );
  }
}

/**
 * PUT - Update balen option
 * Body: { id, name, balen_cargo_type, balen_freight_cost }
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, balen_cargo_type, balen_freight_cost } = body;

    if (!id || !name?.trim()) {
      return NextResponse.json(
        { error: "ID dan nama wajib diisi" },
        { status: 400 },
      );
    }

    const sb = supabaseServer();

    const { data, error } = await sb
      .from("balen")
      .update({
        name: name.trim(),
        balen_cargo_type: balen_cargo_type || "",
        balen_freight_cost: Number(balen_freight_cost) || 0,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      data: {
        id: data.id,
        name: data.name,
        balen_cargo_type: data.balen_cargo_type || "",
        balen_freight_cost: data.balen_freight_cost || 0,
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    console.error("Failed to update balen:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update balen" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Delete balen option
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
      .from("balen")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete balen:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete balen" },
      { status: 500 },
    );
  }
}
