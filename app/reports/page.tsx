"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function idr(n: number) {
  return "Rp " + new Intl.NumberFormat("id-ID").format(n || 0);
}

function hiddenIdr() {
  return "Rp ••••••••";
}

type Row = { key: string; value: number };
type CompanyRow = {
  key: string;
  revenue: number;
  shipments: number;
};

type Report = {
  totalRevenue: number;
  byJenis: Row[];
  byTujuan: Row[];
  byNopol: Row[];
  byCompany: CompanyRow[];
};

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<Report>({
    totalRevenue: 0,
    byJenis: [],
    byTujuan: [],
    byNopol: [],
    byCompany: [],
  });

  const [loading, setLoading] = useState(false);
  const [showAmount, setShowAmount] = useState(false);
  const [tab, setTab] = useState<"jenis" | "tujuan" | "nopol" | "company">(
    "jenis",
  );

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/monthly?start=${startDate}&end=${endDate}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      setData(json);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load report";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const activeRows = useMemo((): Row[] | CompanyRow[] => {
    if (tab === "jenis") return data.byJenis || [];
    if (tab === "tujuan") return data.byTujuan || [];
    if (tab === "nopol") return data.byNopol || [];
    if (tab === "company") return data.byCompany || [];
    return [];
  }, [data, tab]);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">
            Reporting Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-zinc-400">Monthly breakdown</p>
            <button
              onClick={() => setShowAmount(!showAmount)}
              className="ml-2 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title={showAmount ? "Hide amounts" : "Show amounts"}
            >
              {showAmount ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              )}
            </button>
          </div>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm"
        >
          Back
        </Link>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-zinc-300 block mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-300 block mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={load}
            className="w-full rounded-xl bg-white text-zinc-950 px-5 py-3 font-medium"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <TabButton active={tab === "jenis"} onClick={() => setTab("jenis")}>
          By Jenis
        </TabButton>
        <TabButton active={tab === "company"} onClick={() => setTab("company")}>
          By Company
        </TabButton>
        <TabButton active={tab === "tujuan"} onClick={() => setTab("tujuan")}>
          By Tujuan
        </TabButton>
        <TabButton active={tab === "nopol"} onClick={() => setTab("nopol")}>
          By NoPol
        </TabButton>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-zinc-800">
          <div className="text-sm text-zinc-400">
            {tab === "jenis" && "Jenis Muatan"}
            {tab === "company" && "Kepada Yth (Company)"}
            {tab === "tujuan" && "Tujuan"}
            {tab === "nopol" && "NoPol"}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Sorted by highest total
          </div>
        </div>

        <div className="divide-y divide-zinc-800">
          {loading && <div className="p-6 text-zinc-400">Loading...</div>}

          {!loading && activeRows.length === 0 && (
            <div className="p-6 text-zinc-400">No data for this month.</div>
          )}

          {!loading &&
            tab === "company" &&
            data.byCompany.map((r, idx) => (
              <div
                key={`${r.key}-${idx}`}
                className="p-4 sm:p-6 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.key}</div>
                  <div className="text-xs text-zinc-500">
                    {r.shipments} shipments • Rank #{idx + 1}
                  </div>
                </div>
                <div className="font-semibold">{showAmount ? idr(r.revenue) : hiddenIdr()}</div>
              </div>
            ))}

          {!loading &&
            tab !== "company" &&
            (activeRows as Row[]).map((r, idx) => (
              <div
                key={`${r.key}-${idx}`}
                className="p-4 sm:p-6 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.key}</div>
                  <div className="text-xs text-zinc-500">Rank #{idx + 1}</div>
                </div>
                <div className="font-semibold">{showAmount ? idr(r.value) : hiddenIdr()}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl px-4 py-2 text-sm border",
        active
          ? "bg-white text-zinc-950 border-white"
          : "bg-zinc-900/40 text-zinc-200 border-zinc-800 hover:bg-zinc-900/70",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
