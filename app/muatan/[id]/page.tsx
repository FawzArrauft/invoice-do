"use client";

import Link from "next/link";
import { useEffect, useState, use, useCallback } from "react";
import { formatRupiah, calculateCargoResult as calcResult } from "@/lib/calculation";
import { RupiahInput } from "@/components/RupiahInput";

type Truck = {
  id: string;
  nopol: string;
  created_at: string;
};

type Cargo = {
  id: string;
  truck_id: string;
  tanggal: string;
  cargo: string;
  freight_cost: number;
  cargo_type: string;
  balen: string;
  balen_freight_cost: number;
  balen_cargo_type: string;
  fuel: number;
  operational_cost: number;
  other_cost: number;
  total: number | null;
  notes: string;
};

type ResultItem = {
  id: string;
  tanggal: string;
  description: string;
  total: number;
  notes: string;
};

// Use formatRupiah from lib
const formatIDR = formatRupiah;

export default function TruckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [truck, setTruck] = useState<Truck | null>(null);
  const [cargoList, setCargoList] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);

  // Sorting and Filtering state
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedMonth, setSelectedMonth] = useState<string>(""); // Format: YYYY-MM

  // Cargo form state
  const [showCargoForm, setShowCargoForm] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [cargoForm, setCargoForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    cargo: "",
    freight_cost: 0,
    cargo_type: "",
    balen: "",
    balen_freight_cost: 0,
    balen_cargo_type: "",
    fuel: 0,
    operational_cost: 0,
    other_cost: 0,
    notes: "",
  });

  // Result section state
  const [showResult, setShowResult] = useState(false);
  const [selectedCargoForResult, setSelectedCargoForResult] = useState<Cargo | null>(null);
  const [fuel, setFuel] = useState(0);
  const [operationalCost, setOperationalCost] = useState(0);
  const [cargoOtherCost, setCargoOtherCost] = useState(0);

  // Result List state
  const [resultList, setResultList] = useState<ResultItem[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [truckRes, cargoRes] = await Promise.all([
        fetch(`/api/trucks/${id}`),
        fetch(`/api/trucks/${id}/cargo`),
      ]);
      const truckJson = await truckRes.json();
      const cargoJson = await cargoRes.json();
      setTruck(truckJson.data || null);
      setCargoList(cargoJson.data || []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function resetCargoForm() {
    setCargoForm({
      tanggal: new Date().toISOString().slice(0, 10),
      cargo: "",
      freight_cost: 0,
      cargo_type: "",
      balen: "",
      balen_freight_cost: 0,
      balen_cargo_type: "",
      fuel: 0,
      operational_cost: 0,
      other_cost: 0,
      notes: "",
    });
    setEditingCargo(null);
  }

  async function handleSaveCargo() {
    const payload = { ...cargoForm, truck_id: id };
    const url = editingCargo
      ? `/api/trucks/${id}/cargo/${editingCargo.id}`
      : `/api/trucks/${id}/cargo`;
    const method = editingCargo ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      resetCargoForm();
      setShowCargoForm(false);
      fetchData();
    } else {
      const data = await res.json();
      alert(data?.error || "Gagal menyimpan cargo");
    }
  }

  function handleEditCargo(cargo: Cargo) {
    setEditingCargo(cargo);
    setCargoForm({
      tanggal: cargo.tanggal,
      cargo: cargo.cargo,
      freight_cost: cargo.freight_cost,
      cargo_type: cargo.cargo_type,
      balen: cargo.balen,
      balen_freight_cost: cargo.balen_freight_cost,
      balen_cargo_type: cargo.balen_cargo_type,
      fuel: cargo.fuel || 0,
      operational_cost: cargo.operational_cost || 0,
      other_cost: cargo.other_cost || 0,
      notes: cargo.notes,
    });
    setShowCargoForm(true);
  }

  async function handleDeleteCargo(cargoId: string) {
    if (!confirm("Yakin ingin menghapus data cargo ini?")) return;
    const res = await fetch(`/api/trucks/${id}/cargo/${cargoId}`, { method: "DELETE" });
    if (res.ok) {
      fetchData();
    } else {
      const data = await res.json();
      alert(data?.error || "Gagal menghapus");
    }
  }

  function exportToExcel() {
    window.location.href = `/api/trucks/${id}/export`;
  }

  // Open Result calculation for a specific cargo
  function openCargoResult(cargo: Cargo) {
    setSelectedCargoForResult(cargo);
    setFuel(cargo.fuel || 0);
    setOperationalCost(cargo.operational_cost || 0);
    setCargoOtherCost(cargo.other_cost || 0);
    setShowResult(true);
  }

  // Calculate result for selected cargo using calculation utility
  function calculateCargoResult() {
    if (!selectedCargoForResult) return { cargoGross: 0, costMuatan: 0, cutPayment: 0, total: 0 };
    return calcResult(
      selectedCargoForResult.freight_cost || 0,
      selectedCargoForResult.balen_freight_cost || 0,
      fuel,
      operationalCost,
      cargoOtherCost
    );
  }

  // Add result to list and save total to cargo
  async function addToResultList() {
    if (!selectedCargoForResult || !truck) return;
    const { total } = calculateCargoResult();
    
    // Save total, fuel, operational_cost, other_cost to cargo in database
    const res = await fetch(`/api/trucks/${id}/cargo/${selectedCargoForResult.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fuel,
        operational_cost: operationalCost,
        other_cost: cargoOtherCost,
        total: total,
      }),
    });
    
    if (res.ok) {
      // Update local cargoList state
      setCargoList(cargoList.map(c => 
        c.id === selectedCargoForResult.id 
          ? { ...c, fuel, operational_cost: operationalCost, other_cost: cargoOtherCost, total: total }
          : c
      ));
      
      // Add to result list
      const newResult: ResultItem = {
        id: Date.now().toString(),
        tanggal: selectedCargoForResult.tanggal,
        description: `${selectedCargoForResult.cargo} - ${truck.nopol}`,
        total: total,
        notes: `Fuel: ${formatIDR(fuel)}, Op: ${formatIDR(operationalCost)}, Other: ${formatIDR(cargoOtherCost)}`,
      };
      setResultList([...resultList, newResult]);
    } else {
      alert("Failed to save result");
    }
    
    setShowResult(false);
    setSelectedCargoForResult(null);
  }

  // Filter and Sort Cargo List
  const filteredAndSortedCargoList = cargoList
    .filter((c) => {
      if (!selectedMonth) return true;
      return c.tanggal.startsWith(selectedMonth);
    })
    .sort((a, b) => {
      const dateA = new Date(a.tanggal).getTime();
      const dateB = new Date(b.tanggal).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  // Calculations for table total (sum of saved totals only) based on filtered list
  const tableTotal = filteredAndSortedCargoList.reduce((sum, c) => sum + (c.total || 0), 0);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!truck) return <div className="p-6">Truck not found</div>;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/muatan"
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm hover:bg-zinc-900"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold">{truck.nopol}</h1>
            <p className="text-sm text-zinc-400">Detail Truck & Cargo</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCargoForm(true); resetCargoForm(); }}
            className="rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-medium"
          >
            + Add Cargo
          </button>
          <button
            onClick={exportToExcel}
            className="rounded-xl bg-green-600 text-white px-4 py-2 text-sm font-medium"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5 uppercase font-medium tracking-wider">Filter by Month</label>
          <div className="flex gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm w-full sm:w-auto text-zinc-200"
            />
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth("")}
                className="text-sm text-zinc-400 hover:text-white underline px-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5 uppercase font-medium tracking-wider">Sort Order (Date)</label>
          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder("asc")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm border ${
                sortOrder === "asc"
                  ? "bg-amber-500/20 border-amber-500 text-amber-400"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Oldest First (ASC)
            </button>
            <button
              onClick={() => setSortOrder("desc")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm border ${
                sortOrder === "desc"
                  ? "bg-amber-500/20 border-amber-500 text-amber-400"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Newest First (DESC)
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Cargo Form */}
      {showCargoForm && (
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
          <h2 className="font-semibold mb-4">
            {editingCargo ? "Edit Cargo" : "Tambah Cargo Baru"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Tanggal</label>
              <input
                type="date"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                value={cargoForm.tanggal}
                onChange={(e) => setCargoForm({ ...cargoForm, tanggal: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Cargo</label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                placeholder="Nama cargo"
                value={cargoForm.cargo}
                onChange={(e) => setCargoForm({ ...cargoForm, cargo: e.target.value })}
              />
            </div>
            <div>
              <RupiahInput
                label="Freight Cost (IDR)"
                value={cargoForm.freight_cost}
                onChange={(val) => setCargoForm({ ...cargoForm, freight_cost: val })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Cargo Type</label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                placeholder="Jenis cargo"
                value={cargoForm.cargo_type}
                onChange={(e) => setCargoForm({ ...cargoForm, cargo_type: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Balen (optional)</label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                placeholder="Jumlah balen"
                value={cargoForm.balen}
                onChange={(e) => setCargoForm({ ...cargoForm, balen: e.target.value })}
              />
            </div>
            <div>
              <RupiahInput
                label="Balen Freight Cost (IDR)"
                value={cargoForm.balen_freight_cost}
                onChange={(val) => setCargoForm({ ...cargoForm, balen_freight_cost: val })}
              />
            </div> {selectedMonth ? `(${selectedMonth})` : "(All Time)"}
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Balen Cargo Type</label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                placeholder="Jenis balen"
                value={cargoForm.balen_cargo_type}
                onChange={(e) => setCargoForm({ ...cargoForm, balen_cargo_type: e.target.value })}
              />
            </div>
            <div>
              <RupiahInput
                label="Fuel (IDR)"
                value={cargoForm.fuel}
                onChange={(val) => setCargoForm({ ...cargoForm, fuel: val })}
              />
            </div>
            <div>
              <RupiahInput
                label="Operational Cost (IDR)"
                value={cargoForm.operational_cost}
                onChange={(val) => setCargoForm({ ...cargoForm, operational_cost: val })}
              />
            </div>
            <div>
              <RupiahInput
                label="Other Cost (IDR)"
                value={cargoForm.other_cost}
                onChange={(val) => setCargoForm({ ...cargoForm, other_cost: val })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm text-zinc-300">Notes</label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                placeholder="Catatan"
                value={cargoForm.notes}
                onChange={(e) => setCargoForm({ ...cargoForm, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSaveCargo}
              className="rounded-xl bg-white text-zinc-950 px-6 py-2 font-medium"
            >
              {editingCargo ? "Update" : "Simpan"}
            </button>
            <button
              onClick={() => { setShowCargoForm(false); resetCargoForm(); }}
              className="rounded-xl border border-zinc-800 px-6 py-2"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Cargo Table */}
      <div className="mb-8">
        <h2 className="font-semibold mb-3">Cargo List</h2>
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900">
              <tr>
                <th className="px-3 py-3 text-center">No</th>
                <th className="px-3 py-3 text-center">Date</th>
                <th className="px-3 py-3 text-center">Cargo</th>
                <th className="px-3 py-3 text-center">Freight Cost</th>
                <th className="px-3 py-3 text-center">Cargo Type</th>
                <th className="px-3 py-3 text-center">Balen</th>
                <th className="px-3 py-3 text-center">Balen Freight Cost</th>
                <th className="px-3 py-3 text-center">Balen Cargo Type</th>
                <th className="px-3 py-3 text-center">Total</th>
                <th className="px-3 py-3 text-center">Notes</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCargoList.map((c, i) => (
                <tr key={c.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                  <td className="px-3 py-3 text-center">{i + 1}</td>
                  <td className="px-3 py-3 text-center">{c.tanggal}</td>
                  <td className="px-3 py-3 text-center">{c.cargo}</td>
                  <td className="px-3 py-3 text-center">{formatIDR(c.freight_cost)}</td>
                  <td className="px-3 py-3 text-center">{c.cargo_type || "-"}</td>
                  <td className="px-3 py-3 text-center">{c.balen || "-"}</td>
                  <td className="px-3 py-3 text-center">{formatIDR(c.balen_freight_cost)}</td>
                  <td className="px-3 py-3 text-center">{c.balen_cargo_type || "-"}</td>
                  <td className="px-3 py-3 text-center font-semibold text-amber-400">{c.total != null ? formatIDR(c.total) : "-"}</td>
                  <td className="px-3 py-3 text-center">{c.notes || "-"}</td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openCargoResult(c)}
                        className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 transition-colors"
                        title="Calculate Result"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" className="w-4 h-4">
                          <path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H64zM96 64H288c17.7 0 32 14.3 32 32v32c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V96c0-17.7 14.3-32 32-32zm32 160a32 32 0 1 1 -64 0 32 32 0 1 1 64 0zM96 352a32 32 0 1 1 0-64 32 32 0 1 1 0 64zM64 416c0-17.7 14.3-32 32-32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H96c-17.7 0-32-14.3-32-32zM192 256a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm32 64a32 32 0 1 1 -64 0 32 32 0 1 1 64 0zm64-64a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm32 64a32 32 0 1 1 -64 0 32 32 0 1 1 64 0zM288 448a32 32 0 1 1 0-64 32 32 0 1 1 0 64z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditCargo(c)}
                        className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="w-4 h-4">
                          <path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L680 119.7 387.1 121.1 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteCargo(c.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-4 h-4">
                          <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAndSortedCargoList.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-zinc-500">
                    {selectedMonth ? "Tidak ada cargo di bulan ini" : "Belum ada data cargo"}
                  </td>
                </tr>
              )}
              {/* Table Total Row */}
              {filteredAndSortedCargoList.length > 0 && (
                <tr className="bg-zinc-800 border-t-2 border-zinc-600">
                  <td colSpan={8} className="px-3 py-3 text-right font-bold">
                    TOTAL {selectedMonth ? `(${selectedMonth})` : ""}:
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-lg text-amber-400">
                    {formatIDR(tableTotal)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Result List Table */}
      {resultList.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold mb-3">Result List</h2>
          <div className="overflow-x-auto rounded-2xl border border-amber-500/30">
            <table className="w-full text-sm">
              <thead className="bg-amber-500/20">
                <tr>
                  <th className="px-3 py-3 text-center">No</th>
                  <th className="px-3 py-3 text-center">Date</th>
                  <th className="px-3 py-3 text-center">Description</th>
                  <th className="px-3 py-3 text-center">Total</th>
                  <th className="px-3 py-3 text-center">Notes</th>
                  <th className="px-3 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resultList.map((r, i) => (
                  <tr key={r.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                    <td className="px-3 py-3 text-center">{i + 1}</td>
                    <td className="px-3 py-3 text-center">{r.tanggal}</td>
                    <td className="px-3 py-3 text-center">{r.description}</td>
                    <td className="px-3 py-3 text-center font-semibold text-amber-400">{formatIDR(r.total)}</td>
                    <td className="px-3 py-3 text-center text-xs text-zinc-400">{r.notes || "-"}</td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => setResultList(resultList.filter(item => item.id !== r.id))}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-4 h-4">
                          <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Result List Total Row */}
                <tr className="bg-amber-500/30 border-t-2 border-amber-500">
                  <td colSpan={3} className="px-3 py-3 text-right font-bold">RESULT TOTAL:</td>
                  <td className="px-3 py-3 text-center font-bold text-lg text-amber-400">
                    {formatIDR(resultList.reduce((sum, r) => sum + (r.total || 0), 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-Cargo Result Modal */}
      {showResult && selectedCargoForResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-amber-400">Calculate Result</h2>
                <button
                  onClick={() => { setShowResult(false); setSelectedCargoForResult(null); }}
                  className="text-zinc-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" className="w-5 h-5">
                    <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/>
                  </svg>
                </button>
              </div>

              {/* Cargo Info */}
              <div className="bg-zinc-800 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Date:</span>
                    <span className="ml-2">{selectedCargoForResult.tanggal}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Cargo:</span>
                    <span className="ml-2">{selectedCargoForResult.cargo}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Freight Cost:</span>
                    <span className="ml-2 text-green-400">{formatIDR(selectedCargoForResult.freight_cost)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Balen Freight:</span>
                    <span className="ml-2 text-green-400">{formatIDR(selectedCargoForResult.balen_freight_cost)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-400">Cargo Total:</span>
                    <span className="ml-2 font-semibold text-amber-400">
                      {formatIDR((selectedCargoForResult.freight_cost || 0) + (selectedCargoForResult.balen_freight_cost || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deduction Inputs */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Fuel (IDR)</label>
                  <RupiahInput
                    value={fuel}
                    onChange={setFuel}
                    className="border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Operational Cost</label>
                  <RupiahInput
                    value={operationalCost}
                    onChange={setOperationalCost}
                    className="border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Other Costs</label>
                  <RupiahInput
                    value={cargoOtherCost}
                    onChange={setCargoOtherCost}
                    className="border-zinc-700"
                  />
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="bg-zinc-800 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-zinc-700">
                      <td className="px-4 py-3">Cargo Total (Freight + Balen)</td>
                      <td className="px-4 py-3 text-right text-green-400">
                        + {formatIDR(calculateCargoResult().cargoGross)}
                      </td>
                    </tr>
                    <tr className="border-b border-zinc-700">
                      <td className="px-4 py-3">Fuel</td>
                      <td className="px-4 py-3 text-right text-red-400">- {formatIDR(fuel)}</td>
                    </tr>
                    <tr className="border-b border-zinc-700">
                      <td className="px-4 py-3">Operational Cost</td>
                      <td className="px-4 py-3 text-right text-red-400">- {formatIDR(operationalCost)}</td>
                    </tr>
                    <tr className="border-b border-zinc-700">
                      <td className="px-4 py-3">Other Costs</td>
                      <td className="px-4 py-3 text-right text-red-400">- {formatIDR(cargoOtherCost)}</td>
                    </tr>
                    <tr className="border-b border-zinc-700 bg-zinc-700/50">
                      <td className="px-4 py-3 font-semibold">Cost Muatan</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatIDR(calculateCargoResult().costMuatan)}</td>
                    </tr>
                    <tr className="border-b border-zinc-700 bg-zinc-700/50">
                      <td className="px-4 py-3">× 30% = Cut Payment</td>
                      <td className="px-4 py-3 text-right text-red-400">- {formatIDR(calculateCargoResult().cutPayment)}</td>
                    </tr>
                    <tr className="bg-amber-500/20">
                      <td className="px-4 py-4 font-bold text-lg">TOTAL</td>
                      <td className="px-4 py-4 text-right font-bold text-lg text-amber-400">
                        {formatIDR(calculateCargoResult().total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-zinc-500 mb-6">
                Formula: Cost Muatan = (Freight + Balen) - Fuel - Operational - Other. If Cost Muatan &gt; 0: Cut Payment = Cost Muatan × 30%, Total = Cost Muatan - Cut Payment. If Cost Muatan ≤ 0: Total = 0
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={addToResultList}
                  className="flex-1 rounded-xl bg-green-500 hover:bg-green-400 text-black py-3 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-4 h-4">
                    <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/>
                  </svg>
                  Add to Result List
                </button>
                <button
                  onClick={() => { setShowResult(false); setSelectedCargoForResult(null); }}
                  className="rounded-xl border border-zinc-600 px-6 py-3 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
