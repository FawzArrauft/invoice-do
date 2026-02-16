import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

const MuatanSchema = z.object({
  truck_id: z.string().uuid(),
  tanggal: z.string(),
  jenis_muatan: z.string().optional().default(""),
  balen: z.number().nonnegative().optional().default(0),
  ongkos: z.number().nonnegative().optional().default(0),
  keterangan: z.string().optional().default(""),
});

// GET all muatan with truck info
export async function GET() {
  const sb = supabaseServer();

  const { data, error } = await sb
    .from("muatan")
    .select(`
      *,
      trucks (nopol)
    `)
    .order("tanggal", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Flatten the data to include nopol
  const flatData = data?.map((m) => ({
    ...m,
    nopol: (m.trucks as { nopol: string } | null)?.nopol || "",
    trucks: undefined,
  }));

  return NextResponse.json({ data: flatData });
}

// POST create new muatan
export async function POST(req: Request) {
  const parsed = MuatanSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("muatan")
    .insert({
      truck_id: parsed.data.truck_id,
      tanggal: parsed.data.tanggal,
      jenis_muatan: parsed.data.jenis_muatan,
      balen: parsed.data.balen,
      ongkos: parsed.data.ongkos,
      keterangan: parsed.data.keterangan,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data });
}
