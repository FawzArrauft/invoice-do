import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

const CargoSchema = z.object({
  truck_id: z.string().uuid(),
  tanggal: z.string(),
  cargo: z.string().optional().default(""),
  freight_cost: z.number().nonnegative().optional().default(0),
  cargo_type: z.string().optional().default(""),
  balen: z.string().optional().default(""),
  balen_freight_cost: z.number().nonnegative().optional().default(0),
  balen_cargo_type: z.string().optional().default(""),
  fuel: z.number().nonnegative().optional().default(0),
  operational_cost: z.number().nonnegative().optional().default(0),
  other_cost: z.number().nonnegative().optional().default(0),
  total: z.number().nullable().optional().default(null),
  notes: z.string().optional().default(""),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sb = supabaseServer();

    const { data, error } = await sb
      .from("truck_cargo")
      .select("*")
      .eq("truck_id", id)
      .order("tanggal", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to get cargo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = CargoSchema.safeParse({ ...body, truck_id: id });
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const sb = supabaseServer();
    const { data, error } = await sb
      .from("truck_cargo")
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create cargo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
