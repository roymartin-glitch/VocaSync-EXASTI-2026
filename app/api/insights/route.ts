import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { determineSeverity, buildTrendData, build7DayTrend, isStockLow, calculateFinancialSummary } from '@/lib/calculations/financial';
import { callGemini } from '@/lib/ai/gemini';
import { getDailyAdvisorPrompt } from '@/lib/ai/prompts';
import { getActiveUserProfile } from '@/lib/supabase/auth-helper';


export async function POST(req: NextRequest) {
  return handleInsights(req);
}

export async function GET(req: NextRequest) {
  return handleInsights(req);
}

async function handleInsights(req: NextRequest) {
  try {
    let localProductsOverride: any[] = [];
    let localTxsOverride: any[] = [];
    let periodParam: string | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.analysis_period) periodParam = body.analysis_period;
        if (body.period) periodParam = body.period;
        if (Array.isArray(body.localProducts)) {
          localProductsOverride = body.localProducts.filter(Boolean);
        }
        if (Array.isArray(body.localTxs)) {
          localTxsOverride = body.localTxs.filter(Boolean);
        }
      } catch (e) {}
    } else {
      const { searchParams } = new URL(req.url);
      periodParam = searchParams.get('period') || searchParams.get('analysis_period');
    }

    const { user, profile } = await getActiveUserProfile();
    const supabase = createAdminClient();
    const userId = profile?.id;

    let txQuery = supabase
      .from('transactions')
      .select(`
        id,
        type,
        transaction_date,
        source,
        raw_voice_text,
        transaction_items (
          quantity,
          unit,
          unit_price,
          product_id,
          products (
            id,
            name
          )
        )
      `)
      .order('transaction_date', { ascending: false });

    let insightsQuery = supabase
      .from('ai_insights')
      .select('*, products(name)')
      .order('created_at', { ascending: false })
      .limit(5);

    let batchesQuery = supabase
      .from('stock_batches')
      .select(`
        product_id,
        initial_quantity,
        remaining_quantity,
        unit,
        status,
        products (
          id,
          name
        )
      `);

    if (userId) {
      txQuery = txQuery.eq('user_id', userId);
      insightsQuery = insightsQuery.eq('user_id', userId);
      batchesQuery = batchesQuery.eq('user_id', userId);
    }

    // 1. Run all database queries in parallel for maximum speed & lowest latency
    const [txRes, batchesRes, insightsRes] = await Promise.all([
      txQuery,
      batchesQuery,
      insightsQuery,
    ]);

    const activeProfile = profile || {
      owner_name: 'Pedagang',
      business_name: 'Toko Saya',
      margin_alert_threshold: 20,
      analysis_period: '7d',
    };
    const threshold = Number(activeProfile.margin_alert_threshold) || 20;
    const finalPeriod = periodParam || activeProfile.analysis_period || '7d';

    // Use DB transactions and merge with any offline/local ones
    const dbTx = txRes.data || [];
    const allTx: any[] = [...dbTx];
    
    // Sinkronisasi transaksi lokal yang belum ter-push ke database (penting untuk mode demo/offline)
    const existingIds = new Set(allTx.map(t => t.id));
    for (const l of localTxsOverride) {
      if (l && l.id && !existingIds.has(l.id)) {
        allTx.unshift(l);
        existingIds.add(l.id);
      }
    }

    const batches = batchesRes.data || [];
    const insights = insightsRes.data || [];

    // 3. Compute Today's Financials (Sinkron 100% dengan Laporan & Beranda)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const todaySummary = calculateFinancialSummary(allTx, todayStr);
    const yesterdaySummary = calculateFinancialSummary(allTx, yesterdayStr);

    const todayIncome = todaySummary.income;
    const todayExpense = todaySummary.expense;
    const todayGrossProfit = todaySummary.profit;
    const todayMargin = todaySummary.margin;

    const calcPercentChange = (curr: number, prev: number) => {
      if (prev <= 0) return 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const todayIncomeChange = calcPercentChange(todayIncome, yesterdaySummary.income);
    const todayExpenseChange = calcPercentChange(todayExpense, yesterdaySummary.expense);
    const todayProfitChange = calcPercentChange(todayGrossProfit, yesterdaySummary.profit);
    const todayMarginChange = yesterdaySummary.margin > 0
      ? Math.round(((todayMargin - yesterdaySummary.margin) / yesterdaySummary.margin) * 100)
      : 0;

    // Deterministic severity
    const { severity, hasQuickAction } = determineSeverity(todayMargin, threshold);

    // 4. Build Trend sesuai periode analisis aktif (7d, 30d, 3m)
    const trendData = buildTrendData(allTx, finalPeriod);

    // 5. Check stock levels for "Peringatan Stok Hampir Habis" (Severity: yellow)
    const lowStockSignals: any[] = [];
    try {
      if (batches && batches.length > 0) {
        const prodMap: Record<string, { name: string; unit: string; initial: number; remaining: number }> = {};
        batches.forEach((b: any) => {
          const pId = b.product_id;
          if (!prodMap[pId]) {
            prodMap[pId] = {
              name: b.products?.name || 'Produk',
              unit: b.unit || 'kg',
              initial: 0,
              remaining: 0,
            };
          }
          prodMap[pId].initial += Number(b.initial_quantity || 0);
          if (b.status === 'active') {
            prodMap[pId].remaining += Number(b.remaining_quantity || 0);
          }
        });

        Object.entries(prodMap).forEach(([pId, data]) => {
          if (isStockLow(data.remaining, data.initial, 20)) {
            lowStockSignals.push({
              id: `stock-alert-${pId}`,
              user_id: profile?.id || 'demo-user',
              product_id: pId,
              product_name: data.name,
              severity: 'yellow',
              message: `Stok ${data.name} tinggal ${data.remaining} ${data.unit}. Segera belanja stok agar tidak kehabisan.`,
              has_quick_action: false,
              created_at: 'Baru saja',
            });
          }
        });
      }
    } catch (sErr) {
      console.warn('Stock alert check fallback:', sErr);
    }

    // 6. Ambil master produk untuk mendapatkan data harga modal & jual terkini (sinkron real-time dengan halaman Barang)
    let masterProductsQuery = supabase.from('products').select('id, name, default_unit');
    if (userId) {
      masterProductsQuery = masterProductsQuery.eq('user_id', userId);
    }
    const { data: masterProducts } = await masterProductsQuery;

    // Build cost map from expense transactions
    const prodCostMap: Record<string, { totalCost: number; totalQty: number; latestCost: number; latestCostDate: string }> = {};
    const prodSalesMap: Record<string, { id: string; name: string; totalRevenue: number; totalQty: number; profit: number; margin: number; latestSellingPrice: number; latestSellingDate: string }> = {};

    allTx.forEach((tx) => {
      const txDate = tx.transaction_date || '';
      if (tx.type === 'expense') {
        const itemsList = tx.transaction_items || tx.items || [];
        itemsList.forEach((it: any) => {
          const pId = it.product_id || it.products?.id;
          const pName = it.products?.name || it.product_name || 'Lainnya';
          const pKey = pId || pName.toLowerCase();
          const q = Number(it.quantity) || 1;
          const p = Number(it.unit_price) || (tx.total_amount ? tx.total_amount / q : 0);
          if (!prodCostMap[pKey]) {
            prodCostMap[pKey] = { totalCost: 0, totalQty: 0, latestCost: p, latestCostDate: txDate };
          }
          prodCostMap[pKey].totalCost += p * q;
          prodCostMap[pKey].totalQty += q;
          if (p > 0 && (!prodCostMap[pKey].latestCostDate || txDate >= prodCostMap[pKey].latestCostDate)) {
            prodCostMap[pKey].latestCost = p;
            prodCostMap[pKey].latestCostDate = txDate;
          }
        });
      }
    });

    allTx.forEach((tx) => {
      const txDate = tx.transaction_date || '';
      if (tx.type === 'income') {
        const itemsList = tx.transaction_items || tx.items || [];
        itemsList.forEach((it: any) => {
          const pId = it.product_id || it.products?.id;
          const pName = it.products?.name || it.product_name || 'Lainnya';
          const pKey = pId || pName.toLowerCase();
          const q = Number(it.quantity) || 1;
          const sellPrice = Number(it.unit_price) || (tx.total_amount ? tx.total_amount / q : 0);
          const revenue = q * sellPrice;

          const costObj = prodCostMap[pKey] || prodCostMap[pName.toLowerCase()];
          const unitCost = costObj?.latestCost || (costObj && costObj.totalQty > 0 ? costObj.totalCost / costObj.totalQty : 0);
          // Hitung profit hanya jika ada data modal nyata
          const profit = unitCost > 0 && unitCost < sellPrice ? Math.max(0, revenue - (q * unitCost)) : 0;

          if (!prodSalesMap[pKey]) {
            prodSalesMap[pKey] = {
              id: pId || pKey,
              name: pName,
              totalRevenue: 0,
              totalQty: 0,
              profit: 0,
              margin: 0,
              latestSellingPrice: sellPrice,
              latestSellingDate: txDate,
            };
          }
          prodSalesMap[pKey].totalRevenue += revenue;
          prodSalesMap[pKey].totalQty += q;
          prodSalesMap[pKey].profit += profit;

          if (sellPrice > 0 && (!prodSalesMap[pKey].latestSellingDate || txDate >= prodSalesMap[pKey].latestSellingDate)) {
            prodSalesMap[pKey].latestSellingPrice = sellPrice;
            prodSalesMap[pKey].latestSellingDate = txDate;
          }
        });
      }
    });

    // Hitung margin terkini berdasarkan harga jual paling mutakhir dan harga modal paling mutakhir
    Object.values(prodSalesMap).forEach((item) => {
      const pKey = item.id;
      const masterProd = masterProducts?.find(p => p?.id === pKey || (p?.name && item?.name && p.name.toLowerCase() === item.name.toLowerCase()));
      const localOverride = localProductsOverride.find(p => p?.id === pKey || (p?.name && item?.name && p.name.toLowerCase() === item.name.toLowerCase()));
      
      const costObj = prodCostMap[pKey] || prodCostMap[item.name.toLowerCase()];
      
      // Override from frontend if available, else master, else transaction history
      const masterCost = (masterProd as any)?.cost_price;
      const masterSelling = (masterProd as any)?.selling_price;

      const currentCost = (localOverride?.cost_price && localOverride.cost_price > 0)
        ? localOverride.cost_price
        : (masterCost && masterCost > 0
            ? masterCost 
            : (costObj?.latestCost || (costObj && costObj.totalQty > 0 ? costObj.totalCost / costObj.totalQty : 0)));
        
      const currentSelling = (localOverride?.selling_price && localOverride.selling_price > 0)
        ? localOverride.selling_price
        : (masterSelling && masterSelling > 0
            ? masterSelling
            : item.latestSellingPrice);

      if (currentSelling > 0 && currentCost > 0) {
        // Gunakan margin harga terkini jika tersedia (sinkron dengan harga yang baru diubah user)
        item.margin = Math.round(((currentSelling - currentCost) / currentSelling) * 100);
      } else if (item.totalRevenue > 0) {
        item.margin = Math.round((item.profit / item.totalRevenue) * 100);
      } else {
        // Tidak ada data modal maupun penjualan — biarkan 0, jangan hardcode
        item.margin = 0;
      }
    });

    const analyzedProducts = Object.values(prodSalesMap);
    // 7. Hitung insight bisnis komprehensif dari data nyata
    // - Rata-rata penjualan harian 7 hari terakhir (di luar hari ini)
    let sumIncome7d = 0;
    let daysWithDataCount = 0;
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dStr = d.toISOString().split('T')[0];
      const s = calculateFinancialSummary(allTx, dStr);
      sumIncome7d += s.income;
      if (s.income > 0) daysWithDataCount++;
    }
    const avgDailyIncome7d = daysWithDataCount > 0 ? Math.round(sumIncome7d / daysWithDataCount) : Math.round(sumIncome7d / 7);

    let growthText = '';
    if (todayIncome > 0 && avgDailyIncome7d > 0) {
      const diffPct = Math.round(((todayIncome - avgDailyIncome7d) / avgDailyIncome7d) * 100);
      if (diffPct > 0) {
        growthText = `Penjualan hari ini naik ${diffPct}% dibanding rata-rata 7 hari terakhir.`;
      } else if (diffPct < 0) {
        growthText = `Penjualan hari ini ${Math.abs(diffPct)}% di bawah rata-rata 7 hari terakhir.`;
      } else {
        growthText = `Penjualan hari ini stabil setara rata-rata 7 hari terakhir.`;
      }
    } else if (todayIncome > 0 && yesterdaySummary.income > 0) {
      const diffPct = Math.round(((todayIncome - yesterdaySummary.income) / yesterdaySummary.income) * 100);
      if (diffPct > 0) {
        growthText = `Penjualan hari ini naik ${diffPct}% dibanding kemarin.`;
      } else if (diffPct < 0) {
        growthText = `Penjualan hari ini ${Math.abs(diffPct)}% di bawah kemarin.`;
      } else {
        growthText = `Penjualan hari ini sama dengan kemarin.`;
      }
    } else if (todayIncome > 0) {
      growthText = `Penjualan hari ini tercatat Rp${todayIncome.toLocaleString('id-ID')} dengan ${todaySummary.txCount} transaksi.`;
    }

    // Identifikasi produk paling menguntungkan & produk dengan margin tertekan
    const prodsWithSales = analyzedProducts.filter((p) => p.totalRevenue > 0);
    prodsWithSales.sort((a, b) => b.margin - a.margin || b.profit - a.profit);

    const belowThresholdProducts = prodsWithSales.filter((p) => p.margin < threshold);
    const mostProfitableItem = prodsWithSales.length > 0 ? prodsWithSales[0] : null;
    const leastProfitableItem = belowThresholdProducts.length > 0
      ? belowThresholdProducts[0]
      : (prodsWithSales.length > 1 && prodsWithSales[prodsWithSales.length - 1].margin < 25
          ? prodsWithSales[prodsWithSales.length - 1]
          : null);

    const hasTodayData = todaySummary.txCount > 0 || todayIncome > 0;
    const hasHistoricalData = allTx.length > 0;

    // Identifikasi stok menipis nyata dari lokal maupun DB
    let topStockAlert: { name: string; remaining: number; unit: string } | null = null;
    if (localProductsOverride && localProductsOverride.length > 0) {
      const lowLoc = localProductsOverride.find((p: any) => p && typeof p.remaining_stock === 'number' && p.remaining_stock <= 5);
      if (lowLoc) {
        topStockAlert = {
          name: lowLoc.name,
          remaining: Number(lowLoc.remaining_stock),
          unit: lowLoc.unit || 'kg',
        };
      }
    }
    if (!topStockAlert && lowStockSignals.length > 0) {
      const s0 = lowStockSignals[0];
      // Cari data remaining dari prodMap yang sudah dihitung sebelumnya
      const batchProdMap: Record<string, { name: string; unit: string; initial: number; remaining: number }> = {};
      try {
        (batches || []).forEach((b: any) => {
          const pId = b.product_id;
          if (!batchProdMap[pId]) {
            batchProdMap[pId] = { name: b.products?.name || 'Produk', unit: b.unit || 'kg', initial: 0, remaining: 0 };
          }
          batchProdMap[pId].initial += Number(b.initial_quantity || 0);
          if (b.status === 'active') batchProdMap[pId].remaining += Number(b.remaining_quantity || 0);
        });
      } catch (_) {}
      const matchedProd = Object.values(batchProdMap).find(p => p.name === s0.product_name);
      topStockAlert = {
        name: s0.product_name,
        remaining: matchedProd ? Math.round(matchedProd.remaining * 10) / 10 : 0,
        unit: matchedProd?.unit || 'unit',
      };
    }

    let recommendationText = '';
    if (topStockAlert) {
      recommendationText = `Segera kulakan stok ${topStockAlert.name} karena tersisa ${topStockAlert.remaining} ${topStockAlert.unit} agar tidak kehabisan saat pembeli datang.`;
    } else if (leastProfitableItem && leastProfitableItem.margin < threshold) {
      recommendationText = `Margin ${leastProfitableItem.name} (${leastProfitableItem.margin}%) di bawah batas aman ${threshold}%. Sesuaikan harga jual atau tawar harga beli supplier.`;
    } else if (mostProfitableItem && mostProfitableItem.margin >= threshold) {
      recommendationText = `Pertahankan stok ${mostProfitableItem.name} karena performanya sedang bagus dan memberikan kontribusi keuntungan tertinggi.`;
    } else if (todayIncome > 0) {
      recommendationText = `Pertahankan ritme penjualan hari ini dan terus catat transaksi masuk serta pengeluaran modal agar pembukuan rapi.`;
    } else {
      recommendationText = `Mulai catat transaksi penjualan atau belanja stok hari ini untuk memantau performa usaha secara real-time.`;
    }

    let primaryInsight: any = null;

    if (leastProfitableItem && leastProfitableItem.margin < threshold) {
      primaryInsight = {
        id: `real-alert-${leastProfitableItem.id}`,
        product_id: leastProfitableItem.id,
        product_name: leastProfitableItem.name,
        severity: 'yellow',
        message: `Margin ${leastProfitableItem.name} (${leastProfitableItem.margin}%) saat ini di bawah batas aman ${threshold}%. Pertimbangkan menyesuaikan harga jual atau kurangi harga beli modal.`,
        headline: growthText || `Margin ${leastProfitableItem.name} perlu perhatian khusus.`,
        growth_text: growthText,
        most_profitable: mostProfitableItem ? {
          name: mostProfitableItem.name,
          margin: mostProfitableItem.margin,
          profit: mostProfitableItem.profit,
        } : null,
        least_profitable: {
          name: leastProfitableItem.name,
          margin: leastProfitableItem.margin,
        },
        stock_alert: topStockAlert,
        recommendation: recommendationText,
        has_quick_action: true,
        created_at: 'Baru saja',
      };
    } else if (hasTodayData) {
      primaryInsight = {
        id: 'today-healthy-status',
        severity: todayMargin < threshold && todayIncome > 0 ? 'yellow' : 'green',
        product_name: mostProfitableItem?.name,
        message: growthText || `${activeProfile.owner_name}, performa keuangan toko hari ini terpantau sehat dengan margin ${todayMargin}%.`,
        headline: growthText || `Keuangan toko hari ini tercatat dengan baik.`,
        growth_text: growthText,
        most_profitable: mostProfitableItem ? {
          name: mostProfitableItem.name,
          margin: mostProfitableItem.margin,
          profit: mostProfitableItem.profit,
        } : null,
        least_profitable: null,
        stock_alert: topStockAlert,
        recommendation: recommendationText,
        has_quick_action: !!mostProfitableItem,
        created_at: 'Baru saja',
      };
    } else if (hasHistoricalData) {
      primaryInsight = {
        id: 'no-today-data',
        severity: 'green',
        product_name: mostProfitableItem?.name,
        message: `Belum ada transaksi penjualan tercatat hari ini. Catat penjualan Anda sekarang agar keuntungan dihitung otomatis.`,
        headline: mostProfitableItem
          ? `Produk andalan Anda: ${mostProfitableItem.name} (Margin ${mostProfitableItem.margin}%).`
          : `Siap mencatat aktivitas kios hari ini?`,
        growth_text: '',
        most_profitable: mostProfitableItem ? {
          name: mostProfitableItem.name,
          margin: mostProfitableItem.margin,
          profit: mostProfitableItem.profit,
        } : null,
        least_profitable: null,
        stock_alert: topStockAlert,
        recommendation: recommendationText,
        has_quick_action: false,
        created_at: 'Baru saja',
      };
    } else {
      primaryInsight = {
        id: 'welcome-status',
        severity: 'green',
        message: `Selamat datang di VokaSync, ${activeProfile.owner_name}! Mulai catat transaksi penjualan atau belanja stok untuk melihat analisa keuangan otomatis.`,
        headline: `Selamat datang di VokaSync!`,
        growth_text: '',
        most_profitable: null,
        least_profitable: null,
        stock_alert: null,
        recommendation: `Coba gunakan tombol mikrofon di menu Catat untuk mencatat transaksi jualan atau belanja dengan suara santai.`,
        has_quick_action: false,
        created_at: 'Baru saja',
      };
    }

    // Combine low stock signals and general business signals
    const allSignals = [...lowStockSignals, ...(insights || [])];

    return NextResponse.json(
      {
        success: true,
        profile,
        metrics: {
          today_income: todayIncome,
          today_income_change: todayIncomeChange,
          today_expense: todayExpense,
          today_expense_change: todayExpenseChange,
          today_profit: todayGrossProfit,
          today_profit_change: todayProfitChange,
          today_margin: todayMargin,
          today_margin_change: todayMarginChange,
        },
        trendData: trendData.length > 0 ? trendData : [],
        analysis_period: finalPeriod,
        primaryInsight,
        signals: allSignals,
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('GET /api/insights error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
