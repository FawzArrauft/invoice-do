import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

const ItemSchema = z.object({
  tujuan: z.string().min(1),
  jenis: z.string().min(1),
  nopol: z.string().min(1),
  ongkir: z.number().nonnegative(),
  berat: z.number().nonnegative(),
  kuli: z.number().nonnegative().optional().default(0),
  keterangan: z.string().optional().default(""),
});

const BodySchema = z.object({
  invoiceNumber: z.string().optional().default(""),
  tanggal: z.string(),
  kepadaYth: z.string().min(1),
  items: z.array(ItemSchema).min(1),
  footerTanggal: z.string(),
  bankName: z.string().optional().default(""),
  noRekening: z.string().optional().default(""),
  namaRekening: z.string().optional().default(""),
  signatureUrl: z.string().optional(),
  signatureName: z.string(),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const sb = supabaseServer();
  const data = parsed.data;

  const totalOngkir = data.items.reduce((sum, it) => sum + it.ongkir, 0);
  const totalKuli = data.items.reduce((sum, it) => sum + (it.kuli || 0), 0);
  const grandTotal = totalOngkir + totalKuli;

  // insert invoice header first
  const { data: invoice, error: invErr } = await sb
    .from("invoices")
    .insert({
      invoice_number: data.invoiceNumber || `TEMP-${Date.now()}`,
      is_manual: !!data.invoiceNumber,
      tanggal: data.tanggal,
      kepada_yth: data.kepadaYth,
      total_ongkir: grandTotal,
      footer_tanggal: data.footerTanggal,
      bank_name: data.bankName,
      no_rekening: data.noRekening,
      account_name: data.namaRekening,
      signature_url: data.signatureUrl,
      signature_name: data.signatureName,
    })
    .select()
    .single();

  if (invErr) {
    return NextResponse.json({ error: invErr.message }, { status: 400 });
  }

  // insert invoice items
  const itemsToInsert = data.items.map((it) => ({
    invoice_id: invoice.id,
    tujuan: it.tujuan,
    jenis: it.jenis,
    nopol: it.nopol,
    ongkir: it.ongkir,
    berat: it.berat,
    kuli: it.kuli || 0,
    keterangan: it.keterangan,
  }));

  const { error: itemErr } = await sb
    .from("invoice_items")
    .insert(itemsToInsert);

  if (itemErr) {
    return NextResponse.json({ error: itemErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: invoice.id });
}
