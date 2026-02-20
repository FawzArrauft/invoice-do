"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

type ItemType = "default" | "murti" | "japfa";

type Item = {
  id?: string;
  type: ItemType;
  nopol: string;
  tujuan: string;
  jenis: string;
  ongkir: number;
  berat: number;
  kuli: number;
  uang_makan: number;
  keterangan: string;
  tanggal_item: string;
};

type InvoiceData = {
  id: string;
  invoice_number: string;
  tanggal: string;
  kepada_yth: string;
  footer_tanggal: string;
  bank_name: string;
  no_rekening: string;
  account_name: string;
  signature_url: string;
  signature_name: string;
  items: Item[];
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [kepadaYth, setKepadaYth] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [footerTanggal, setFooterTanggal] = useState("");
  const [bankName, setBankName] = useState("");
  const [noRekening, setNoRekening] = useState("");
  const [namaRekening, setNamaRekening] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Refs for auto-scroll
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Ref for bottom "Add Row" button area
  const bottomAddRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadInvoice() {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load invoice");

        const inv: InvoiceData = json.data;
        setInvoiceNumber(inv.invoice_number || "");
        setTanggal(inv.tanggal || "");
        setKepadaYth(inv.kepada_yth || "");
        setFooterTanggal(inv.footer_tanggal || "");
        setBankName(inv.bank_name || "");
        setNoRekening(inv.no_rekening || "");
        setNamaRekening(inv.account_name || "");
        setSignatureName(inv.signature_name || "");
        setSignatureUrl(inv.signature_url || "");

        setItems(
          inv.items?.length > 0
            ? inv.items.map((it) => ({
                id: it.id,
                type: (it.type as ItemType) || "default",
                nopol: it.nopol || "",
                tujuan: it.tujuan || "",
                jenis: it.jenis || "",
                ongkir: it.ongkir || 0,
                berat: it.berat || 0,
                kuli: it.kuli || 0,
                uang_makan: it.uang_makan || 0,
                keterangan: it.keterangan || "",
                tanggal_item: it.tanggal_item || "",
              }))
            : [{ type: "default" as ItemType, nopol: "", tujuan: "", jenis: "", ongkir: 0, berat: 0, kuli: 0, uang_makan: 0, keterangan: "", tanggal_item: "" }]
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading invoice");
      } finally {
        setLoading(false);
      }
    }

    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  // Sort items by tanggal_item for display (earlier dates first)
  const sortedItemsWithIndex = useMemo(() => {
    return items
      .map((item, originalIndex) => ({ item, originalIndex }))
      .sort((a, b) => {
        const dateA = a.item.tanggal_item ? new Date(a.item.tanggal_item).getTime() : 0;
        const dateB = b.item.tanggal_item ? new Date(b.item.tanggal_item).getTime() : 0;
        return dateA - dateB;
      });
  }, [items]);

  const totalOngkir = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.ongkir) || 0), 0),
    [items]
  );

  const totalKuli = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.kuli) || 0), 0),
    [items]
  );

  const totalUangMakan = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.uang_makan) || 0), 0),
    [items]
  );

  const total = totalOngkir + totalKuli + totalUangMakan;

  function updateItem(i: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it))
    );
  }

  function addRow() {
    setItems((prev) => [
      ...prev,
      { type: "default", nopol: "", tujuan: "", jenis: "", ongkir: 0, berat: 0, kuli: 0, uang_makan: 0, keterangan: "", tanggal_item: new Date().toISOString().slice(0, 10) },
    ]);
    // Auto-scroll to bottom add row area after render
    setTimeout(() => {
      if (bottomAddRowRef.current) {
        bottomAddRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }

  function removeRow(i: number) {
    setItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)
    );
  }

  async function uploadSignature(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-signature", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setSignatureUrl(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function saveInvoice() {
    const payload = {
      invoiceNumber,
      tanggal,
      kepadaYth,
      items: items.map((it) => ({
        id: it.id,
        type: it.type || "default",
        nopol: it.nopol || "",
        tujuan: it.tujuan || "",
        jenis: it.jenis || "",
        ongkir: Number(it.ongkir) || 0,
        berat: Number(it.berat) || 0,
        kuli: Number(it.kuli) || 0,
        uang_makan: Number(it.uang_makan) || 0,
        keterangan: it.keterangan || "",
        tanggal_item: it.tanggal_item || "",
      })),
      footerTanggal,
      bankName,
      noRekening,
      namaRekening,
      signatureUrl,
      signatureName,
    };

    for (const [index, it] of items.entries()) {
      if (!it.tujuan.trim()) {
        alert(`Row ${index + 1}: Tujuan wajib diisi`);
        return;
      }
      if (!it.nopol.trim()) {
        alert(`Row ${index + 1}: NoPol wajib diisi`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Failed");
        return;
      }
      alert("Invoice updated successfully");
      router.push("/invoices");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">Error: {error}</div>;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Edit Invoice</h1>
          <p className="text-sm text-zinc-400">{invoiceNumber}</p>
        </div>
        <a
          href="/invoices"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm"
        >
          Back to List
        </a>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Invoice Number">
            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              placeholder="Invoice number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </Field>

          <Field label="Tanggal">
            <input
              type="date"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
          </Field>

          <Field label="Kepada Yth *">
            <input
              required
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              placeholder="Nama Perusahaan"
              value={kepadaYth}
              onChange={(e) => setKepadaYth(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Items */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Items</h2>
          <button
            onClick={addRow}
            className="rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-medium"
          >
            + Add Row
          </button>
        </div>

        <div className="space-y-3">
          {sortedItemsWithIndex.map(({ item: it, originalIndex: i }, displayIndex) => (
            <div
              key={i}
              ref={(el) => { itemRefs.current[i] = el; }}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3 sm:p-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Type Selector */}
                <div className="sm:col-span-2">
                  <Label>Tipe</Label>
                  <select
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                    value={it.type}
                    onChange={(e) => {
                      const newType = e.target.value as ItemType;
                      const patch: Partial<Item> = { type: newType };
                      if (newType === "japfa") {
                        patch.tujuan = "JAPFA SIDOARJO";
                      }
                      updateItem(i, patch);
                    }}
                  >
                    <option value="default">Default</option>
                    <option value="murti">Murti</option>
                    <option value="japfa">Japfa</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <Label>Tanggal</Label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                    value={it.tanggal_item}
                    onChange={(e) =>
                      updateItem(i, { tanggal_item: e.target.value })
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label>NoPol *</Label>
                  <input
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                    value={it.nopol}
                    onChange={(e) => updateItem(i, { nopol: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label>Tujuan *</Label>
                  <input
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                    value={it.tujuan}
                    readOnly={it.type === "japfa"}
                    onChange={(e) => updateItem(i, { tujuan: e.target.value })}
                  />
                </div>

                {/* Jenis - Show for Default and Japfa type */}
                {(it.type === "default" || it.type === "japfa") && (
                  <div className="sm:col-span-2">
                    <Label>Jenis</Label>
                    <input
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                      value={it.jenis}
                      onChange={(e) => updateItem(i, { jenis: e.target.value })}
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <Label>{it.type === "murti" ? "Biaya Kirim (IDR)" : "Ongkir (IDR)"}</Label>
                  <input
                    inputMode="numeric"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                    value={it.ongkir}
                    onChange={(e) =>
                      updateItem(i, { ongkir: Number(e.target.value || 0) })
                    }
                  />
                </div>

                {/* Berat - Show for Default type (before Kuli) */}
                {it.type === "default" && (
                  <div className="sm:col-span-2">
                    <Label>Berat</Label>
                    <input
                      inputMode="numeric"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                      value={it.berat}
                      onChange={(e) =>
                        updateItem(i, { berat: Number(e.target.value || 0) })
                      }
                    />
                  </div>
                )}

                {/* Kuli - Show for non-Japfa types */}
                {it.type !== "japfa" && (
                  <div className="sm:col-span-2">
                    <Label>Kuli (IDR)</Label>
                    <input
                      inputMode="numeric"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                      value={it.kuli}
                      onChange={(e) =>
                        updateItem(i, { kuli: Number(e.target.value || 0) })
                      }
                    />
                  </div>
                )}

                {/* Uang Makan - Show only for Japfa type */}
                {it.type === "japfa" && (
                  <div className="sm:col-span-2">
                    <Label>Uang Makan (IDR)</Label>
                    <input
                      inputMode="numeric"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                      value={it.uang_makan}
                      onChange={(e) =>
                        updateItem(i, { uang_makan: Number(e.target.value || 0) })
                      }
                    />
                  </div>
                )}

                {/* Berat - Show for Murti/Japfa type (after Kuli) */}
                {(it.type === "murti" || it.type === "japfa") && (
                  <div className="sm:col-span-2">
                    <Label>Berat</Label>
                    <input
                      inputMode="numeric"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                      value={it.berat}
                      onChange={(e) =>
                        updateItem(i, { berat: Number(e.target.value || 0) })
                      }
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <Label>Keterangan</Label>
                  <input
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                    value={it.keterangan}
                    onChange={(e) =>
                      updateItem(i, { keterangan: e.target.value })
                    }
                  />
                </div>

                <div className="sm:col-span-2 flex sm:flex-col items-center justify-between gap-5">
                  <span className="text-xs text-zinc-400 sm:mt-7">
                    Row {displayIndex + 1}
                  </span>
                  <button
                    onClick={() => removeRow(i)}
                    className="rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Add Row button - avoids scrolling back up */}
        <div ref={bottomAddRowRef} className="mt-3 flex justify-end">
          <button
            onClick={addRow}
            className="rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-medium"
          >
            + Add Row
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-zinc-800 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Total Ongkir</span>
            <span className="text-sm">Rp {formatIDR(totalOngkir)}</span>
          </div>
          {totalKuli > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Total Kuli</span>
              <span className="text-sm">Rp {formatIDR(totalKuli)}</span>
            </div>
          )}
          {totalUangMakan > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Total Uang Makan</span>
              <span className="text-sm">Rp {formatIDR(totalUangMakan)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400 font-semibold">GRAND TOTAL</span>
            <span className="text-lg font-semibold">Rp {formatIDR(total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
        <h2 className="font-semibold mb-3">Footer</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Footer Tanggal">
            <input
              type="date"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              value={footerTanggal}
              onChange={(e) => setFooterTanggal(e.target.value)}
            />
          </Field>

          <Field label="Nama Bank">
            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              placeholder="BCA"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </Field>

          <Field label="No Rekening">
            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              placeholder="1234567890"
              value={noRekening}
              onChange={(e) => setNoRekening(e.target.value)}
            />
          </Field>

          <Field label="Nama Rekening (A/N)">
            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              placeholder="Nama Pemilik Rekening"
              value={namaRekening}
              onChange={(e) => setNamaRekening(e.target.value)}
            />
          </Field>

          {/* Signature Section */}
          <div className="sm:col-span-2 space-y-4">
            <label className="text-sm text-zinc-300 font-medium">Tanda Tangan</label>

            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadSignature(f);
                }}
                className="block w-full text-sm text-zinc-300
                           file:mr-4 file:rounded-xl file:border-0
                           file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-950"
              />
              {uploading && (
                <span className="text-xs text-zinc-400">Uploading…</span>
              )}
            </div>

            {signatureUrl && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                <img
                  src={signatureUrl}
                  alt="signature"
                  className="h-20 object-contain"
                />
                <p className="text-xs text-zinc-400 mt-2">Current Signature</p>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm text-zinc-300">Nama di bawah tanda tangan</label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                placeholder="Nama lengkap"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={saveInvoice}
            disabled={saving}
            className="rounded-xl bg-white text-zinc-950 px-6 py-3 font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <a
            href="/invoices"
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-3 font-medium"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm text-zinc-300">{children}</label>;
}
