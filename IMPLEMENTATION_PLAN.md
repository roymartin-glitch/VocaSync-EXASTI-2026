# IMPLEMENTATION_PLAN.md — VokaSync

**Dokumen Pelacakan Realisasi & Rencana Implementasi Bertahap**  
Proyek: VokaSync — AI Business Advisor & Visual Marketing untuk Pedagang Pasar & UMKM Indonesia  
Kompetisi: EXASTI 2.0 — Web Application Competition 2026 (Universitas Negeri Jakarta)  

> **STATUS KESELURUHAN**: ✅ **100% Selesai & Terverifikasi** — Seluruh fitur MVP dan penyempurnaan final telah terbangun dengan sukses (`npm run build` 100% pass, 0 TypeScript error, performa tinggi non-blocking).

---

## Ringkasan Eksekutif Fase Pengembangan

| Fase | Deskripsi Modul & Milestone | Status |
|---|---|---|
| **FASE 1** | Fondasi Arsitektur, Kontrak Tipe Data, & Design System Emerald | ✅ Selesai 100% |
| **FASE 2** | Antarmuka Frontend Responsif (Desktop, Tablet, Mobile) | ✅ Selesai 100% |
| **FASE 3** | Integrasi Backend Supabase PostgreSQL (8 Tabel, RLS, & API Routes) | ✅ Selesai 100% |
| **FASE 4** | Integrasi AI Engine (Gemini Flash), Web Speech API, & Studio Visual | ✅ Selesai 100% |
| **FASE 5** | Penyempurnaan Smart Voice, Auto-Registrasi Produk, & TTS Audio | ✅ Selesai 100% |
| **FASE 6** | Laporan Finansial, 1-Klik Rekap WhatsApp, FIFO Stock, & Cloud Storage | ✅ Selesai 100% |
| **FASE 7** | Optimasi Performa Non-Blocking, SWR Caching, & Kesiapan Demo Juri | ✅ Selesai 100% |
| **FASE 8** | Cetak Struk Digital PDF/WA, Visualisasi Fintech Kapsul Arsir, & AI Sapaan | ✅ Selesai 100% |

---

## ✅ FASE 1: FONDASI ARSITEKTUR & DESIGN SYSTEM

- [x] Inisialisasi Next.js `16.3.4` App Router dengan TypeScript dan ESLint
- [x] Instalasi paket dependensi inti:
  - `lucide-react@^1.42.0` (ikon antarmuka)
  - `recharts@^3.10.1` (visualisasi bar chart)
  - `@supabase/ssr@^0.12.6` & `@supabase/supabase-js@^2.115.0` (konektor database)
  - `@imgly/background-removal@^1.7.0` (segmentasi foto AI lokal client-side)
  - `tailwindcss@^4` (styling responsif)
- [x] Desain sistem palet warna hijau hutan / emerald profesional di `app/globals.css`:
  - Background Halaman: `#F5F5F5` / `#0A2619` (sidebar pekat)
  - Aksen Utama: Hijau Segar `#22C55E` & Hijau Tua `#123825`
  - Kartu Bersih & Border Halus: `#E2E8F0`
- [x] Kontrak tipe data ketat di `types/index.ts`:
  - `Profile`, `AppSettings`, `Product`, `Transaction`, `TransactionItem`
  - `AIInsight`, `Experiment`, `ExperimentResult`, `ExperimentMetric`
  - `StockBatch`, `ProductAnalysisItem`, `DashboardMetrics`, `TrendDayData`
- [x] Konfigurasi file lingkungan terisolasi (`.env.local` & `.env.example`)

---

## ✅ FASE 2: IMPLEMENTASI ANTARMUKA PENGGUNA (UI/UX)

- [x] **Sidebar Responsif Desktop & Tablet** (`components/layout/sidebar.tsx`):
  - Desktop ($\ge 1024\text{px}$): Sidebar penuh 256px dengan 6 menu navigasi utama (`Beranda`, `Catat`, `Barang`, `Laporan`, `Riwayat`, `Pengaturan`).
  - Tablet ($768\text{px} - 1023\text{px}$): Mode ringkas 80px *icon-only*.
- [x] **Bottom Navigation Mobile Ergonomis** (`components/layout/bottom-nav.tsx`):
  - Khusus perangkat layar sentuh ($\le 767\text{px}$): 6 tab mudah dijangkau satu tangan (`Beranda`, `Catat`, `Barang`, `Laporan`, `Riwayat`, `Setelan`).
- [x] **Header Adaptif & Informasi Kios** (`components/layout/header.tsx`):
  - Sapaan nama pemilik, indikator kios buka/tutup, lonceng notifikasi, dan tombol pintas.
- [x] **Layout Shell Terpadu** (`components/layout/app-shell.tsx`):
  - Menangani sesi login, isolasi data, dan *zero-flicker rendering*.

---

## ✅ FASE 3: BACKEND SUPABASE & INTEGRASI BASIS DATA

- [x] **Skema Database Relasional Lengkap** (`supabase/schema/full_schema.sql`):
  1. `profiles`: Profil toko, ambang batas margin, ambang batas stok fisik (kg/pcs), saklar audio.
  2. `products`: Master komoditas dan referensi tautan gambar.
  3. `transactions`: Header transaksi pemasukan dan pengeluaran.
  4. `transaction_items`: Item detail komoditas, kuantitas, satuan, dan harga satuan (sumber kebenaran tunggal).
  5. `stock_batches`: Pelacakan stok fisik batch belanja modal (metode FIFO).
  6. `ai_insights`: Histori narasi dan rekomendasi proaktif AI Advisor.
  7. `experiments`: Inisiatif perbaikan toko dan target perbaikan.
  8. `experiment_results`: Evaluasi checkpoint hasil eksperimen.
- [x] **Row-Level Security (RLS) Aktif**:
  - Seluruh operasi query dan mutasi dikunci dengan filter kepemilikan `auth.uid() = user_id`.
- [x] **Trigger Otomatis Pendaftaran Bersih** (`handle_new_user`):
  - Menangkap nama dan nama usaha dari metadata registrasi tanpa mencemari akun baru dengan data demo.
- [x] **Dataset Percontohan Realistis** (`supabase/schema/seed_data.sql`):
  - Data transaksi historis untuk simulasi presentasi penjurian.

---

## ✅ FASE 4: INTEGRASI AI, SUARA & STUDIO VISUAL

- [x] **Konektor Gemini Flash Server-Side** (`lib/ai/gemini.ts`):
  - Pengamanan `GEMINI_API_KEY` agar tidak pernah bocor ke client.
- [x] **Prompt Engineering Terfokus** (`lib/ai/prompts.ts`):
  - `getParseVoicePrompt`: Ekstraksi entitas transaksi dari ucapan.
  - `getDailyAdvisorPrompt`: Narasi bisnis ramah awam dengan penjelasan *root-cause*.
  - `getExperimentVerdictPrompt`: Evaluasi dampak strategi perbaikan toko.
  - `getMarketingCopyPrompt`: Generator pesan promosi WhatsApp (gaya Pasar, FOMO, Elegan).
- [x] **AI Virtual Studio Modal** (`components/studio/StudioModal.tsx`):
  - Segmentasi gambar lokal di browser via WASM (`@imgly/background-removal`).
  - Overlay bingkai PNG studio ke Canvas API.
  - Pembuatan copywriting promosi kilat dan integrasi tombol kirim ke WhatsApp (`wa.me`).

---

## ✅ FASE 5: PENYEMPURNAAN SUARA, NOISE FILTER & AUDIO TTS

- [x] **Smart Voice Parsing dengan Filter Noise Percakapan** (`app/api/parse-voice/route.ts`):
  - Mampu menyaring kata pembuka umum seperti *"Dek tolong catatkan ya..."*, *"Barusan ada pembeli..."*, atau *"Tadi belanja..."* sehingga mengekstrak nama komoditas murni tanpa kata sambung.
- [x] **Auto-Registrasi Komoditas Baru** (`app/api/transactions/route.ts`):
  - Komoditas baru yang belum terdaftar di database otomatis ditambahkan ke tabel `products` saat transaksi dicatat tanpa membatalkan proses pencatatan.
- [x] **Konfirmasi Suara Audio Balasan (Text-to-Speech)** (`app/catat/page.tsx`):
  - Menggunakan Web Speech API `window.speechSynthesis` dengan bahasa `id-ID` yang membacakan konfirmasi ramah: *"Catatan Jual Bawang Merah 5 kg sebesar 150 ribu rupiah sudah tersimpan ya."* Sangat membantu pedagang saat tangan kotor atau basah.
- [x] **Standardisasi Istilah Sehari-hari Pedagang**:
  - Mengganti istilah teknis seperti *kulakan* dengan istilah yang lebih akrab: **"Belanja Stok / Beli Barang"** (Uang Keluar) dan **"Jual Barang / Penjualan"** (Uang Masuk).

---

## ✅ FASE 6: LAPORAN KEUANGAN, WHATSAPP REKAP & CLOUD STORAGE

- [x] **Halaman Laporan Keuangan Komprehensif** (`app/laporan/page.tsx`):
  - Filter rentang waktu: *Hari Ini*, *7 Hari Terakhir*, *Bulan Ini*, dan *Semua Waktu*.
  - 4 Kartu metrik agregat: Total Uang Masuk, Total Uang Keluar, Untung Bersih, dan Rata-rata Margin %.
  - Breakdown komoditas terlaris berdasarkan kontribusi omzet.
  - Mode Cetak Fisik / PDF yang dioptimalkan (`window.print()`).
- [x] **1-Klik Berbagi Rekap ke WhatsApp**:
  - Tombol *"📲 Kirim Rekap ke WhatsApp"* di Beranda (`app/dashboard/page.tsx`) untuk mengirimkan ringkasan harian kios.
  - Tombol *"📲 Rekap WhatsApp"* di Halaman Laporan (`app/laporan/page.tsx`) untuk mengirimkan laporan finansial berkala dengan format chat yang terstruktur rapi.
- [x] **Manajemen Inventaris FIFO & Peringatan Stok Fisik** (`public.stock_batches`):
  - Perhitungan sisa kuantitas barang dagangan secara berurutan (*first-in, first-out*).
  - Peringatan dini di halaman barang saat sisa stok fisik $\le$ ambang batas (kg/pcs).
- [x] **Supabase Storage Bucket `product-images`** (`app/api/upload-product-image/route.ts`):
  - Endpoint upload foto produk mandiri dengan validasi ekstensi, batas ukuran 5 MB, dan pembaruan kolom `image_url`.

---

## ✅ FASE 7: OPTIMASI PERFORMA & KESIAPAN DEMO

- [x] **Pemisahan Kalkulasi Deterministik & Non-Blocking AI** (`app/api/insights/route.ts`):
  - Angka metrik keuangan dihitung seketika ($< 50\text{ms}$) tanpa terhambat oleh latensi pemanggilan AI.
- [x] **SWR & SessionStorage Caching**:
  - Seluruh halaman (`dashboard`, `catat`, `produk`, `laporan`, `riwayat`) menerapkan mekanisme caching sesi lokal sehingga transisi halaman terasa instan tanpa layar putih berkedip.
- [x] **Penyederhanaan Halaman Pengaturan** (`app/settings/page.tsx`):
  - Pengaturan ambang batas stok fisik sederhana (angka kg/pcs).
  - Saklar suara asisten 2 opsi jelas (Suara Aktif / Suara Mati) dilengkapi tombol uji coba audio.
  - Pengaturan kenyamanan mata (Ukuran teks: Normal, Besar, Sangat Besar) dan tema aplikasi.
- [x] **Verifikasi Build Production**:
  - `npm run build` sukses 100% dengan 17+ routes terverifikasi dan 0 error TypeScript.

---

## ✅ FASE 8: CETAK STRUK DIGITAL, VISUALISASI FINTECH & PANDUAN SUARA

- [x] **Modal Struk Transaksi Digital & Cetak PDF/WA** (`app/riwayat/page.tsx`):
  - Tombol aksi struk pada setiap item riwayat transaksi.
  - Tampilan struk kertas profesional dengan garis batas putus-putus (*dashed line*).
  - Tombol *"Cetak / Simpan PDF"* dengan print layout bersih.
  - Tombol *"Kirim Struk ke WhatsApp"* via `wa.me` langsung ke kontak pembeli.
- [x] **Redesain Grafik Tren Modern Fintech (Kapsul Arsir)** (`components/dashboard/TrendChart.tsx`):
  - Palet warna konsisten: Uang Masuk Hijau Zamrud (`#00875A`) dan Uang Keluar Oranye Segar (`#EA580C`).
  - Desain bentuk kapsul (*capsule pill*) dengan motif garis arsir diagonal rapi.
  - Penataan label angka anti-tumpuk dan tooltip ringkasan nilai riil.
- [x] **Sapaan Waktu Dinamis AI & Tips Ucapan Suara**:
  - `components/dashboard/AdvisorCard.tsx`: Sapaan dinamis waktu operasional (*Selamat Pagi/Siang/Sore/Malam*) berbasis jam lokal pengguna.
  - `app/catat/page.tsx`: Modal panduan contoh frasa suara sehari-hari (*"Contoh: Cabai rawit 2 kilo 70 ribu rupiah"*).
- [x] **Standarisasi Rekomendasi Bisnis & Performa Halaman Eksperimen** (`app/eksperimen/page.tsx`):
  - Rekomendasi tindakan bisnis berbasis data riil produk toko.

---

## Prosedur Verifikasi & Pengujian Sistem

1. **Pengujian Catat Suara Natural**:
   - Ucapkan kalimat panjang: *"Dek tolong catatkan ya barusan ada yang beli cabai rawit 2 kilo 70 ribu rupiah"*.
   - Verifikasi: Form mengekstrak produk **Cabai Rawit**, kuantitas **2**, satuan **kg**, total **70000**, jenis **income**.
   - Verifikasi: Transaksi tersimpan dan asisten mengeluarkan suara konfirmasi ramah.
2. **Pengujian 1-Klik Rekap WhatsApp**:
   - Klik tombol *"📲 Kirim Rekap ke WhatsApp"* pada Beranda.
   - Verifikasi: Aplikasi WhatsApp terbuka dengan pesan terformat rapi memuat tanggal, uang masuk, uang keluar, untung bersih, dan margin.
3. **Pengujian Laporan Finansial & Cetak**:
   - Buka `/laporan`, ubah filter ke *"Bulan Ini"*.
   - Verifikasi: Angka total pemasukan dan pengeluaran teragregasi dengan benar.
   - Klik tombol *"Cetak Laporan"* dan pastikan tampilan cetak bersih tanpa elemen navigasi.
4. **Pengujian Peringatan Stok Fisik**:
   - Buka `/settings`, atur peringatan stok fisik menjadi 5 kg.
   - Buka `/produk`, verifikasi komoditas dengan stok di bawah 5 kg memunculkan indikator peringatan stok menipis.
