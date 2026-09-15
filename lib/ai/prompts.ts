export function getParseVoicePrompt(transcript: string): string {
  return `Anda adalah AI asisten keuangan pedagang pasar tradisional & UMKM (VokaSync) yang sangat pintar, teliti, dan paham konteks komoditas pasar Indonesia.
Tugas Anda mengekstrak dan memperbaiki data transaksi perdagangan dari ucapan suara pedagang menjadi JSON valid.

Ucapan pedagang:
"${transcript}"

ATURAN KECERDASAN & KOREKSI TYPO / SALAH DENGAR (SANGAT PENTING):
1. Pengenalan suara (Speech-To-Text) sering salah dengar/typo karena suara bising pasar atau pengucapan cepat. Anda WAJIB cerdas mengoreksi kata typo menjadi nama komoditas pasar yang benar dan masuk akal:
   - "kampung", "kangkong", "kakung", "kankung" -> OLEH KARENA TIDAK ADA SAYUR 'KAMPUNG', KOREKSI OTOMATIS MENJADI: "Kangkung"
   - "tumat", "tomed", "umat" -> "Tomat"
   - "bayam", "bayem" -> "Bayam"
   - "rawang", "bawang", "bawang merah", "bawang putih", "bombay" -> "Bawang Merah" / "Bawang Putih" / "Bawang Bombay"
   - "cabe", "cabay", "cabi", "rawit" -> "Cabai Rawit" / "Cabai Merah"
   - "belas", "beras", "bras" -> "Beras"
   - "telor", "telur" -> "Telur"
   - "minyak", "minyak goreng" -> "Minyak Goreng"
   - "tempe", "tahu" -> "Tempe" / "Tahu"
   - "wortel", "buncis", "terong", "kol", "kubis", "sawi", "labu", "singkong", "kentang", "jagung", "timun", "tauge" -> nama sayur baku yang benar.
2. DILARANG KERAS menghasilkan nama barang non-komoditas yang tidak masuk akal seperti "Kampung", "Barang", "Saya", "Beli", atau kata acak. Jika kata tidak jelas tapi mirip komoditas pasar, pilih komoditas pasar terdekat.
3. type:
   - "expense" jika kata mengarah ke pembelian/belanja/kulakan/modal stok (contoh: "saya beli", "beli", "kulak", "kulakan", "belanja", "stok", "ambil", "bayar").
   - "income" jika transaksi penjualan/pembeli/laku/uang masuk (contoh: "jual", "laku", "dapat", "ada yang beli", "terjual").
4. product_name:
   - Nama murni komoditas dalam huruf kapital awal (contoh: "Kangkung", "Tomat", "Cabai Rawit", "Bawang Merah").
5. quantity & unit (STANDARISASI SATUAN PASAR KG & ONS):
   - Komoditas timbang (bawang, cabai, tomat, beras, kentang, wortel, dsb) secara default menggunakan satuan 'kg'.
   - Jika pedagang menyebut "ons" (misal: "1 ons", "2 ons", "setengah ons"):
     * Set "unit": "kg"
     * Konversikan "quantity" ke kg: 1 ons -> 0.1, 2 ons -> 0.2, 3 ons -> 0.3, 5 ons / setengah kilo -> 0.5, dsb.
     * Tambahkan field "raw_unit": "ons" dan "raw_quantity": angka asli sebelum konversi.
   - Jika pedagang menyebut pecahan: "seperempat kilo" -> quantity: 0.25 (unit: "kg"), "setengah kilo" -> quantity: 0.5 (unit: "kg"), "tiga perempat kilo" -> quantity: 0.75 (unit: "kg").
   - Jika barang bukan timbangan (ikat, butir, bungkus, renteng, karung, papan, pcs), gunakan satuan asli tersebut. Default quantity: 1 jika tidak disebut.
6. total_price:
   - Total rupiah dalam angka bulat (misal: "100 ribu" -> 100000, "50rb" -> 50000, "200.000" -> 200000, "1,5 juta" -> 1500000, "sepuluh ribu" -> 10000, "lima ribu" -> 5000).
7. is_valid_commodity:
   - true jika barang adalah komoditas/produk yang masuk akal dijual pedagang pasar/UMKM.
   - false jika ucapan sama sekali tidak mengandung barang dagangan atau hanya obrolan ngawur.

Wajib kembalikan HANYA format JSON valid tanpa tanda kutip markdown backtick dan tanpa teks tambahan:
{"product_name": "string", "quantity": number, "unit": "string", "raw_unit"?: "string", "raw_quantity"?: number, "total_price": number, "type": "expense" | "income", "is_valid_commodity": boolean}`;
}

export function getDailyAdvisorPrompt(
  ownerName: string,
  metrics: {
    todayIncome: number;
    todayExpense: number;
    todayProfit: number;
    todayMargin: number;
    threshold: number;
    criticalProduct?: string;
    criticalMargin?: number;
  }
): string {
  return `Anda adalah AI Advisor untuk ${ownerName}, pedagang pasar/UMKM.
Berikut data kondisi keuangan terkini:
- Pemasukan hari ini: Rp${metrics.todayIncome.toLocaleString('id-ID')}
- Pengeluaran hari ini: Rp${metrics.todayExpense.toLocaleString('id-ID')}
- Keuntungan bersih: Rp${metrics.todayProfit.toLocaleString('id-ID')}
- Margin rata-rata: ${metrics.todayMargin}% (Target ambang batas: ${metrics.threshold}%)
${metrics.criticalProduct ? `- Produk tertekan: ${metrics.criticalProduct} (margin ${metrics.criticalMargin}%)` : ''}

Tugas Anda:
Susun 1 paragraf narasi (3-4 kalimat ringkas) dalam bahasa Indonesia yang hangat, bersahabat, menyapa ${ownerName}. Jelaskan akar masalah (root-cause) dan berikan saran aksi nyata (apakah perlu menaikkan harga Rp1.000-Rp2.000, membuat paket hemat, atau mempromosikan via WhatsApp). Jangan gunakan istilah teknis rumit.`;
}

export function getExperimentVerdictPrompt(
  title: string,
  productName: string,
  baselineMargin: number,
  currentMargin: number,
  daysRunning: number
): string {
  return `Eksperimen bisnis: "${title}" pada produk "${productName}".
- Margin sebelum eksperimen (Baseline): ${baselineMargin}%
- Margin setelah dievaluasi: ${currentMargin}%
- Durasi pelaksanaan: ${daysRunning} hari.

Tugas Anda:
Berikan verdict evaluasi singkat (2-3 kalimat) apakah tindakan ini sukses, perlu dipertahankan, atau disesuaikan lagi. Bahasanya ramah dan memotivasi pedagang.`;
}

export function getMarketingCopyPrompt(
  productName: string,
  storeName: string = 'Kios Berkah',
  style: 'pasar' | 'fomo' | 'elegan' = 'pasar'
): string {
  return `Buatkan teks pesan promosi WhatsApp singkat dan menarik untuk produk "${productName}" dari "${storeName}".
Gaya bahasa: ${style === 'fomo' ? 'Promo kilat / terbatas / mendesak (FOMO)' : style === 'elegan' ? 'Kualitas terbaik / higienis / terpercaya' : 'Ramah khas pasar tradisional / hangat / kekeluargaan'}.
Gunakan emoji yang pas dan format yang rapi untuk dibaca di chat WhatsApp.`;
}
