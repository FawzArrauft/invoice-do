"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Truck = {
  id: string;
  nopol: string;
  created_at: string;
  cargo_count?: number;
};

export default function MuatanPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nopol, setNopol] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchTrucks() {
    setLoading(true);
    try {
      const res = await fetch("/api/trucks");
      const json = await res.json();
      setTrucks(json.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrucks();
  }, []);

  async function handleAddTruck() {
    if (!nopol.trim()) {
      alert("Nopol wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/trucks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nopol }),
      });
      if (res.ok) {
        setNopol("");
        setShowForm(false);
        fetchTrucks();
      } else {
        const data = await res.json();
        alert(data?.error || "Gagal menambah truck");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTruck(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Yakin ingin menghapus truck ini? Semua data cargo akan ikut terhapus.")) return;
    const res = await fetch(`/api/trucks/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchTrucks();
    } else {
      const data = await res.json();
      alert(data?.error || "Gagal menghapus");
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  // Group trucks by order status
  const orderGroup = trucks.filter(t => (t.cargo_count || 0) > 0);
  const inHomeGroup = trucks.filter(t => (t.cargo_count || 0) === 0);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Truck Management</h1>
          <p className="text-sm text-zinc-400">Kelola truck dan cargo</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-medium"
        >
          + Add Truck
        </button>
      </div>

      {/* Add Truck Form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
          <h2 className="font-semibold mb-4">Tambah Truck Baru</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm text-zinc-300">Nopol (License Plate) *</label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600"
                placeholder="AG 1234 BC"
                value={nopol}
                onChange={(e) => setNopol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleAddTruck()}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAddTruck}
              disabled={submitting}
              className="rounded-xl bg-white text-zinc-950 px-6 py-2 font-medium disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Simpan Truck"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-zinc-800 px-6 py-2"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Order Group */}
      {orderGroup.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Order Group
            <span className="text-sm text-zinc-500 font-normal">({orderGroup.length} trucks)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orderGroup.map((truck) => (
              <Link
                key={truck.id}
                href={`/muatan/${truck.id}`}
                className="group rounded-2xl border border-green-500/30 bg-green-500/5 p-5 hover:bg-green-500/10 hover:border-green-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold group-hover:text-green-400 transition-colors">
                      {truck.nopol}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Added: {new Date(truck.created_at).toLocaleDateString("id-ID")}
                    </div>
                    <div className="text-sm text-green-400 mt-2 font-medium">
                      {truck.cargo_count} cargo entries
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <svg
                      className="w-5 h-5 text-zinc-500 group-hover:text-green-400 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <button
                      onClick={(e) => handleDeleteTruck(e, truck.id)}
                      className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* In Home Group */}
      {inHomeGroup.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-zinc-500 rounded-full"></span>
            In Home
            <span className="text-sm text-zinc-500 font-normal">({inHomeGroup.length} trucks)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inHomeGroup.map((truck) => (
              <Link
                key={truck.id}
                href={`/muatan/${truck.id}`}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 hover:bg-zinc-900/70 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold group-hover:text-amber-400 transition-colors">
                      {truck.nopol}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Added: {new Date(truck.created_at).toLocaleDateString("id-ID")}
                    </div>
                    <div className="text-sm text-zinc-500 mt-2">
                      No active orders
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <svg
                      className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <button
                      onClick={(e) => handleDeleteTruck(e, truck.id)}
                      className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {trucks.length === 0 && !showForm && (
        <div className="text-center py-12 text-zinc-500">
          <p>Belum ada truck terdaftar.</p>
          <p className="text-sm mt-2">Klik &quot;+ Add Truck&quot; untuk menambah truck baru.</p>
        </div>
      )}
    </div>
  );
}
