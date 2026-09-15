import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { callGemini } from '@/lib/ai/gemini';
import { getActiveUserProfile } from '@/lib/supabase/auth-helper';

export async function GET(_req: NextRequest) {
  try {
    const { profile } = await getActiveUserProfile();
    const supabase = createAdminClient();
    const userId = profile?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User tidak terautentikasi.' }, { status: 401 });
    }

    // 1. Ambil produk nyata milik user beserta harga & stok
    let prodQuery = supabase
      .from('products')
      .select('id, name, default_unit')
      .eq('user_id', userId)
      .limit(10);

    const { data: products } = await prodQuery;

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Belum ada produk. Tambahkan produk terlebih dahulu.',
      });
    }

    // 2. Ambil stock_batches untuk setiap produk (cost_price & remaining)
    const productIds = products.map((p: any) => p.id);
    const { data: batches } = await supabase
      .from('stock_batches')
      .select('product_id, cost_price, remaining_quantity')
      .in('product_id', productIds)
      .eq('status', 'active');

    // 3. Ambil transaksi penjualan 14 hari terakhir per produk
    const since14d = new Date(Date.now() - 14 * 86400000).toISOString();
    const { data: txItems } = await supabase
      .from('transaction_items')
      .select(`
        product_id,
        quantity,
        unit_price,
        transactions!inner (
          type,
          transaction_date,
          user_id
        )
      `)
      .eq('transactions.user_id', userId)
      .eq('transactions.type', 'income')
      .gte('transactions.transaction_date', since14d);

    // 4. Hitung cost_price & selling_price per produk
    const batchMap: Record<string, { cost: number; remaining: number }> = {};
    for (const b of batches || []) {
      const cur = batchMap[b.product_id];
      if (!cur || b.cost_price < cur.cost) {
        batchMap[b.product_id] = {
          cost: Number(b.cost_price) || 0,
          remaining: Number(b.remaining_quantity) || 0,
        };
      }
    }

    const txMap: Record<string, { totalSales: number; totalQty: number; avgPrice: number }> = {};
    for (const ti of txItems || []) {
      if (!txMap[ti.product_id]) txMap[ti.product_id] = { totalSales: 0, totalQty: 0, avgPrice: 0 };
      txMap[ti.product_id].totalSales += Number(ti.unit_price || 0) * Number(ti.quantity || 0);
      txMap[ti.product_id].totalQty += Number(ti.quantity || 0);
    }
    for (const pid of Object.keys(txMap)) {
      const d = txMap[pid];
      d.avgPrice = d.totalQty > 0 ? Math.round(d.totalSales / d.totalQty) : 0;
    }

    // 5. Buat ringkasan produk untuk prompt Gemini
    const productSummaries = products.map((p: any) => {
      const batch = batchMap[p.id];
      const tx = txMap[p.id];
      const cost = batch?.cost || 0;
      const selling = tx?.avgPrice || 0;
      const margin = selling > 0 && cost > 0
        ? Math.round(((selling - cost) / selling) * 100)
        : null;
      const remaining = batch?.remaining || 0;
      const avgDailySales = tx ? Math.round(tx.totalQty / 14 * 10) / 10 : 0;

      return {
        name: p.name,
        unit: p.default_unit || 'kg',
        cost_price: cost,
        selling_price: selling,
        margin_percentage: margin,
        remaining_stock: remaining,
        avg_daily_sales_14d: avgDailySales,
      };
    }).filter((p: any) => p.cost_price > 0 || p.selling_price > 0 || p.remaining_stock > 0);

    if (productSummaries.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Data harga produk belum lengkap. Tambahkan harga beli dan jual terlebih dahulu.',
      });
    }

    const ownerName = profile?.owner_name || 'Pedagang';
    const threshold = Number(profile?.margin_alert_threshold) || 20;

    // 6. Buat prompt Gemini dengan data produk nyata
    const productListText = productSummaries.map((p: any, i: number) =>
      `${i + 1}. ${p.name} (${p.unit}):
   - Harga beli modal: ${p.cost_price > 0 ? `Rp${p.cost_price.toLocaleString('id-ID')}` : 'belum tercatat'}
   - Harga jual rata-rata: ${p.selling_price > 0 ? `Rp${p.selling_price.toLocaleString('id-ID')}` : 'belum tercatat'}
   - Margin saat ini: ${p.margin_percentage !== null ? `${p.margin_percentage}%` : 'tidak dapat dihitung'}
   - Sisa stok: ${p.remaining_stock} ${p.unit}
   - Rata-rata penjualan harian 14 hari: ${p.avg_daily_sales_14d} ${p.unit}/hari`
    ).join('\n\n');

    const maxRecs = Math.min(3, productSummaries.length);

    const prompt = `Kamu adalah AI advisor bisnis untuk ${ownerName}, seorang pedagang pasar/UMKM.
Target margin keuntungan yang diinginkan: ≥${threshold}%.

Berikut data produk nyata yang sedang dijual:

${productListText}

Tugas kamu:
Berikan rekomendasi tindakan bisnis yang SPESIFIK, BERBEDA, dan langsung bisa dilaksanakan pedagang ini HARI INI.

ATURAN WAJIB & SANGAT KETAT:
1. MAKSIMAL HANYA 1 REKOMENDASI UNTUK 1 PRODUK. DILARANG KERAS memberikan lebih dari 1 rekomendasi untuk produk yang sama!
2. Jika jumlah produk di atas hanya 1, kamu HANYA BOLEH memberikan TEPAT 1 rekomendasi saja (dilarang menduplikat)!
3. Jika jumlah produk lebih dari 1, berikan maksimal ${maxRecs} rekomendasi di mana SETIAP REKOMENDASI WAJIB UNTUK PRODUK YANG BERBEDA.

Format output WAJIB JSON array persis seperti ini (tanpa markdown backtick, langsung JSON):
[
  {
    "productName": "nama produk dari daftar di atas",
    "title": "judul tindakan singkat (max 60 karakter)",
    "description": "penjelasan tindakan konkret 2-3 kalimat, sebut angka spesifik (harga, margin, estimasi untung harian)",
    "targetMargin": angka_margin_target_integer,
    "baselineMargin": margin_saat_ini_integer_atau_15_jika_tidak_diketahui,
    "actionType": "harga" | "bundling" | "promosi" | "stok"
  }
]`;

    // 7. Panggil Gemini
    let recommendations: any[] = [];
    try {
      const raw = await callGemini(prompt);
      // Parse JSON — strip backticks jika ada
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        const seenProducts = new Set<string>();
        const seenTitles = new Set<string>();
        const uniqueRecs: any[] = [];

        for (const r of parsed) {
          const rawName = (r.productName || productSummaries[0]?.name || 'Produk Anda').trim();
          const normName = rawName.toLowerCase();
          const normTitle = (r.title || '').trim().toLowerCase();

          // KETAT: 1 produk hanya boleh memiliki 1 rekomendasi
          if (seenProducts.has(normName) || (normTitle && seenTitles.has(normTitle))) {
            continue;
          }

          seenProducts.add(normName);
          if (normTitle) seenTitles.add(normTitle);

          uniqueRecs.push({
            id: `rec-${Date.now()}-${uniqueRecs.length}`,
            productName: rawName,
            title: r.title || 'Tindakan Bisnis Baru',
            description: r.description || '',
            targetMargin: Number(r.targetMargin) || threshold + 5,
            baselineMargin: Number(r.baselineMargin) || 15,
            actionType: r.actionType || 'harga',
          });

          if (uniqueRecs.length >= maxRecs) break;
        }

        recommendations = uniqueRecs;
      }
    } catch (parseErr) {
      console.warn('Gemini recommendations parse error, using product-based fallback:', parseErr);
      // Fallback: buat rekomendasi berbasis logika dari data produk nyata (1 produk = 1 saran)
      const seenFallbackProducts = new Set<string>();
      const fallbackRecs: any[] = [];

      for (let idx = 0; idx < productSummaries.length; idx++) {
        const p = productSummaries[idx];
        const normName = (p.name || '').trim().toLowerCase();
        if (seenFallbackProducts.has(normName)) continue;
        seenFallbackProducts.add(normName);

        const margin = p.margin_percentage ?? 15;
        const cost = p.cost_price;
        const selling = p.selling_price;
        let title = '';
        let description = '';
        let targetMargin = threshold + 5;

        if (margin <= 0 && cost > 0) {
          const rec = Math.round(cost * 1.25);
          title = `Sesuaikan Harga Jual ${p.name} ke Rp${rec.toLocaleString('id-ID')}/${p.unit}`;
          description = `Harga jual ${p.name} saat ini (Rp${selling.toLocaleString('id-ID')}) di bawah modal (Rp${cost.toLocaleString('id-ID')}), margin ${margin}%. Naikkan ke Rp${rec.toLocaleString('id-ID')} untuk margin 20% dan mulai profit.`;
          targetMargin = 20;
        } else if (margin < threshold) {
          const stepUp = p.unit === 'kg' ? 1000 : 500;
          const newPrice = selling + stepUp;
          const newMargin = cost > 0 ? Math.round(((newPrice - cost) / newPrice) * 100) : threshold;
          title = `Naikkan Harga ${p.name} Rp${stepUp.toLocaleString('id-ID')}/${p.unit}`;
          description = `Margin ${p.name} sekarang ${margin}%, di bawah target ${threshold}%. Naikkan Rp${stepUp.toLocaleString('id-ID')} menjadi Rp${newPrice.toLocaleString('id-ID')} untuk margin ${newMargin}%. Estimasi tambahan untung harian Rp${(stepUp * (p.avg_daily_sales_14d || 3)).toLocaleString('id-ID')}.`;
          targetMargin = newMargin;
        } else {
          const nextProd = productSummaries.find((other: any) => (other.name || '').toLowerCase() !== normName) || productSummaries[(idx + 1) % productSummaries.length];
          title = `Paket Bundling ${p.name} + ${nextProd?.name || 'Produk Pelengkap'}`;
          description = `Margin ${p.name} sudah sehat di ${margin}%. Buat paket bundling bersama ${nextProd?.name || 'produk lain'} untuk meningkatkan nilai transaksi per pembeli dan percepat perputaran stok.`;
          targetMargin = Math.min(50, margin + 5);
        }

        fallbackRecs.push({
          id: `rec-${Date.now()}-${fallbackRecs.length}`,
          productName: p.name,
          title,
          description,
          targetMargin,
          baselineMargin: margin > 0 ? margin : 15,
          actionType: margin < threshold ? 'harga' : 'bundling',
        });

        if (fallbackRecs.length >= maxRecs) break;
      }
      recommendations = fallbackRecs;
    }

    return NextResponse.json({ success: true, data: recommendations });
  } catch (err: any) {
    console.error('GET /api/experiments/recommendations error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
