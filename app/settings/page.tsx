"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faPenToSquare,
  faFloppyDisk,
  faXmark,
  faIndustry,
  faTruck,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";

type Pabrik = {
  id: string;
  name: string;
  tujuan: string;
  jenis: string;
  ongkir: number;
  berat: number;
  kuli: number;
  uang_makan: number;
};

type MuatanTruk = {
  id: string;
  name: string;
  cargo_type: string;
  freight_cost: number;
};

type Balen = {
  id: string;
  name: string;
  balen_cargo_type: string;
  balen_freight_cost: number;
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function SettingsPage() {
  const [pabrikList, setPabrikList] = useState<Pabrik[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for adding new pabrik
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formTujuan, setFormTujuan] = useState("");
  const [formJenis, setFormJenis] = useState("");
  const [formOngkir, setFormOngkir] = useState(0);
  const [formBerat, setFormBerat] = useState(0);
  const [formKuli, setFormKuli] = useState(0);
  const [formUangMakan, setFormUangMakan] = useState(0);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTujuan, setEditTujuan] = useState("");
  const [editJenis, setEditJenis] = useState("");
  const [editOngkir, setEditOngkir] = useState(0);
  const [editBerat, setEditBerat] = useState(0);
  const [editKuli, setEditKuli] = useState(0);
  const [editUangMakan, setEditUangMakan] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);

  // Search state for pabrik
  const [pabrikSearch, setPabrikSearch] = useState("");

  // Active tab: "pabrik" | "muatan-truk"
  const [activeTab, setActiveTab] = useState<"pabrik" | "muatan-truk">("pabrik");

  // Muatan Truk state
  const [muatanTrukList, setMuatanTrukList] = useState<MuatanTruk[]>([]);
  const [loadingMuatanTruk, setLoadingMuatanTruk] = useState(true);
  const [showMuatanTrukForm, setShowMuatanTrukForm] = useState(false);
  const [muatanTrukName, setMuatanTrukName] = useState("");
  const [muatanTrukCargoType, setMuatanTrukCargoType] = useState("");
  const [muatanTrukFreightCost, setMuatanTrukFreightCost] = useState(0);
  const [savingMuatanTruk, setSavingMuatanTruk] = useState(false);
  const [editMuatanTrukId, setEditMuatanTrukId] = useState<string | null>(null);
  const [editMuatanTrukName, setEditMuatanTrukName] = useState("");
  const [editMuatanTrukCargoType, setEditMuatanTrukCargoType] = useState("");
  const [editMuatanTrukFreightCost, setEditMuatanTrukFreightCost] = useState(0);
  const [savingEditMuatanTruk, setSavingEditMuatanTruk] = useState(false);
  const [muatanTrukSearch, setMuatanTrukSearch] = useState("");

  // Balen state
  const [balenList, setBalenList] = useState<Balen[]>([]);
  const [loadingBalen, setLoadingBalen] = useState(true);
  const [showBalenForm, setShowBalenForm] = useState(false);
  const [balenName, setBalenName] = useState("");
  const [balenCargoType, setBalenCargoType] = useState("");
  const [balenFreightCost, setBalenFreightCost] = useState(0);
  const [savingBalen, setSavingBalen] = useState(false);
  const [editBalenId, setEditBalenId] = useState<string | null>(null);
  const [editBalenName, setEditBalenName] = useState("");
  const [editBalenCargoType, setEditBalenCargoType] = useState("");
  const [editBalenFreightCost, setEditBalenFreightCost] = useState(0);
  const [savingEditBalen, setSavingEditBalen] = useState(false);
  const [balenSearch, setBalenSearch] = useState("");

  async function fetchPabrik() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/pabrik");
      const json = await res.json();
      if (json.data) setPabrikList(json.data);
    } catch (err) {
      console.error("Failed to load pabrik:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPabrik();
  }, []);

  function resetForm() {
    setFormName("");
    setFormTujuan("");
    setFormJenis("");
    setFormOngkir(0);
    setFormBerat(0);
    setFormKuli(0);
    setFormUangMakan(0);
    setShowForm(false);
  }

  async function handleAdd() {
    if (!formName.trim()) {
      alert("Nama pabrik wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/pabrik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          tujuan: formTujuan,
          jenis: formJenis,
          ongkir: formOngkir,
          berat: formBerat,
          kuli: formKuli,
          uang_makan: formUangMakan,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");

      setPabrikList((prev) => [...prev, json.data]);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Gagal menambah pabrik");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p: Pabrik) {
    setEditId(p.id);
    setEditName(p.name);
    setEditTujuan(p.tujuan);
    setEditJenis(p.jenis);
    setEditOngkir(p.ongkir);
    setEditBerat(p.berat);
    setEditKuli(p.kuli);
    setEditUangMakan(p.uang_makan);
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function handleSaveEdit() {
    if (!editId) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/settings/pabrik", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          name: editName,
          tujuan: editTujuan,
          jenis: editJenis,
          ongkir: editOngkir,
          berat: editBerat,
          kuli: editKuli,
          uang_makan: editUangMakan,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");

      setPabrikList((prev) =>
        prev.map((p) => (p.id === editId ? json.data : p)),
      );
      setEditId(null);
    } catch (err) {
      console.error(err);
      alert("Gagal mengupdate pabrik");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus pabrik ini?")) return;
    try {
      const res = await fetch(`/api/settings/pabrik?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed");
      }
      setPabrikList((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus pabrik");
    }
  }

  // === Muatan Truk CRUD ===
  async function fetchMuatanTruk() {
    setLoadingMuatanTruk(true);
    try {
      const res = await fetch("/api/settings/muatan-truk");
      const json = await res.json();
      if (json.data) setMuatanTrukList(json.data);
    } catch (err) {
      console.error("Failed to load muatan truk:", err);
    } finally {
      setLoadingMuatanTruk(false);
    }
  }

  useEffect(() => {
    fetchMuatanTruk();
  }, []);

  async function handleAddMuatanTruk() {
    if (!muatanTrukName.trim()) {
      alert("Nama muatan truk wajib diisi");
      return;
    }
    setSavingMuatanTruk(true);
    try {
      const res = await fetch("/api/settings/muatan-truk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: muatanTrukName,
          cargo_type: muatanTrukCargoType,
          freight_cost: muatanTrukFreightCost,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setMuatanTrukList((prev) => [...prev, json.data]);
      setMuatanTrukName("");
      setMuatanTrukCargoType("");
      setMuatanTrukFreightCost(0);
      setShowMuatanTrukForm(false);
    } catch (err) {
      console.error(err);
      alert("Gagal menambah muatan truk");
    } finally {
      setSavingMuatanTruk(false);
    }
  }

  function startEditMuatanTruk(m: MuatanTruk) {
    setEditMuatanTrukId(m.id);
    setEditMuatanTrukName(m.name);
    setEditMuatanTrukCargoType(m.cargo_type);
    setEditMuatanTrukFreightCost(m.freight_cost);
  }

  async function handleSaveEditMuatanTruk() {
    if (!editMuatanTrukId) return;
    setSavingEditMuatanTruk(true);
    try {
      const res = await fetch("/api/settings/muatan-truk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editMuatanTrukId,
          name: editMuatanTrukName,
          cargo_type: editMuatanTrukCargoType,
          freight_cost: editMuatanTrukFreightCost,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setMuatanTrukList((prev) =>
        prev.map((m) => (m.id === editMuatanTrukId ? json.data : m)),
      );
      setEditMuatanTrukId(null);
    } catch (err) {
      console.error(err);
      alert("Gagal mengupdate muatan truk");
    } finally {
      setSavingEditMuatanTruk(false);
    }
  }

  async function handleDeleteMuatanTruk(id: string) {
    if (!confirm("Yakin ingin menghapus muatan truk ini?")) return;
    try {
      const res = await fetch(`/api/settings/muatan-truk?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed");
      }
      setMuatanTrukList((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus muatan truk");
    }
  }

  // Filtered lists
  const filteredPabrikList = pabrikList.filter((p) =>
    p.name.toLowerCase().includes(pabrikSearch.toLowerCase()) ||
    p.tujuan.toLowerCase().includes(pabrikSearch.toLowerCase()) ||
    p.jenis.toLowerCase().includes(pabrikSearch.toLowerCase())
  );

  const filteredMuatanTrukList = muatanTrukList.filter((m) =>
    m.name.toLowerCase().includes(muatanTrukSearch.toLowerCase()) ||
    m.cargo_type.toLowerCase().includes(muatanTrukSearch.toLowerCase())
  );

  // === Balen CRUD ===
  async function fetchBalen() {
    setLoadingBalen(true);
    try {
      const res = await fetch("/api/settings/balen");
      const json = await res.json();
      if (json.data) setBalenList(json.data);
    } catch (err) {
      console.error("Failed to load balen:", err);
    } finally {
      setLoadingBalen(false);
    }
  }

  useEffect(() => {
    fetchBalen();
  }, []);

  async function handleAddBalen() {
    if (!balenName.trim()) {
      alert("Nama balen wajib diisi");
      return;
    }
    setSavingBalen(true);
    try {
      const res = await fetch("/api/settings/balen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: balenName,
          balen_cargo_type: balenCargoType,
          balen_freight_cost: balenFreightCost,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setBalenList((prev) => [...prev, json.data]);
      setBalenName("");
      setBalenCargoType("");
      setBalenFreightCost(0);
      setShowBalenForm(false);
    } catch (err) {
      console.error(err);
      alert("Gagal menambah balen");
    } finally {
      setSavingBalen(false);
    }
  }

  function startEditBalen(b: Balen) {
    setEditBalenId(b.id);
    setEditBalenName(b.name);
    setEditBalenCargoType(b.balen_cargo_type);
    setEditBalenFreightCost(b.balen_freight_cost);
  }

  async function handleSaveEditBalen() {
    if (!editBalenId) return;
    setSavingEditBalen(true);
    try {
      const res = await fetch("/api/settings/balen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editBalenId,
          name: editBalenName,
          balen_cargo_type: editBalenCargoType,
          balen_freight_cost: editBalenFreightCost,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setBalenList((prev) =>
        prev.map((b) => (b.id === editBalenId ? json.data : b)),
      );
      setEditBalenId(null);
    } catch (err) {
      console.error(err);
      alert("Gagal mengupdate balen");
    } finally {
      setSavingEditBalen(false);
    }
  }

  async function handleDeleteBalen(id: string) {
    if (!confirm("Yakin ingin menghapus balen ini?")) return;
    try {
      const res = await fetch(`/api/settings/balen?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed");
      }
      setBalenList((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus balen");
    }
  }

  const filteredBalenList = balenList.filter((b) =>
    b.name.toLowerCase().includes(balenSearch.toLowerCase()) ||
    b.balen_cargo_type.toLowerCase().includes(balenSearch.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-zinc-400">Kelola data pabrik dan muatan truk</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("pabrik")}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
            activeTab === "pabrik"
              ? "bg-amber-500/20 border border-amber-500 text-amber-400"
              : "border border-zinc-800 text-zinc-400 hover:bg-zinc-900"
          }`}
        >
          <FontAwesomeIcon icon={faIndustry} />
          Pabrik
        </button>
        <button
          onClick={() => setActiveTab("muatan-truk")}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
            activeTab === "muatan-truk"
              ? "bg-amber-500/20 border border-amber-500 text-amber-400"
              : "border border-zinc-800 text-zinc-400 hover:bg-zinc-900"
          }`}
        >
          <FontAwesomeIcon icon={faTruck} />
          Muatan Truk
        </button>
      </div>

      {/* ====== PABRIK TAB ====== */}
      {activeTab === "pabrik" && (
        <>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-semibold">
                <FontAwesomeIcon icon={faIndustry} className="mr-2 text-amber-400" />
                Pabrik
              </h2>
              <p className="text-sm text-zinc-400">
                Kelola data pabrik untuk auto-fill pada form invoice
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-medium flex items-center gap-2"
            >
              <FontAwesomeIcon icon={showForm ? faXmark : faPlus} />
              {showForm ? "Batal" : "Tambah Pabrik"}
            </button>
          </div>

      {/* Add Pabrik Form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
          <h2 className="font-semibold mb-4">Tambah Pabrik Baru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Nama Pabrik *
              </label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                placeholder="Contoh: PT Semen Indonesia"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Tujuan</label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                placeholder="Contoh: Surabaya"
                value={formTujuan}
                onChange={(e) => setFormTujuan(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Jenis</label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                placeholder="Contoh: Semen"
                value={formJenis}
                onChange={(e) => setFormJenis(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Ongkir (IDR)
              </label>
              <input
                inputMode="numeric"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                value={formOngkir}
                onChange={(e) => setFormOngkir(Number(e.target.value || 0))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Berat</label>
              <input
                inputMode="numeric"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                value={formBerat}
                onChange={(e) => setFormBerat(Number(e.target.value || 0))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Kuli (IDR)
              </label>
              <input
                inputMode="numeric"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                value={formKuli}
                onChange={(e) => setFormKuli(Number(e.target.value || 0))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Uang Makan (IDR)
              </label>
              <input
                inputMode="numeric"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                value={formUangMakan}
                onChange={(e) => setFormUangMakan(Number(e.target.value || 0))}
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 text-sm text-white font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faFloppyDisk} />
            {saving ? "Menyimpan..." : "Simpan Pabrik"}
          </button>
        </div>
      )}

      {/* Pabrik List */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">
            Daftar Pabrik ({filteredPabrikList.length})
          </h2>
          {/* Search Pabrik */}
          <div className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
            <input
              type="text"
              placeholder="Cari pabrik..."
              className="w-48 sm:w-64 rounded-xl border border-zinc-700 bg-zinc-900 pl-9 pr-4 py-2 text-sm outline-none focus:border-zinc-500 transition-colors"
              value={pabrikSearch}
              onChange={(e) => setPabrikSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-zinc-400 text-sm py-8 text-center">Loading...</p>
        ) : filteredPabrikList.length === 0 ? (
          <p className="text-zinc-400 text-sm py-8 text-center">
            {pabrikSearch ? "Tidak ada pabrik yang cocok dengan pencarian." : "Belum ada data pabrik. Klik \"Tambah Pabrik\" untuk menambahkan."}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredPabrikList.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4"
              >
                {editId === p.id ? (
                  /* Edit Mode */
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="mb-1 block text-xs text-zinc-400">
                          Nama
                        </label>
                        <input
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-400">
                          Tujuan
                        </label>
                        <input
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                          value={editTujuan}
                          onChange={(e) => setEditTujuan(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-400">
                          Jenis
                        </label>
                        <input
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                          value={editJenis}
                          onChange={(e) => setEditJenis(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-400">
                          Ongkir
                        </label>
                        <input
                          inputMode="numeric"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                          value={editOngkir}
                          onChange={(e) =>
                            setEditOngkir(Number(e.target.value || 0))
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-400">
                          Berat
                        </label>
                        <input
                          inputMode="numeric"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                          value={editBerat}
                          onChange={(e) =>
                            setEditBerat(Number(e.target.value || 0))
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-400">
                          Kuli
                        </label>
                        <input
                          inputMode="numeric"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                          value={editKuli}
                          onChange={(e) =>
                            setEditKuli(Number(e.target.value || 0))
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-zinc-400">
                          Uang Makan
                        </label>
                        <input
                          inputMode="numeric"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                          value={editUangMakan}
                          onChange={(e) =>
                            setEditUangMakan(Number(e.target.value || 0))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleSaveEdit}
                        disabled={savingEdit}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faFloppyDisk} />
                        {savingEdit ? "Saving..." : "Simpan"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faXmark} />
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base">{p.name}</div>
                      <div className="text-sm text-zinc-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Tujuan: {p.tujuan || "-"}</span>
                        <span>Jenis: {p.jenis || "-"}</span>
                        <span>Berat: {p.berat || 0}</span>
                      </div>
                      <div className="text-sm text-zinc-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Ongkir: Rp {formatIDR(p.ongkir)}</span>
                        <span>Kuli: Rp {formatIDR(p.kuli)}</span>
                        <span>Uang Makan: Rp {formatIDR(p.uang_makan)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        className="rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}

      {/* ====== MUATAN TRUK TAB ====== */}
      {activeTab === "muatan-truk" && (
        <>
          {/* --- Muatan Truk Section --- */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-semibold">
                <FontAwesomeIcon icon={faTruck} className="mr-2 text-amber-400" />
                Muatan Truk
              </h2>
              <p className="text-sm text-zinc-400">
                Auto-fill Cargo, Cargo Type, dan Freight Cost pada form cargo
              </p>
            </div>
            <button
              onClick={() => setShowMuatanTrukForm(!showMuatanTrukForm)}
              className="rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-medium flex items-center gap-2"
            >
              <FontAwesomeIcon icon={showMuatanTrukForm ? faXmark : faPlus} />
              {showMuatanTrukForm ? "Batal" : "Tambah Muatan"}
            </button>
          </div>

          {/* Add Muatan Truk Form */}
          {showMuatanTrukForm && (
            <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
              <h3 className="font-semibold mb-4">Tambah Muatan Truk Baru</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-zinc-300">Cargo (Nama Muatan) *</label>
                  <input
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                    placeholder="Contoh: Semen, Besi, Pupuk"
                    value={muatanTrukName}
                    onChange={(e) => setMuatanTrukName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-zinc-300">Cargo Type</label>
                  <input
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                    placeholder="Contoh: Bag, Bulk, Drum"
                    value={muatanTrukCargoType}
                    onChange={(e) => setMuatanTrukCargoType(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-zinc-300">Freight Cost (IDR)</label>
                  <input
                    inputMode="numeric"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                    placeholder="0"
                    value={muatanTrukFreightCost || ""}
                    onChange={(e) => setMuatanTrukFreightCost(Number(e.target.value || 0))}
                  />
                </div>
              </div>
              <button
                onClick={handleAddMuatanTruk}
                disabled={savingMuatanTruk}
                className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 text-sm text-white font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faFloppyDisk} />
                {savingMuatanTruk ? "Menyimpan..." : "Simpan Muatan"}
              </button>
            </div>
          )}

          {/* Muatan Truk List */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                Daftar Muatan Truk ({filteredMuatanTrukList.length})
              </h3>
              <div className="relative">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
                <input
                  type="text"
                  placeholder="Cari muatan..."
                  className="w-48 sm:w-64 rounded-xl border border-zinc-700 bg-zinc-900 pl-9 pr-4 py-2 text-sm outline-none focus:border-zinc-500 transition-colors"
                  value={muatanTrukSearch}
                  onChange={(e) => setMuatanTrukSearch(e.target.value)}
                />
              </div>
            </div>

            {loadingMuatanTruk ? (
              <p className="text-zinc-400 text-sm py-8 text-center">Loading...</p>
            ) : filteredMuatanTrukList.length === 0 ? (
              <p className="text-zinc-400 text-sm py-8 text-center">
                {muatanTrukSearch
                  ? "Tidak ada muatan truk yang cocok dengan pencarian."
                  : "Belum ada data. Klik \"Tambah Muatan\" untuk menambahkan."}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredMuatanTrukList.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                    {editMuatanTrukId === m.id ? (
                      <div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="mb-1 block text-xs text-zinc-400">Cargo</label>
                            <input
                              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                              value={editMuatanTrukName}
                              onChange={(e) => setEditMuatanTrukName(e.target.value)}
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-zinc-400">Cargo Type</label>
                            <input
                              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                              value={editMuatanTrukCargoType}
                              onChange={(e) => setEditMuatanTrukCargoType(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-zinc-400">Freight Cost (IDR)</label>
                            <input
                              inputMode="numeric"
                              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                              value={editMuatanTrukFreightCost || ""}
                              onChange={(e) => setEditMuatanTrukFreightCost(Number(e.target.value || 0))}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={handleSaveEditMuatanTruk}
                            disabled={savingEditMuatanTruk}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                          >
                            <FontAwesomeIcon icon={faFloppyDisk} />
                            {savingEditMuatanTruk ? "Saving..." : "Simpan"}
                          </button>
                          <button
                            onClick={() => setEditMuatanTrukId(null)}
                            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                          >
                            <FontAwesomeIcon icon={faXmark} />
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base">{m.name}</div>
                          <div className="text-sm text-zinc-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>Cargo Type: {m.cargo_type || "-"}</span>
                            <span>Freight Cost: Rp {formatIDR(m.freight_cost)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditMuatanTruk(m)}
                            className="rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMuatanTruk(m.id)}
                            className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                            <span className="hidden sm:inline">Hapus</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- Balen Section --- */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-semibold">
                <span className="mr-2 text-amber-400">📦</span>
                Balen
              </h2>
              <p className="text-sm text-zinc-400">
                Auto-fill Balen, Balen Cargo Type, dan Balen Freight Cost pada form cargo
              </p>
            </div>
            <button
              onClick={() => setShowBalenForm(!showBalenForm)}
              className="rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-medium flex items-center gap-2"
            >
              <FontAwesomeIcon icon={showBalenForm ? faXmark : faPlus} />
              {showBalenForm ? "Batal" : "Tambah Balen"}
            </button>
          </div>

          {/* Add Balen Form */}
          {showBalenForm && (
            <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
              <h3 className="font-semibold mb-4">Tambah Balen Baru</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-zinc-300">Balen (Nama) *</label>
                  <input
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                    placeholder="Contoh: Balen A, Balen B"
                    value={balenName}
                    onChange={(e) => setBalenName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-zinc-300">Balen Cargo Type</label>
                  <input
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                    placeholder="Contoh: Bag, Bulk"
                    value={balenCargoType}
                    onChange={(e) => setBalenCargoType(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-zinc-300">Balen Freight Cost (IDR)</label>
                  <input
                    inputMode="numeric"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                    placeholder="0"
                    value={balenFreightCost || ""}
                    onChange={(e) => setBalenFreightCost(Number(e.target.value || 0))}
                  />
                </div>
              </div>
              <button
                onClick={handleAddBalen}
                disabled={savingBalen}
                className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 text-sm text-white font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faFloppyDisk} />
                {savingBalen ? "Menyimpan..." : "Simpan Balen"}
              </button>
            </div>
          )}

          {/* Balen List */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                Daftar Balen ({filteredBalenList.length})
              </h3>
              <div className="relative">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
                <input
                  type="text"
                  placeholder="Cari balen..."
                  className="w-48 sm:w-64 rounded-xl border border-zinc-700 bg-zinc-900 pl-9 pr-4 py-2 text-sm outline-none focus:border-zinc-500 transition-colors"
                  value={balenSearch}
                  onChange={(e) => setBalenSearch(e.target.value)}
                />
              </div>
            </div>

            {loadingBalen ? (
              <p className="text-zinc-400 text-sm py-8 text-center">Loading...</p>
            ) : filteredBalenList.length === 0 ? (
              <p className="text-zinc-400 text-sm py-8 text-center">
                {balenSearch
                  ? "Tidak ada balen yang cocok dengan pencarian."
                  : "Belum ada data balen. Klik \"Tambah Balen\" untuk menambahkan."}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredBalenList.map((b) => (
                  <div key={b.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                    {editBalenId === b.id ? (
                      <div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="mb-1 block text-xs text-zinc-400">Balen</label>
                            <input
                              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                              value={editBalenName}
                              onChange={(e) => setEditBalenName(e.target.value)}
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-zinc-400">Balen Cargo Type</label>
                            <input
                              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                              value={editBalenCargoType}
                              onChange={(e) => setEditBalenCargoType(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-zinc-400">Balen Freight Cost (IDR)</label>
                            <input
                              inputMode="numeric"
                              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                              value={editBalenFreightCost || ""}
                              onChange={(e) => setEditBalenFreightCost(Number(e.target.value || 0))}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={handleSaveEditBalen}
                            disabled={savingEditBalen}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                          >
                            <FontAwesomeIcon icon={faFloppyDisk} />
                            {savingEditBalen ? "Saving..." : "Simpan"}
                          </button>
                          <button
                            onClick={() => setEditBalenId(null)}
                            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                          >
                            <FontAwesomeIcon icon={faXmark} />
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base">{b.name}</div>
                          <div className="text-sm text-zinc-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>Balen Cargo Type: {b.balen_cargo_type || "-"}</span>
                            <span>Balen Freight Cost: Rp {formatIDR(b.balen_freight_cost)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditBalen(b)}
                            className="rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteBalen(b.id)}
                            className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                            <span className="hidden sm:inline">Hapus</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
