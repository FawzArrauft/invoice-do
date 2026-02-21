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

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">
            <FontAwesomeIcon icon={faIndustry} className="mr-2 text-amber-400" />
            Settings — Pabrik
          </h1>
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
        <h2 className="font-semibold mb-4">
          Daftar Pabrik ({pabrikList.length})
        </h2>

        {loading ? (
          <p className="text-zinc-400 text-sm py-8 text-center">Loading...</p>
        ) : pabrikList.length === 0 ? (
          <p className="text-zinc-400 text-sm py-8 text-center">
            Belum ada data pabrik. Klik &quot;Tambah Pabrik&quot; untuk menambahkan.
          </p>
        ) : (
          <div className="space-y-3">
            {pabrikList.map((p) => (
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
    </div>
  );
}
