-- =============================================================
-- Migration: Nama Perusahaan (companies list), invoice company field,
--            pagination support + Nopol list
-- Jalankan SQL ini di Supabase SQL Editor.
-- AMAN dijalankan ulang (idempotent). Tidak menghapus data apa pun.
-- =============================================================

-- 1) Daftar nama perusahaan (Settings -> Nama Perusahaan)
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Name unik (case-insensitive) supaya tidak dobel setelah trim (handled in code too)
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_name_unique
  ON companies (LOWER(TRIM(name)));

CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);

-- 2) Feld "Nama Perusahaan" pada invoice (nullable, legacy-safe)
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS nama_perusahaan TEXT DEFAULT NULL;

-- 3) Kolom nopol pada invoices (untuk autocomplete / list nopol tanpa join trucks)
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS nopol TEXT DEFAULT NULL;

-- 4) Jaga konsistensi: no_rekening & account_name sebaiknya nullable agar
--    invoice tanpa rekening tidak gagal insert. Kolom ini di-ubah agar
--    memiliki default '' (tidak menyentuh data existing).
ALTER TABLE invoices
  ALTER COLUMN no_rekening SET DEFAULT '',
  ALTER COLUMN account_name SET DEFAULT '';

-- =============================================================
-- (Tidak ada DROP / TRUNCATE / DELETE di migration ini.)
-- =============================================================
