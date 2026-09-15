'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
  Mic,
  PlusCircle,
  TrendingUp,
  FileText,
  History,
  FlaskConical,
  Sparkles,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string[];
  tips?: string;
  badge?: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Umum',
    question: 'Apa itu VokaSync dan untuk siapa aplikasi ini dibuat?',
    answer: [
      'VokaSync adalah asisten keuangan pintar berbasis suara (Voice-First AI Advisor) yang dirancang khusus untuk pedagang pasar tradisional, pemilik warung, kios sembako, sayur, buah, bumbu, daging, dan pelaku UMKM.',
      'VokaSync memungkinkan pedagang mencatat transaksi jualan dan belanja cukup dengan berbicara santai dalam bahasa Indonesia sehari-hari.',
      'VokaSync juga secara otomatis menghitung laba kotor, memantau sisa stok barang, mendeteksi produk yang marginnya menipis, hingga merekomendasikan strategi harga yang tepat.',
    ],
    tips: 'Sangat cocok digunakan saat tangan basah atau sedang memegang timbangan di kios pasar.',
    badge: 'Dasar',
  },
  {
    id: 'faq-2',
    category: 'Umum',
    question: 'Bagaimana alur utama menggunakan VokaSync setiap hari?',
    answer: [
      '1. Buka menu Beranda setiap pagi untuk melihat kondisi toko dan mendengarkan saran asisten AI.',
      '2. Saat belanja kulakan modal di pasar subuh, catat pengeluaran lewat menu Catat (Uang Keluar) agar harga modal produk terbarui otomatis.',
      '3. Setiap kali ada pembeli atau transaksi jualan, tekan tombol mic di menu Catat (Uang Masuk) dan sebutkan barang yang laku.',
      '4. Pantau Laba Kotor harian di Beranda atau buka menu Laporan untuk melihat barang terlaris, barang kurang laku, dan stok yang menipis.',
      '5. Coba rekomendasi strategi di menu Coba & Pantau untuk meningkatkan keuntungan toko secara terukur.',
    ],
    tips: 'Catat setiap transaksi sekecil apa pun agar perhitungan laba kotor toko Anda 100% akurat.',
    badge: 'Panduan Harian',
  },
  {
    id: 'faq-3',
    category: 'Pencatatan',
    question: 'Bagaimana cara mencatat transaksi menggunakan suara?',
    answer: [
      '1. Tekan menu Catat di bilah navigasi bawah (ikon mikrofon hijau).',
      '2. Tekan tombol Mikrofon besar di tengah layar sampai berkedip dan muncul status Mendengarkan.',
      '3. Ucapkan transaksi Anda secara santai dan jelas, contoh:',
      '   • Penjualan: Jual bawang merah 3 kilo dapat sembilan puluh ribu',
      '   • Belanja modal: Belanja kangkung 10 ikat bayar lima puluh ribu',
      '   • Eceran: Laku cabai rawit setengah kilo 25 ribu',
      '4. Diam sebentar selama 1,5 detik atau tekan tombol selesai. Sistem akan otomatis memproses ucapan Anda.',
      '5. Periksa jendela konfirmasi. Jika ada salah ucap, Anda bisa langsung mengedit angkanya di layar sebelum menekan tombol Simpan.',
    ],
    tips: 'VokaSync mengenali sebutan lokal seperti goceng, ceban, gocap, setengah kilo, seperempat kilo, dan ons.',
    badge: 'Fitur Utama',
  },
  {
    id: 'faq-4',
    category: 'Pencatatan',
    question: 'Apakah saya bisa mencatat transaksi secara manual jika sedang tidak ingin bicara?',
    answer: [
      'Bisa! VokaSync menyediakan formulir manual lengkap di bawah tombol mikrofon pada halaman Catat.',
      '1. Pilih jenis transaksi: Uang Masuk (Penjualan) atau Uang Keluar (Belanja Modal).',
      '2. Pilih nama barang dari daftar produk toko Anda atau ketik nama baru.',
      '3. Masukkan jumlah dan satuan (kg, ikat, butir, liter, bungkus, karung, pcs, renteng).',
      '4. Masukkan nominal total rupiah.',
      '5. Tekan tombol Simpan Transaksi. Transaksi langsung masuk dan kas toko diperbarui.',
    ],
    badge: 'Manual',
  },
  {
    id: 'faq-5',
    category: 'Pencatatan',
    question: 'Apa yang terjadi jika saya menyebut nama barang yang belum pernah saya daftarkan?',
    answer: [
      'Jangan khawatir! VokaSync memiliki fitur pendaftaran otomatis.',
      'Saat Anda mengucapkan barang baru (misalnya Jual kol putih 2 kilo 20 ribu), sistem akan mendeteksi bahwa barang tersebut belum ada di toko Anda, lalu otomatis mendaftarkannya ke menu Barang lengkap dengan satuan dan harga awal.',
      'Anda tidak perlu repot mendaftarkan ratusan barang satu per satu sebelum mulai jualan.',
    ],
    tips: 'Anda bisa melengkapi foto atau mengubah harga modal barang tersebut kapan saja di menu Barang.',
  },
  {
    id: 'faq-6',
    category: 'Barang & Stok',
    question: 'Bagaimana cara mengelola produk dan stok di menu Barang?',
    answer: [
      'Di menu Barang, Anda dapat melihat seluruh katalog komoditas yang dijual di kios Anda beserta harga beli supplier, harga jual eceran, margin persen untung, dan sisa stok fisik.',
      'Untuk menambah produk baru: Tekan tombol + Tambah Produk, isi nama, satuan, harga beli, harga jual, dan stok awal lalu simpan.',
      'Untuk mengubah harga atau stok: Tekan tombol Edit pada kartu produk yang bersangkutan.',
      'Untuk menghapus produk: Tekan tombol Hapus dan konfirmasi.',
    ],
    tips: 'Stok akan otomatis berkurang saat Anda mencatat penjualan dan bertambah saat Anda mencatat belanja modal.',
    badge: 'Inventaris',
  },
  {
    id: 'faq-7',
    category: 'Barang & Stok',
    question: 'Mengapa harga beli di produk tidak berubah saat saya mencatat penjualan?',
    answer: [
      'VokaSync dirancang dengan perlindungan akuntansi yang ketat:',
      '• Saat Anda mencatat Penjualan (Uang Masuk), sistem hanya memperbarui harga jual eceran terkini dan mengurangi stok.',
      '• Harga beli dari supplier (modal) TIDAK AKAN PERNAH naik otomatis mengikuti harga jual. Ini menjamin margin keuntungan Anda tetap dihitung dengan jujur dan akurat.',
      '• Harga beli hanya diperbarui saat Anda mencatat Belanja Modal (Uang Keluar) atau saat Anda mengubahnya langsung di menu Barang.',
    ],
    tips: 'Hal ini mencegah kesalahan kalkulasi laba akibat kenaikan harga jual di pasar.',
  },
  {
    id: 'faq-8',
    category: 'Keuangan',
    question: 'Apa perbedaan Laba Kotor dengan Uang Masuk dan bagaimana cara menghitungnya?',
    answer: [
      '• Uang Masuk (Omzet): Seluruh uang tunai atau transfer yang diterima dari hasil penjualan barang hari ini.',
      '• Uang Keluar: Seluruh uang yang Anda bayarkan untuk belanja modal stok dagangan atau biaya operasional.',
      '• Laba Kotor (Untung Dagang): Selisih antara harga penjualan barang dengan harga modal belinya (Laba Kotor = Penjualan - Modal Belanja Pokok).',
      '• Persen Margin (%): Seberapa besar persentase keuntungan yang didapat dari setiap rupiah penjualan.',
      'Contoh: Beli telur modal Rp20.000, dijual Rp25.000. Laba Kotor = Rp5.000, Persen Margin = 20%.',
    ],
    badge: 'Keuangan',
  },
  {
    id: 'faq-9',
    category: 'Laporan',
    question: 'Informasi apa saja yang bisa saya lihat di menu Laporan?',
    answer: [
      'Menu Laporan menyajikan pembukuan lengkap yang dapat Anda filter berdasarkan Hari Ini, 7 Hari Terakhir, Bulan Ini, atau Semua Waktu:',
      '1. Ringkasan Keuangan: Total Uang Masuk, Total Uang Keluar, Laba Kotor, dan Persen Rata-rata.',
      '2. Arus Kas Harian: Rincian total transaksi harian beserta selisih kas.',
      '3. Real-Time Analisis Barang (di bagian bawah halaman):',
      '   • Barang Terlaris: Komoditas dengan volume penjualan tertinggi dan kontribusi laba kotor terbesar.',
      '   • Barang Kurang Laku: Produk yang minim perputaran sehingga Anda bisa lebih berhati-hati saat menyetok.',
      '   • Stok Menipis: Barang dengan sisa stok <= 5 unit sebagai sinyal dini agar Anda segera kulakan.',
    ],
    tips: 'Anda dapat mencetak laporan ke printer kasir (thermal/A4) atau membagikan rekapnya langsung ke WhatsApp.',
    badge: 'Laporan Riil',
  },
  {
    id: 'faq-10',
    category: 'Riwayat',
    question: 'Bagaimana cara mencari atau membatalkan transaksi yang salah catat?',
    answer: [
      '1. Buka menu Riwayat di bilah navigasi bawah.',
      '2. Anda dapat mencari transaksi berdasarkan nama barang lewat kolom pencarian atau filter rentang tanggal.',
      '3. Untuk mengubah: Tekan ikon pensil (Edit) pada baris transaksi yang ingin diperbaiki.',
      '4. Untuk menghapus: Tekan ikon tempat sampah (Hapus). Data kas dan stok akan otomatis dikembalikan seperti semula.',
      '5. Anda juga bisa menekan ikon Struk untuk mencetak struk kasir atau mengirim bukti pembayaran resmi ke WhatsApp pembeli.',
    ],
  },
  {
    id: 'faq-11',
    category: 'Strategi',
    question: 'Bagaimana cara kerja fitur Coba & Pantau (Eksperimen Bisnis)?',
    answer: [
      'Fitur Coba & Pantau adalah laboratorium bisnis pribadi Anda untuk menguji strategi harga sebelum atau sesudah diterapkan di pasar.',
      'Alurnya bekerja secara bertahap (Closed-Loop):',
      '1. Kondisi Bisnis Riil: AI membaca data penjualan, margin, dan harga modal produk Anda.',
      '2. Temuan Peluang/Masalah: AI menemukan barang yang marginnya tipis atau barang laris yang bisa dinaikkan sedikit harganya.',
      '3. Rekomendasi Saran: AI merumuskan strategi konkret (misalnya naikkan harga bawang merah Rp2.000 atau buat paket bundling).',
      '4. Pengguna Mencoba Strategi: Anda menekan Coba Strategi Ini dan menerapkannya di kios.',
      '5. Pemantauan & Evaluasi Riil: VokaSync memantau transaksi penjualan yang Anda lakukan selama beberapa hari ke depan.',
      '6. Hasil & Rekomendasi Akhir: Setelah selesai dievaluasi, sistem menampilkan apakah strategi tersebut berhasil meningkatkan keuntungan Anda.',
    ],
    tips: 'Jangan takut bereksperimen menaikkan harga Rp500 - Rp1.000 pada komoditas yang sedang ramai pembeli.',
    badge: 'Inovasi',
  },
  {
    id: 'faq-12',
    category: 'Pemasaran',
    question: 'Apa itu Virtual Studio / Buat Promo WhatsApp dan bagaimana cara memakainya?',
    answer: [
      'Virtual Studio adalah fitur promosi visual cerdas di VokaSync.',
      '1. Di halaman Beranda pada kartu Insight VokaSync, tekan tombol Buat Promo WhatsApp.',
      '2. Foto produk Anda langsung dari kamera HP atau pilih dari galeri.',
      '3. Kecerdasan buatan lokal akan otomatis menghapus latar belakang foto yang berantakan menjadi foto produk bersih profesional.',
      '4. Sistem akan otomatis menuliskan kalimat promosi WhatsApp yang ramah dan menarik lengkap dengan nama barang dan harga.',
      '5. Tekan tombol bagikan untuk mengirimkan gambar dan teks promo langsung ke grup WhatsApp pelanggan Anda.',
    ],
    tips: 'Proses penghapusan latar belakang berjalan langsung di HP Anda tanpa memakan kuota server.',
  },
  {
    id: 'faq-13',
    category: 'AI Advisor',
    question: 'Apakah suara asisten VokaSync bisa berbicara membacakan kondisi toko?',
    answer: [
      'Bisa! Pada kartu Insight VokaSync di halaman Beranda, terdapat tombol Dengarkan.',
      'Saat ditekan, asisten AI VokaSync akan menyapa hangat sesuai waktu (Selamat Pagi / Siang / Sore / Malam) dan membacakan kondisi performa penjualan toko, barang paling menguntungkan, serta saran strategi dengan suara natural bahasa Indonesia.',
      'Anda bisa mengaktifkan atau menonaktifkan suara otomatis di menu Pengaturan -> Suara Asisten Bicara.',
    ],
    badge: 'Audio TTS',
  },
  {
    id: 'faq-14',
    category: 'Pengaturan',
    question: 'Pengaturan apa saja yang bisa saya sesuaikan di aplikasi?',
    answer: [
      'Buka menu Pengaturan untuk menyesuaikan:',
      '• Kelola Profil Toko: Ubah nama toko, nama pemilik, dan jenis komoditas jualan.',
      '• Peringatan Untung & Stok: Atur batas minimum untung (default 20%) dan batas sisa stok minimum.',
      '• Suara Asisten Bicara: Nyalakan/matikan suara asisten atau atur volume.',
      '• Tampilan, Tema & Satuan: Sesuaikan ukuran huruf (Normal/Besar), mode tema, dan satuan default (kg, ikat, pcs, dll).',
      '• Periode Analisis: Tentukan rentang waktu evaluasi mingguan (7 hari) atau bulanan (30 hari).',
      '• Keamanan & Kata Sandi: Ganti kata sandi akun toko Anda agar selalu aman.',
    ],
  },
];

const CATEGORIES = ['Semua', 'Umum', 'Pencatatan', 'Barang & Stok', 'Keuangan', 'Laporan', 'Strategi', 'Pemasaran', 'AI Advisor', 'Pengaturan'];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FAQ_DATA.filter((item) => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;
      const inQuestion = item.question.toLowerCase().includes(q);
      const inAnswer = item.answer.some((line) => line.toLowerCase().includes(q));
      const inCategory = item.category.toLowerCase().includes(q);
      return inQuestion || inAnswer || inCategory;
    });
  }, [searchQuery, selectedCategory]);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-full border-2 border-slate-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Kembali ke Pengaturan</span>
        </Link>
      </div>

      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-900/60 border border-emerald-400/30 px-3.5 py-1 rounded-full text-xs font-black text-emerald-200 uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-300" />
            <span>Pusat Bantuan Resmi VokaSync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Panduan Penggunaan &amp; Tanya Jawab
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl font-medium leading-relaxed">
            Temukan jawaban cepat seputar cara mencatat transaksi suara, memantau laba kotor kios, mengatur stok barang, hingga menggunakan saran cerdas asisten bisnis Anda.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari panduan atau pertanyaan... (misal: suara, laba kotor, stok, margin)"
          className="w-full pl-12 pr-4 py-3.5 text-sm sm:text-base font-semibold text-slate-900 bg-white border-2 border-slate-200 rounded-2xl focus:border-emerald-600 focus:outline-hidden shadow-2xs transition-all placeholder:text-slate-400 placeholder:font-normal"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md cursor-pointer"
          >
            Hapus
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${isOpen ? 'border-emerald-300 shadow-sm' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      ?
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {faq.category}
                        </span>
                        {faq.badge && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {faq.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                        {faq.question}
                      </h3>
                    </div>
                  </div>

                  <div className="shrink-0 text-slate-400 group-hover:text-emerald-700 transition-colors">
                    {isOpen ? <ChevronUp className="w-5 h-5 stroke-[2.5]" /> : <ChevronDown className="w-5 h-5 stroke-[2.5]" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-700 space-y-3 border-t border-slate-100 animate-in fade-in duration-150">
                    {faq.answer.map((paragraph, pIdx) => (
                      <p key={pIdx} className="leading-relaxed font-medium">
                        {paragraph}
                      </p>
                    ))}

                    {faq.tips && (
                      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-950 font-semibold mt-2">
                        <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <span>Tips Praktis: {faq.tips}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">Tidak ada pertanyaan yang cocok</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Coba gunakan kata kunci lain seperti &quot;suara&quot;, &quot;harga&quot;, &quot;stok&quot;, atau pilih kategori &quot;Semua&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Reset Pencarian
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
        <h4 className="text-sm font-black text-slate-900">Butuh Langsung Mencoba Fitur?</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            href="/catat"
            className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 hover:border-emerald-300 transition-all text-left"
          >
            <Mic className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-xs font-bold text-slate-800">Catat Suara</span>
          </Link>
          <Link
            href="/produk"
            className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 hover:border-emerald-300 transition-all text-left"
          >
            <PlusCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-xs font-bold text-slate-800">Kelola Produk</span>
          </Link>
          <Link
            href="/laporan"
            className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 hover:border-emerald-300 transition-all text-left"
          >
            <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-xs font-bold text-slate-800">Buka Laporan</span>
          </Link>
          <Link
            href="/eksperimen"
            className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 hover:border-emerald-300 transition-all text-left"
          >
            <FlaskConical className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-xs font-bold text-slate-800">Coba &amp; Pantau</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
