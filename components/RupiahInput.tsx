"use client";

import { useRef, useEffect } from "react";
import { parseRupiah, formatRupiah } from "@/lib/calculation";

interface RupiahInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

/**
 * Currency input that handles Indonesian Rupiah format
 * Allows typing: 700.000, 1.500.000, 700000, etc.
 * Parses and stores as number, displays formatted on blur
 */
export function RupiahInput({ 
  value, 
  onChange, 
  placeholder = "0",
  className = "",
  label
}: RupiahInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  // Initialize input value on mount and when value changes externally
  useEffect(() => {
    if (inputRef.current) {
      // Only update if not focused (don't interrupt user typing)
      if (document.activeElement !== inputRef.current) {
        inputRef.current.value = value ? formatRupiah(value).replace("Rp ", "") : "";
      }
    }
  }, [value]);

  // Set initial value
  useEffect(() => {
    if (inputRef.current && !initializedRef.current) {
      inputRef.current.value = value ? formatRupiah(value).replace("Rp ", "") : "";
      initializedRef.current = true;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse and update the numeric value on each change
    const parsed = parseRupiah(e.target.value);
    onChange(parsed);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Show raw number for easier editing
    if (value) {
      e.target.value = value.toString();
      e.target.select();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Parse and format on blur
    const parsed = parseRupiah(e.target.value);
    onChange(parsed);
    e.target.value = parsed ? formatRupiah(parsed).replace("Rp ", "") : "";
  };

  return (
    <div>
      {label && <label className="mb-2 block text-sm text-zinc-300">{label}</label>}
      <input
        ref={inputRef}
        type="text"
        className={`w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 ${className}`}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
    </div>
  );
}

/**
 * Simple numeric input that parses Indonesian format on blur
 */
export function NumericInput({
  value,
  onChange,
  placeholder = "0",
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value when value prop changes
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = value?.toString() || "";
    }
  }, [value]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const parsed = parseRupiah(e.target.value);
    onChange(parsed);
    e.target.value = parsed.toString();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      className={`w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 ${className}`}
      defaultValue={value?.toString() || ""}
      onBlur={handleBlur}
      placeholder={placeholder}
    />
  );
}
