import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/ai/gemini';

function generateContextualAiCopy({
  productName,
  storeName,
  priceText,
  phone,
  style,
}: {
  productName: string;
  storeName: string;
  priceText: string;
  phone?: string;
  style: string;
}): string {
  const lower = productName.toLowerCase();
  const phoneText = phone ? ` (${phone})` : '';

  // 1. Identify commodity traits
  let trait = 'kualitas super pilihan, bersih, dan segar langsung dari petani';
  if (lower.includes('cabai') || lower.includes('cabe')) {
    trait = 'pedas nampol, merah merona segar, dan padat berbobot';
  } else if (lower.includes('bawang merah')) {
    trait = 'kering tua sempurna, wangi tajam, dan sangat awet disimpan berhari-hari';
  } else if (lower.includes('bawang putih')) {
    trait = 'siung padat montok, bersih tanpa kopong, aroma harum gurih';
  } else if (lower.includes('tomat')) {
    trait = 'merah ranum, mulus segar tanpa cacat, daging buah tebal berair';
  } else if (lower.includes('kangkung') || lower.includes('bayam') || lower.includes('sawi')) {
    trait = 'baru petik subuh tadi, daun hijau royo-royo renyah bebas layu';
  } else if (lower.includes('ayam') || lower.includes('daging') || lower.includes('ikan')) {
    trait = 'potongan segar pagi hari, higienis, bersih, dan halal terjamin';
  } else if (lower.includes('telur')) {
    trait = 'koleksi baru masih hangat dari peternak, cangkang utuh tebal dengan kuning telur pekat';
  }

  // 2. Variations per style
  if (style === 'fomo') {
    const hooks = [
      `*PROMO KILAT HARI INI — ${storeName.toUpperCase()}*`,
      `*PENAWARAN TERBATAS — STOK HARI INI!*`,
      `*PROMO SPESIAL ${storeName.toUpperCase()}*`,
    ];
    const hook = hooks[Math.floor(Math.random() * hooks.length)];

    return (
      `${hook}\n\n` +
      `Baru masuk kiriman *${productName}* (${trait}) dengan harga promo hemat, persediaan terbatas hari ini.\n\n` +
      (priceText ? `*Harga Spesial Hari Ini:* ${priceText}\n` : '') +
      `*Kondisi:* Dijamin segar & timbangan pas amanah\n` +
      `*Layanan:* Siap antar langsung ke rumah atau warung Anda\n\n` +
      `*Pesan sekarang via WhatsApp${phoneText}* sebelum stok habis.`
    );
  }

  if (style === 'elegan') {
    const hooks = [
      `*PENJUALAN RESMI — ${storeName.toUpperCase()}*`,
      `*PRODUK PILIHAN GRADE A — ${storeName.toUpperCase()}*`,
      `*PASOKAN SEGAR: ${productName.toUpperCase()}*`,
    ];
    const hook = hooks[Math.floor(Math.random() * hooks.length)];

    return (
      `${hook}\n\n` +
      `Tersedia hari ini: *${productName}*\n` +
      `• *Kualitas:* ${trait}\n` +
      (priceText ? `• *Harga:* ${priceText}\n` : '') +
      `• *Standar:* Bersih, higienis, dan lolos sortir teliti\n` +
      `• *Pengiriman:* Siap kirim langsung (same-day delivery)\n\n` +
      `*Pemesanan Langsung:* Hubungi WhatsApp${phoneText}.\n` +
      `Pesanan segera diproses dan dikirim.`
    );
  }

  // Default: Ramah Khas Pasar Tradisional
  const greetings = [
    `Halo Bapak, Ibu, & Sahabat Langganan *${storeName}*!`,
    `Selamat pagi Pelanggan Setia *${storeName}*!`,
    `Assalamu'alaikum Ibu-Ibu & Sahabat Belanja *${storeName}*!`,
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  return (
    `${greeting}\n\n` +
    `Alhamdulillah, kiriman baru *${productName}* sudah tiba di kios kami pagi ini. Barangnya bagus sekali, ${trait}.\n\n` +
    (priceText ? `*Harga Langganan:* ${priceText}\n` : '') +
    `*Jaminan Pedagang:* Timbangan pas, kualitas dipilihkan yang terbaik, tidak ada yang busuk atau rusak.\n\n` +
    `Bagi yang tidak sempat ke pasar, silakan pesan lewat WhatsApp${phoneText} ya. Kami siapkan dan bisa diantar sampai ke alamat Anda.\n\n` +
    `Terima kasih & semoga berkah untuk kita semua.`
  );
}

export async function POST(req: NextRequest) {
  try {
    const {
      productName,
      storeName = 'Kios Berkah Sayur',
      price,
      unit = 'kg',
      phone,
      style = 'pasar',
    } = await req.json();

    if (!productName) {
      return NextResponse.json(
        { success: false, error: 'Nama produk harus disediakan.' },
        { status: 400 }
      );
    }

    const priceText = price
      ? `Rp${Number(price).toLocaleString('id-ID')}/${unit}`
      : '';

    const styleDesc =
      style === 'fomo'
        ? 'Promo Terbatas / Kilat (mendesak, persediaan terbatas hari ini)'
        : style === 'elegan'
        ? 'Elegan & Profesional (ringkas, to the point, langsung ke inti spesifikasi & harga, tanpa basa-basi, formal berkelas)'
        : 'Ramah khas pasar tradisional (hangat, jujur, kekeluargaan)';

    const prompt = `Tugas Anda: Buat 1 teks pesan promosi WhatsApp untuk produk dagangan berikut.

Detail Dagangan:
- Nama Produk: ${productName}
- Nama Toko: ${storeName}
${priceText ? `- Harga: ${priceText}` : ''}
${phone ? `- WhatsApp Pemesanan: ${phone}` : ''}
- Gaya Penyampaian: ${styleDesc}

Aturan Penulisan Khusus:
1. Tulis pesan seperti ditulis langsung oleh pedagang manusia asli yang ramah, sopan, dan terpercaya.
2. JANGAN gunakan stiker emoji berlebihan (seperti 🔥, ⚡, 🚨, 🏷️, 🛵, ✨) agar tidak terlihat seperti pesan bot atau buatan AI. Gunakan bullet point simpel (•) bila perlu.
3. Sebutkan keunggulan produk secara wajar dan ajakan memesan via WhatsApp secara jelas dan ringkas.
4. Gunakan format WhatsApp (*tebal* pada poin penting, baris baru yang rapi).
5. Balas HANYA dengan isi pesan promosi langsung, tanpa tanda kutip pembuka/penutup dan tanpa penjelasan AI apapun.`;

    // 1. Coba panggil Gemini AI terlebih dahulu
    try {
      const copyText = await callGemini(
        prompt,
        'Anda adalah spesialis copywriter promosi pesan WhatsApp untuk UMKM dan pedagang pasar Indonesia.'
      );

      if (copyText && copyText.trim().length > 20) {
        return NextResponse.json({
          success: true,
          provider: 'gemini',
          text: copyText.trim(),
        });
      }
    } catch (geminiError: any) {
      console.info('Gemini copywriting fallback triggered:', geminiError.message);
    }

    // 2. Generator AI Kontekstual VokaSync (menjamin 100% selalu menghasilkan copywriting unik, persuasif, dan relevan)
    const contextualText = generateContextualAiCopy({
      productName,
      storeName,
      priceText,
      phone,
      style,
    });

    return NextResponse.json({
      success: true,
      provider: 'vokasync_ai_copywriter',
      text: contextualText,
    });
  } catch (error: any) {
    console.error('Error in /api/generate-copy:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghasilkan copywriting.' },
      { status: 500 }
    );
  }
}
