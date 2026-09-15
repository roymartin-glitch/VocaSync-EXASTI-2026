# PRD.md — VokaSync

**Product Requirements Document**
Proyek: VokaSync — AI Business Advisor & Visual Marketing untuk Pedagang Pasar & UMKM Indonesia
Kompetisi: EXASTI 2.0 — Web Application Competition 2026 (Universitas Negeri Jakarta)
Subtema: SDGs 9 — Industry, Innovation, and Infrastructure (Sustainable Innovation)

> **STATUS IMPLEMENTASI**: ✅ **MVP & Fitur Final Selesai 100%** — Build production sukses, 17+ routes, 0 TypeScript error, performa responsif non-blocking dengan database real Supabase.

---

## 1. Gambaran VokaSync

VokaSync adalah aplikasi web AI Business Advisor cerdas yang dirancang khusus untuk pedagang pasar tradisional dan pelaku UMKM mikro — termasuk pedagang komoditas basah (sayur, buah, bumbu, daging, ikan), kuliner rumahan, pengrajin kriya/fashion, dan warung kelontong — yang produknya tidak memiliki barcode/tidak discan dan belum memiliki sistem pencatatan formal. VokaSync **bukan** kasir POS ritel modern yang kaku, **bukan** software akuntansi rumit, dan **bukan** marketplace/procurement.

Konsep inti produk adalah sebuah **loop advisory tertutup (closed-loop advisory)** yang dilengkapi dengan **aksi pemasaran visual kilat** serta **rekap komunikasi instan ke WhatsApp**:

```
BICARA NATURAL (Voice Input) → FILTER KATA PENGANTAR → AUTO-REGISTRASI PRODUK
→ AI CATAT TRANSAKSI → AUDIO BALASAN SUARA (TTS) → SISTEM HITUNG KONDISI BISNIS (FIFO & Margin)
→ AI ANALISIS PROAKTIF → PERINGATAN DINI (Margin & Stok Fisik kg/pcs) → REKOMENDASI TINDAKAN
→ EKSPERIMEN & TRACKING HASIL → AI EVALUASI VERDICT
         ↓ (jika margin tergerus atau butuh dorong omzet)
QUICK-ACTION: BUAT PROMOSI WA → AI VIRTUAL STUDIO → FOTO PRODUK (Client-side BG Removal)
→ PILIH FRAME STUDIO → COPYWRITING PROMOSI GEMINI → SHARE VIA WHATSAPP DIRECT (wa.me)
         ↓ (rekap harian / laporan keuangan)
REKAP 1-KLIK KE WHATSAPP & CETAK LAPORAN FISIK
```

Pengguna cukup berbicara natural ke aplikasi untuk mencatat transaksi tanpa perlu repot mengetik dengan tangan basah atau kotor (dengan opsi input manual sebagai cadangan). Sistem kemudian menyaring kata pengantar obrolan, mendaftarkan komoditas baru secara otomatis jika belum terdata, membalas dengan konfirmasi suara ramah (*audio text-to-speech*), menghitung profitabilitas per produk secara deterministik, memantau batch stok fisik (FIFO), serta memberi peringatan proaktif sebelum masalah keuangan menjadi parah.

---

## 2. Masalah yang Diselesaikan

- **Keterbatasan Fisik & Waktu di Lapangan**: Pedagang pasar sibuk dari subuh hingga siang, tangan sering basah atau kotor, sehingga tidak sempat dan enggan mengetik di layar HP.
- **Bahasa Asisten Kaku & Noise Obrolan**: Input suara konvensional sering gagal karena pedagang berbicara natural dengan kata pengantar ("Dek tolong catatkan...", "Barusan ada yang beli...").
- **Produk Tidak Terdaftar Bikin Transaksi Gagal**: Pada kasir POS biasa, barang yang belum diinput di master data akan ditolak; pedagang butuh sistem yang otomatis mendaftarkan barang baru saat diucapkan.
- **Laris Belum Tentu Untung**: Pedagang sering tertipu oleh volume penjualan yang tinggi, padahal margin keuntungan tergerus akibat kenaikan harga beli modal dari supplier.
- **Stok Fisik Menipis Tanpa Terpantau**: Pedagang komoditas basah sering kehabisan stok mendadak atau barang rusak karena tidak ada peringatan stok fisik (kg/pcs).
- **Istilah Akuntansi Rumit**: Istilah seperti *HPP*, *COGS*, *Accounts Payable*, atau bahkan kata *Kulakan* tidak selalu nyaman bagi semua pedagang. Pedagang butuh istilah sehari-hari yang akrab: **"Belanja Stok / Beli Barang"** (Uang Keluar) dan **"Jual Barang / Penjualan"** (Uang Masuk).
- **Materi Promosi Terlihat Kurang Menarik**: UMKM kuliner rumahan dan pengrajin kriya kesulitan membuat foto produk profesional tanpa menyewa fotografer mahal.
- **Komunikasi Rekap ke Mitra / Keluarga**: Pedagang butuh mengirim rekap pemasukan, pengeluaran, dan sisa untung bersih harian ke grup WhatsApp keluarga atau mitra kios secara cepat tanpa ketik ulang.

---

## 3. Target Pengguna

| Segmen | Karakteristik Utama | Manfaat Utama VokaSync |
|---|---|---|
| **Pedagang Pasar Tradisional** | Penjual sayur, buah, bumbu dapur, daging, ikan. Sibuk sejak subuh, tangan basah/kotor, butuh input suara cepat dan audio konfirmasi balik. | Catat transaksi via suara, audio balasan ramah, peringatan margin tergerus & sisa stok fisik (kg). |
| **UMKM Kuliner Rumahan** | Warung kue, katering rumahan, kedai kopi, pedagang gorengan. Harga bahan baku fluktuatif (minyak, tepung, telur). | Pantau lonjakan harga belanja modal, AI Virtual Studio untuk foto makanan menarik, rekap WhatsApp. |
| **Pengrajin Kriya & Fashion** | Pengrajin batik, anyaman, konveksi kecil, aksesoris. Butuh visualisasi produk yang estetik untuk menarik pembeli online. | AI Virtual Studio (hapus background produk lokal instan, bingkai estetik, copywriting promosi). |
| **Warung Kelontong & Sembako** | Menjual puluhan item eceran, margin tipis per satuan, sering lupa mencatat pengeluaran belanja grosir. | Kategorisasi aksi produk (Dorong/Pertahankan/Perbaiki/Kurangi), laporan berkala cetak & WA. |
| **Pedagang Kaki Lima / Keliling** | Mobilitas tinggi, tidak punya laptop atau meja kasir, mengandalkan smartphone layar sentuh sederhana. | Mobile bottom navigation ergonomis, ukuran teks ramah mata, rekap kilat WhatsApp. |

**Relevansi SDGs 9 (Sustainable Development Goals)**:
Mendukung fokus **Inovasi Berkelanjutan & Optimalisasi Industri Kreatif/UMKM** dengan digitalisasi inklusif tanpa biaya langganan API berbayar (arsitektur komitmen Rp0).

---

## 4. Nilai Tambah & Fitur Final VokaSync

1. **Smart Voice Parsing dengan Filter Noise Obrolan**: Menyaring kata-kata percakapan ("dek tolong catat", "barusan laku", "tadi belanja") sehingga mengekstrak nama komoditas murni, jumlah, satuan, dan nominal.
2. **Auto-Registrasi Produk Baru**: Bila komoditas yang diucapkan belum pernah dicatat sebelumnya, sistem otomatis menambahkannya ke master produk tanpa menolak input pedagang.
3. **Konfirmasi Suara Audio (Text-to-Speech)**: Menggunakan Web Speech API `speechSynthesis` untuk membacakan pesan suara ramah dalam Bahasa Indonesia setelah transaksi tersimpan ("Catatan Jual Bawang Merah 5 kg sebesar 150 ribu rupiah sudah tersimpan ya.").
4. **Terminologi Akrab Pedagang**:
   - Uang Masuk / Penjualan Barang (Income)
   - Uang Keluar / Belanja Stok Barang (Expense)
   - Untung Bersih (Profit) & Margin Keuntungan (%)
5. **Inventaris Cerdas FIFO (First-In, First-Out) & Peringatan Stok Fisik (kg/pcs)**: Melacak batch modal belanja barang dan memberi peringatan saat sisa stok fisik di bawah ambang batas (misal: sisa < 2 kg atau 2 pcs).
6. **AI Business Advisor Proaktif**: Menjelaskan akar masalah (*root-cause*) kondisi keuangan dalam narasi bahasa Indonesia awam tanpa istilah akuntansi rumit.
7. **Kategori Aksi Produk**:
   - **Dorong** (Hijau): Margin tinggi (≥35%), tingkatkan promosi.
   - **Pertahankan** (Biru): Margin sehat (≥ ambang batas).
   - **Perbaiki** (Kuning): Margin tertekan (10% s.d. threshold), naikkan harga eceran atau cari supplier lebih murah.
   - **Kurangi** (Merah): Margin kritis (<10%), evaluasi kelayakan jual.
8. **Eksperimen Bisnis Terukur**: Menjalankan rekomendasi AI (misal "Naikkan harga cabai Rp2.000"), membandingkan metrik baseline vs realita transaksi baru, dan dievaluasi otomatis oleh AI verdict.
9. **Laporan Keuangan & Rekap Toko Komprehensif (`/laporan`)**:
   - Pilihan periode: Hari Ini, 7 Hari Terakhir, Bulan Ini, Semua Waktu.
   - 4 Metrik Agregat Utama (Uang Masuk, Uang Keluar, Untung Bersih, Margin).
   - Analisis Performa Barang Terlaris.
   - Tombol Cetak Fisik / PDF (`window.print()`).
   - Tombol Rekap WhatsApp instan dengan template format rapi.
10. **1-Klik Rekap WhatsApp & Struk Transaksi Digital**:
    - Rekap performa harian kios ke WhatsApp via URL scheme `wa.me`.
    - **Lihat & Cetak Struk Transaksi (`/riwayat`)**: Modal struk belanja digital per transaksi dengan opsi cetak fisik/simpan PDF dan opsi kirim struk instan ke WhatsApp pelanggan.
11. **Visualisasi Data Modern Fintech & Sapaan Dinamis**:
    - Grafik tren Uang Masuk (`#00875A`) & Uang Keluar (`#EA580C`) dengan desain *capsule pill* arsir diagonal rapi anti-tumpuk.
    - Sapaan kontekstual waktu dinamis (Pagi, Siang, Sore, Malam) pada kartu AI Advisor sesuai jam operasional pedagang.
12. **AI Virtual Studio & Instant Marketing**:
    - Hapus latar belakang foto produk 100% lokal di browser (`@imgly/background-removal` WASM).
    - Pasang frame studio (Minimalis, Pasar Tradisional, Kriya & Fashion).
    - Generator copywriting promosi WhatsApp real-time oleh Gemini Flash (gaya pasar, fomo, elegan).
13. **Pengaturan Fleksibel & Aksesibilitas Pedagang**:
    - Ambang batas peringatan margin (%).
    - Peringatan stok fisik minimum (kg/pcs).
    - Opsi Suara Asisten: 2 tombol jelas (Suara Aktif / Suara Mati) + tombol uji suara.
    - Ukuran Teks (Normal, Besar, Sangat Besar) untuk kenyamanan lansia.
    - Pilihan tema (Terang / Gelap) dan satuan utama.
    - Isolasi pendaftaran pengguna baru yang bersih (nama dan toko dinamis dari metadata pendaftaran).

---

## 5. Struktur Halaman Aplikasi (7 Halaman Inti + 1 Studio Modal)

VokaSync memiliki **7 halaman inti** yang saling terintegrasi secara modular:

1. **Beranda (`/dashboard`)**:
   - Ringkasan 4 kartu metrik utama (Uang Masuk, Uang Keluar, Untung Bersih, Margin).
   - Tombol "📲 Kirim Rekap ke WhatsApp".
   - Kartu AI Advisor proaktif + tombol Quick Action "Buat Promosi WA".
   - Grafik tren mingguan pemasukan vs pengeluaran.
   - Tabel transaksi terkini & feed sinyal peringatan.
2. **Catat Transaksi (`/catat`)**:
   - Tombol mikrofon besar dengan visual animasi gelombang suara.
   - Countdown timer deteksi hening (silence detection) untuk auto-save tenang.
   - Penyaring noise obrolan & auto-registrasi komoditas baru.
   - Audio konfirmasi suara balasan ramah (Text-to-Speech).
   - Form input manual sebagai fallback lengkap dengan tombol penambah/pengurang kuantitas.
3. **Barang & Stok (`/produk`)**:
   - Monitoring profitabilitas per komoditas (harga modal terkini, harga jual, margin %).
   - Status badge aksi: Dorong, Pertahankan, Perbaiki, Kurangi.
   - Upload foto produk langsung ke Supabase Storage (`product-images`).
   - Pemantauan sisa stok fisik dengan indikator peringatan stok menipis (kg/pcs).
4. **Laporan Keuangan (`/laporan`)**:
   - Rekapitulasi finansial berdasarkan filter periode (Hari Ini, 7 Hari, Bulan Ini, Semua).
   - Breakdown komoditas terlaris dan kontribusi omzet.
   - Fitur Cetak Laporan Resmi Kios (Print CSS optimized).
   - Fitur 1-Klik Share Laporan Lengkap ke WhatsApp.
5. **Eksperimen Bisnis (`/eksperimen`)**:
   - Pelacakan inisiatif perbaikan toko (misal penyesuaian harga atau bundling).
   - Perbandingan metrik sebelum (baseline) vs sesudah (current).
   - AI Verdict otomatis dari Gemini saat eksperimen diselesaikan.
6. **Riwayat Transaksi (`/riwayat`)**:
   - Arsip lengkap seluruh transaksi dengan filter tanggal, jenis transaksi, dan pencarian nama barang.
   - Fitur koreksi data (edit) dan hapus transaksi (dengan cascade delete ke item).
7. **Pengaturan (`/settings`)**:
   - Profil Toko: Nama Toko, Nama Pemilik, Jenis Usaha, Ganti Password.
   - Ambang batas peringatan margin dan stok fisik (kg/pcs).
   - Saklar Suara Asisten (Aktif / Mati) + Uji Coba Suara.
   - Preferensi Tampilan: Ukuran teks ramah mata, tema, satuan utama.
   - Logout akun aman.
8. **AI Virtual Studio (`components/studio/StudioModal.tsx`)**:
   - Modal studio visual marketing yang dapat dibuka dari tombol Quick Action AI Advisor atau menu barang.
   - Background removal client-side WASM, frame overlay, copywriting AI 3 variasi, kirim WhatsApp.

---

## 6. Navigasi & Tampilan Antarmuka

### Desktop & Tablet (Sidebar Kiri Hijau Tua Emerald) — `components/layout/sidebar.tsx`
- Mengadopsi palet warna profesional: Hijau Hutan Pekat (`#0A2619`), Border (`#123825`), Aksen Hijau Segar (`#22C55E`).
- Navigasi Menu:
  1. **Beranda** (`/dashboard`)
  2. **Catat** (`/catat`)
  3. **Barang** (`/produk`)
  4. **Laporan** (`/laporan`)
  5. **Riwayat** (`/riwayat`)
  6. **Pengaturan** (`/settings`)
- Desktop (≥1024px): Lebar sidebar 256px (`w-64`), ikon + label teks tebal + nama toko pengguna.
- Tablet (768px–1023px): Sidebar mengecil menjadi 80px (`w-20`), icon-only mode terpusat.

### Mobile Smartphone (≤767px) — `components/layout/bottom-nav.tsx` & `header.tsx`
- **Bottom Navigation Ergonomis 6 Tab**:
  Beranda | Catat | Barang | Laporan | Riwayat | Setelan
- Padding safe-area untuk perangkat modern berponi/gesture bar.
- Tab aktif disorot dengan warna `#22C55E` dan latar belakang kapsul halus.
- Header mobile menampilkan nama toko, status pedagang, tombol notifikasi, dan jalan pintas.

---

## 7. Use Case Terverifikasi

| ID | Use Case | Aktor | Implementasi Teknis |
|---|---|---|---|
| UC-01 | Melihat ringkasan bisnis harian, grafik tren & AI insight | Pedagang | `app/dashboard` + `/api/insights` (non-blocking) |
| UC-02 | Mengirim rekap harian kios ke WhatsApp keluarga/mitra | Pedagang | `DashboardPage.handleShareWhatsAppRekap` + `wa.me` |
| UC-03 | Mencatat transaksi via suara dengan filter obrolan alami | Pedagang | `app/catat` + Web Speech API + `/api/parse-voice` |
| UC-04 | Mendengar audio konfirmasi suara selesai simpan (TTS) | Pedagang | `speakConfirmation` + `window.speechSynthesis` |
| UC-05 | Pendaftaran otomatis produk baru dari input suara | Sistem | `/api/transactions/route.ts` (auto insert `products`) |
| UC-06 | Mencatat transaksi manual dengan tombol penambah kuantitas | Pedagang | `app/catat` form fallback manual |
| UC-07 | Melihat margin per komoditas dan status kategori aksi | Pedagang | `app/produk` + `/api/product-analysis` |
| UC-08 | Mengunggah foto produk ke cloud storage | Pedagang | `/api/upload-product-image` + Supabase Storage `product-images` |
| UC-09 | Memantau sisa stok fisik dan batch modal FIFO | Pedagang | `public.stock_batches` + `/api/product-analysis` |
| UC-10 | Menjalankan rekomendasi tindakan AI & melihat evaluasi verdict | Pedagang | `app/eksperimen` + `/api/experiments` + Gemini Flash |
| UC-11 | Melihat laporan keuangan berkala & filter periode | Pedagang | `app/laporan` + agregasi deterministik |
| UC-12 | Mencetak laporan fisik rekap toko | Pedagang | `app/laporan` + `window.print()` media print |
| UC-13 | Mengirim laporan berkala lengkap ke WhatsApp | Pedagang | `app/laporan` + `handleShareWhatsAppLaporan` |
| UC-14 | Melihat riwayat transaksi, filter, pencarian, edit, & hapus | Pedagang | `app/riwayat` + `/api/transactions/[id]` (cascade delete) |
| UC-15 | Mengatur profil toko, ambang batas stok fisik & peringatan | Pedagang | `app/settings` + `/api/settings` |
| UC-16 | Menghidupkan/mematikan suara asisten & uji coba audio | Pedagang | `app/settings` + `soundAlertEnabled` state |
| UC-17 | Membuat foto promosi produk via AI Virtual Studio | Pedagang | `StudioModal.tsx` + `@imgly/background-removal` |
| UC-18 | Menghasilkan 3 variasi copywriting WhatsApp otomatis | Sistem | `/api/generate-copy` + Gemini Flash |
| UC-19 | Registrasi pengguna baru dengan profil toko dinamis bersih | Pedagang Baru | `auth.users` + trigger DB `handle_new_user()` |
| UC-20 | Cache sesi cepat dan pemuatan data tanpa jeda (anti-lemot) | Sistem | SWR / sessionStorage caching di seluruh halaman |
| UC-21 | Cetak struk belanja PDF & kirim struk digital ke WhatsApp | Pedagang | `app/riwayat` (Modal Struk + `window.print` + `wa.me`) |
| UC-22 | Sapaan waktu dinamis AI & panduan lengkap ucapan suara | Pedagang | `AdvisorCard.tsx` + `app/catat` modal tips suara |

---

## 8. Arsitektur Komitmen Rp0 & Tech Stack Final

| Kebutuhan | Solusi Teknologi | Keterangan & Skema Biaya |
|---|---|---|
| Fullstack Framework | Next.js 16.3.4 (App Router) + TypeScript | Open-source, SSR aman untuk API key |
| Frontend Library | React 19.2.8 | State reaktif performa tinggi |
| Styling & UI | Tailwind CSS v4 + Lucide Icons | Desain responsif emerald profesional tanpa vibe-coding |
| Visualisasi Data | Recharts 3.10.1 | Bar chart interaktif tren mingguan |
| Database & Auth | Supabase PostgreSQL + Supabase Auth | Free Tier (RLS aktif, trigger otomatis, RDBMS ACID) |
| File & Image Storage | Supabase Storage Bucket (`product-images`) | Free Tier (5 GB kuota publik, terisolasi RLS) |
| AI Text Engine | Google Gemini Flash | Free Tier (API key server-side, kuota harian memadai) |
| Transkripsi Suara | Web Speech API (`SpeechRecognition`) | Native browser client, Rp0 tanpa server audio |
| Konfirmasi Suara (TTS) | Web Speech API (`SpeechSynthesis`) | Native browser audio, Rp0 bebas kuota |
| Background Removal | `@imgly/background-removal` (WASM) | 100% Client-Side di memori browser, privasi terjaga |
| Integrasi WhatsApp | URL Scheme `https://wa.me/?text=` | Rp0, langsung membuka aplikasi WhatsApp tanpa biaya API |
| Hosting & Deployment | Vercel | Free Tier Hobby (CI/CD otomatis dari GitHub) |

---

## 9. Kriteria Keberhasilan & Validasi Produk

1. **Kehandalan Input Suara**: Pengguna dapat mencatat penjualan dengan mengucapkan kalimat sehari-hari tanpa terganggu kata pengantar.
2. **Kemandirian Pengguna**: Konfirmasi suara audio (TTS) memberikan kepastian transaksi tercatat tanpa harus terus-menerus menatap layar HP.
3. **Penyelamatan Margin & Stok**: Peringatan dini muncul sebelum pedagang kehabisan modal atau kehabisan stok fisik komoditas penting.
4. **Kecepatan Akses**: Tidak ada jeda *sluggishness* berkat arsitektur pemisahan kalkulasi deterministik instan dan pemanggilan AI non-blocking dengan session caching.
5. **Kesiapan Lomba**: 100% fungsional, 0 error TypeScript, skema SQL tunggal `full_schema.sql` siap eksekusi, dan akun demo siap pakai untuk penjurian EXASTI 2.0.
