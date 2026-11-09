import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type SortParam = "recently-added" | "last-updated" | "old-to-new";

const PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // --- Pagination params ---
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;

  const limitParam = parseInt(searchParams.get("limit") || String(PAGE_SIZE), 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), MAX_PAGE_SIZE)
    : PAGE_SIZE;

  // --- Search ---
  const search = (searchParams.get("search") || "").trim();

  // --- Sort ---
  const sortRaw = (searchParams.get("sort") || "recently-added") as SortParam;
  const sort: SortParam =
    sortRaw === "last-updated" || sortRaw === "old-to-new" ? sortRaw : "recently-added";

  const sb = supabaseServer();

  // Base query builder so count and rows always share the same filter.
  // Try with nama_perusahaan first; if the column does not exist yet (migration
  // not applied), retry without it so the invoice list never breaks.
  const baseSelect =
    "id, created_at, invoice_number, is_manual, tanggal, kepada_yth, total_ongkir, updated_at, order_notes, nama_perusahaan";

  const runQuery = (includeColumn: boolean) => {
    let base = sb
      .from("invoices")
      .select(includeColumn ? baseSelect : baseSelect.replace(", nama_perusahaan", ""), {
        count: "exact",
      });

    if (search) {
      const q = `%${search}%`;
      base = base.or(`invoice_number.ilike.${q},kepada_yth.ilike.${q},tanggal.ilike.${q}`);
    }

    const from = (page - 1) * limit;
    let query = base;

    if (sort === "recently-added") {
      query = query.order("created_at", { ascending: false }).order("id", { ascending: false });
    } else if (sort === "old-to-new") {
      query = query.order("created_at", { ascending: true }).order("id", { ascending: true });
    } else {
      query = query
        .order("updated_at", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false });
    }

    if (from > 0) query = query.range(from, from + limit - 1);
    else query = query.limit(limit);

    return query;
  };

  let { data, count, error } = await runQuery(true);

  if (error && /nama_perusahaan/i.test(error.message)) {
    // Column not present yet — retry without it.
    const retry = await runQuery(false);
    ({ data, count, error } = retry);
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return NextResponse.json({
    data: data || [],
    total,
    page,
    limit,
    totalPages,
    sort,
  });
}

