import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

const TruckSchema = z.object({
  nopol: z.string().min(1),
});

// GET all trucks with cargo count
export async function GET() {
  const sb = supabaseServer();

  // Get all trucks
  const { data: trucks, error: trucksError } = await sb
    .from("trucks")
    .select("*")
    .order("created_at", { ascending: false });

  if (trucksError) {
    return NextResponse.json({ error: trucksError.message }, { status: 400 });
  }

  // Get cargo counts
  const { data: cargoCounts } = await sb
    .from("truck_cargo")
    .select("truck_id");

  // Count cargo per truck
  const cargoCountMap: Record<string, number> = {};
  cargoCounts?.forEach((c) => {
    cargoCountMap[c.truck_id] = (cargoCountMap[c.truck_id] || 0) + 1;
  });

  // Add cargo_count to each truck
  const trucksWithCount = trucks?.map((truck) => ({
    ...truck,
    cargo_count: cargoCountMap[truck.id] || 0,
  }));

  return NextResponse.json({ data: trucksWithCount });
}

// POST create new truck
export async function POST(req: Request) {
  const parsed = TruckSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("trucks")
    .insert({
      nopol: parsed.data.nopol.toUpperCase(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data });
}
