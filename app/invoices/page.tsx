"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

type Invoice = {
  id: string;
  created_at: string;
  invoice_number: string;
  is_manual: boolean;
  tanggal: string;
  kepada_yth: string;
  total_ongkir: number;
};

function formatDateDMY(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

function DownloadPdfButton({ invoiceId, invoiceNumber }: { invoiceId: string; invoiceNumber: string }) {
  return (
    <a
      href={`/api/invoices/${invoiceId}/pdf`}
      download={`invoice-${invoiceNumber}.pdf`}
      className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      PDF
    </a>
  );
}

function EditButton({ invoiceId }: { invoiceId: string }) {
  return (
    <Link
      href={`/invoices/${invoiceId}/edit`}
      className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      Edit
    </Link>
  );
}

function DeleteButton({ invoiceId, onDelete }: { invoiceId: string; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Yakin ingin menghapus invoice ini?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
      if (res.ok) {
        onDelete();
      } else {
        const data = await res.json();
        alert(data?.error || "Gagal menghapus");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
      {deleting ? "..." : "Hapus"}
    </button>
  );
}

export default function InvoicesPage() {
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchInvoices() {
    try {
      const res = await fetch("/api/invoices/list");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(query) ||
        inv.kepada_yth.toLowerCase().includes(query) ||
        inv.tanggal.includes(query)
    );
  }, [data, searchQuery]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">Error: {error}</div>;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Invoices</h1>
          <p className="text-sm text-zinc-400">History (latest 100)</p>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm"
        >
          + New Invoice
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by invoice number, customer, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 pl-10 pr-4 py-3 outline-none focus:border-zinc-600 placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-zinc-400 mb-3">
          Found {filteredData.length} invoice{filteredData.length !== 1 ? "s" : ""}
        </p>
      )}

      <div className="space-y-3">
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            {searchQuery ? "No invoices found matching your search" : "No invoices yet"}
          </div>
        ) : (
          filteredData.map((inv) => (
          <div
            key={inv.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 hover:bg-zinc-900/60 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <Link href={`/invoices/${inv.id}`} className="flex-1 min-w-0">
                <div className="font-semibold">
                  {inv.invoice_number}{" "}
                  <span className="text-xs text-zinc-400">
                    {inv.is_manual ? "(manual)" : "(auto)"}
                  </span>
                </div>
                <div className="text-sm text-zinc-400">
                  {formatDateDMY(inv.tanggal)} • {inv.kepada_yth}
                </div>
              </Link>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold">
                    Rp {new Intl.NumberFormat("id-ID").format(inv.total_ongkir)}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {new Date(inv.created_at).toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <EditButton invoiceId={inv.id} />
                  <DownloadPdfButton invoiceId={inv.id} invoiceNumber={inv.invoice_number} />
                  <DeleteButton invoiceId={inv.id} onDelete={fetchInvoices} />
                </div>
              </div>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
}