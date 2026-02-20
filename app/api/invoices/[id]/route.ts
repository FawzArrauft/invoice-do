import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

const ItemSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["default", "murti", "japfa"]).optional().default("default"),
  tujuan: z.string().min(1),
  jenis: z.string().optional().default(""),
  nopol: z.string().min(1),
  ongkir: z.number().nonnegative(),
  berat: z.number().nonnegative().optional().default(0),
  kuli: z.number().nonnegative().optional().default(0),
  uang_makan: z.number().nonnegative().optional().default(0),
  keterangan: z.string().optional().default(""),
  tanggal_item: z.string().optional().default(""),
});

const UpdateBodySchema = z.object({
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sb = supabaseServer();

    const { data: invoice, error: invoiceError } = await sb
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { data: items, error: itemsError } = await sb
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    // Sort items by tanggal_item ascending (earlier dates first)
    const sortedItems = items?.sort((a, b) => {
      const dateA = a.tanggal_item ? new Date(a.tanggal_item).getTime() : 0;
      const dateB = b.tanggal_item ? new Date(b.tanggal_item).getTime() : 0;
      return dateA - dateB;
    }) || [];

    return NextResponse.json({ data: { ...invoice, items: sortedItems } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Get failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = UpdateBodySchema.safeParse(await request.json());
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const sb = supabaseServer();
    const data = parsed.data;

    const totalOngkir = data.items.reduce((sum, it) => sum + it.ongkir, 0);
    const totalKuli = data.items.reduce((sum, it) => sum + (it.kuli || 0), 0);
    const totalUangMakan = data.items.reduce((sum, it) => sum + (it.uang_makan || 0), 0);
    const grandTotal = totalOngkir + totalKuli + totalUangMakan;

    // Update invoice header
    const { error: invErr } = await sb
      .from("invoices")
      .update({
        invoice_number: data.invoiceNumber,
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
      .eq("id", id);

    if (invErr) {
      return NextResponse.json({ error: invErr.message }, { status: 400 });
    }

    // Delete existing items and insert new ones
    const { error: deleteErr } = await sb
      .from("invoice_items")
      .delete()
      .eq("invoice_id", id);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 400 });
    }

    const itemsToInsert = data.items.map((it) => ({
      invoice_id: id,
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
    }));

    const { error: itemErr } = await sb
      .from("invoice_items")
      .insert(itemsToInsert);

    if (itemErr) {
      return NextResponse.json({ error: itemErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sb = supabaseServer();

    // Delete invoice items first (foreign key constraint)
    const { error: itemsError } = await sb
      .from("invoice_items")
      .delete()
      .eq("invoice_id", id);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    // Delete the invoice
    const { error: invoiceError } = await sb
      .from("invoices")
      .delete()
      .eq("id", id);

    if (invoiceError) {
      return NextResponse.json({ error: invoiceError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
