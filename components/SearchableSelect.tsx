"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";

export type SearchableOption = {
  value: string;
  label: string;
  description?: string;
  group?: string;
};

type SearchableSelectProps = {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Show recent selections at top */
  recentKeys?: string[];
  className?: string;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "-- Pilih --",
  disabled = false,
  loading = false,
  debounceMs = 300,
  recentKeys = [],
  className = "",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [highlightIdx, setHighlightIdx] = useState(-1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setHighlightIdx(-1);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [search, debounceMs]);

  // Filtered options based on debounced search
  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    let results = options;

    if (q) {
      results = options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          (opt.description && opt.description.toLowerCase().includes(q)) ||
          (opt.group && opt.group.toLowerCase().includes(q))
      );
    }

    // Group by category if groups exist
    const grouped = new Map<string, SearchableOption[]>();
    const recentSet = new Set(recentKeys);
    const recentItems: SearchableOption[] = [];
    const regularItems: SearchableOption[] = [];

    for (const opt of results) {
      if (recentSet.has(opt.value)) {
        recentItems.push(opt);
      } else {
        regularItems.push(opt);
      }
    }

    // Build ordered list: recent first, then grouped
    const ordered: SearchableOption[] = [...recentItems];

    for (const opt of regularItems) {
      const group = opt.group || "";
      if (!grouped.has(group)) grouped.set(group, []);
      grouped.get(group)!.push(opt);
    }

    // Flatten groups into ordered
    for (const [, items] of grouped) {
      ordered.push(...items);
    }

    return { all: ordered, recentCount: recentItems.length, grouped };
  }, [options, debouncedSearch, recentKeys]);

  // Close on click outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIdx >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-option]");
      items[highlightIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx]);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label || "",
    [options, value]
  );

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
      setSearch("");
    },
    [onChange]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    const total = filtered.all.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIdx((prev) => (prev < total - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIdx((prev) => (prev > 0 ? prev - 1 : total - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIdx >= 0 && highlightIdx < total) {
          handleSelect(filtered.all[highlightIdx].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setSearch("");
        break;
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Main button / display */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen(!open);
            // Focus input after opening
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={`w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left outline-none focus:border-zinc-600 transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-zinc-700"
        } ${open ? "border-zinc-600" : ""}`}
      >
        <span className={selectedLabel ? "text-zinc-100" : "text-zinc-500"}>
          {loading ? "Loading..." : selectedLabel || placeholder}
        </span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
          <svg
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-zinc-800">
            <input
              ref={inputRef}
              type="text"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500 placeholder-zinc-500"
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Options list */}
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto"
            role="listbox"
          >
            {filtered.all.length === 0 ? (
              <div className="px-4 py-3 text-sm text-zinc-500 text-center">
                {debouncedSearch ? "Tidak ditemukan" : "Tidak ada data"}
              </div>
            ) : (
              <>
                {/* Recent section header */}
                {filtered.recentCount > 0 && (
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-800/50 font-medium">
                    Recent
                  </div>
                )}

                {filtered.all.map((opt, idx) => {
                  const isRecent = idx < filtered.recentCount;
                  const isAfterRecent = idx === filtered.recentCount && filtered.recentCount > 0;

                  // Check if we need a group header
                  let groupHeader: string | null = null;
                  if (!isRecent && opt.group) {
                    const prevOpt = idx > 0 ? filtered.all[idx - 1] : null;
                    if (!prevOpt || prevOpt.group !== opt.group || (prevOpt && idx - 1 < filtered.recentCount)) {
                      groupHeader = opt.group;
                    }
                  }

                  return (
                    <div key={opt.value + "-" + idx}>
                      {/* Separator between recent and regular */}
                      {isAfterRecent && (
                        <div className="border-t border-zinc-700" />
                      )}
                      {/* Group header */}
                      {groupHeader && (
                        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-800/50 font-medium">
                          {groupHeader}
                        </div>
                      )}
                      <div
                        data-option
                        role="option"
                        aria-selected={opt.value === value}
                        onClick={() => handleSelect(opt.value)}
                        onMouseEnter={() => setHighlightIdx(idx)}
                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                          highlightIdx === idx
                            ? "bg-zinc-800 text-white"
                            : opt.value === value
                            ? "bg-zinc-800/50 text-zinc-100"
                            : "text-zinc-300 hover:bg-zinc-800/40"
                        }`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{opt.label}</span>
                          {opt.description && (
                            <span className="text-xs text-zinc-500 truncate">
                              {opt.description}
                            </span>
                          )}
                        </div>
                        {opt.value === value && (
                          <svg className="w-4 h-4 text-emerald-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
