"use client";

import { useState, useCallback, useRef } from "react";

interface IDRInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Format a number with Indonesian thousand separator (.)
 */
function formatWithDots(n: number): string {
  if (!n && n !== 0) return "";
  if (n === 0) return "";
  return new Intl.NumberFormat("id-ID").format(n);
}

/**
 * Strip non-digit chars and parse to number
 */
function parseDigits(str: string): number {
  const digits = str.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * IDR input that auto-formats with dots as the user types.
 * Example: typing 1000000 shows 1.000.000
 * Automatically syncs display when value changes externally.
 */
export function IDRInput({ value, onChange, placeholder = "0", className = "" }: IDRInputProps) {
  // Track local editing state and the value being edited
  const [editing, setEditing] = useState(false);
  const [localDisplay, setLocalDisplay] = useState("");
  const localNumRef = useRef(0);

  // When not editing, always derive display from the prop value
  const displayValue = editing ? localDisplay : (value ? formatWithDots(value) : "");

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseDigits(raw);
    const formatted = num ? formatWithDots(num) : "";
    setLocalDisplay(formatted);
    localNumRef.current = num;
    onChange(num);
  }, [onChange]);

  const handleFocus = useCallback(() => {
    setEditing(true);
    setLocalDisplay(value ? formatWithDots(value) : "");
    localNumRef.current = value;
  }, [value]);

  const handleBlur = useCallback(() => {
    setEditing(false);
  }, []);

  return (
    <input
      type="text"
      inputMode="numeric"
      className={`w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600 ${className}`}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
    />
  );
}
