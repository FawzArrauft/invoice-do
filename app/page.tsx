"use client";

import { useMemo, useState, useEffect, useRef } from "react";

type ItemType = "default" | "murti" | "japfa";

type Item = {
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

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function CreateInvoicePage() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [kepadaYth, setKepadaYth] = useState("");

  const [items, setItems] = useState<Item[]>([
    { type: "default", nopol: "", tujuan: "", jenis: "", ongkir: 0, berat: 0, kuli: 0, uang_makan: 0, keterangan: "", tanggal_item: new Date().toISOString().slice(0, 10) },
  ]);

  // Ref for bottom "Add Row" button area
  const bottomAddRowRef = useRef<HTMLDivElement | null>(null);

  // Refs for auto-scroll
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // Bank dropdown state
  const [bankList, setBankList] = useState<Array<{ id: string; name: string; noRekening: string; accountName: string }>>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBankName, setNewBankName] = useState("");
  const [newNoRekening, setNewNoRekening] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [savingBank, setSavingBank] = useState(false);

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

  // Load bank accounts on mount
  useEffect(() => {
    async function loadBanks() {
      setLoadingBanks(true);
      try {
        const res = await fetch("/api/settings/banks");
        const json = await res.json();
        if (json.data) {
          setBankList(json.data);
          // Auto-select first bank if available
          if (json.data.length > 0 && !selectedBankId) {
            const firstBank = json.data[0];
            setSelectedBankId(firstBank.id);
            setBankName(firstBank.name);
            setNoRekening(firstBank.noRekening);
            setNamaRekening(firstBank.accountName);
          }
        }
      } catch (err) {
        console.error("Failed to load banks:", err);
      } finally {
        setLoadingBanks(false);
      }
    }
    loadBanks();
  }, []);

  // Handle bank selection
  function handleBankChange(bankId: string) {
    setSelectedBankId(bankId);
    const selected = bankList.find(b => b.id === bankId);
    if (selected) {
      setBankName(selected.name);
      setNoRekening(selected.noRekening);
      setNamaRekening(selected.accountName);
    } else {
      // Custom / manual entry
      setBankName("");
      setNoRekening("");
      setNamaRekening("");
    }
  }

  // Save new bank account
  async function saveNewBank() {
    if (!newBankName.trim() || !newNoRekening.trim() || !newAccountName.trim()) {
      alert("Semua field bank wajib diisi");
      return;
    }
    setSavingBank(true);
    try {
      const res = await fetch("/api/settings/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBankName,
          noRekening: newNoRekening,
          accountName: newAccountName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      
      // Add to list and select it
      const newBank = json.data;
      setBankList(prev => [newBank, ...prev]);
      setSelectedBankId(newBank.id);
      setBankName(newBank.name);
      setNoRekening(newBank.noRekening);
      setNamaRekening(newBank.accountName);
      
      // Reset form
      setNewBankName("");
      setNewNoRekening("");
      setNewAccountName("");
      setShowAddBank(false);
      
      alert("Bank berhasil disimpan!");
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan bank");
    } finally {
      setSavingBank(false);
    }
  }

  // Sync signature berdasarkan toggle
  useEffect(() => {
    if (useDefaultSignature && defaultSignatureUrl) {
      setSignatureUrl(defaultSignatureUrl);
      setSignatureName(defaultSignatureName);
    }
  }, [useDefaultSignature, defaultSignatureUrl, defaultSignatureName]);

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
    [items],
  );

  const totalKuli = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.kuli) || 0), 0),
    [items],
  );

  const totalUangMakan = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.uang_makan) || 0), 0),
    [items],
  );

  const total = totalOngkir + totalKuli + totalUangMakan;

  function updateItem(i: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
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
        type: it.type || "default",
        nopol: it.nopol || "",
        tujuan: it.tujuan || "",
        jenis: it.jenis || "",
        ongkir: Number(it.ongkir) || 0,
        berat: Number(it.berat) || 0,
        kuli: Number(it.kuli) || 0,
        uang_makan: Number(it.uang_makan) || 0,
        keterangan: it.keterangan || "",
        tanggal_item: it.tanggal_item || new Date().toISOString().slice(0, 10),
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
      // Jenis only required for default type
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
                    <Label>Jenis *</Label>
                    <input
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                      value={it.jenis}
                      onChange={(e) => updateItem(i, { jenis: e.target.value })}
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <Label>{it.type === "murti" ? "Biaya Kirim (IDR)" : it.type === "japfa" ? "Ongkir (IDR)" : "Ongkir (IDR)"}</Label>
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
            <div className="flex gap-2">
              <select
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                value={selectedBankId}
                onChange={(e) => handleBankChange(e.target.value)}
                disabled={loadingBanks}
              >
                <option value="">-- Pilih Bank --</option>
                {bankList.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name} - ****{bank.noRekening.slice(-4)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddBank(!showAddBank)}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                {showAddBank ? "×" : "+"}
              </button>
            </div>
          </Field>

          {/* Add New Bank Form */}
          {showAddBank && (
            <div className="sm:col-span-2 rounded-xl border border-zinc-700 bg-zinc-900/50 p-4 space-y-3">
              <h3 className="text-sm font-medium text-zinc-300">Tambah Bank Baru (Terenkripsi)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                  placeholder="Nama Bank (BCA, Mandiri, dll)"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                  placeholder="No Rekening"
                  value={newNoRekening}
                  onChange={(e) => setNewNoRekening(e.target.value)}
                />
                <input
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                  placeholder="Nama Pemilik Rekening"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={saveNewBank}
                disabled={savingBank}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {savingBank ? "Menyimpan..." : "Simpan Bank (Encrypted)"}
              </button>
            </div>
          )}

          <Field label="No Rekening">
            <input
              readOnly
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600 opacity-70"
              placeholder="Pilih bank dari dropdown"
              value={noRekening}
            />
          </Field>

          <Field label="Nama Rekening (A/N)">
            <input
              readOnly
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600 opacity-70"
              placeholder="Pilih bank dari dropdown"
              value={namaRekening}
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
