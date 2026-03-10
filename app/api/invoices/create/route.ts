import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

const ExtraChargeSchema = z.object({
  amount: z.number().nonnegative(),
  label: z.string().optional().default(""),
});

const ItemSchema = z.object({
  type: z.enum(["default", "murti", "japfa"]).optional().default("default"),
  tujuan: z.string(),
  jenis: z.string().optional().default(""),
  nopol: z.string(),
  ongkir: z.number().nonnegative(),
  berat: z.number().nonnegative().optional().default(0),
  kuli: z.number().nonnegative().optional().default(0),
  uang_makan: z.number().nonnegative().optional().default(0),
  keterangan: z.string().optional().default(""),
  tanggal_item: z.string().optional().default(""),
  extra_charges: z.array(ExtraChargeSchema).optional().default([]),
  is_empty_row: z.boolean().optional().default(false),
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
  const totalUangMakan = data.items.reduce((sum, it) => sum + (it.uang_makan || 0), 0);
  const totalExtraCharges = data.items.reduce((sum, it) => sum + (it.extra_charges || []).reduce((s, ec) => s + (ec.amount || 0), 0), 0);
  const grandTotal = totalOngkir + totalKuli + totalUangMakan + totalExtraCharges;

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
    type: it.type || "default",
    tujuan: it.tujuan,
    jenis: it.jenis || "",
    nopol: it.nopol,
    ongkir: it.ongkir,
    berat: it.berat || 0,
    kuli: it.kuli || 0,
    uang_makan: it.uang_makan || 0,
    keterangan: it.keterangan,
    tanggal_item: it.tanggal_item || null,
    extra_charges: it.extra_charges || [],
    is_empty_row: it.is_empty_row || false,
  }));

  const { error: itemErr } = await sb
    .from("invoice_items")
    .insert(itemsToInsert);

  if (itemErr) {
    return NextResponse.json({ error: itemErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: invoice.id });
}
