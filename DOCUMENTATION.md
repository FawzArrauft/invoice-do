# Invoice DO — Dokumentasi Teknis Lengkap

> **Stack**: Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS v4 · Supabase (PostgreSQL) · FontAwesome 7  
> **Runtime Node**: ≥ 18 · **Package Manager**: npm

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Arsitektur & Struktur Folder](#2-arsitektur--struktur-folder)
3. [Konfigurasi Proyek](#3-konfigurasi-proyek)
4. [Database Schema (Supabase)](#4-database-schema-supabase)
5. [Autentikasi & Middleware](#5-autentikasi--middleware)
6. [API Routes (Backend)](#6-api-routes-backend)
7. [Halaman (Frontend)](#7-halaman-frontend)
8. [Komponen UI Reusable](#8-komponen-ui-reusable)
9. [Library / Utilitas](#9-library--utilitas)
10. [Tema & Styling](#10-tema--styling)
11. [Keamanan](#11-keamanan)
12. [Panduan Development](#12-panduan-development)
13. [Deployment](#13-deployment)

---

## 1. Gambaran Umum

**Invoice DO** adalah aplikasi web internal untuk manajemen:

| Modul | Fungsi |
|-------|--------|
| **Invoice** | Membuat, mengedit, mencetak PDF, dan mengekspor invoice pengiriman barang |
| **Truck Management** | CRUD data truk, cargo per truk, kerusakan, dan status ordering |
| **Keterangan Muat** | Mencatat detail muatan truk (order, balen, tanggal muat/bongkar, tempat bongkar) dengan auto-expire |
| **Kontak Order** | Buku kontak pelanggan (nama, telepon, keterangan) yang bisa di-link ke invoice |
| **Reports** | Laporan bulanan pendapatan dengan chart dan export Excel |
| **Settings** | Konfigurasi bank, pabrik/tujuan preset, balen, muatan truk, dan tanda tangan default |

---

## 2. Arsitektur & Struktur Folder

```
invoice-app/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout (ThemeProvider, Toast, Navbar)
│   ├── page.tsx                 # Dashboard — form buat invoice baru
│   ├── globals.css              # Tailwind v4 + CSS variables tema
│   ├── login/page.tsx           # Halaman login
│   ├── invoices/
│   │   ├── page.tsx             # Daftar invoice (search, sort, pagination)
│   │   └── [id]/edit/page.tsx   # Edit invoice yang sudah ada
│   ├── muatan/
│   │   ├── page.tsx             # Truck Management (Order/Available groups)
│   │   └── [id]/page.tsx        # Detail truck (cargo, damages)
│   ├── reports/page.tsx         # Laporan bulanan
│   ├── settings/page.tsx        # Pengaturan aplikasi
│   └── api/                     # API Route Handlers (server-side)
│       ├── auth/check/          # Cek status autentikasi
│       ├── health/              # Health check endpoint
│       ├── login/               # POST login, DELETE logout
│       ├── invoices/            # CRUD invoice + PDF + export
│       ├── trucks/              # CRUD truk + cargo + damages + export
│       ├── muatan/              # Manajemen muatan (legacy)
│       ├── notes/               # CRUD kontak order
│       ├── keterangan-muat/     # CRUD keterangan muat
│       ├── reports/             # Laporan bulanan + export Excel
│       ├── settings/            # Configuration endpoints
│       └── upload-signature/    # Upload tanda tangan
├── components/                  # Komponen UI reusable
│   ├── Navbar.tsx               # Navigasi + modal Notes/Keterangan Muat
│   ├── ThemeProvider.tsx         # Context provider dark/light mode
│   ├── Toast.tsx                # Sistem notifikasi toast
│   ├── SearchableSelect.tsx     # Dropdown dengan fitur pencarian
│   ├── IDRInput.tsx             # Input format mata uang IDR
│   ├── RupiahInput.tsx          # Input Rupiah (versi alternatif)
│   └── NopolInput.tsx           # Input plat nomor kendaraan
├── lib/                         # Fungsi utilitas server & kalkulasi
│   ├── supabaseServer.ts        # Singleton Supabase client (server-side)
│   ├── encryption.ts            # Enkripsi/dekripsi token (AES-256-CBC)
│   ├── calculation.ts           # Kalkulasi invoice (total, per-item)
│   └── excelReport.ts           # Generator laporan Excel (exceljs)
├── middleware.ts                # Auth guard + JWT token refresh
├── next.config.ts               # Konfigurasi Next.js + security headers
├── supabase-migration.sql       # SQL migration untuk Supabase
├── package.json
├── tsconfig.json
└── postcss.config.mjs
```

### Pola Arsitektur

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Browser     │────▷│  Next.js App    │────▷│   Supabase   │
│  (React SPA)  │◁────│  (API Routes)   │◁────│ (PostgreSQL)  │
└──────────────┘     └─────────────────┘     └──────────────┘
                            │
                     ┌──────┴──────┐
                     │  middleware  │
                     │ (auth guard) │
                     └─────────────┘
```

- **Client Components** (`"use client"`) — Semua halaman menggunakan client-side rendering untuk interaktivitas form
- **API Route Handlers** — Semua operasi database dilakukan server-side via `/api/*`
- **Middleware** — Interceptor request untuk validasi JWT dan auto-refresh token

---

## 3. Konfigurasi Proyek

### `next.config.ts`

```ts
// Security headers yang diterapkan:
// - X-DNS-Prefetch-Control: on
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - X-XSS-Protection: 1; mode=block
// - Referrer-Policy: strict-origin-when-cross-origin
// - Permissions-Policy: camera=(), microphone=(), geolocation=()
// - poweredByHeader: false (menyembunyikan X-Powered-By)
```

### `tsconfig.json`

- **Target**: ES2017
- **Module**: ESNext (bundler resolution)
- **Strict mode**: Aktif
- **Path alias**: `@/*` → project root

### Environment Variables (`.env.local`)

| Variable | Deskripsi |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key Supabase |
| `ENCRYPTION_KEY` | 32-char key untuk AES-256-CBC enkripsi token |

---

## 4. Database Schema (Supabase)

### Tabel Utama

#### `invoices`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID (PK) | Primary key |
| `invoice_number` | TEXT | Nomor invoice (auto/manual) |
| `is_manual` | BOOLEAN | Apakah nomor diisi manual |
| `tanggal` | TEXT | Tanggal invoice |
| `kepada_yth` | TEXT | Nama penerima |
| `total_ongkir` | NUMERIC | Grand total semua biaya |
| `footer_tanggal` | TEXT | Tanggal di footer invoice |
| `bank_name` | TEXT | Nama bank tujuan transfer |
| `no_rekening` | TEXT | Nomor rekening |
| `account_name` | TEXT | Nama pemilik rekening |
| `signature_url` | TEXT | URL gambar tanda tangan |
| `signature_name` | TEXT | Nama penandatangan |
| `order_notes` | JSONB | Array kontak order terlampir |
| `created_at` | TIMESTAMPTZ | Waktu pembuatan |
| `updated_at` | TIMESTAMPTZ | Waktu update terakhir |

#### `invoice_items`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID (PK) | Primary key |
| `invoice_id` | UUID (FK) | Referensi ke `invoices` |
| `type` | TEXT | Tipe item: `default`, `murti`, `japfa` |
| `nopol` | TEXT | Nomor polisi kendaraan |
| `tujuan` | TEXT | Tujuan pengiriman |
| `jenis` | TEXT | Jenis barang |
| `ongkir` | NUMERIC | Ongkos kirim |
| `berat` | NUMERIC | Berat (khusus type murti/japfa) |
| `kuli` | NUMERIC | Biaya kuli |
| `uang_makan` | NUMERIC | Uang makan |
| `keterangan` | TEXT | Keterangan tambahan |
| `tanggal_item` | TEXT | Tanggal per item |
| `extra_charges` | JSONB | Array `{amount, label}` biaya tambahan |
| `is_empty_row` | BOOLEAN | Baris kosong (separator) |

#### `trucks`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID (PK) | Primary key |
| `nopol` | TEXT (UNIQUE) | Nomor polisi |
| `keterangan` | TEXT | Nama/jenis truck |
| `nama_supir` | TEXT | Nama supir |
| `status` | TEXT | `ordering` atau `available` |
| `created_at` | TIMESTAMPTZ | Waktu pembuatan |

#### `truck_cargo`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID (PK) | Primary key |
| `truck_id` | UUID (FK) | Referensi ke `trucks` (CASCADE delete) |
| `tanggal` | TEXT | Tanggal cargo |
| `tujuan` | TEXT | Tujuan pengiriman |
| `ongkir` | NUMERIC | Ongkos kirim |
| `keterangan` | TEXT | Keterangan |
| `tanggal_balen` | TEXT | Tanggal balen |

#### `truck_damages`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID (PK) | Primary key |
| `truck_id` | UUID (FK) | Referensi ke `trucks` (CASCADE delete) |
| `tanggal` | TEXT | Tanggal kerusakan |
| `keterangan` | TEXT | Deskripsi kerusakan |
| `biaya` | NUMERIC | Biaya perbaikan |

#### `order_notes`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID (PK) | Primary key |
| `name` | TEXT | Nama kontak |
| `phone` | TEXT | Nomor telepon |
| `description` | TEXT | Keterangan |
| `created_at` | TIMESTAMPTZ | Waktu pembuatan |
| `updated_at` | TIMESTAMPTZ | Waktu update |

#### `keterangan_muat`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID (PK) | Primary key |
| `truck_id` | UUID (FK) | Referensi ke `trucks` (CASCADE delete) |
| `note_id` | UUID (FK) | Referensi ke `order_notes` (SET NULL on delete) |
| `order` | TEXT | Nomor/nama order |
| `tgl_muat` | TEXT | Tanggal muat |
| `tgl_bongkar` | TEXT | Tanggal bongkar |
| `balen` | TEXT | Nomor balen |
| `tgl_muat_balen` | TEXT | Tanggal muat balen |
| `balen_do` | TEXT | Nomor balen DO |
| `tgl_bongkar_balen` | TEXT | Tanggal bongkar balen |
| `tempat_bongkar` | TEXT | Lokasi bongkar |
| `created_at` | TIMESTAMPTZ | Waktu pembuatan |
| `updated_at` | TIMESTAMPTZ | Waktu update |

### Tabel Konfigurasi

- **`settings`** — Key-value store (`key` TEXT PK, `value` TEXT) untuk default signature, dll.
- **`bank_accounts`** — Daftar rekening bank (name, noRekening, accountName)
- **`pabrik_list`** — Preset tujuan pabrik (name, tujuan, jenis, ongkir, berat, kuli, uang_makan, keterangan)
- **`balen_list`** — Daftar balen (name, description)
- **`muatan_truk_list`** — Daftar muatan truk (name, description)

### Relasi Antar Tabel

```
invoices ──1:N──▷ invoice_items
trucks   ──1:N──▷ truck_cargo
trucks   ──1:N──▷ truck_damages
trucks   ──1:N──▷ keterangan_muat
order_notes ──1:N──▷ keterangan_muat (nullable)
```

### Indexes

```sql
idx_order_notes_created_at   ON order_notes(created_at DESC)
idx_keterangan_muat_truck_id ON keterangan_muat(truck_id)
idx_keterangan_muat_created_at ON keterangan_muat(created_at DESC)
```

---

## 5. Autentikasi & Middleware

### Alur Login

```
[Login Page] ──POST /api/login──▷ Supabase Auth (signInWithPassword)
                                   │
                                   ▼
                          Set HttpOnly cookies:
                          ├── auth-token (JWT access token)
                          ├── refresh-token
                          └── user-role (encrypted)
```

### `middleware.ts` — Auth Guard

**Fungsi**: Interceptor setiap request sebelum masuk ke route handler.

| Langkah | Aksi |
|---------|------|
| 1 | Cek apakah route **public** (`/login`, `/api/login`, `/api/health`, `/api/auth/check`) → lewatkan |
| 2 | Baca cookie `auth-token` — jika valid (JWT belum expired) → lanjut |
| 3 | Jika expired, coba **auto-refresh** menggunakan `refresh-token` via Supabase REST API |
| 4 | Jika refresh berhasil → set cookie baru, lanjut request |
| 5 | Jika gagal → redirect ke `/login?redirect={path}`, hapus semua cookie auth |

**Detail Implementasi**:
- JWT di-decode manual tanpa library (split `.`, `atob` payload, cek `exp`)
- Buffer 30 detik untuk clock skew
- Cookie config: `httpOnly: true`, `secure: production`, `sameSite: lax`, `maxAge: 7 hari`
- Route protection juga berlaku di halaman (SSR redirect jika cookie juga di-query)

### `lib/encryption.ts` — Token Encryption

```ts
// Menggunakan Node.js crypto (AES-256-CBC)
encrypt(text: string): string    // → iv:encrypted (hex format)
decrypt(encrypted: string): string
```

Digunakan untuk mengenkripsi `user-role` di cookie agar tidak bisa dimanipulasi client-side.

### `app/api/login/route.ts`

| Method | Fungsi |
|--------|--------|
| `POST` | Login — validasi `{ email, password }`, panggil `supabase.auth.signInWithPassword()`, set cookies |
| `DELETE` | Logout — panggil `supabase.auth.signOut()`, hapus semua cookies |

### `app/api/auth/check/route.ts`

| Method | Fungsi |
|--------|--------|
| `GET` | Cek apakah user terautentikasi — return `{ ok: true, role }` atau `{ ok: false }` |

---

## 6. API Routes (Backend)

Semua API route menggunakan Next.js Route Handlers dan berkomunikasi dengan Supabase menggunakan `supabaseServer()` singleton.

### 6.1 Invoice API

#### `POST /api/invoices/create`
- **Input**: Body JSON di-validasi dengan **Zod schema** (`BodySchema`)
- **Proses**:
  1. Validasi input (invoiceNumber, tanggal, kepadaYth, items[], signatureName, dll.)
  2. Hitung `grandTotal` = Σ(ongkir + kuli + uang_makan + extra_charges) per item
  3. Insert ke tabel `invoices`
  4. Insert semua items ke `invoice_items` (bulk insert)
  5. Generate `invoice_number` auto-increment jika tidak manual
- **Output**: `{ data: invoice, items: [...] }`

#### `GET /api/invoices/list`
- **Query params**: `page`, `limit`, `search`, `sort`
- **Proses**: Query `invoices` dengan pagination, search by invoice_number/kepada_yth, sortable
- **Output**: `{ data: [...], total, page, limit }`

#### `GET /api/invoices/[id]`
- **Proses**: Fetch single invoice dengan semua items via join
- **Output**: `{ data: { ...invoice, items: [...] } }`

#### `PUT /api/invoices/[id]`
- **Proses**: Update invoice header + delete old items + insert new items (replace strategy)
- **Output**: `{ ok: true }`

#### `DELETE /api/invoices/[id]`
- **Proses**: Cascade delete invoice + items
- **Output**: `{ ok: true }`

#### `GET /api/invoices/[id]/pdf`
- **Proses**: Generate PDF menggunakan `@react-pdf/renderer` (server-side React PDF)
- **Output**: PDF binary stream (`Content-Type: application/pdf`)

#### `GET /api/invoices/export`
- **Query params**: `search`
- **Proses**: Export semua invoice ke Excel via `exceljs`
- **Output**: XLSX binary stream

#### `DELETE /api/invoices/delete-all`
- **Proses**: Hapus semua invoice (development utility)
- **Output**: `{ ok: true }`

### 6.2 Truck API

#### `GET /api/trucks`
- **Proses**: Fetch semua trucks dengan `cargo_count` (left join count `truck_cargo`)
- **Output**: `{ data: [...] }` — sorted by `created_at DESC`

#### `POST /api/trucks`
- **Input**: `{ nopol, keterangan?, nama_supir? }`
- **Validasi**: Nopol wajib diisi
- **Output**: `{ data: truck }`

#### `GET /api/trucks/[id]`
- **Proses**: Fetch single truck
- **Output**: `{ data: truck }`

#### `PUT /api/trucks/[id]`
- **Input**: `{ nopol?, keterangan?, nama_supir?, status? }`
- **Proses**: Update partial (hanya field yang dikirim)
- **Output**: `{ ok: true }`

#### `DELETE /api/trucks/[id]`
- **Proses**: Delete truck (cascade ke `truck_cargo`, `truck_damages`, `keterangan_muat`)
- **Output**: `{ ok: true }`

#### `GET/POST /api/trucks/[id]/cargo`
- **GET**: List cargo untuk truck tertentu (sorted `tanggal DESC`)
- **POST**: Tambah cargo baru `{ tanggal, tujuan, ongkir, keterangan, tanggal_balen? }`

#### `PUT/DELETE /api/trucks/[id]/cargo/[cargoId]`
- **PUT**: Update cargo entry
- **DELETE**: Hapus cargo entry

#### `GET/POST /api/trucks/[id]/damages`
- **GET**: List kerusakan untuk truck tertentu
- **POST**: Tambah record kerusakan `{ tanggal, keterangan, biaya }`

#### `PUT/DELETE /api/trucks/[id]/damages/[damageId]`
- **PUT**: Update damage entry
- **DELETE**: Hapus damage entry

#### `GET /api/trucks/[id]/export`
- **Proses**: Export cargo + damages ke Excel
- **Output**: XLSX binary stream

### 6.3 Notes (Kontak Order) API

#### `GET /api/notes`
- **Proses**: Fetch semua kontak order, sorted `created_at DESC`
- **Output**: `{ data: [...] }`

#### `POST /api/notes`
- **Input**: `{ name, phone, description? }`
- **Validasi**: `name` dan `phone` wajib
- **Output**: `{ data: note }`

#### `PUT /api/notes/[id]`
- **Input**: `{ name, phone, description? }`
- **Proses**: Update kontak yang sudah ada
- **Output**: `{ ok: true }`

#### `DELETE /api/notes/[id]`
- **Proses**: Hapus kontak
- **Output**: `{ ok: true }`

### 6.4 Keterangan Muat API

#### `GET /api/keterangan-muat`
- **Query params**: `truck_id` (optional filter)
- **Proses**: Fetch dengan join ke `trucks(nopol)` dan `order_notes(name, phone)`
- **Output**: `{ data: [...] }`

#### `POST /api/keterangan-muat`
- **Input**: `{ truck_id, note_id?, order, tgl_muat, tgl_bongkar, balen, tgl_muat_balen, balen_do, tgl_bongkar_balen, tempat_bongkar }`
- **Validasi**: `truck_id` wajib
- **Output**: `{ data: keterangan }`

#### `PUT /api/keterangan-muat/[id]`
- **Input**: Sama seperti POST
- **Proses**: Update + set `updated_at`
- **Output**: `{ ok: true }`

#### `DELETE /api/keterangan-muat/[id]`
- **Proses**: Hapus row keterangan muat
- **Output**: `{ ok: true }`

### 6.5 Reports API

#### `GET /api/reports/monthly`
- **Query params**: `year`, `month`
- **Proses**: Aggregate `invoices` per bulan — count, total revenue, average per invoice
- **Output**: `{ data: { total_invoices, total_revenue, avg_per_invoice, invoices: [...] } }`

#### `GET /api/reports/export`
- **Query params**: `year`, `month`
- **Proses**: Export laporan bulanan ke Excel (styled headers, borders, summary)
- **Output**: XLSX binary stream

### 6.6 Settings API

#### `GET/PUT /api/settings`
- **GET**: Ambil semua settings (key-value pairs)
- **PUT**: Update settings (default_signature_url, default_signature_name)

#### `GET/POST/DELETE /api/settings/banks`
- CRUD rekening bank

#### `GET/POST/PUT/DELETE /api/settings/pabrik`
- CRUD preset tujuan pabrik (auto-fill form invoice)

#### `GET/POST/DELETE /api/settings/balen`
- CRUD daftar balen

#### `GET/POST/DELETE /api/settings/muatan-truk`
- CRUD daftar muatan truk

### 6.7 Upload API

#### `POST /api/upload-signature`
- **Input**: FormData dengan file gambar
- **Proses**: Upload ke Supabase Storage bucket `signatures`
- **Output**: `{ url: "public_url" }`

### 6.8 Utility API

#### `GET /api/health`
- Health check endpoint (public, tanpa auth)
- **Output**: `{ ok: true, timestamp }`

---

## 7. Halaman (Frontend)

Semua halaman menggunakan `"use client"` directive karena membutuhkan interaktivitas (state, event handlers, effects).

### 7.1 Dashboard — `app/page.tsx`

**Fungsi**: Form pembuatan invoice baru.

**Fitur**:
- **Session cache** — Draft form disimpan ke `sessionStorage` agar tidak hilang saat navigasi. Otomatis restore saat re-visit.
- **Multi-type items** — Mendukung 3 tipe item: `default`, `murti`, `japfa` (masing-masing memiliki field berbeda)
- **Pabrik preset** — Dropdown `SearchableSelect` yang otomatis fill form item (tujuan, jenis, ongkir, berat, kuli, uang_makan, keterangan)
- **Nopol dropdown** — Searchable dropdown dari data Truck Management
- **Extra charges** — Setiap item bisa punya biaya tambahan (label + amount)
- **Empty row** — Baris separator kosong (toggle `is_empty_row`)
- **Kontak Order** — Pilih kontak pelanggan dari `order_notes` untuk dilampirkan
- **Bank account** — Pilih rekening bank dari dropdown (bisa tambah baru inline)
- **Tanda tangan** — Upload gambar atau gunakan default
- **Kalkulasi real-time** — Total otomatis dihitung per item dan grand total
- **Validasi** — Menampilkan validasi error sebelum submit

**Flow Submit**:
1. Validasi client-side (kepadaYth, nopol per item, signature)
2. `POST /api/invoices/create`
3. Hapus cache, redirect ke halaman invoice list
4. Toast notifikasi sukses

### 7.2 Invoice List — `app/invoices/page.tsx`

**Fitur**:
- **Search** — Filter by invoice number atau nama penerima
- **Sort** — Dropdown sorter: Terbaru, Terakhir Diupdate, Terlama
- **Pagination** — 10 items per page, navigasi prev/next
- **Actions per row**:
  - View PDF (buka di tab baru)
  - Edit (navigasi ke halaman edit)
  - Delete (confirm dialog)
- **Batch actions**: Export all ke Excel, Delete All (dengan proteksi konfirmasi)

### 7.3 Edit Invoice — `app/invoices/[id]/edit/page.tsx`

**Fitur**: Sama seperti Dashboard namun dalam mode edit.
- Load data invoice yang sudah ada
- Pre-fill semua field (header, items, bank, signature, order notes)
- `PUT /api/invoices/[id]` saat submit — strategy replace: hapus items lama, insert items baru

### 7.4 Truck Management — `app/muatan/page.tsx`

**Fitur**:
- **Search** — Filter by nopol, keterangan, nama supir
- **Truck Groups**:
  - **Order Group** — Truck dengan status `ordering` (highlight hijau)
  - **In Home / Available** — Truck dengan status `available`
- **Truck Card** — Menampilkan: nopol, keterangan, supir, tanggal added, cargo count
  - **Badge "Dimuat"** — Muncul (hijau) jika ada keterangan muat untuk truck tersebut
  - **Toggle Status** — Button untuk pindah antara ordering ↔ available
  - **Selesai Muat** — Button oranye untuk menghapus semua keterangan muat truck (selesai muat/bongkar)
  - **Edit inline** — Klik edit untuk ubah nopol, keterangan, nama supir tanpa navigasi
  - **Delete** — Hapus truck (cascade cargo, damages, keterangan_muat)
- **Add Truck Form** — Collapsible form di atas
- **Keterangan Muat Table** — Tabel terpisah di atas Order Group:
  - Hanya menampilkan **kolom yang memiliki data** (dynamic columns)
  - Nopol ditampilkan sebagai badge hijau
  - Bisa di-hide/show
  - **Auto-expire**: Saat page load, row yang `tgl_bongkar_balen` = hari ini otomatis dihapus

### 7.5 Truck Detail — `app/muatan/[id]/page.tsx`

**Fitur**:
- **Cargo Management**: Tambah/edit/delete cargo items (tanggal, tujuan, ongkir, keterangan, tanggal_balen)
- **Damage Records**: Tambah/edit/delete kerusakan (tanggal, keterangan, biaya)
- **Summary Cards**: Total cargo count, total ongkir, total biaya kerusakan
- **Export**: Download data truck ke Excel

### 7.6 Reports — `app/reports/page.tsx`

**Fitur**:
- **Month/Year picker** — Pilih bulan dan tahun
- **Summary cards** — Total invoice, total revenue, rata-rata per invoice
- **Invoice list** — Daftar invoice untuk bulan terpilih
- **Export Excel** — Download laporan bulanan

### 7.7 Settings — `app/settings/page.tsx`

**Fitur**:
- **Bank Accounts** — CRUD rekening bank (nama bank, nomor rekening, nama pemilik)
- **Pabrik Presets** — CRUD preset tujuan (untuk auto-fill form invoice)
- **Balen List** — CRUD daftar balen
- **Muatan Truk List** — CRUD daftar muatan truk
- **Default Signature** — Upload/kelola tanda tangan default

### 7.8 Login — `app/login/page.tsx`

**Fitur**:
- Form email + password
- Loading state saat proses login
- Error handling (tampilkan pesan error dari server)
- Redirect ke halaman sebelumnya setelah login sukses (via query param `redirect`)

---

## 8. Komponen UI Reusable

### 8.1 `Navbar.tsx`

**Fungsi**: Navigasi utama + modal Notes.

**Struktur**:
- **Desktop**: Horizontal nav links + Notes button + Theme toggle + Logout
- **Mobile**: Hamburger menu → dropdown vertical + Theme toggle terpisah di luar menu

**Modal Notes** (2 tab):
1. **Kontak Order**:
   - Form tambah kontak baru (nama, telepon, keterangan)
   - List kontak dengan edit inline + delete
2. **Keterangan Muat**:
   - Form tambah/edit (searchable dropdown Nopol + searchable dropdown Kontak Order + 8 field input)
   - Tabel data dengan edit/delete action per row

**Komponen Internal — `DropdownSearch`**:
- Dropdown inline dengan fitur search
- Digunakan untuk Nopol dan Kontak Order di form Keterangan Muat
- Filter opsi secara real-time berdasarkan input pencarian

### 8.2 `ThemeProvider.tsx`

**Fungsi**: Context provider untuk dark/light mode.

**Implementasi** (hydration-safe):
1. State selalu diinisialisasi sebagai `"dark"` (match SSR `data-theme="dark"` di layout)
2. `useEffect` membaca `localStorage` → sync state via `startTransition` (no hydration mismatch)
3. `mounted` flag mencegah rendering icon yang salah sebelum hydration selesai
4. `toggleTheme()` — Toggle antara dark/light, persist ke `localStorage`, update `data-theme` attribute

**API**: `useTheme()` → `{ theme, mounted, toggleTheme }`

### 8.3 `Toast.tsx`

**Fungsi**: Sistem notifikasi toast global.

**Implementasi**:
- Context provider (`ToastProvider`) wrapping seluruh aplikasi
- `showToast(message, type?)` — Tipe: `success`, `error`, `info`
- Auto-dismiss setelah beberapa detik
- Animasi masuk/keluar

**API**: `useToast()` → `{ showToast }`

### 8.4 `SearchableSelect.tsx`

**Fungsi**: Dropdown select dengan fitur pencarian, grouping, dan recent items.

**Props**:
| Prop | Tipe | Deskripsi |
|------|------|-----------|
| `options` | `SearchableOption[]` | Daftar opsi (`{value, label, description?, group?}`) |
| `value` | `string` | Value yang terpilih |
| `onChange` | `(value) => void` | Callback saat memilih opsi |
| `placeholder` | `string` | Teks placeholder |
| `disabled` | `boolean` | Nonaktifkan input |
| `loading` | `boolean` | Tampilkan loading state |
| `debounceMs` | `number` | Delay debounce pencarian (default: 300ms) |
| `recentKeys` | `string[]` | Key opsi yang ditaruh di atas (recent) |

**Fitur**:
- Debounced search input
- Keyboard navigation (Arrow Up/Down, Enter, Escape)
- Group headers
- Recent items section
- Click outside to close

### 8.5 `IDRInput.tsx`

**Fungsi**: Input angka yang otomatis diformat sebagai mata uang Indonesia (titik sebagai pemisah ribuan).

**Behavior**:
- User mengetik angka → otomatis diformat (contoh: `1500000` → `1.500.000`)
- Menghapus karakter non-angka
- Return value numerik ke parent via `onChange`

### 8.6 `RupiahInput.tsx`

**Fungsi**: Serupa dengan `IDRInput`, versi alternatif dengan prefix "Rp" di label.

### 8.7 `NopolInput.tsx`

**Fungsi**: Input plat nomor kendaraan Indonesia dengan auto-formatting.

**Behavior**:
- Auto-uppercase
- Memformat sesuai pola plat kendaraan Indonesia
- Validasi karakter yang diperbolehkan

---

## 9. Library / Utilitas

### 9.1 `lib/supabaseServer.ts`

```ts
export function supabaseServer(): SupabaseClient
```

**Fungsi**: Membuat/mengembalikan Supabase client singleton untuk server-side.
- Menggunakan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Hanya digunakan di API routes (bukan client components)

### 9.2 `lib/encryption.ts`

```ts
export function encrypt(text: string): string
export function decrypt(encrypted: string): string
```

**Fungsi**: Enkripsi/dekripsi string menggunakan AES-256-CBC.
- Key dari environment variable `ENCRYPTION_KEY` (32 karakter)
- Format output: `{iv_hex}:{ciphertext_hex}`
- Digunakan untuk mengenkripsi user role di cookie

### 9.3 `lib/calculation.ts`

```ts
export function calculateItemTotal(item: Item): number
export function calculateGrandTotal(items: Item[]): number
```

**Fungsi**: Kalkulasi total invoice.
- Per item: `ongkir + kuli + uang_makan + Σ(extra_charges)`
- Grand total: Σ semua item (skip `is_empty_row`)

### 9.4 `lib/excelReport.ts`

```ts
export async function generateMonthlyReport(data): Promise<Buffer>
export async function generateTruckExport(data): Promise<Buffer>
export async function generateInvoiceExport(data): Promise<Buffer>
```

**Fungsi**: Generator file Excel menggunakan library `exceljs`.
- Styled headers (background color, bold, border)
- Auto-width kolom
- Number formatting untuk mata uang
- Summary row di bawah data

---

## 10. Tema & Styling

### Dark/Light Mode

**Mekanisme** (Zero-FOUC):
1. `layout.tsx`: `<html data-theme="dark">` + inline `<script>` baca `localStorage` dan set `data-theme` sebelum paint
2. `globals.css`: Definisi CSS variables pada `[data-theme="light"]` yang mem-override zinc color scale
3. `ThemeProvider.tsx`: React state sync setelah hydration menggunakan `startTransition`

### `globals.css` — Variabel Tema

```css
/* Default (dark) menggunakan zinc scale Tailwind CSS v4 native */

[data-theme="light"] {
  /* Invert zinc scale: --color-zinc-950 jadi warna terang, dst */
  --color-zinc-50: #09090b;    /* gelap */
  --color-zinc-100: #18181b;
  --color-zinc-200: #27272a;
  ...
  --color-zinc-900: #e4e4e7;   /* terang */
  --color-zinc-950: #fafafa;   /* paling terang (jadi background) */
  color-scheme: light;
}
```

**Keuntungan**: Tidak perlu mengubah class Tailwind di komponen. Semua `bg-zinc-950`, `text-zinc-100`, dll. otomatis berubah warna saat tema berganti.

### Browser Chrome Support

```html
<meta name="theme-color" content="#09090b" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

---

## 11. Keamanan

### Implementasi Security

| Aspek | Implementasi |
|-------|-------------|
| **Authentication** | Supabase Auth (email/password), JWT access token via HttpOnly cookie |
| **Token Storage** | HttpOnly, Secure (production), SameSite=Lax — tidak dapat diakses JavaScript |
| **Token Refresh** | Auto-refresh di middleware saat access token expired, menggunakan refresh token |
| **Role Encryption** | User role dienkripsi dengan AES-256-CBC sebelum disimpan di cookie |
| **Input Validation** | Zod schema validation di API routes (server-side) |
| **SQL Injection** | Dicegah — menggunakan Supabase client (parameterized queries) |
| **XSS** | Dicegah — React auto-escaping, `X-XSS-Protection` header |
| **Clickjacking** | Dicegah — `X-Frame-Options: DENY` |
| **MIME Sniffing** | Dicegah — `X-Content-Type-Options: nosniff` |
| **Information Leak** | `poweredByHeader: false`, generic error messages |
| **CSRF** | SameSite=Lax cookies + server-side mutation via API routes |
| **Permissions** | Camera, Microphone, Geolocation di-disable via Permissions-Policy |

### Middleware Route Protection

```
Public Routes (tanpa auth):
  /login, /api/login, /api/public/*, /api/health, /api/auth/check

Protected Routes (semua sisanya):
  /, /invoices/*, /muatan/*, /reports, /settings, /api/*
```

---

## 12. Panduan Development

### Prasyarat

- Node.js ≥ 18
- npm
- Akun Supabase (free tier cukup)

### Setup Awal

```bash
# 1. Clone repository
git clone <repo-url>
cd invoice-app

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.local.example .env.local
# Isi: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ENCRYPTION_KEY

# 4. Jalankan migrasi database
# Buka Supabase SQL Editor → copy-paste isi supabase-migration.sql → Run

# 5. Jalankan development server
npm run dev
```

### Konvensi Kode

| Aspek | Konvensi |
|-------|----------|
| **Naming** | PascalCase untuk komponen, camelCase untuk variable/function |
| **File Structure** | Co-location — file terkait disimpan berdekatan (route.ts di folder API nya) |
| **API Pattern** | Request → Validate → Process → Response dengan try/catch |
| **State Management** | React useState + useCallback/useMemo untuk optimisasi |
| **Styling** | Tailwind CSS utility classes, responsive prefix (sm:, md:, lg:) |
| **Error Handling** | Try/catch di setiap API route, error message generik ke client |

### Alur Menambah Fitur Baru

1. **Database** — Tambah tabel/kolom di `supabase-migration.sql`, jalankan di SQL Editor
2. **API Route** — Buat folder baru di `app/api/`, buat `route.ts` dengan GET/POST/PUT/DELETE
3. **Type** — Definisikan TypeScript type di file page/component yang menggunakannya
4. **UI** — Buat/update page di `app/` atau komponen di `components/`
5. **Test** — Cek error via `npm run build` dan test manual di browser

### Scripts

```bash
npm run dev      # Development server (hot reload)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

---

## 13. Deployment

### Build Production

```bash
npm run build
npm run start
```

### Environment Variables (Production)

Pastikan semua variabel berikut di-set di environment hosting:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # Tepat 32 karakter
NODE_ENV=production
```

### Hosting yang Disarankan

- **Vercel** — Platform native Next.js, auto-deploy dari GitHub
- **Railway / Render** — Alternatif dengan Docker support
- **Self-hosted** — `npm run build` lalu `npm run start` di server dengan Node.js ≥ 18

### Checklist Sebelum Deploy

- [ ] Semua environment variables sudah di-set
- [ ] Migrasi database sudah dijalankan
- [ ] `npm run build` berhasil tanpa error
- [ ] Auth cookie `secure: true` aktif di production (`NODE_ENV=production`)
- [ ] Supabase RLS dikonfigurasi sesuai kebutuhan (opsional)
