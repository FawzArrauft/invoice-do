"use client";

import { useMemo, useState, useEffect } from "react";

type Item = {
  nopol: string;
  tujuan: string;
  jenis: string;
  ongkir: number;
  berat: number;
  kuli: number;
  keterangan: string;
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function CreateInvoicePage() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [kepadaYth, setKepadaYth] = useState("");

  const [items, setItems] = useState<Item[]>([
    { nopol: "", tujuan: "", jenis: "", ongkir: 0, berat: 0, kuli: 0, keterangan: "" },
  ]);

  const [footerTanggal, setFooterTanggal] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [bankName, setBankName] = useState("");
  const [noRekening, setNoRekening] = useState("");
  const [namaRekening, setNamaRekening] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [useDefaultSignature, setUseDefaultSignature] = useState(true);
  const [defaultSignatureUrl, setDefaultSignatureUrl] = useState("");
  const [defaultSignatureName, setDefaultSignatureName] = useState("");
  const [savingDefault, setSavingDefault] = useState(false);

  // Load default signature on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const json = await res.json();
        if (json.data) {
          const url = json.data.default_signature_url || "";
          const name = json.data.default_signature_name || "";
          setDefaultSignatureUrl(url);
          setDefaultSignatureName(name);
          // Auto-fill jika ada default
          if (url) setSignatureUrl(url);
          if (name) setSignatureName(name);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    loadSettings();
  }, []);

  // Sync signature berdasarkan toggle
  useEffect(() => {
    if (useDefaultSignature && defaultSignatureUrl) {
      setSignatureUrl(defaultSignatureUrl);
      setSignatureName(defaultSignatureName);
    }
  }, [useDefaultSignature, defaultSignatureUrl, defaultSignatureName]);

  const totalOngkir = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.ongkir) || 0), 0),
    [items],
  );

  const totalKuli = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.kuli) || 0), 0),
    [items],
  );

  const total = totalOngkir + totalKuli;

  function updateItem(i: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    );
  }

  function addRow() {
    setItems((prev) => [
      ...prev,
      { nopol: "", tujuan: "", jenis: "", ongkir: 0, berat: 0, kuli: 0, keterangan: "" },
    ]);
  }

  function removeRow(i: number) {
    setItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i),
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
      setUseDefaultSignature(false);
    } finally {
      setUploading(false);
    }
  }

  async function saveAsDefaultSignature() {
    if (!signatureUrl) {
      alert("Upload tanda tangan dulu sebelum menyimpan sebagai default");
      return;
    }
    setSavingDefault(true);
    try {
      // Save URL
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "default_signature_url", value: signatureUrl }),
      });
      // Save Name
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "default_signature_name", value: signatureName }),
      });
      setDefaultSignatureUrl(signatureUrl);
      setDefaultSignatureName(signatureName);
      setUseDefaultSignature(true);
      alert("Tanda tangan default berhasil disimpan!");
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan tanda tangan default");
    } finally {
      setSavingDefault(false);
    }
  }

  async function saveInvoice() {
    const payload = {
      invoiceNumber,
      tanggal,
      kepadaYth,
      items: items.map((it) => ({
        nopol: it.nopol || "",
        tujuan: it.tujuan || "",
        jenis: it.jenis || "",
        ongkir: Number(it.ongkir) || 0,
        berat: Number(it.berat) || 0,
        kuli: Number(it.kuli) || 0,
        keterangan: it.keterangan || "",
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
      if (!it.jenis.trim()) {
        alert(`Row ${index + 1}: Jenis wajib diisi`);
        return;
      }
      if (!it.nopol.trim()) {
        alert(`Row ${index + 1}: NoPol wajib diisi`);
        return;
      }
    }

    const res = await fetch("/api/invoices/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Failed");
      return;
    }
    alert("Invoice saved successfully");
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Create Invoice</h1>
          <p className="text-sm text-zinc-400">
            Dark modern • mobile friendly • IDR
          </p>
        </div>
        <a
          href="/invoices"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm"
        >
          Invoice List
        </a>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Invoice Number (optional)">
            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              placeholder="Leave empty for auto (INV-YYYY-0001)"
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
          {items.map((it, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3 sm:p-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <Label>NoPol *</Label>
                  <input
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                    value={it.nopol}
                    onChange={(e) => updateItem(i, { nopol: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-3">
                  <Label>Tujuan *</Label>
                  <input
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                    value={it.tujuan}
                    onChange={(e) => updateItem(i, { tujuan: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-3">
                  <Label>Jenis *</Label>
                  <input
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                    value={it.jenis}
                    onChange={(e) => updateItem(i, { jenis: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-3">
                  <Label>Ongkir (IDR)</Label>
                  <input
                    inputMode="numeric"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                    value={it.ongkir}
                    onChange={(e) =>
                      updateItem(i, { ongkir: Number(e.target.value || 0) })
                    }
                  />
                </div>

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

                <div className="sm:col-span-3">
                  <Label>Keterangan</Label>
                  <input
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                    value={it.keterangan}
                    onChange={(e) =>
                      updateItem(i, { keterangan: e.target.value })
                    }
                  />
                </div>

                <div className="sm:col-span-1 flex sm:flex-col items-center justify-between gap-5">
                  <span className="text-xs text-zinc-400 sm:mt-7">
                    Row {i + 1}
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
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-300 font-medium">Tanda Tangan</label>
              {defaultSignatureUrl && (
                <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useDefaultSignature}
                    onChange={(e) => setUseDefaultSignature(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900"
                  />
                  Gunakan tanda tangan default
                </label>
              )}
            </div>

            {useDefaultSignature && defaultSignatureUrl ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-xs text-zinc-400 mb-2">Tanda Tangan Default</p>
                <img
                  src={defaultSignatureUrl}
                  alt="default signature"
                  className="h-20 object-contain"
                />
                <p className="text-sm text-zinc-300 mt-2">{defaultSignatureName}</p>
              </div>
            ) : (
              <>
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
                    <p className="text-xs text-zinc-400 mt-2">Uploaded</p>
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

                {signatureUrl && (
                  <button
                    type="button"
                    onClick={saveAsDefaultSignature}
                    disabled={savingDefault}
                    className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {savingDefault ? "Menyimpan..." : "Simpan sebagai tanda tangan default"}
                  </button>
                )}
              </>
            )}
          </div>
          </div>

        <button
          onClick={saveInvoice}
          className="mt-6 w-full sm:w-auto rounded-xl bg-white text-zinc-950 px-6 py-3 font-medium"
        >
          Save Invoice
        </button>
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
