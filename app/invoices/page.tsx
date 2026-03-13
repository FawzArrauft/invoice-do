"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useToast } from "@/components/Toast";

type Invoice = {
  id: string;
  created_at: string;
  invoice_number: string;
  is_manual: boolean;
  tanggal: string;
  kepada_yth: string;
  total_ongkir: number;
  updated_at: string | null;
  order_notes: Array<{ id: string; name: string; phone: string }> | null;
};

type InvoiceDetail = {
  id: string;
  invoice_number: string;
  tanggal: string;
  kepada_yth: string;
  footer_tanggal: string;
  bank_name: string;
  no_rekening: string;
  account_name: string;
  signature_name: string;
  items: {
    id: string;
    type: string;
    nopol: string;
    tujuan: string;
    jenis: string;
    ongkir: number;
    berat: number;
    kuli: number;
    uang_makan: number;
    keterangan: string;
    tanggal_item: string;
  }[];
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
      className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors whitespace-nowrap"
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
      <span className="hidden sm:inline">PDF</span>
    </a>
  );
}

function EditButton({ invoiceId }: { invoiceId: string }) {
  return (
    <Link
      href={`/invoices/${invoiceId}/edit`}
      className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors whitespace-nowrap"
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
      <span className="hidden sm:inline">Edit</span>
    </Link>
  );
}

function DeleteButton({ invoiceId, onDelete }: { invoiceId: string; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  async function handleDelete() {
    if (!confirm("Yakin ingin menghapus invoice ini?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
      if (res.ok) {
        onDelete();
        showToast("Invoice berhasil dihapus", "success");
      } else {
        const data = await res.json();
        showToast(data?.error || "Gagal menghapus", "error");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
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
      <span className="hidden sm:inline">{deleting ? "..." : "Hapus"}</span>
    </button>
  );
}

export default function InvoicesPage() {
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"last-updated" | "recently-added" | "old-to-new">("recently-added");
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  const { showToast } = useToast();

  // Showcase/preview state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, InvoiceDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

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

  // Toggle invoice detail showcase
  const toggleDetail = useCallback(async (invoiceId: string) => {
    if (expandedId === invoiceId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(invoiceId);

    // If already cached, don't refetch
    if (detailCache[invoiceId]) return;

    setLoadingDetail(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setDetailCache((prev) => ({ ...prev, [invoiceId]: json.data }));
      }
    } catch (err) {
      console.error("Failed to load invoice detail:", err);
    } finally {
      setLoadingDetail(null);
    }
  }, [expandedId, detailCache]);

  async function handleDeleteAll() {
    if (deleteConfirmText !== "HAPUS SEMUA") {
      showToast("Ketik 'HAPUS SEMUA' untuk konfirmasi", "warning");
      return;
    }
    setDeletingAll(true);
    try {
      const res = await fetch("/api/invoices/delete-all?confirm=DELETE_ALL_INVOICES", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus");
      showToast(`Berhasil menghapus ${json.deletedCount} invoice`, "success");
      setShowDeleteAllModal(false);
      setDeleteConfirmText("");
      fetchInvoices();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal menghapus semua invoice", "error");
    } finally {
      setDeletingAll(false);
    }
  }

  const filteredData = useMemo(() => {
    let result = data;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(query) ||
          inv.kepada_yth.toLowerCase().includes(query) ||
          inv.tanggal.includes(query)
      );
    }
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "last-updated":
          return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
        case "recently-added":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "old-to-new":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [data, searchQuery, sortBy]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">Error: {error}</div>;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-red-400 mb-4">⚠️ Hapus Semua Invoice</h2>
            <p className="text-zinc-300 mb-4">
              Tindakan ini akan menghapus <strong>SEMUA invoice</strong> dan tidak dapat dibatalkan.
              Data yang sudah dihapus tidak bisa dikembalikan.
            </p>
            <p className="text-zinc-400 text-sm mb-4">
              Ketik <strong className="text-red-400">HAPUS SEMUA</strong> untuk konfirmasi:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Ketik: HAPUS SEMUA"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 mb-4 outline-none focus:border-red-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteAllModal(false);
                  setDeleteConfirmText("");
                }}
                className="flex-1 rounded-lg border border-zinc-700 px-4 py-2 hover:bg-zinc-800"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deletingAll || deleteConfirmText !== "HAPUS SEMUA"}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingAll ? "Menghapus..." : "Hapus Semua"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Invoices</h1>
          <p className="text-sm text-zinc-400">History (latest 100)</p>
        </div>
        <div className="flex gap-2">
          {data.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="rounded-xl border border-red-800 bg-red-900/30 px-3 sm:px-4 py-2 text-sm text-red-400 hover:bg-red-900/50 whitespace-nowrap"
            >
              Hapus Semua
            </button>
          )}
          <Link
            href="/"
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 sm:px-4 py-2 text-sm whitespace-nowrap"
          >
            + New Invoice
          </Link>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
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
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 pl-10 pr-4 py-3 outline-none focus:border-zinc-600 placeholder:text-zinc-500 text-sm"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 outline-none focus:border-zinc-600 text-sm text-zinc-300 min-w-[170px] cursor-pointer"
        >
          <option value="recently-added">Recently Added</option>
          <option value="last-updated">Last Updated</option>
          <option value="old-to-new">Old to New</option>
        </select>
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
            className={`rounded-2xl border ${expandedId === inv.id ? 'border-zinc-600' : 'border-zinc-800'} bg-zinc-900/40 overflow-hidden transition-colors`}
          >
            <div className="p-4 hover:bg-zinc-900/60 transition-colors">
            {/* Mobile Layout (< sm) */}
            <div className="flex sm:hidden flex-col gap-3">
              <button onClick={() => toggleDetail(inv.id)} className="flex-1 text-left">
                <div className="font-semibold text-base">
                  {inv.invoice_number}{" "}
                  <span className="text-xs text-zinc-400">
                    {inv.is_manual ? "(manual)" : "(auto)"}
                  </span>
                </div>
                <div className="text-sm text-zinc-400 mt-1">
                  {formatDateDMY(inv.tanggal)} &bull; {inv.kepada_yth}
                </div>
                {inv.order_notes && inv.order_notes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {inv.order_notes.map((note) => (
                      <span key={note.id} className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300">
                        {note.name}
                      </span>
                    ))}
                  </div>
                )}
              </button>
              
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="font-semibold text-sm">
                    Rp {new Intl.NumberFormat("id-ID").format(inv.total_ongkir)}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {new Date(inv.created_at).toLocaleString("id-ID", { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {inv.updated_at && (
                    <div className="text-[10px] text-amber-400/70 mt-0.5">
                      Updated: {new Date(inv.updated_at).toLocaleString("id-ID", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <EditButton invoiceId={inv.id} />
                  <DownloadPdfButton invoiceId={inv.id} invoiceNumber={inv.invoice_number} />
                  <DeleteButton invoiceId={inv.id} onDelete={fetchInvoices} />
                </div>
              </div>
            </div>

            {/* Desktop Layout (>= sm) */}
            <div className="hidden sm:flex items-center justify-between gap-3">
              <button onClick={() => toggleDetail(inv.id)} className="flex-1 min-w-0 text-left">
                <div className="font-semibold">
                  {inv.invoice_number}{" "}
                  <span className="text-xs text-zinc-400">
                    {inv.is_manual ? "(manual)" : "(auto)"}
                  </span>
                  <svg
                    className={`inline-block ml-2 transition-transform ${expandedId === inv.id ? 'rotate-180' : ''}`}
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
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <div className="text-sm text-zinc-400">
                  {formatDateDMY(inv.tanggal)} &bull; {inv.kepada_yth}
                </div>
                {inv.order_notes && inv.order_notes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {inv.order_notes.map((note) => (
                      <span key={note.id} className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300">
                        {note.name} ({note.phone})
                      </span>
                    ))}
                  </div>
                )}
              </button>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold">
                    Rp {new Intl.NumberFormat("id-ID").format(inv.total_ongkir)}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {new Date(inv.created_at).toLocaleString("id-ID")}
                  </div>
                  {inv.updated_at && (
                    <div className="text-[10px] text-amber-400/70 mt-0.5">
                      Updated: {new Date(inv.updated_at).toLocaleString("id-ID")}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <EditButton invoiceId={inv.id} />
                  <DownloadPdfButton invoiceId={inv.id} invoiceNumber={inv.invoice_number} />
                  <DeleteButton invoiceId={inv.id} onDelete={fetchInvoices} />
                </div>
              </div>
            </div>
            </div>

            {/* Expandable Detail Showcase Table */}
            {expandedId === inv.id && (
              <div className="border-t border-zinc-800 bg-zinc-950/30 p-4">
                {loadingDetail === inv.id ? (
                  <div className="text-center py-4 text-sm text-zinc-400">Loading detail...</div>
                ) : detailCache[inv.id] ? (
                  <InvoiceShowcase detail={detailCache[inv.id]} />
                ) : (
                  <div className="text-center py-4 text-sm text-zinc-400">Gagal memuat detail</div>
                )}
              </div>
            )}
          </div>
        ))
        )}
      </div>
    </div>
  );
}

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function InvoiceShowcase({ detail }: { detail: InvoiceDetail }) {
  const totalOngkir = detail.items.reduce((sum, it) => sum + (it.ongkir || 0), 0);
  const totalKuli = detail.items.reduce((sum, it) => sum + (it.kuli || 0), 0);
  const totalUangMakan = detail.items.reduce((sum, it) => sum + (it.uang_makan || 0), 0);
  const grandTotal = totalOngkir + totalKuli + totalUangMakan;

  return (
    <div className="space-y-4">
      {/* Invoice Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <span className="text-zinc-500 block text-xs">Kepada Yth</span>
          <span className="text-zinc-200">{detail.kepada_yth}</span>
        </div>
        <div>
          <span className="text-zinc-500 block text-xs">Tanggal</span>
          <span className="text-zinc-200">{formatDateDMY(detail.tanggal)}</span>
        </div>
        <div>
          <span className="text-zinc-500 block text-xs">Bank</span>
          <span className="text-zinc-200">{detail.bank_name || "-"}</span>
        </div>
        <div>
          <span className="text-zinc-500 block text-xs">TTD</span>
          <span className="text-zinc-200">{detail.signature_name || "-"}</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700 text-zinc-400 text-xs">
              <th className="text-left py-2 pr-2 font-medium">No</th>
              <th className="text-left py-2 pr-2 font-medium">Tanggal</th>
              <th className="text-left py-2 pr-2 font-medium">NoPol</th>
              <th className="text-left py-2 pr-2 font-medium">Tujuan</th>
              <th className="text-left py-2 pr-2 font-medium">Jenis</th>
              <th className="text-right py-2 pr-2 font-medium">Ongkir</th>
              <th className="text-right py-2 pr-2 font-medium">Kuli</th>
              <th className="text-right py-2 pr-2 font-medium">U. Makan</th>
              <th className="text-left py-2 font-medium">Ket.</th>
            </tr>
          </thead>
          <tbody>
            {detail.items.map((item, idx) => (
              <tr key={item.id || idx} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                <td className="py-2 pr-2 text-zinc-400">{idx + 1}</td>
                <td className="py-2 pr-2 text-zinc-300 whitespace-nowrap">{formatDateDMY(item.tanggal_item)}</td>
                <td className="py-2 pr-2 text-zinc-200 font-mono text-xs whitespace-nowrap">{item.nopol}</td>
                <td className="py-2 pr-2 text-zinc-200">{item.tujuan}</td>
                <td className="py-2 pr-2 text-zinc-300">{item.jenis || "-"}</td>
                <td className="py-2 pr-2 text-right text-zinc-200 whitespace-nowrap">{formatIDR(item.ongkir)}</td>
                <td className="py-2 pr-2 text-right text-zinc-300 whitespace-nowrap">{item.kuli ? formatIDR(item.kuli) : "-"}</td>
                <td className="py-2 pr-2 text-right text-zinc-300 whitespace-nowrap">{item.uang_makan ? formatIDR(item.uang_makan) : "-"}</td>
                <td className="py-2 text-zinc-400 text-xs">{item.keterangan || "-"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-700">
              <td colSpan={5} className="py-2 text-right text-zinc-400 font-medium text-xs">TOTAL</td>
              <td className="py-2 pr-2 text-right text-zinc-100 font-semibold whitespace-nowrap">{formatIDR(totalOngkir)}</td>
              <td className="py-2 pr-2 text-right text-zinc-200 whitespace-nowrap">{totalKuli ? formatIDR(totalKuli) : "-"}</td>
              <td className="py-2 pr-2 text-right text-zinc-200 whitespace-nowrap">{totalUangMakan ? formatIDR(totalUangMakan) : "-"}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={5} className="py-1 text-right text-zinc-300 font-semibold text-xs">GRAND TOTAL</td>
              <td colSpan={3} className="py-1 text-right text-lg font-bold text-zinc-50 whitespace-nowrap">Rp {formatIDR(grandTotal)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 pt-2">
        <Link
          href={`/invoices/${detail.id}/edit`}
          className="rounded-lg bg-blue-500/10 border border-blue-500/30 px-4 py-2 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
        >
          Edit Invoice
        </Link>
        <a
          href={`/api/invoices/${detail.id}/pdf`}
          download={`invoice-${detail.invoice_number}.pdf`}
          className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
        >
          Download PDF
        </a>
      </div>
    </div>
  );
}