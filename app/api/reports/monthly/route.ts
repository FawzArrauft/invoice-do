import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

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

    const sb = supabaseServer();

    const { data: invoices, error: invErr } = await sb
      .from("invoices")
      .select("id, kepada_yth, total_ongkir")
      .gte("tanggal", startDate)
      .lte("tanggal", endDate);

    if (invErr) throw invErr;

    const totalRevenue = (invoices || []).reduce(
      (sum, inv) => sum + (inv.total_ongkir || 0),
      0,
    );

    const invoiceIds = (invoices || []).map((i) => i.id);

    if (invoiceIds.length === 0) {
      return NextResponse.json({
        totalRevenue: 0,
        byJenis: [],
        byTujuan: [],
        byNopol: [],
        byCompany: []
      });
    }

    const { data: items, error: itemsErr } = await sb
      .from("invoice_items")
      .select("jenis, tujuan, nopol, ongkir, invoice_id")
      .in("invoice_id", invoiceIds);

    if (itemsErr) throw itemsErr;

    // ===== COMPANY AGGREGATION START =====

    const companyMap = new Map<
      string,
      { revenue: number; shipments: number }
    >();

    // Revenue from invoice header
    for (const inv of invoices || []) {
      companyMap.set(inv.kepada_yth, {
        revenue:
          (companyMap.get(inv.kepada_yth)?.revenue || 0) +
          (inv.total_ongkir || 0),
        shipments: 0,
      });
    }

    // Shipment count from items
    for (const item of items || []) {
      const invoice = invoices?.find((inv) => inv.id === item.invoice_id);
      if (!invoice) continue;

      const existing = companyMap.get(invoice.kepada_yth);
      if (existing) {
        existing.shipments += 1;
      }
    }

    const byCompany = Array.from(companyMap.entries())
      .map(([key, value]) => ({
        key,
        revenue: value.revenue,
        shipments: value.shipments,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ===== COMPANY AGGREGATION END =====

    const aggregate = (rows: any[], key: string) => {
      const map = new Map<string, number>();
      for (const r of rows) {
        map.set(r[key], (map.get(r[key]) || 0) + (r.ongkir || 0));
      }
      return Array.from(map.entries())
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) => b.value - a.value);
    };

    return NextResponse.json({
      totalRevenue,
      byJenis: aggregate(items || [], "jenis"),
      byTujuan: aggregate(items || [], "tujuan"),
      byNopol: aggregate(items || [], "nopol"),
      byCompany,
    });
  } catch (err: any) {
    console.error("Report error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate report" },
      { status: 500 },
    );
  }
}
