-- =============================================================
-- Migration: Extra Charges, Empty Rows & Order Notes
-- Jalankan SQL ini di Supabase SQL Editor
-- =============================================================

-- 1. Tambah kolom extra_charges (JSONB) dan is_empty_row pada invoice_items
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS extra_charges JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_empty_row BOOLEAN DEFAULT false;

-- 2. Buat tabel order_notes untuk fitur Notes (kontak order)
CREATE TABLE IF NOT EXISTS order_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Index untuk performance
CREATE INDEX IF NOT EXISTS idx_order_notes_created_at ON order_notes(created_at DESC);

-- 4. Tambah kolom tanggal_balen pada truck_cargo
ALTER TABLE truck_cargo
  ADD COLUMN IF NOT EXISTS tanggal_balen TEXT DEFAULT '';

-- 5. Tambah kolom updated_at dan order_notes pada invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS order_notes JSONB DEFAULT '[]'::jsonb;

-- 6. Tambah kolom keterangan dan nama_supir pada trucks
ALTER TABLE trucks
  ADD COLUMN IF NOT EXISTS keterangan TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS nama_supir TEXT DEFAULT '';

-- 7. RLS (Row Level Security) - opsional, aktifkan jika menggunakan RLS
-- ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for authenticated" ON order_notes
--   FOR ALL USING (true) WITH CHECK (true);
