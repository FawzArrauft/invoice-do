"use client";

import { useMemo, useState, useRef, useEffect } from "react";

export type TruckOption = {
  id: string;
  nopol: string;
  keterangan?: string;
  nama_supir?: string;
};

interface NopolInputProps {
  value: string;
  onChange: (value: string) => void;
  trucks?: TruckOption[];
}

/**
 * Parse a nopol string into its 3 parts
 * Format: "AG 1234 XX" -> { prefix: "AG", number: "1234", suffix: "XX" }
 */
function parseNopol(nopol: string): { prefix: string; number: string; suffix: string } {
  if (!nopol) return { prefix: "", number: "", suffix: "" };
  
  const trimmed = nopol.trim();
  // Try to split by spaces
  const parts = trimmed.split(/\s+/);
  
  if (parts.length >= 3) {
    return {
      prefix: parts[0],
      number: parts[1],
      suffix: parts.slice(2).join(" "),
    };
  } else if (parts.length === 2) {
    // Could be "AG 1234XX" or "AG1234 XX"
    // Check if second part starts with number
    const match = parts[1].match(/^(\d+)(.*)$/);
    if (match) {
      return { prefix: parts[0], number: match[1], suffix: match[2] || "" };
    }
    return { prefix: parts[0], number: parts[1], suffix: "" };
  } else {
    // Single word - try to parse "AG1234XX"
    const match = trimmed.match(/^([A-Za-z]{1,2})(\d+)([A-Za-z]*)$/);
    if (match) {
      return { prefix: match[1], number: match[2], suffix: match[3] || "" };
    }
    return { prefix: trimmed, number: "", suffix: "" };
  }
}

/**
 * NoPol input split into 3 fields: [Kode Wilayah] [Nomor] [Akhir]
 * Indonesian license plate format: AG 1234 XX
 * Responsive: adapts to container width, auto uppercase
 */
export function NopolInput({ value, onChange, trucks = [] }: NopolInputProps) {
  const parsed = useMemo(() => parseNopol(value), [value]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTrucks = useMemo(() => {
    if (!trucks.length) return [];
    const q = search.toLowerCase().replace(/\s+/g, "");
    if (!q) return trucks;
    return trucks.filter((t) => {
      const nopolMatch = t.nopol.toLowerCase().replace(/\s+/g, "").includes(q);
      const ketMatch = (t.keterangan || "").toLowerCase().includes(q);
      const supirMatch = (t.nama_supir || "").toLowerCase().includes(q);
      return nopolMatch || ketMatch || supirMatch;
    });
  }, [trucks, search]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleChange(part: "prefix" | "number" | "suffix", val: string) {
    const updated = { ...parsed, [part]: val.toUpperCase() };
    const combined = [updated.prefix, updated.number, updated.suffix]
      .map((p) => p.trim())
      .filter(Boolean)
      .join(" ");
    onChange(combined);
    if (trucks.length > 0) setShowDropdown(true);
  }

  function selectTruck(nopol: string) {
    onChange(nopol);
    setSearch("");
    setShowDropdown(false);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex gap-1 sm:gap-1.5 min-w-0 w-full">
        <input
          className="w-[28%] min-w-0 shrink-0 rounded-xl border border-zinc-800 bg-zinc-950 px-1 sm:px-2 py-3 text-center text-sm sm:text-base uppercase outline-none focus:border-zinc-600"
          placeholder="AG"
          maxLength={2}
          autoCapitalize="characters"
          value={parsed.prefix}
          onFocus={() => trucks.length > 0 && setShowDropdown(true)}
          onChange={(e) => handleChange("prefix", e.target.value.replace(/[^A-Za-z]/g, ""))}
        />
        <input
          className="flex-1 min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 px-1 sm:px-2 py-3 text-center text-sm sm:text-base outline-none focus:border-zinc-600"
          placeholder="1234"
          maxLength={4}
          inputMode="numeric"
          value={parsed.number}
          onFocus={() => trucks.length > 0 && setShowDropdown(true)}
          onChange={(e) => handleChange("number", e.target.value.replace(/[^0-9]/g, ""))}
        />
        <input
          className="w-[28%] min-w-0 shrink-0 rounded-xl border border-zinc-800 bg-zinc-950 px-1 sm:px-2 py-3 text-center text-sm sm:text-base uppercase outline-none focus:border-zinc-600"
          placeholder="XX"
          maxLength={3}
          autoCapitalize="characters"
          value={parsed.suffix}
          onFocus={() => trucks.length > 0 && setShowDropdown(true)}
          onChange={(e) => handleChange("suffix", e.target.value.replace(/[^A-Za-z]/g, ""))}
        />
      </div>
      {showDropdown && trucks.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 shadow-lg">
          <div className="p-2 border-b border-zinc-800">
            <input
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500 placeholder-zinc-500"
              placeholder="Cari nopol, keterangan, supir..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredTrucks.length === 0 ? (
              <div className="px-3 py-2 text-xs text-zinc-500">Tidak ditemukan</div>
            ) : (
              filteredTrucks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 transition-colors ${
                    t.nopol === value ? "bg-zinc-800 text-white" : "text-zinc-300"
                  }`}
                  onMouseDown={(e) => { e.preventDefault(); selectTruck(t.nopol); }}
                >
                  <span className="font-mono">{t.nopol}</span>
                  {(t.keterangan || t.nama_supir) && (
                    <span className="ml-2 text-xs text-zinc-500">
                      {[t.keterangan, t.nama_supir].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
