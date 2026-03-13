"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileInvoiceDollar,
  faTruckFast,
  faChartBar,
  faGear,
  faRightFromBracket,
  faBars,
  faXmark,
  faNoteSticky,
  faPhone,
  faTrash,
  faPlus,
  faClover,
  faSun,
  faMoon,
  faPen,
  faCheck,
  faTruck,
  faSearch,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@/components/ThemeProvider";

type Note = {
  id: string;
  name: string;
  phone: string;
  description: string;
  created_at: string;
};

type TruckOption = {
  id: string;
  nopol: string;
  keterangan: string;
};

type KeteranganMuat = {
  id: string;
  truck_id: string;
  note_id: string | null;
  order: string;
  tgl_muat: string;
  tgl_bongkar: string;
  balen: string;
  tgl_muat_balen: string;
  balen_do: string;
  tgl_bongkar_balen: string;
  tempat_bongkar: string;
  created_at: string;
  trucks?: { nopol: string };
  order_notes?: { name: string; phone: string } | null;
};

// Inline searchable dropdown component for use inside the modal
function DropdownSearch({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { value: string; label: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.sub && o.sub.toLowerCase().includes(q))
    );
  }, [options, search]);

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-left outline-none focus:border-zinc-500 ${
          open ? "border-zinc-500" : ""
        }`}
      >
        <span className={selectedLabel ? "" : "text-zinc-500"}>
          {selectedLabel || placeholder}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-[70] mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-zinc-800">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
              <input
                ref={inputRef}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-8 pr-3 py-1.5 text-sm outline-none focus:border-zinc-500 placeholder-zinc-500"
                placeholder="Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500 text-center">Tidak ditemukan</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 ${
                    o.value === value ? "bg-zinc-800 text-zinc-100" : "text-zinc-300"
                  }`}
                >
                  <div>{o.label}</div>
                  {o.sub && <div className="text-xs text-zinc-500">{o.sub}</div>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, mounted, toggleTheme } = useTheme();
  const themeIcon = mounted ? (theme === "dark" ? faSun : faMoon) : faSun;
  const themeTitle = mounted ? (theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode") : "Switch Theme";
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Edit note state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Tab state: "kontak" or "keterangan"
  const [activeTab, setActiveTab] = useState<"kontak" | "keterangan">("kontak");

  // Keterangan Muat state
  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [keteranganList, setKeteranganList] = useState<KeteranganMuat[]>([]);
  const [loadingKeterangan, setLoadingKeterangan] = useState(false);
  const [showKetForm, setShowKetForm] = useState(false);
  const [ketTruckId, setKetTruckId] = useState("");
  const [ketNoteId, setKetNoteId] = useState("");
  const [ketOrder, setKetOrder] = useState("");
  const [ketTglMuat, setKetTglMuat] = useState("");
  const [ketTglBongkar, setKetTglBongkar] = useState("");
  const [ketBalen, setKetBalen] = useState("");
  const [ketTglMuatBalen, setKetTglMuatBalen] = useState("");
  const [ketBalenDo, setKetBalenDo] = useState("");
  const [ketTglBongkarBalen, setKetTglBongkarBalen] = useState("");
  const [ketTempatBongkar, setKetTempatBongkar] = useState("");
  const [savingKet, setSavingKet] = useState(false);
  const [editingKetId, setEditingKetId] = useState<string | null>(null)

  const navItems = [
    { href: "/", label: "Dashboard", icon: faFileInvoiceDollar },
    { href: "/muatan", label: "Muatan", icon: faTruckFast },
    { href: "/reports", label: "Reports", icon: faChartBar },
    { href: "/settings", label: "Settings", icon: faGear },
  ];

  const fetchNotes = useCallback(async () => {
    setLoadingNotes(true);
    try {
      const res = await fetch("/api/notes");
      const json = await res.json();
      if (json.data) setNotes(json.data);
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  const fetchTrucks = useCallback(async () => {
    try {
      const res = await fetch("/api/trucks");
      const json = await res.json();
      if (json.data) setTrucks(json.data.map((t: TruckOption & { nama_supir?: string }) => ({ id: t.id, nopol: t.nopol, keterangan: t.keterangan || t.nama_supir || "" })));
    } catch (err) {
      console.error("Failed to load trucks:", err);
    }
  }, []);

  const fetchKeterangan = useCallback(async () => {
    setLoadingKeterangan(true);
    try {
      const res = await fetch("/api/keterangan-muat");
      const json = await res.json();
      if (json.data) setKeteranganList(json.data);
    } catch (err) {
      console.error("Failed to load keterangan muat:", err);
    } finally {
      setLoadingKeterangan(false);
    }
  }, []);

  useEffect(() => {
    if (notesOpen) {
      fetchNotes();
      fetchTrucks();
      if (activeTab === "keterangan") fetchKeterangan();
    }
  }, [notesOpen, activeTab, fetchNotes, fetchTrucks, fetchKeterangan]);

  async function addNote() {
    if (!newName.trim() || !newPhone.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, phone: newPhone, description: newDesc }),
      });
      if (res.ok) {
        setNewName("");
        setNewPhone("");
        setNewDesc("");
        fetchNotes();
      }
    } finally {
      setSavingNote(false);
    }
  }

  async function updateNote(id: string) {
    if (!editName.trim() || !editPhone.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone: editPhone, description: editDesc }),
      });
      if (res.ok) {
        setEditingNoteId(null);
        fetchNotes();
      }
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteNote(id: string) {
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  }

  function startEditNote(note: Note) {
    setEditingNoteId(note.id);
    setEditName(note.name);
    setEditPhone(note.phone);
    setEditDesc(note.description || "");
  }

  // Keterangan Muat functions
  function resetKetForm() {
    setKetTruckId("");
    setKetNoteId("");
    setKetOrder("");
    setKetTglMuat("");
    setKetTglBongkar("");
    setKetBalen("");
    setKetTglMuatBalen("");
    setKetBalenDo("");
    setKetTglBongkarBalen("");
    setKetTempatBongkar("");
    setEditingKetId(null);
    setShowKetForm(false);
  }

  async function saveKeterangan() {
    if (!ketTruckId) return;
    setSavingKet(true);
    try {
      const payload = {
        truck_id: ketTruckId,
        note_id: ketNoteId || null,
        order: ketOrder,
        tgl_muat: ketTglMuat,
        tgl_bongkar: ketTglBongkar,
        balen: ketBalen,
        tgl_muat_balen: ketTglMuatBalen,
        balen_do: ketBalenDo,
        tgl_bongkar_balen: ketTglBongkarBalen,
        tempat_bongkar: ketTempatBongkar,
      };

      const url = editingKetId ? `/api/keterangan-muat/${editingKetId}` : "/api/keterangan-muat";
      const method = editingKetId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resetKetForm();
        fetchKeterangan();
      }
    } finally {
      setSavingKet(false);
    }
  }

  function startEditKet(k: KeteranganMuat) {
    setEditingKetId(k.id);
    setKetTruckId(k.truck_id);
    setKetNoteId(k.note_id || "");
    setKetOrder(k.order || "");
    setKetTglMuat(k.tgl_muat || "");
    setKetTglBongkar(k.tgl_bongkar || "");
    setKetBalen(k.balen || "");
    setKetTglMuatBalen(k.tgl_muat_balen || "");
    setKetBalenDo(k.balen_do || "");
    setKetTglBongkarBalen(k.tgl_bongkar_balen || "");
    setKetTempatBongkar(k.tempat_bongkar || "");
    setShowKetForm(true);
  }

  async function deleteKeterangan(id: string) {
    if (!confirm("Yakin ingin menghapus keterangan muat ini?")) return;
    try {
      await fetch(`/api/keterangan-muat/${id}`, { method: "DELETE" });
      setKeteranganList((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error("Failed to delete keterangan muat:", err);
    }
  }

  // Dropdown options
  const truckOptions = trucks.map((t) => ({
    value: t.id,
    label: t.nopol,
    sub: t.keterangan,
  }));

  const noteOptions = notes.map((n) => ({
    value: n.id,
    label: n.name,
    sub: n.phone,
  }));

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/login", { method: "DELETE" });
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <FontAwesomeIcon icon={faClover} className="w-5 h-5 text-green-400" />
            <span className="text-zinc-500 mx-0.5">·</span>
            <span>HR Billing</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex gap-2 items-center">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-xl px-4 py-2 text-sm transition border flex items-center gap-2",
                    active
                      ? "bg-zinc-100 text-zinc-950 border-zinc-100"
                      : "bg-zinc-900/40 text-zinc-200 border-zinc-800 hover:bg-zinc-900/70",
                  ].join(" ")}
                >
                  <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}

            <button
              onClick={() => setNotesOpen(true)}
              className="rounded-xl px-4 py-2 text-sm transition border bg-zinc-900/40 text-zinc-200 border-zinc-800 hover:bg-zinc-900/70 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faNoteSticky} className="w-4 h-4" />
              Notes
            </button>

            <button
              onClick={toggleTheme}
              className="rounded-xl px-3 py-2 text-sm transition border bg-zinc-900/40 text-zinc-200 border-zinc-800 hover:bg-zinc-900/70"
              title={themeTitle}
            >
              <FontAwesomeIcon icon={themeIcon} className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="ml-2 rounded-xl px-4 py-2 text-sm transition border bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
              {loggingOut ? "..." : "Logout"}
            </button>
          </div>

          {/* Mobile: theme toggle + menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-2 text-zinc-200"
              title={themeTitle}
            >
              <FontAwesomeIcon icon={themeIcon} className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-2 text-zinc-200"
            >
              <FontAwesomeIcon icon={mobileMenuOpen ? faXmark : faBars} className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile nav menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur px-4 py-3 space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={[
                    "rounded-xl px-4 py-3 text-sm transition border flex items-center gap-3 w-full",
                    active
                      ? "bg-zinc-100 text-zinc-950 border-zinc-100"
                      : "bg-zinc-900/40 text-zinc-200 border-zinc-800 hover:bg-zinc-900/70",
                  ].join(" ")}
                >
                  <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setNotesOpen(true);
              }}
              className="rounded-xl px-4 py-3 text-sm transition border bg-zinc-900/40 text-zinc-200 border-zinc-800 hover:bg-zinc-900/70 flex items-center gap-3 w-full"
            >
              <FontAwesomeIcon icon={faNoteSticky} className="w-4 h-4" />
              Notes
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              disabled={loggingOut}
              className="rounded-xl px-4 py-3 text-sm transition border bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 flex items-center gap-3 w-full"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {notesOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setNotesOpen(false); setEditingNoteId(null); resetKetForm(); }} />
          <div className="relative w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faNoteSticky} className="w-5 h-5 text-yellow-400" />
                Notes
              </h2>
              <button onClick={() => { setNotesOpen(false); setEditingNoteId(null); resetKetForm(); }} className="rounded-lg p-1 hover:bg-zinc-800">
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              <button
                onClick={() => setActiveTab("kontak")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "kontak"
                    ? "text-zinc-100 border-b-2 border-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <FontAwesomeIcon icon={faPhone} className="w-3.5 h-3.5 mr-2" />
                Kontak Order
              </button>
              <button
                onClick={() => setActiveTab("keterangan")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "keterangan"
                    ? "text-zinc-100 border-b-2 border-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <FontAwesomeIcon icon={faTruck} className="w-3.5 h-3.5 mr-2" />
                Keterangan Muat
              </button>
            </div>

            {/* TAB: Kontak Order */}
            {activeTab === "kontak" && (
              <>
                {/* Add new note form */}
                <div className="border-b border-zinc-800 px-5 py-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                      placeholder="Nama"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <input
                      className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                      placeholder="No. Telepon"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                      placeholder="Keterangan (opsional)"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
                    />
                    <button
                      onClick={addNote}
                      disabled={savingNote || !newName.trim() || !newPhone.trim()}
                      className="rounded-xl bg-zinc-100 text-zinc-950 px-4 py-2 text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                      Tambah
                    </button>
                  </div>
                </div>

                {/* Notes list */}
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
                  {loadingNotes ? (
                    <p className="text-sm text-zinc-500 text-center py-4">Loading...</p>
                  ) : notes.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-4">Belum ada kontak tersimpan</p>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                        {editingNoteId === note.id ? (
                          /* Edit mode */
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-zinc-500"
                                placeholder="Nama"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                              />
                              <input
                                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-zinc-500"
                                placeholder="No. Telepon"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                              />
                            </div>
                            <input
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-zinc-500"
                              placeholder="Keterangan"
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") updateNote(note.id); }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateNote(note.id)}
                                disabled={savingNote || !editName.trim() || !editPhone.trim()}
                                className="rounded-lg bg-green-600 text-white px-3 py-1 text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                              >
                                <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                                Simpan
                              </button>
                              <button
                                onClick={() => setEditingNoteId(null)}
                                className="rounded-lg bg-zinc-700 text-zinc-300 px-3 py-1 text-xs"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View mode */
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium text-sm">{note.name}</div>
                              <div className="text-sm text-blue-400 flex items-center gap-1.5 mt-0.5">
                                <FontAwesomeIcon icon={faPhone} className="w-3 h-3" />
                                <a href={`tel:${note.phone}`}>{note.phone}</a>
                              </div>
                              {note.description && (
                                <div className="text-xs text-zinc-500 mt-1">{note.description}</div>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => startEditNote(note)}
                                className="rounded-lg p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-950/30"
                              >
                                <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteNote(note.id)}
                                className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30"
                              >
                                <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* TAB: Keterangan Muat */}
            {activeTab === "keterangan" && (
              <>
                {/* Add / Edit form toggle */}
                <div className="border-b border-zinc-800 px-5 py-3">
                  <button
                    onClick={() => {
                      if (showKetForm && !editingKetId) {
                        resetKetForm();
                      } else {
                        resetKetForm();
                        setShowKetForm(true);
                      }
                    }}
                    className="rounded-xl bg-zinc-100 text-zinc-950 px-4 py-2 text-sm font-medium flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={showKetForm ? faXmark : faPlus} className="w-3 h-3" />
                    {showKetForm ? "Tutup Form" : "Tambah Keterangan Muat"}
                  </button>
                </div>

                {showKetForm && (
                  <div className="border-b border-zinc-800 px-5 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
                    <div className="text-sm font-medium text-zinc-300 mb-1">
                      {editingKetId ? "Edit Keterangan Muat" : "Form Keterangan Muat Baru"}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Nopol *</label>
                        <DropdownSearch
                          options={truckOptions}
                          value={ketTruckId}
                          onChange={setKetTruckId}
                          placeholder="Pilih Nopol..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Kontak Order</label>
                        <DropdownSearch
                          options={noteOptions}
                          value={ketNoteId}
                          onChange={setKetNoteId}
                          placeholder="Pilih Kontak..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Order</label>
                        <input className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500" placeholder="Order" value={ketOrder} onChange={(e) => setKetOrder(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Tgl Muat</label>
                        <input type="date" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500" value={ketTglMuat} onChange={(e) => setKetTglMuat(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Tgl Bongkar</label>
                        <input type="date" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500" value={ketTglBongkar} onChange={(e) => setKetTglBongkar(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Balen</label>
                        <input className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500" placeholder="Balen" value={ketBalen} onChange={(e) => setKetBalen(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Tgl Muat (Balen)</label>
                        <input type="date" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500" value={ketTglMuatBalen} onChange={(e) => setKetTglMuatBalen(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Balen DO</label>
                        <input className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500" placeholder="Balen DO" value={ketBalenDo} onChange={(e) => setKetBalenDo(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Tgl Bongkar (Balen)</label>
                        <input type="date" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500" value={ketTglBongkarBalen} onChange={(e) => setKetTglBongkarBalen(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Tempat Bongkar</label>
                        <input className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500" placeholder="Tempat Bongkar" value={ketTempatBongkar} onChange={(e) => setKetTempatBongkar(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={saveKeterangan}
                        disabled={savingKet || !ketTruckId}
                        className="rounded-xl bg-zinc-100 text-zinc-950 px-4 py-2 text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                      >
                        <FontAwesomeIcon icon={editingKetId ? faCheck : faPlus} className="w-3 h-3" />
                        {savingKet ? "Saving..." : editingKetId ? "Update" : "Simpan"}
                      </button>
                      <button
                        onClick={resetKetForm}
                        className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* Keterangan Muat list / table */}
                <div className="flex-1 overflow-y-auto px-5 py-3">
                  {loadingKeterangan ? (
                    <p className="text-sm text-zinc-500 text-center py-4">Loading...</p>
                  ) : keteranganList.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-4">Belum ada keterangan muat</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-400">
                            <th className="text-left py-2 px-2">Nopol</th>
                            <th className="text-left py-2 px-2">Order</th>
                            <th className="text-left py-2 px-2">Kontak</th>
                            <th className="text-left py-2 px-2">Tgl Muat</th>
                            <th className="text-left py-2 px-2">Tgl Bongkar</th>
                            <th className="text-left py-2 px-2">Balen</th>
                            <th className="text-left py-2 px-2">Tempat Bongkar</th>
                            <th className="text-right py-2 px-2">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {keteranganList.map((k) => (
                            <tr key={k.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                              <td className="py-2 px-2 font-medium">{k.trucks?.nopol || "-"}</td>
                              <td className="py-2 px-2">{k.order || "-"}</td>
                              <td className="py-2 px-2">{k.order_notes?.name || "-"}</td>
                              <td className="py-2 px-2">{k.tgl_muat || "-"}</td>
                              <td className="py-2 px-2">{k.tgl_bongkar || "-"}</td>
                              <td className="py-2 px-2">{k.balen || "-"}</td>
                              <td className="py-2 px-2">{k.tempat_bongkar || "-"}</td>
                              <td className="py-2 px-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  <button
                                    onClick={() => startEditKet(k)}
                                    className="rounded p-1 text-zinc-500 hover:text-blue-400 hover:bg-blue-950/30"
                                  >
                                    <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteKeterangan(k.id)}
                                    className="rounded p-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/30"
                                  >
                                    <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
