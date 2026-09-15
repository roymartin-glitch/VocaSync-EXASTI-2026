# VokaSync — Voice-First Financial AI Advisor & Visual Marketing Studio untuk UMKM Pasar

> **Inovasi Digital Inklusif (SDGs 9: Industry, Innovation, and Infrastructure)**  
> *Bukan sekadar kasir (POS), melainkan Asisten Keuangan & Strategi Bisnis Cerdas Berbasis Suara bagi Pedagang Komoditas Mikro.*

---

## 🎯 1. Tujuan & Latar Belakang

Di pasar tradisional dan usaha mikro, mayoritas pedagang menjual komoditas basah/curah (sayuran, cabai, daging, bumbu dapur, buah, dan sembako) yang **tidak memiliki barcode**. Saat jam sibuk pasar, tangan pedagang basah atau memegang timbangan, sehingga **mustahil mengetik manual** di aplikasi kasir konvensional. Akibatnya, lebih dari 80% pedagang pasar tidak memiliki catatan keuangan, tidak tahu pasti keuntungan harian, dan rentan merugi akibat harga modal yang fluktuatif.

**VokaSync hadir untuk mengatasi masalah ini:**
1. **Menghapus Hambatan Input:** Pedagang cukup berbicara santai dalam bahasa Indonesia sehari-hari untuk mencatat penjualan maupun belanja modal secara instan.
2. **Memberikan Navigasi Keuangan Riil:** Menghitung laba bersih, margin riil, dan evaluasi stok secara otomatis tanpa perlu pemahaman akuntansi yang rumit.
3. **Meningkatkan Daya Saing Pasar Tradisional:** Memberdayakan pedagang dengan rekomendasi tindakan bisnis proaktif berbasis AI dan materi promosi visual profesional langsung dari HP.

---

## ⚖️ 2. Perbedaan Mendasar: VokaSync vs Aplikasi Kasir (POS) Konvensional

Banyak pedagang mengira semua aplikasi pencatatan itu sama. Tabel ini menjelaskan mengapa VokaSync berbeda secara fundamental dari aplikasi kasir biasa:

| Aspek | Aplikasi Kasir Biasa (POS) | VokaSync (Voice-First AI Advisor) |
| :--- | :--- | :--- |
| **Metode Input** | Wajib mengetik, mencari nama barang di layar, atau scan barcode produk berkemasan. | **Voice-First (Suara Sehari-hari)**: Cukup bicara *"Jual cabai 3 kilo 120 ribu"* atau *"Belanja kangkung 10 ikat 50 ribu"*. Tangan basah/kotor bukan kendala. |
| **Karakter Produk** | Dirancang untuk barang pabrikan/retail dengan SKU dan barcode tetap. | **Dioptimalkan untuk komoditas curah & pasar basah** (sayur, daging, buah, sembako) dengan satuan kg, ikat, karung, pcs, karpet, ekor. |
| **Peran Sistem** | **Pasif**: Hanya mencatat transaksi dan menjumlahkan total nominal uang. | **Proaktif & Advisory**: AI menganalisis jika margin produk menipis atau rugi, lalu memberikan solusi konkret (misal: penyesuaian harga jual, paket *bundling*). |
| **Interaksi AI & Audio** | Tidak ada panduan suara, teks kaku dan teknis. | **AI Asisten Berbicara (Audio TTS)** yang menyapa hangat sesuai waktu (Pagi/Siang/Sore/Malam) dan membacakan kondisi usaha secara lisan. |
| **Pengelolaan Laba Rugi** | Laporan statis di akhir bulan yang rumit dipahami pedagang awam. | **Real-Time Margin Tracking**: Langsung mendeteksi apakah harga jual hari ini menutup modal belanja pagi tadi secara detik itu juga. |
| **Dukungan Pemasaran** | Tidak ada fitur pembuatan konten promosi. | **Studio Pemasaran AI**: Hapus latar belakang foto produk otomatis (WASM lokal) & hasilkan teks promo siap sebar ke WhatsApp pelanggan. |

---

## 👥 3. Target Pengguna

VokaSync dirancang spesifik untuk pelaku ekonomi mikro:
1. **Pedagang Pasar Tradisional:** Kios sayur mayur, lapak daging & ayam potong, pedagang cabai/bawang, kios buah musiman, dan toko sembako.
2. **Pelaku Usaha Kuliner Mikro & Warung Makan:** Warung kelontong, warteg, kedai kopi kecil, dan pedagang kaki lima (PKL) yang belanja stok harian di pasar subuh.
3. **Pemasok Komoditas Rumahan:** Peternak telur skala rumahan, distributor bumbu giling, dan agen bahan pokok lokal.

---

## 🚀 4. Keunggulan Utama VokaSync

### 🎙️ 4.1. Pencatatan Berbasis Suara Cerdas (Voice-to-Transaction Suite)
Fitur unggulan utama VokaSync yang dirancang khusus untuk operasional riil di pasar yang bising dan dinamis:
- **Pengenalan Bahasa Sehari-hari & Dialek Pasar (Natural Language Parsing):**
  - Mengerti ucapan kasual pedagang seperti *"Jual bawang merah 5 kilo dapat 200 ribu"*, *"Beli kangkung 10 ikat bayar 50 ribu"*, atau *"Belanja ayam potong 10 ekor 350 ribu"*.
  - Otomatis mengekstrak **Jenis Transaksi** (Penjualan/Belanja), **Nama Komoditas**, **Jumlah**, **Satuan**, dan **Total Nominal**.
- **Normalisasi Angka & Satuan Indonesia Otomatis:**
  - Mengenali ragam penyebutan nominal lokal: *seperempat (0.25)*, *setengah (0.5)*, *sepuluh ribu (10.000)*, *goceng (5.000)*, *ceban (10.000)*, *gocap (50.000)*, *setengah juta (500.000)*, *1 juta*, dll.
  - Mendukung satuan komoditas pasar lengkap: *kg, gram, ikat, karung, pcs/buah, bungkus, karpet, ekor, liter, kaleng, pack, dus*.
- **Pembeda Arah Arus Kas Otomatis (Uang Masuk vs Uang Keluar):**
  - Mendeteksi kata kunci penjualan (*jual, laku, dapat, terima*) menjadi **Uang Masuk (+)**.
  - Mendeteksi kata kunci modal belanja (*beli, belanja, modal, kulak, bayar*) menjadi **Uang Keluar (-)**.
- **Arsitektur Dual-Engine Parsing (Hybrid Regex + Google Gemini AI):**
  - Parsing dilakukan secara instan lewat mesin regex lokal berkecepatan tinggi (~10ms).
  - Jika kalimat ucapan panjang atau kompleks, sistem otomatis mengalihkan ke model Google Gemini untuk mengekstrak entitas tanpa gagal.
- **Peredam Jeda & Filter Kata Berulang (Noise & Hesitation Filter):**
  - Mengeliminasi gumaman khas manusia seperti *"eh...", "anu...", "mmm...", "terus..."* serta kata yang diulang dua kali karena ragu.
- **Fuzzy Matching Nama Produk & Registrasi Otomatis:**
  - Mencocokkan nama komoditas dengan inventaris yang sudah ada di toko untuk mencegah duplikasi (misal: ucapan *"tomat"* otomatis terhubung ke produk *"Tomat Sayur"*).
  - Jika komoditas baru pertama kali diucapkan, sistem otomatis mendaftarkannya ke katalog barang dagangan secara instan.
- **Form Edit Langsung di Tempat (*In-Place Edit Modal*):**
  - Sebelum data disimpan permanen, pedagang dapat melihat modal konfirmasi visual yang rapi. Jika ada salah ucap, pedagang bisa langsung mengedit teks/angka di form tanpa perlu mengulang bicara dari awal.
- **Konfirmasi Suara Lisan Asisten Ramah (Audio Text-to-Speech):**
  - Asisten membalas langsung secara lisan dalam bahasa Indonesia: *"Baik, tercatat penjualan bawang merah 5 kilo senilai dua ratus ribu rupiah"*. Pedagang tahu catatannya masuk tanpa harus memandang layar HP.
- **Contoh Kalimat Sekali Klik (*Voice Cheatsheet*):**
  - Tersedia kartu panduan contoh kalimat suara yang bisa diklik langsung untuk menguji sistem secara instan.

### 📊 4.2. Visualisasi Tren Finansial Kapsul Modern
- Grafik 7 hari terakhir bergaya **Capsule Pill Bar** dengan arsir diagonal halus.
- Palet warna finansial kontras tinggi: **Uang Masuk (Hijau Zamrud `#00875A`)** berdampingan dengan **Uang Keluar (Sunset Amber `#EA580C`)**.
- Cepat dibaca dan dipahami sekilas bahkan di bawah terik matahari pasar.

### 🧠 4.3. Closed-Loop AI Advisory (Gemini AI Engine)
- Menghitung margin deterministik tanpa risiko halusinasi angka.
- Memberikan peringatan dini jika harga beli komoditas melonjak tetapi harga jual belum disesuaikan.
- Rekomendasi tindakan nyata yang disesuaikan dengan data riil toko Anda (tersedia fitur uji coba/eksperimen strategi harga).

### 🧾 4.4. Struk Digital Resmi (WhatsApp & PDF Thermal)
- Setiap transaksi dapat langsung dicetak struk fisiknya (format kertas kasir) atau dikirim dalam 1 klik ke WhatsApp pelanggan dalam format pesan rapi beridentitas toko.

### ⚡ 4.5. Performa Super Ringan (0ms Load Time & Hemat Baterai)
- Menggunakan arsitektur *Session Storage Caching*: Dashboard dan riwayat terbuka seketika tanpa layar tunggu (*loading spinner*).
- Kueri database Supabase dijalankan secara paralel (`Promise.all`) dengan latensi rendah (<200ms).
- Desain antarmuka mobile-first responsif yang pas di layar HP Android tanpa terpotong navigasi.

### 🎨 4.6. Studio Pemasaran Visual Tanpa Kuota Server
- Fitur penghapusan background foto produk dijalankan langsung di memori HP pengguna menggunakan WebAssembly lokal (`@imgly/background-removal`).
- Nol biaya server tambahan, privat, dan menghasilkan poster promosi jualan yang menarik.

---

## 🛠️ 5. Arsitektur & Tumpukan Teknologi

- **Frontend & Routing:** Next.js (App Router, Server Components & Client Hooks) + TypeScript
- **Styling UI:** Tailwind CSS (Mobile-First responsive layout)
- **Database & Auth:** Supabase PostgreSQL dengan Row-Level Security (RLS)
- **Model Kecerdasan Buatan:** Google Gemini API (Structured JSON & Contextual Advisor)
- **Audio & Suara:** Web Speech API (`SpeechRecognition` untuk telinga, `SpeechSynthesis` untuk suara asisten)
- **Pemrosesan Gambar Lokal:** WebAssembly (WASM) background segmentation
- **Visualisasi Data:** Recharts dengan kustomisasi SVG Capsule Pattern

---

## 💻 6. Panduan Menjalankan Aplikasi Secara Lokal

### 6.1. Prasyarat Sistem
- Node.js versi 18.x atau lebih baru
- Akun Supabase (Tersedia tier gratis)
- Google Gemini API Key

### 6.2. Pemasangan Dependensi
```bash
# Clone repositori
git clone https://github.com/roymartin-glitch/Vocasyncc.git
cd Vocasyncc

# Pasang dependensi
npm install
```

### 6.3. Konfigurasi Environment (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
GEMINI_API_KEY=AIzaSy...
```

### 6.4. Inisialisasi Database
Jalankan script SQL yang tersedia di `supabase/schema/full_schema.sql` pada SQL Editor Supabase Anda.

### 6.5. Menjalankan Server Development
```bash
npm run dev
```
Buka peramban di `http://localhost:3000`.

### 6.6. Verifikasi Build Produksi
```bash
npm run build
```
*Lolos 100% dengan 0 TypeScript error pada seluruh rute aplikasi.*

---

## 👥 Tim Pengembang (TIM EXASTI 2)

Dikembangkan bersama oleh **Tim EXASTI 2** (Universitas Tanri Abeng):
1. **Silvi Audina**
2. **Roy Martin Gulo**
3. **Rico Arya Rivanhani**
4. **Muhammad Adi Pramana**

---

## 📄 Lisensi
Dikembangkan untuk mendukung kemandirian dan digitalisasi berkelanjutan pelaku UMKM Indonesia. Hak cipta dilindungi undang-undang.

