"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Truck = {
  id: string;
  nopol: string;
  created_at: string;
  cargo_count?: number;
  status?: string;
};

export default function MuatanPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nopol, setNopol] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNopol, setEditNopol] = useState("");

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
    if (
      !confirm(
        "Yakin ingin menghapus truck ini? Semua data cargo akan ikut terhapus."
      )
    )
      return;
    const res = await fetch(`/api/trucks/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchTrucks();
    } else {
      const data = await res.json();
      alert(data?.error || "Gagal menghapus");
    }
  }

  async function handleUpdateTruck(e: React.MouseEvent) {
    e.preventDefault();
    if (!editingId || !editNopol.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/trucks/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nopol: editNopol }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditNopol("");
        fetchTrucks();
      } else {
        const data = await res.json();
        alert(data?.error || "Gagal update truck");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(e: React.MouseEvent, truck: Truck) {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(truck.id);
    setEditNopol(truck.nopol);
  }

  function cancelEdit(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(null);
    setEditNopol("");
  }

  async function handleToggleStatus(e: React.MouseEvent, truck: Truck) {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = truck.status === "ordering" ? "available" : "ordering";

    try {
      const res = await fetch(`/api/trucks/${truck.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchTrucks();
      } else {
        const data = await res.json();
        alert(data?.error || "Gagal update status");
      }
    } catch {
      alert("Terjadi kesalahan saat update status");
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  // Filter trucks based on search query
  const filteredTrucks = trucks.filter((t) =>
    t.nopol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group trucks by status
  const orderGroup = filteredTrucks.filter((t) => t.status === "ordering");
  const inHomeGroup = filteredTrucks.filter((t) => t.status !== "ordering");

  // Render truck card content
  const TruckCard = ({
    truck,
    styleClass,
  }: {
    truck: Truck;
    styleClass: string;
  }) => {
    const isEditing = editingId === truck.id;

    return (
      <div
        className={`group rounded-2xl border p-5 transition-all ${styleClass} relative`}
      >
        {isEditing ? (
          <div onClick={(e) => e.stopPropagation()}>
            <input
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-lg font-semibold mb-2"
              value={editNopol}
              onChange={(e) => setEditNopol(e.target.value.toUpperCase())}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleUpdateTruck}
                disabled={submitting}
                className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs"
              >
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="bg-zinc-700 text-zinc-300 px-3 py-1 rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <Link href={`/muatan/${truck.id}`} className="block">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold group-hover:text-current transition-colors">
                  {truck.nopol}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Added: {new Date(truck.created_at).toLocaleDateString("id-ID")}
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  {truck.cargo_count || 0} cargo items
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Truck Status Toggle Button - Always Visible */}
                <button
                  onClick={(e) => handleToggleStatus(e, truck)}
                  className={`p-2 rounded-lg transition-all ${
                    truck.status === "ordering"
                      ? "bg-green-500 text-black hover:bg-green-600"
                      : "bg-gray-500 text-black hover:bg-gray-700"
                  }`}
                  title={truck.status === "ordering" ? "Pindahkan ke Available" : "Pindahkan ke Ordering"}
                >
                  <svg 
                  xmlns="http://www.w3.org/2000/svg"
                  width= "16"
                  height= "16"
                  viewBox="0 0 640 640"
                  >
                  <path d="M32 160C32 124.7 60.7 96 96 96L384 96C419.3 96 448 124.7 448 160L448 192L498.7 192C515.7 192 532 198.7 544 210.7L589.3 256C601.3 268 608 284.3 608 301.3L608 448C608 483.3 579.3 512 544 512L540.7 512C530.3 548.9 496.3 576 456 576C415.7 576 381.8 548.9 371.3 512L268.7 512C258.3 548.9 224.3 576 184 576C143.7 576 109.8 548.9 99.3 512L96 512C60.7 512 32 483.3 32 448L32 160zM544 352L544 301.3L498.7 256L448 256L448 352L544 352zM224 488C224 465.9 206.1 448 184 448C161.9 448 144 465.9 144 488C144 510.1 161.9 528 184 528C206.1 528 224 510.1 224 488zM456 528C478.1 528 496 510.1 496 488C496 465.9 478.1 448 456 448C433.9 448 416 465.9 416 488C416 510.1 433.9 528 456 528z"/></svg>
                </button>
                
                {/* Edit and Delete buttons - Show on hover */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => startEdit(e, truck)}
                    className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                    title="Edit Nopol"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDeleteTruck(e, truck.id)}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                    title="Delete Truck"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Truck Management</h1>
          <p className="text-sm text-zinc-400">Kelola truck dan cargo</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search Nopol..."
              className="w-full sm:w-64 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 pl-10 text-sm outline-none focus:border-zinc-500 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-medium whitespace-nowrap"
          >
            + Add Truck
          </button>
        </div>
      </div>

      {/* Add Truck Form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
          <h2 className="font-semibold mb-4">Tambah Truck Baru</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm text-zinc-300">
                Nopol (License Plate) *
              </label>
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
            <span className="text-sm text-zinc-500 font-normal">
              ({orderGroup.length} trucks)
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orderGroup.map((truck) => (
              <TruckCard
                key={truck.id}
                truck={truck}
                styleClass="border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/50"
              />
            ))}
          </div>
        </div>
      )}

      {/* In Home Group */}
      {inHomeGroup.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-zinc-500 rounded-full"></span>
            In Home / Available
            <span className="text-sm text-zinc-500 font-normal">
              ({inHomeGroup.length} trucks)
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inHomeGroup.map((truck) => (
              <TruckCard
                key={truck.id}
                truck={truck}
                styleClass="border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700"
              />
            ))}
          </div>
        </div>
      )}

      {trucks.length === 0 && (
        <div className="text-center py-10 text-zinc-500">
          Belum ada truck. Silakan tambah truck baru.
        </div>
      )}
    </div>
  );
}
