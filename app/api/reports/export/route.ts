import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generateTruckingReport, type TruckingReportRow } from "@/lib/excelReport";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const startDate =
      url.searchParams.get("start") ||
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .slice(0, 10);

    const endDate =
      url.searchParams.get("end") || new Date().toISOString().slice(0, 10);

    const company = url.searchParams.get("company") || "";

    const sb = supabaseServer();

    // Fetch invoices within date range
    let invoiceQuery = sb
      .from("invoices")
      .select("id, invoice_number, kepada_yth, tanggal")
      .gte("tanggal", startDate)
      .lte("tanggal", endDate)
      .order("tanggal", { ascending: true });

    if (company) {
      invoiceQuery = invoiceQuery.eq("kepada_yth", company);
    }

    const { data: invoices, error: invErr } = await invoiceQuery;
    if (invErr) throw invErr;

    if (!invoices || invoices.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data invoice untuk periode ini" },
        { status: 404 },
      );
    }

    const invoiceIds = invoices.map((i) => i.id);

    // Fetch invoice items
    const { data: items, error: itemsErr } = await sb
      .from("invoice_items")
      .select("invoice_id, tanggal_item, nopol, tujuan, jenis, berat, ongkir, keterangan")
      .in("invoice_id", invoiceIds)
      .order("tanggal_item", { ascending: true });

    if (itemsErr) throw itemsErr;

    // Map invoice_id to invoice data
    const invoiceMap = new Map(invoices.map((inv) => [inv.id, inv]));

    // Build report data
    const reportData: TruckingReportRow[] = (items || []).map((item) => {
      const inv = invoiceMap.get(item.invoice_id);
      return {
        tanggal: item.tanggal_item || inv?.tanggal || "",
        noDO: inv?.invoice_number || "",
        platNomor: item.nopol || "",
        supir: "-", // field supir belum ada di DB, fallback
        tujuan: item.tujuan || "",
        beratKG: item.berat || 0,
        ongkir: item.ongkir || 0,
        keterangan: item.keterangan || "",
      };
    });

    // Format periode
    const startFormatted = formatDateID(startDate);
    const endFormatted = formatDateID(endDate);
    const periode = `${startFormatted} s/d ${endFormatted}`;

    // Determine perusahaan name
    const perusahaan = company || invoices[0]?.kepada_yth || "Semua Perusahaan";

    // Generate Excel
    const buffer = await generateTruckingReport({
      periode,
      perusahaan,
      data: reportData,
    });

    // Filename
    const safeCompany = perusahaan.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    const filename = `Laporan_Trucking_${safeCompany}_${startDate}_${endDate}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    console.error("Report export error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate report",
      },
      { status: 500 },
    );
  }
}

function formatDateID(dateStr: string): string {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const [y, m, d] = dateStr.split("-");
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
}
