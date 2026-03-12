"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

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

export default function CreateInvoicePage() {
  const router = useRouter();
  const { showToast } = useToast();

  // --- Form data cache (sessionStorage) ---
  const CACHE_KEY = "create-invoice-draft";
  const isMountedRef = useRef(false);

  function loadCache() {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }
    return null;
  }

  const cached = useRef(typeof window !== "undefined" ? loadCache() : null);

  const [invoiceNumber, setInvoiceNumber] = useState(cached.current?.invoiceNumber ?? "");
  const [tanggal, setTanggal] = useState(cached.current?.tanggal ?? new Date().toISOString().slice(0, 10));
  const [kepadaYth, setKepadaYth] = useState(cached.current?.kepadaYth ?? "");

  const [items, setItems] = useState<Item[]>(
    cached.current?.items ?? [
      { type: "default", nopol: "", tujuan: "", jenis: "", ongkir: 0, berat: 0, kuli: 0, uang_makan: 0, keterangan: "", tanggal_item: new Date().toISOString().slice(0, 10), extra_charges: [], is_empty_row: false },
    ]
  );

  // Ref for bottom "Add Row" button area
  const bottomAddRowRef = useRef<HTMLDivElement | null>(null);

  // Refs for auto-scroll
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [footerTanggal, setFooterTanggal] = useState(
    cached.current?.footerTanggal ?? new Date().toISOString().slice(0, 10),
  );
  const [bankName, setBankName] = useState(cached.current?.bankName ?? "");
  const [noRekening, setNoRekening] = useState(cached.current?.noRekening ?? "");
  const [namaRekening, setNamaRekening] = useState(cached.current?.namaRekening ?? "");
  const [signatureName, setSignatureName] = useState(cached.current?.signatureName ?? "");
  const [signatureUrl, setSignatureUrl] = useState(cached.current?.signatureUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [useDefaultSignature, setUseDefaultSignature] = useState(true);
  const [defaultSignatureUrl, setDefaultSignatureUrl] = useState("");
  const [defaultSignatureName, setDefaultSignatureName] = useState("");
  const [savingDefault, setSavingDefault] = useState(false);

  // Bank dropdown state
  const [bankList, setBankList] = useState<Array<{ id: string; name: string; noRekening: string; accountName: string }>>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState(cached.current?.selectedBankId ?? "");
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBankName, setNewBankName] = useState("");
  const [newNoRekening, setNewNoRekening] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [savingBank, setSavingBank] = useState(false);

  // Pabrik dropdown state
  const [pabrikList, setPabrikList] = useState<Pabrik[]>([]);
  const [loadingPabrik, setLoadingPabrik] = useState(false);

  // Truck list for NoPol dropdown
  const [truckList, setTruckList] = useState<Array<{ id: string; nopol: string; keterangan?: string; nama_supir?: string }>>([]);

  // Order Notes state (informational - who ordered)
  const [notesList, setNotesList] = useState<Array<{ id: string; name: string; phone: string; description: string }>>([]);
  const [selectedNotes, setSelectedNotes] = useState<Array<{ id: string; name: string; phone: string }>>(cached.current?.selectedNotes ?? []);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{ kepadaYth?: string; tanggal?: string; signatureName?: string; items: Record<number, { nopol?: string; tujuan?: string }> }>({ items: {} });
  const [showValidation, setShowValidation] = useState(false);

  // --- Persist form data to sessionStorage ---
  const saveCache = useCallback(() => {
    try {
      const data = {
        invoiceNumber, tanggal, kepadaYth, items, footerTanggal,
        bankName, noRekening, namaRekening, signatureName, signatureUrl,
        selectedBankId, selectedNotes,
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch { /* quota exceeded or private mode */ }
  }, [invoiceNumber, tanggal, kepadaYth, items, footerTanggal, bankName, noRekening, namaRekening, signatureName, signatureUrl, selectedBankId, selectedNotes]);

  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return; }
    saveCache();
  }, [saveCache]);

  function clearCache() {
    try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
  }

  // Load pabrik list, notes, and trucks on mount
  useEffect(() => {
    async function loadData() {
      setLoadingPabrik(true);
      try {
        const [pabrikRes, notesRes, trucksRes] = await Promise.all([
          fetch("/api/settings/pabrik"),
          fetch("/api/notes"),
          fetch("/api/trucks"),
        ]);
        const pabrikJson = await pabrikRes.json();
        const notesJson = await notesRes.json();
        const trucksJson = await trucksRes.json();
        if (pabrikJson.data) setPabrikList(pabrikJson.data);
        if (notesJson.data) setNotesList(notesJson.data);
        if (trucksJson.data) setTruckList(trucksJson.data.map((t: { id: string; nopol: string; keterangan?: string; nama_supir?: string }) => ({ id: t.id, nopol: t.nopol, keterangan: t.keterangan || "", nama_supir: t.nama_supir || "" })));
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoadingPabrik(false);
      }
    }
    loadData();
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
      showToast("Semua field bank wajib diisi", "error");
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
      
      showToast("Bank berhasil disimpan!", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal menyimpan bank", "error");
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
  // const sortedItemsWithIndex = useMemo(() => {
  //   return items
  //     .map((item, originalIndex) => ({ item, originalIndex }))
  //     .sort((a, b) => {
  //       const dateA = a.item.tanggal_item ? new Date(a.item.tanggal_item).getTime() : 0;
  //       const dateB = b.item.tanggal_item ? new Date(b.item.tanggal_item).getTime() : 0;
  //       return dateA - dateB;
  //     });
  // }, [items]);

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

  const totalExtraCharges = useMemo(
    () => items.reduce((sum, it) => sum + it.extra_charges.reduce((s, ec) => s + (Number(ec.amount) || 0), 0), 0),
    [items],
  );

  const total = totalOngkir + totalKuli + totalUangMakan + totalExtraCharges;

  function updateItem(i: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
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

  // Helper: check if a row is "empty" (draft) — no meaningful data filled
  function isRowEmpty(item: Item): boolean {
    if (item.is_empty_row) return false; // empty rows are intentional
    return (
      !item.nopol.trim() &&
      !item.tujuan.trim() &&
      !item.jenis.trim() &&
      item.ongkir === 0 &&
      item.berat === 0 &&
      item.kuli === 0 &&
      item.uang_makan === 0 &&
      !item.keterangan.trim() &&
      item.extra_charges.length === 0
    );
  }

  function addRow() {
    const newIndex = items.length;
    setItems((prev) => [
      ...prev,
      { type: "default", nopol: "", tujuan: "", jenis: "", ongkir: 0, berat: 0, kuli: 0, uang_makan: 0, keterangan: "", tanggal_item: new Date().toISOString().slice(0, 10), extra_charges: [], is_empty_row: false },
    ]);
    // Device-specific scroll behavior:
    // Mobile (<768px): scroll to new row
    // Tablet/Desktop (>=768px): no scroll, just focus first input
    setTimeout(() => {
      const newRowEl = itemRefs.current[newIndex];
      if (newRowEl) {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          newRowEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        // Focus the first focusable input in the new row
        const firstInput = newRowEl.querySelector<HTMLElement>(
          'input, select, [tabindex]'
        );
        if (firstInput) {
          firstInput.focus({ preventScroll: !isMobile });
        }
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
      showToast("Upload tanda tangan dulu sebelum menyimpan sebagai default", "error");
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
      showToast("Tanda tangan default berhasil disimpan!", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal menyimpan tanda tangan default", "error");
    } finally {
      setSavingDefault(false);
    }
  }

  async function saveInvoice() {
    // Run validation first — skip completely empty (draft) rows
    const errors: { kepadaYth?: string; tanggal?: string; signatureName?: string; items: Record<number, { nopol?: string; tujuan?: string }> } = { items: {} };
    if (!kepadaYth.trim()) errors.kepadaYth = "Kepada Yth wajib diisi";
    if (!tanggal.trim()) errors.tanggal = "Tanggal wajib diisi";
    if (!signatureName.trim()) errors.signatureName = "Nama tanda tangan wajib diisi";

    items.forEach((it, index) => {
      // Skip validation for completely empty draft rows and intentional empty rows
      if (isRowEmpty(it) || it.is_empty_row) return;
      const itemErrors: { nopol?: string; tujuan?: string } = {};
      if (!it.nopol.trim()) itemErrors.nopol = "NoPol wajib diisi";
      if (!it.tujuan.trim()) itemErrors.tujuan = "Tujuan wajib diisi";
      if (Object.keys(itemErrors).length > 0) errors.items[index] = itemErrors;
    });

    setValidationErrors(errors);
    setShowValidation(true);

    const hasErr = !!errors.kepadaYth || !!errors.tanggal || !!errors.signatureName || Object.keys(errors.items).length > 0;
    if (hasErr) {
      const messages: string[] = [];
      if (errors.kepadaYth) messages.push(errors.kepadaYth);
      if (errors.tanggal) messages.push(errors.tanggal);
      if (errors.signatureName) messages.push(errors.signatureName);
      Object.entries(errors.items).forEach(([idx, errs]) => {
        const rowNum = Number(idx) + 1;
        if (errs.nopol) messages.push(`Row ${rowNum}: ${errs.nopol}`);
        if (errs.tujuan) messages.push(`Row ${rowNum}: ${errs.tujuan}`);
      });
      showToast(messages.join(" \u2022 "), "error");

      // Scroll to first error
      if (errors.kepadaYth || errors.tanggal) {
        document.getElementById('kepada-yth-input')?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        const firstErrorIdx = Number(Object.keys(errors.items)[0]);
        itemRefs.current[firstErrorIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Filter out completely empty draft rows before saving (keep intentional empty rows)
    const nonEmptyItems = items.filter((it) => !isRowEmpty(it));

    const payload = {
      invoiceNumber,
      tanggal,
      kepadaYth,
      items: nonEmptyItems.map((it) => ({
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
        extra_charges: it.extra_charges || [],
        is_empty_row: it.is_empty_row || false,
      })),
      footerTanggal,
      bankName,
      noRekening,
      namaRekening,
      signatureUrl,
      signatureName,
      orderNotes: selectedNotes,
    };

    const res = await fetch("/api/invoices/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data?.error || "Gagal menyimpan invoice", "error");
      return;
    }
    showToast("Invoice berhasil disimpan!", "success");
    clearCache();
    router.push("/invoices");
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Create Invoice</h1>
          <p className="text-sm text-zinc-400">
            Dark modern &bull; mobile friendly &bull; IDR
          </p>
        </div>
        <a
          href="/invoices"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm hover:bg-zinc-900 transition-colors"
        >
          Invoice List
        </a>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Invoice Number (optional)">
            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
              placeholder="Auto (INV-YYYY-0001)"
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
              id="kepada-yth-input"
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

        {/* Order Notes - Informational only (siapa yang order) */}
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <label className="mb-2 block text-sm text-zinc-300 font-medium">Order Notes (Info saja, tidak di-export)</label>
          <div className="w-full sm:w-auto sm:min-w-[300px]">
            <SearchableSelect
              options={notesList.map((n) => ({
                value: n.id,
                label: `${n.name} - ${n.phone}`,
                description: n.description || undefined,
              }))}
              value=""
              onChange={(val) => {
                const selected = notesList.find((n) => n.id === val);
                if (selected && !selectedNotes.find((sn) => sn.id === selected.id)) {
                  setSelectedNotes((prev) => [...prev, { id: selected.id, name: selected.name, phone: selected.phone }]);
                }
              }}
              placeholder="-- Cari & Pilih Order Notes --"
            />
          </div>
          {selectedNotes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedNotes.map((sn) => (
                <span
                  key={sn.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-1 text-xs text-blue-300"
                >
                  {sn.name} ({sn.phone})
                  <button
                    type="button"
                    onClick={() => setSelectedNotes((prev) => prev.filter((n) => n.id !== sn.id))}
                    className="text-blue-400 hover:text-blue-200"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Items</h2>
          <div className="flex gap-2">
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
        </div>

        <div className="space-y-4">
          {items.map((it, i) => {
            const isDraft = isRowEmpty(it);
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
              className={`rounded-2xl border ${
                showValidation && validationErrors.items[i]
                  ? 'border-red-500/50'
                  : isDraft
                  ? 'border-amber-500/30'
                  : 'border-zinc-800'
              } ${isDraft ? 'bg-amber-950/5' : 'bg-zinc-950/40'} p-4 sm:p-5`}
            >
              {/* Row header: badge + row number + remove */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-800/50 rounded-lg px-2 py-0.5">
                    Row {i + 1}
                  </span>
                  {isDraft && (
                    <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-400">
                      Draft
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeRow(i)}
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/30 hover:border-red-500/30 transition-colors"
                >
                  Remove
                </button>
              </div>

              {isDraft && (
                <p className="text-[11px] text-zinc-500 mb-3">Row kosong — isi minimal 1 field untuk menyimpan</p>
              )}

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
                      trucks={truckList}
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

              {/* Row 2: Tujuan, Jenis, Ongkir, Berat/Kuli/UangMakan */}
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

                <div className={it.type === "japfa" || it.type === "murti" ? "sm:col-span-1 lg:col-span-3" : "sm:col-span-1 lg:col-span-3"}>
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
                      <div key={ecIdx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          className="w-full sm:flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-zinc-600"
                          placeholder="Keterangan (mis: Kuli tambahan)"
                          value={ec.label}
                          onChange={(e) => {
                            const updated = [...it.extra_charges];
                            updated[ecIdx] = { ...updated[ecIdx], label: e.target.value };
                            updateItem(i, { extra_charges: updated });
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0 sm:w-44 sm:flex-none">
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
                            className="shrink-0 rounded-lg border border-zinc-800 px-2.5 py-2.5 text-xs text-red-400 hover:bg-red-950/30 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
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
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                {showAddBank ? "×" : "+"}
              </button>
            </div>
          </Field>

          <Field label="No Rekening">
            <input
              readOnly
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none opacity-70"
              placeholder="Pilih bank dari dropdown"
              value={noRekening}
            />
          </Field>
        </div>

        {/* Add New Bank Form */}
        {showAddBank && (
          <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-900/50 p-4 space-y-3">
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
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {savingBank ? "Menyimpan..." : "Simpan Bank (Encrypted)"}
            </button>
          </div>
        )}

        {/* Nama Rekening */}
        <div className="mt-4">
          <Field label="Nama Rekening (A/N)">
            <input
              readOnly
              className="w-full sm:max-w-md rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none opacity-70"
              placeholder="Pilih bank dari dropdown"
              value={namaRekening}
            />
          </Field>
        </div>

        {/* Signature Section */}
        <div className="mt-6 pt-4 border-t border-zinc-800 space-y-4">
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
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 max-w-sm">
              <p className="text-xs text-zinc-400 mb-2">Tanda Tangan Default</p>
              <img
                src={defaultSignatureUrl}
                alt="default signature"
                className="h-20 object-contain"
              />
              <p className="text-sm text-zinc-300 mt-2">{defaultSignatureName}</p>
            </div>
          ) : (
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
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  {savingDefault ? "Menyimpan..." : "Simpan sebagai tanda tangan default"}
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={saveInvoice}
          className="mt-6 w-full sm:w-auto rounded-xl bg-white text-zinc-950 px-8 py-3 font-medium hover:bg-zinc-200 transition-colors"
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
