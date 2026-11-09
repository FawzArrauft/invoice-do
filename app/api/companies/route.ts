import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const normalize = (s: string) => {
  const v = (s ?? "").toString().trim();
  return v.replace(/\s+/g, " ");
};

/**
 * GET /api/companies — list saved company names (newest first)
 */
export async function GET() {
  try {
    const sb = supabaseServer();
    const { data, error } = await sb
      .from("companies")
      .select("id, name, created_at")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error("Failed to fetch companies:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch companies" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/companies — add a company name
 * Body: { name }
 * - trims, collapses whitespace, rejects blank
 * - case-insensitive duplicate check
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = normalize(body?.name);

    if (!name) {
      return NextResponse.json({ error: "Nama perusahaan tidak boleh kosong" }, { status: 400 });
    }

    const sb = supabaseServer();

    // Duplicate check (case-insensitive, trimmed)
    const { data: dup, error: dupErr } = await sb
      .from("companies")
      .select("id")
      .ilike("name", name)
      .maybeSingle();
    if (dupErr) throw new Error(dupErr.message);
    if (dup) {
      return NextResponse.json({ error: "Nama perusahaan sudah ada" }, { status: 409 });
    }

    const { data, error } = await sb
      .from("companies")
      .insert({ name })
      .select("id, name, created_at")
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Failed to create company:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create company" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/companies — rename a company
 * Body: { id, name }
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = body?.id;
    const name = normalize(body?.name);

    if (!id) return NextResponse.json({ error: "ID perusahaan diperlukan" }, { status: 400 });
    if (!name) return NextResponse.json({ error: "Nama perusahaan tidak boleh kosong" }, { status: 400 });

    const sb = supabaseServer();

    const { data: dup, error: dupErr } = await sb
      .from("companies")
      .select("id")
      .ilike("name", name)
      .neq("id", id)
      .maybeSingle();
    if (dupErr) throw new Error(dupErr.message);
    if (dup) {
      return NextResponse.json({ error: "Nama perusahaan sudah ada" }, { status: 409 });
    }

    const { data, error } = await sb
      .from("companies")
      .update({ name })
      .eq("id", id)
      .select("id, name, created_at")
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Failed to update company:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update company" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/companies?id=<id> — delete a company name
 * (Existing invoices keep their nama_perusahaan text; only the list entry is removed.)
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID perusahaan diperlukan" }, { status: 400 });
    }

    const sb = supabaseServer();
    const { error } = await sb.from("companies").delete().eq("id", id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete company:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete company" },
      { status: 500 },
    );
  }
}
