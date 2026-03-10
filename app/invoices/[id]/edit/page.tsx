"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { NopolInput } from "@/components/NopolInput";
import { IDRInput } from "@/components/IDRInput";
import { SearchableSelect } from "@/components/SearchableSelect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";

type ItemType = "default" | "murti" | "japfa";

type ExtraCharge = {
  amount: number;
  label: string;
};

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
  extra_charges: ExtraCharge[];
  is_empty_row: boolean;
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

type Pabrik = {
  id: string;
  name: string;
  tujuan: string;
  jenis: string;
  ongkir: number;
  berat: number;
  kuli: number;
  uang_makan: number;
  keterangan: string;
};

type ValidationErrors = {
  kepadaYth?: string;
  tanggal?: string;
  signatureName?: string;
  items: Record<number, { nopol?: string; tujuan?: string }>;
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
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

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({ items: {} });
  const [showValidation, setShowValidation] = useState(false);

  // Pabrik dropdown state
  const [pabrikList, setPabrikList] = useState<Pabrik[]>([]);
  const [loadingPabrik, setLoadingPabrik] = useState(false);

  // Refs for auto-scroll
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Ref for bottom "Add Row" button area
  const bottomAddRowRef = useRef<HTMLDivElement | null>(null);

  // Ref for kepada yth field
  const kepadaYthRef = useRef<HTMLInputElement | null>(null);

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
                extra_charges: it.extra_charges || [],
                is_empty_row: it.is_empty_row || false,
              }))
            : [{ type: "default" as ItemType, nopol: "", tujuan: "", jenis: "", ongkir: 0, berat: 0, kuli: 0, uang_makan: 0, keterangan: "", tanggal_item: "", extra_charges: [], is_empty_row: false }]
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

  // Load pabrik list on mount
  useEffect(() => {
    async function loadPabrik() {
      setLoadingPabrik(true);
      try {
        const res = await fetch("/api/settings/pabrik");
        const json = await res.json();
        if (json.data) setPabrikList(json.data);
      } catch (err) {
        console.error("Failed to load pabrik:", err);
      } finally {
        setLoadingPabrik(false);
      }
    }
    loadPabrik();
  }, []);

  // Handle pabrik selection for a specific item
  function handlePabrikChange(itemIndex: number, pabrikId: string) {
    const selected = pabrikList.find((p) => p.id === pabrikId);
    if (selected) {
      updateItem(itemIndex, {
        tujuan: selected.tujuan,
        jenis: selected.jenis,
        ongkir: selected.ongkir,
        berat: selected.berat,
        kuli: selected.kuli,
        uang_makan: selected.uang_makan,
        keterangan: selected.keterangan,
      });
    }
  }

  // Validate form and return errors
  function validateForm(): ValidationErrors {
    const errors: ValidationErrors = { items: {} };
    if (!kepadaYth.trim()) errors.kepadaYth = "Kepada Yth wajib diisi";
    if (!tanggal.trim()) errors.tanggal = "Tanggal wajib diisi";
    if (!signatureName.trim()) errors.signatureName = "Nama tanda tangan wajib diisi";

    items.forEach((it, index) => {
      if (it.is_empty_row) return; // skip empty rows
      const itemErrors: { nopol?: string; tujuan?: string } = {};
      if (!it.nopol.trim()) itemErrors.nopol = "NoPol wajib diisi";
      if (!it.tujuan.trim()) itemErrors.tujuan = "Tujuan wajib diisi";
      if (Object.keys(itemErrors).length > 0) {
        errors.items[index] = itemErrors;
      }
    });

    return errors;
  }

  // Check if there are any errors
  function hasErrors(errors: ValidationErrors): boolean {
    return !!errors.kepadaYth || !!errors.tanggal || !!errors.signatureName || Object.keys(errors.items).length > 0;
  }

  // Sort items by tanggal_item for display (earlier dates first), empty rows at end
  const sortedItemsWithIndex = useMemo(() => {
    const normal = items
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => !item.is_empty_row)
      .sort((a, b) => {
        const dateA = a.item.tanggal_item ? new Date(a.item.tanggal_item).getTime() : 0;
        const dateB = b.item.tanggal_item ? new Date(b.item.tanggal_item).getTime() : 0;
        return dateA - dateB;
      });
    const empty = items
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => item.is_empty_row);
    return [...normal, ...empty];
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

  const totalExtraCharges = useMemo(
    () => items.reduce((sum, it) => sum + it.extra_charges.reduce((s, ec) => s + (Number(ec.amount) || 0), 0), 0),
    [items]
  );

  const total = totalOngkir + totalKuli + totalUangMakan + totalExtraCharges;

  function updateItem(i: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it))
    );
    // Clear validation errors for this item when user types
    if (showValidation) {
      setValidationErrors((prev) => {
        const newItems = { ...prev.items };
        if (newItems[i]) {
          if (patch.nopol !== undefined && patch.nopol.trim()) delete newItems[i].nopol;
          if (patch.tujuan !== undefined && patch.tujuan.trim()) delete newItems[i].tujuan;
          if (newItems[i] && Object.keys(newItems[i]).length === 0) delete newItems[i];
        }
        return { ...prev, items: newItems };
      });
    }
  }

  function addRow() {
    const newIndex = items.length;
    setItems((prev) => [
      ...prev,
      { type: "default", nopol: "", tujuan: "", jenis: "", ongkir: 0, berat: 0, kuli: 0, uang_makan: 0, keterangan: "", tanggal_item: new Date().toISOString().slice(0, 10), extra_charges: [], is_empty_row: false },
    ]);
    setTimeout(() => {
      const newRowEl = itemRefs.current[newIndex];
      if (newRowEl) {
        newRowEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }

  function addEmptyRow() {
    setItems((prev) => [
      ...prev,
      { type: "default", nopol: "", tujuan: "", jenis: "", ongkir: 0, berat: 0, kuli: 0, uang_makan: 0, keterangan: "", tanggal_item: "", extra_charges: [], is_empty_row: true },
    ]);
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
    // Run validation first
    const errors = validateForm();
    setValidationErrors(errors);
    setShowValidation(true);

    if (hasErrors(errors)) {
      // Collect all error messages
      const messages: string[] = [];
      if (errors.kepadaYth) messages.push(errors.kepadaYth);
      if (errors.tanggal) messages.push(errors.tanggal);
      if (errors.signatureName) messages.push(errors.signatureName);
      Object.entries(errors.items).forEach(([idx, errs]) => {
        const rowNum = Number(idx) + 1;
        if (errs.nopol) messages.push(`Row ${rowNum}: ${errs.nopol}`);
        if (errs.tujuan) messages.push(`Row ${rowNum}: ${errs.tujuan}`);
      });
      showToast(messages.join(" • "), "error");

      // Scroll to first error
      if (errors.kepadaYth || errors.tanggal) {
        kepadaYthRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        const firstErrorIdx = Number(Object.keys(errors.items)[0]);
        itemRefs.current[firstErrorIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

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
        extra_charges: it.extra_charges || [],
        is_empty_row: it.is_empty_row || false,
      })),
      footerTanggal,
      bankName,
      noRekening,
      namaRekening,
      signatureUrl,
      signatureName,
    };

    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error || "Failed", "error");
        return;
      }
      showToast("Invoice updated successfully", "success");
      router.push("/invoices");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">Error: {error}</div>;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Invoice Number">
            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              placeholder="Invoice number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </Field>

          <Field label="Tanggal *" error={showValidation ? validationErrors.tanggal : undefined}>
            <input
              type="date"
              className={`w-full rounded-xl border ${showValidation && validationErrors.tanggal ? 'border-red-500 bg-red-950/20' : 'border-zinc-800 bg-zinc-950'} px-4 py-3 outline-none focus:border-zinc-600`}
              value={tanggal}
              onChange={(e) => {
                setTanggal(e.target.value);
                if (showValidation && e.target.value.trim()) {
                  setValidationErrors((prev) => ({ ...prev, tanggal: undefined }));
                }
              }}
            />
          </Field>

          <Field label="Kepada Yth *" error={showValidation ? validationErrors.kepadaYth : undefined}>
            <input
              ref={kepadaYthRef}
              required
              className={`w-full rounded-xl border ${showValidation && validationErrors.kepadaYth ? 'border-red-500 bg-red-950/20' : 'border-zinc-800 bg-zinc-950'} px-4 py-3 outline-none focus:border-zinc-600`}
              placeholder="Nama Perusahaan"
              value={kepadaYth}
              onChange={(e) => {
                setKepadaYth(e.target.value);
                if (showValidation && e.target.value.trim()) {
                  setValidationErrors((prev) => ({ ...prev, kepadaYth: undefined }));
                }
              }}
            />
          </Field>
        </div>
      </div>

      {/* Items */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Items</h2>
          <div className="flex gap-2">
            <button
              onClick={addEmptyRow}
              className="rounded-xl border border-dashed border-zinc-600 text-zinc-400 px-4 py-2 text-sm font-medium hover:bg-zinc-900"
            >
              + Empty Row
            </button>
            <button
              onClick={addRow}
              className="rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-medium"
            >
              + Add Row
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {sortedItemsWithIndex.map(({ item: it, originalIndex: i }, displayIndex) => {
            if (it.is_empty_row) {
              return (
                <div
                  key={i}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/20 p-3 sm:p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                      Empty Row
                    </span>
                    <span className="text-[11px] text-zinc-500">Row kosong untuk cetak PDF</span>
                  </div>
                  <button
                    onClick={() => removeRow(i)}
                    className="rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
                  >
                    Remove
                  </button>
                </div>
              );
            }
            return (
            <div
              key={i}
              ref={(el) => { itemRefs.current[i] = el; }}
              className={`rounded-2xl border ${showValidation && validationErrors.items[i] ? 'border-red-500/50' : 'border-zinc-800'} bg-zinc-950/40 p-4 sm:p-5`}
            >
              {/* Row header: badge + row number + remove */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-800/50 rounded-lg px-2 py-0.5">
                    Row {displayIndex + 1}
                  </span>
                </div>
                <button
                  onClick={() => removeRow(i)}
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/30 hover:border-red-500/30 transition-colors"
                >
                  Remove
                </button>
              </div>

              {/* Validation error banner */}
              {showValidation && validationErrors.items[i] && (
                <div className="mb-3 rounded-lg bg-red-950/30 border border-red-500/30 px-3 py-1.5 text-xs text-red-400">
                  {Object.values(validationErrors.items[i]).join(" \u2022 ")}
                </div>
              )}

              {/* Row 1: Tipe, Tanggal, NoPol, Pabrik */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <div>
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

                <div>
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

                <div>
                  <Label>NoPol *</Label>
                  <div className={showValidation && validationErrors.items[i]?.nopol ? 'rounded-xl ring-1 ring-red-500' : ''}>
                    <NopolInput
                      value={it.nopol}
                      onChange={(val) => updateItem(i, { nopol: val })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Pabrik</Label>
                  <SearchableSelect
                    options={pabrikList.map((p) => ({
                      value: p.id,
                      label: p.name,
                      description: p.tujuan ? `→ ${p.tujuan}` : undefined,
                    }))}
                    value=""
                    onChange={(val) => handlePabrikChange(i, val)}
                    placeholder={loadingPabrik ? "Loading..." : "-- Pilih Pabrik --"}
                    disabled={loadingPabrik}
                    loading={loadingPabrik}
                  />
                </div>
              </div>

              {/* Row 2: Tujuan, Jenis, Ongkir, Berat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <div>
                  <Label>Tujuan *</Label>
                  <input
                    className={`w-full rounded-xl border ${showValidation && validationErrors.items[i]?.tujuan ? 'border-red-500 bg-red-950/20' : 'border-zinc-800 bg-zinc-950'} px-4 py-3 outline-none focus:border-zinc-600`}
                    value={it.tujuan}
                    readOnly={it.type === "japfa"}
                    onChange={(e) => updateItem(i, { tujuan: e.target.value })}
                  />
                </div>

                {(it.type === "default" || it.type === "japfa") && (
                  <div>
                    <Label>Jenis</Label>
                    <input
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                      value={it.jenis}
                      onChange={(e) => updateItem(i, { jenis: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <Label>{it.type === "murti" ? "Biaya Kirim (IDR)" : "Ongkir (IDR)"}</Label>
                  <IDRInput
                    value={it.ongkir}
                    onChange={(val) => updateItem(i, { ongkir: val })}
                  />
                </div>

                <div>
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
              </div>

              {/* Row 3: Kuli/UangMakan, Keterangan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {it.type !== "japfa" && (
                  <div>
                    <Label>Kuli (IDR)</Label>
                    <IDRInput
                      value={it.kuli}
                      onChange={(val) => updateItem(i, { kuli: val })}
                    />
                  </div>
                )}

                {it.type === "japfa" && (
                  <div>
                    <Label>Uang Makan (IDR)</Label>
                    <IDRInput
                      value={it.uang_makan}
                      onChange={(val) => updateItem(i, { uang_makan: val })}
                    />
                  </div>
                )}

                <div className="sm:col-span-1 lg:col-span-3">
                  <Label>Keterangan</Label>
                  <input
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                    value={it.keterangan}
                    onChange={(e) =>
                      updateItem(i, { keterangan: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Extra Charges */}
              <div className="mt-3 pt-3 border-t border-zinc-800/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-400">Biaya Tambahan</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...it.extra_charges, { amount: 0, label: "" }];
                      updateItem(i, { extra_charges: updated });
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    title="Tambah biaya lainnya"
                  >
                    <FontAwesomeIcon icon={faCirclePlus} className="w-3.5 h-3.5" />
                    Tambah
                  </button>
                </div>
                {it.extra_charges.length > 0 && (
                  <div className="space-y-2">
                    {it.extra_charges.map((ec, ecIdx) => (
                      <div key={ecIdx} className="flex items-center gap-2">
                        <input
                          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                          placeholder="Keterangan (mis: Kuli tambahan)"
                          value={ec.label}
                          onChange={(e) => {
                            const updated = [...it.extra_charges];
                            updated[ecIdx] = { ...updated[ecIdx], label: e.target.value };
                            updateItem(i, { extra_charges: updated });
                          }}
                        />
                        <div className="w-36 sm:w-44">
                          <IDRInput
                            value={ec.amount}
                            onChange={(val) => {
                              const updated = [...it.extra_charges];
                              updated[ecIdx] = { ...updated[ecIdx], amount: val };
                              updateItem(i, { extra_charges: updated });
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = it.extra_charges.filter((_, idx) => idx !== ecIdx);
                            updateItem(i, { extra_charges: updated });
                          }}
                          className="rounded-lg border border-zinc-800 px-2 py-2 text-xs text-red-400 hover:bg-red-950/30"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div className="text-right text-xs text-zinc-400">
                      Subtotal tambahan: Rp {formatIDR(it.extra_charges.reduce((s, ec) => s + (Number(ec.amount) || 0), 0))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
          })}
        </div>

        {/* Bottom Add Row button */}
        <div ref={bottomAddRowRef} className="mt-4 flex justify-end gap-2">
          <button
            onClick={addEmptyRow}
            className="rounded-xl border border-dashed border-zinc-600 text-zinc-400 px-3 py-2 text-xs sm:text-sm font-medium hover:bg-zinc-900 transition-colors"
          >
            + Empty Row
          </button>
          <button
            onClick={addRow}
            className="rounded-xl bg-white text-zinc-950 px-3 py-2 text-xs sm:text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            + Add Row
          </button>
        </div>

        <div className="mt-4 border-t border-zinc-800 pt-4">
          <div className="ml-auto max-w-sm flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Total Ongkir</span>
              <span className="text-sm font-mono">Rp {formatIDR(totalOngkir)}</span>
            </div>
            {totalKuli > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Total Kuli</span>
                <span className="text-sm font-mono">Rp {formatIDR(totalKuli)}</span>
              </div>
            )}
            {totalUangMakan > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Total Uang Makan</span>
                <span className="text-sm font-mono">Rp {formatIDR(totalUangMakan)}</span>
              </div>
            )}
            {totalExtraCharges > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Total Tambahan</span>
                <span className="text-sm font-mono">Rp {formatIDR(totalExtraCharges)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-zinc-700 pt-2 mt-1">
              <span className="text-sm text-zinc-300 font-semibold">GRAND TOTAL</span>
              <span className="text-lg font-bold font-mono">Rp {formatIDR(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
        <h2 className="font-semibold mb-4">Footer</h2>

        {/* Bank & Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </div>

        {/* Nama Rekening */}
        <div className="mt-4">
          <Field label="Nama Rekening (A/N)">
            <input
              className="w-full sm:max-w-md rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              placeholder="Nama Pemilik Rekening"
              value={namaRekening}
              onChange={(e) => setNamaRekening(e.target.value)}
            />
          </Field>
        </div>

        {/* Signature Section */}
        <div className="mt-6 pt-4 border-t border-zinc-800 space-y-4">
          <label className="text-sm text-zinc-300 font-medium">Tanda Tangan</label>

          <div className="max-w-lg space-y-4">
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
              <label className="mb-2 block text-sm text-zinc-300">Nama di bawah tanda tangan *</label>
              <input
                className={`w-full rounded-xl border ${showValidation && validationErrors.signatureName ? 'border-red-500 bg-red-950/20' : 'border-zinc-800 bg-zinc-950'} px-4 py-3 outline-none focus:border-zinc-600`}
                placeholder="Nama lengkap"
                value={signatureName}
                onChange={(e) => {
                  setSignatureName(e.target.value);
                  if (showValidation && e.target.value.trim()) {
                    setValidationErrors((prev) => ({ ...prev, signatureName: undefined }));
                  }
                }}
              />
              {showValidation && validationErrors.signatureName && (
                <p className="mt-1 text-xs text-red-400">{validationErrors.signatureName}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={saveInvoice}
            disabled={saving}
            className="rounded-xl bg-white text-zinc-950 px-8 py-3 font-medium disabled:opacity-50 hover:bg-zinc-200 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <a
            href="/invoices"
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-3 font-medium hover:bg-zinc-800 transition-colors"
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
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm text-zinc-300">{children}</label>;
}
