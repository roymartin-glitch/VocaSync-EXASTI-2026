import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productName,
      costPrice,
      sellingPrice,
      margin,
      actionCategory,
      unit = 'kg',
      ownerName = 'Pak Budi',
    } = body;

    if (!productName) {
      return NextResponse.json(
        { success: false, error: 'Nama produk harus disediakan.' },
        { status: 400 }
      );
    }

    const costNum = Number(costPrice) || 0;
    const sellingNum = Number(sellingPrice) || 0;
    const costText = costNum > 0 ? `Rp${costNum.toLocaleString('id-ID')}` : 'Belum diisi / belum tersedia';

    const prompt = `Anda adalah penasihat bisnis untuk pedagang UMKM/pasar tradisional (${ownerName}).
Berikut adalah data komoditas yang sedang ditinjau:
- Nama Produk: ${productName}
- Satuan: ${unit}
- Harga Modal: ${costText}
- Harga Jual Eceran: Rp${sellingNum.toLocaleString('id-ID')}
- Margin Keuntungan: ${costNum > 0 ? `${margin}%` : 'Belum dapat dihitung (harga modal belum ada)'}
- Status Rekomendasi: ${costNum > 0 ? actionCategory.toUpperCase() : 'BELUM ADA MODAL'}

Tugas:
Buat catatan analisis singkat (1-2 kalimat padat, ramah, bahasa Indonesia sehari-hari yang mudah dipahami pedagang).
${costNum <= 0 ? 'Sampaikan bahwa margin dan keuntungan bersih baru bisa dihitung akurat setelah pedagang mencatat harga beli modal (kulakan) barang ini.' : 'Jelaskan arti margin ini bagi usaha dan berikan saran langkah praktis yang dapat diambil hari ini.'}`;

    const note = await callGemini(
      prompt,
      'Anda adalah konsultan bisnis UMKM mikro yang sangat paham kondisi pasar tradisional dan dagangan riil.'
    );

    return NextResponse.json({
      success: true,
      note: note.trim(),
    });
  } catch (err: any) {
    console.error('Error generating product advisor note:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menghasilkan catatan AI.' },
      { status: 500 }
    );
  }
}
