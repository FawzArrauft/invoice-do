import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

const CargoUpdateSchema = z.object({
  tanggal: z.string().optional(),
  cargo: z.string().optional(),
  freight_cost: z.number().nonnegative().optional(),
  cargo_type: z.string().optional(),
  balen: z.string().optional(),
  balen_freight_cost: z.number().nonnegative().optional(),
  balen_cargo_type: z.string().optional(),
  fuel: z.number().nonnegative().optional(),
  operational_cost: z.number().nonnegative().optional(),
  other_cost: z.number().nonnegative().optional(),
  total: z.number().nullable().optional(),
  notes: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; cargoId: string }> }
) {
  try {
    const { id, cargoId } = await params;
    const body = await request.json();
    const parsed = CargoUpdateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const sb = supabaseServer();
    const { data, error } = await sb
      .from("truck_cargo")
      .update(parsed.data)
      .eq("id", cargoId)
      .eq("truck_id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update cargo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; cargoId: string }> }
) {
  try {
    const { id, cargoId } = await params;
    const sb = supabaseServer();

    const { error } = await sb
      .from("truck_cargo")
      .delete()
      .eq("id", cargoId)
      .eq("truck_id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete cargo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
