"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
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
} from "@fortawesome/free-solid-svg-icons";

type Note = {
  id: string;
  name: string;
  phone: string;
  description: string;
  created_at: string;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [savingNote, setSavingNote] = useState(false);

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

  useEffect(() => {
    if (notesOpen) fetchNotes();
  }, [notesOpen, fetchNotes]);

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

  async function deleteNote(id: string) {
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  }

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
          <div className="font-semibold text-lg">
            Logistics Billing
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
                      ? "bg-white text-zinc-950 border-white"
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
              onClick={handleLogout}
              disabled={loggingOut}
              className="ml-2 rounded-xl px-4 py-2 text-sm transition border bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
              {loggingOut ? "..." : "Logout"}
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-2 text-zinc-200"
          >
            <FontAwesomeIcon icon={mobileMenuOpen ? faXmark : faBars} className="w-5 h-5" />
          </button>
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
                      ? "bg-white text-zinc-950 border-white"
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNotesOpen(false)} />
          <div className="relative w-full max-w-lg mx-4 max-h-[80vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faNoteSticky} className="w-5 h-5 text-yellow-400" />
                Kontak Order
              </h2>
              <button onClick={() => setNotesOpen(false)} className="rounded-lg p-1 hover:bg-zinc-800">
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>

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
                  className="rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-medium disabled:opacity-50 flex items-center gap-1"
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
                  <div key={note.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 flex items-start justify-between gap-3">
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
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 shrink-0"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
