"use client";

import { useMemo } from "react";

interface NopolInputProps {
  value: string;
  onChange: (value: string) => void;
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
export function NopolInput({ value, onChange }: NopolInputProps) {
  const parsed = useMemo(() => parseNopol(value), [value]);

  function handleChange(part: "prefix" | "number" | "suffix", val: string) {
    const updated = { ...parsed, [part]: val.toUpperCase() };
    // Combine parts with space separator, trim trailing spaces if parts are empty
    const combined = [updated.prefix, updated.number, updated.suffix]
      .map((p) => p.trim())
      .filter(Boolean)
      .join(" ");
    onChange(combined);
  }

  return (
    <div className="flex gap-1 sm:gap-1.5 min-w-0 w-full">
      <input
        className="w-[28%] min-w-0 shrink-0 rounded-xl border border-zinc-800 bg-zinc-950 px-1 sm:px-2 py-3 text-center text-sm sm:text-base uppercase outline-none focus:border-zinc-600"
        placeholder="AG"
        maxLength={2}
        autoCapitalize="characters"
        value={parsed.prefix}
        onChange={(e) => handleChange("prefix", e.target.value.replace(/[^A-Za-z]/g, ""))}
      />
      <input
        className="flex-1 min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 px-1 sm:px-2 py-3 text-center text-sm sm:text-base outline-none focus:border-zinc-600"
        placeholder="1234"
        maxLength={4}
        inputMode="numeric"
        value={parsed.number}
        onChange={(e) => handleChange("number", e.target.value.replace(/[^0-9]/g, ""))}
      />
      <input
        className="w-[28%] min-w-0 shrink-0 rounded-xl border border-zinc-800 bg-zinc-950 px-1 sm:px-2 py-3 text-center text-sm sm:text-base uppercase outline-none focus:border-zinc-600"
        placeholder="XX"
        maxLength={3}
        autoCapitalize="characters"
        value={parsed.suffix}
        onChange={(e) => handleChange("suffix", e.target.value.replace(/[^A-Za-z]/g, ""))}
      />
    </div>
  );
}
