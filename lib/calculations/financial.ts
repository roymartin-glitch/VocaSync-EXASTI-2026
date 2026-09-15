import { ProductActionCategory, SeverityLevel, TrendDayData } from '@/types';

export function calculateMargin(costPrice: number, sellingPrice: number): number {
  if (!sellingPrice || sellingPrice <= 0) return 0;
  if (!costPrice || costPrice <= 0) return 0; // Tidak bisa hitung margin tanpa harga modal — kembalikan 0, bukan 100%
  const margin = ((sellingPrice - costPrice) / sellingPrice) * 100;
  return Math.round(margin * 10) / 10;
}

export function determineActionCategory(
  margin: number,
  threshold: number = 20
): ProductActionCategory {
  if (margin >= 35) return 'dorong';
  if (margin >= threshold) return 'pertahankan';
  if (margin >= 10) return 'perbaiki';
  return 'kurangi';
}

export function determineSeverity(
  margin: number,
  threshold: number = 20
): { severity: SeverityLevel; hasQuickAction: boolean } {
  if (margin < threshold) {
    return { severity: 'red', hasQuickAction: true };
  }
  if (margin < threshold + 5) {
    return { severity: 'yellow', hasQuickAction: false };
  }
  return { severity: 'green', hasQuickAction: false };
}

export interface FinancialSummaryTotals {
  income: number;
  expense: number;
  profit: number;
  margin: number;
  txCount: number;
}

/**
 * Menghitung ringkasan keuangan (Omzet, Belanja, Untung Bersih, Margin)
 * yang 100% konsisten antara Beranda, Laporan, dan API Insights.
 */
export function calculateFinancialSummary(
  transactions: any[],
  dateFilter?: string
): FinancialSummaryTotals {
  // 1. Kumpulkan harga modal kulakan dari semua transaksi belanja/expense
  const costMap = new Map<string, { totalExpense: number; expenseQty: number; latestUnitCost: number }>();
  transactions.forEach((tx) => {
    if (tx.type === 'expense') {
      const items = tx.transaction_items || tx.items || [];
      items.forEach((item: any) => {
        const pName = item.product_name || item.products?.name || 'Lainnya';
        const key = (item.product_id || pName).toLowerCase();
        const nameKey = pName.toLowerCase();
        const q = Number(item.quantity) || 1;
        const p = Number(item.unit_price) || (tx.total_amount ? tx.total_amount / q : 0);
        const current = costMap.get(key) || costMap.get(nameKey) || { totalExpense: 0, expenseQty: 0, latestUnitCost: p };
        current.totalExpense += p * q;
        current.expenseQty += q;
        current.latestUnitCost = p;
        costMap.set(key, current);
        costMap.set(nameKey, current);
      });
    }
  });

  // 2. Filter transaksi sesuai tanggal (jika dateFilter diberikan)
  const filtered = dateFilter
    ? transactions.filter((tx) => (tx.transaction_date || '').split('T')[0] === dateFilter)
    : transactions;

  let totalIncome = 0;
  let totalExpense = 0;
  let totalProfit = 0;

  filtered.forEach((tx) => {
    const items = tx.transaction_items || tx.items || [];
    const txTotal = Number(tx.total_amount) || 0;

    if (tx.type === 'income') {
      if (items.length > 0) {
        items.forEach((item: any) => {
          const pName = item.product_name || item.products?.name || 'Lainnya';
          const key = (item.product_id || pName).toLowerCase();
          const nameKey = pName.toLowerCase();
          const q = Number(item.quantity) || 1;
          const sellPrice = Number(item.unit_price) || (txTotal ? txTotal / q : 0);
          const inc = q * sellPrice || txTotal || 0;
          totalIncome += inc;

          const costObj = costMap.get(key) || costMap.get(nameKey);
          const unitCost = costObj?.latestUnitCost || (costObj && costObj.expenseQty > 0 ? costObj.totalExpense / costObj.expenseQty : 0);
          // Hanya hitung profit jika data modal tersedia; jangan estimasi jika tidak ada
          if (unitCost > 0 && unitCost < sellPrice) {
            totalProfit += Math.max(0, inc - (q * unitCost));
          }
        });
      } else {
        totalIncome += txTotal;
        // Tidak ada item detail: catat pemasukan, tapi profit tidak bisa dihitung tanpa data modal
      }
    } else if (tx.type === 'expense') {
      if (items.length > 0) {
        items.forEach((item: any) => {
          totalExpense += (Number(item.quantity) || 1) * (Number(item.unit_price) || 0);
        });
      } else {
        totalExpense += txTotal;
      }
    }
  });

  // Jangan isi profit dengan estimasi — biarkan 0 jika data modal tidak tersedia

  const margin = totalIncome > 0 ? Number(((totalProfit / totalIncome) * 100).toFixed(1)) : 0;

  return {
    income: totalIncome,
    expense: totalExpense,
    profit: totalProfit,
    margin,
    txCount: filtered.length,
  };
}

export function buildTrendData(transactionsWithItems: any[], period: string = '7d'): TrendDayData[] {
  const days: TrendDayData[] = [];
  const now = new Date();

  let numDays = 7;
  if (period === '30d' || period === 'month') numDays = 30;
  else if (period === '3m' || period === 'quarter') numDays = 90;
  else if (period === '14d') numDays = 14;

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Buat deretan tanggal untuk periode numDays
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = dayNames[d.getDay()];
    // Jika periode lebih dari 7 hari, tampilkan tanggal (misal: "Sen, 14/09") untuk kemudahan membaca di tabel buku kas
    const dayLabel = numDays > 7
      ? `${dayOfWeek}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
      : dayOfWeek;

    days.push({
      date: dateStr,
      dayName: dayLabel,
      income: 0,
      expense: 0,
    });
  }

  // Agregasikan transaksi berdasarkan tanggal
  transactionsWithItems.forEach((tx) => {
    const txDate = (tx.transaction_date || '').split('T')[0];
    const targetDay = days.find((d) => d.date === txDate);
    if (targetDay) {
      let totalAmount = Number(tx.total_amount) || 0;
      const itemsList = tx.transaction_items || tx.items;
      if (itemsList && itemsList.length > 0) {
        totalAmount = itemsList.reduce(
          (acc: number, item: any) => acc + (Number(item.quantity) * Number(item.unit_price) || 0),
          0
        );
      }
      if (tx.type === 'income') {
        targetDay.income += totalAmount;
      } else if (tx.type === 'expense') {
        targetDay.expense += totalAmount;
      }
    }
  });

  return days;
}

export function build7DayTrend(transactionsWithItems: any[]): TrendDayData[] {
  return buildTrendData(transactionsWithItems, '7d');
}

export interface FIFOConsumptionResult {
  weightedCostPrice: number;
  totalCostConsumed: number;
  quantityConsumed: number;
  unfulfilledQuantity: number;
  batchDeductions: {
    batchId: string;
    deductedQty: number;
    newRemainingQty: number;
    status: 'active' | 'depleted';
    costPrice: number;
  }[];
}

/**
 * Mengambil batch aktif terlama (FIFO) untuk produk terkait,
 * menghitung modal rata-rata tertimbang dan daftar pengurangan sisa stok per batch.
 */
export function getFIFOCostPrice(
  productId: string,
  quantitySold: number,
  activeBatches: any[]
): FIFOConsumptionResult {
  const productBatches = (activeBatches || [])
    .filter((b) => b.product_id === productId && b.status === 'active' && Number(b.remaining_quantity) > 0)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let neededQty = quantitySold;
  let totalCost = 0;
  let consumedQty = 0;
  const deductions: FIFOConsumptionResult['batchDeductions'] = [];

  for (const batch of productBatches) {
    if (neededQty <= 0) break;
    const remaining = Number(batch.remaining_quantity);
    const takeQty = Math.min(neededQty, remaining);
    const newRemaining = remaining - takeQty;
    const cost = Number(batch.cost_price);

    totalCost += takeQty * cost;
    consumedQty += takeQty;
    neededQty -= takeQty;

    deductions.push({
      batchId: batch.id,
      deductedQty: takeQty,
      newRemainingQty: Math.max(0, Math.round(newRemaining * 100) / 100),
      status: newRemaining <= 0 ? 'depleted' : 'active',
      costPrice: cost,
    });
  }

  const unfulfilledQty = Math.max(0, neededQty);
  let finalWeightedCost = consumedQty > 0 ? Math.round((totalCost / consumedQty) * 100) / 100 : 0;

  // Jika stok batch kurang dari jumlah jual, pro-rate sisa dengan harga batch terakhir
  if (unfulfilledQty > 0 && productBatches.length > 0) {
    const lastCost = Number(productBatches[productBatches.length - 1].cost_price);
    totalCost += unfulfilledQty * lastCost;
    finalWeightedCost = Math.round((totalCost / quantitySold) * 100) / 100;
  }

  return {
    weightedCostPrice: finalWeightedCost,
    totalCostConsumed: totalCost,
    quantityConsumed: consumedQty,
    unfulfilledQuantity: unfulfilledQty,
    batchDeductions: deductions,
  };
}

/**
 * Menghitung total sisa stok dari semua batch aktif untuk produk tertentu.
 */
export function calculateStockRemaining(productId: string, batches: any[]): number {
  return (batches || [])
    .filter((b) => b.product_id === productId && b.status === 'active')
    .reduce((sum, b) => sum + Number(b.remaining_quantity || 0), 0);
}

/**
 * Menentukan apakah sisa stok berada di bawah ambang batas.
 * Mendukung ambang kuantitas fisik (misal: sisa 1 atau 2 kg/pcs) maupun persentase.
 */
export function isStockLow(
  remainingQty: number,
  initialOrReferenceQty: number,
  threshold: number = 2
): boolean {
  if (remainingQty <= 0) return true;
  // Jika ambang batas berupa kuantitas fisik kecil (misal: <= 15 kg/pcs), bandingkan langsung sisa stok
  if (threshold <= 15) {
    return remainingQty <= threshold;
  }
  // Jika persentase (misal: 20%)
  if (!initialOrReferenceQty || initialOrReferenceQty <= 0) {
    return remainingQty <= 2;
  }
  const percentage = (remainingQty / initialOrReferenceQty) * 100;
  return percentage <= threshold;
}

/**
 * Normalisasi nama produk untuk perbandingan ramah pedagang pasar
 */
export function normalizeProductName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\b(cabe|cabee)\b/g, 'cabai')
    .replace(/\b(bwg|bwang)\b/g, 'bawang')
    .replace(/\b(klo|kilo|kilogram)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Menghitung skor kemiripan antara dua nama produk (0.0 sampai 1.0)
 * Menggunakan kombinasi token overlap (Jaccard) dan Levenshtein distance
 */
export function calculateProductSimilarity(nameA: string, nameB: string): number {
  const normA = normalizeProductName(nameA);
  const normB = normalizeProductName(nameB);

  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  // Substring inclusion check (misal "bawang merah" di dalam "bawang merah brebes")
  if (normA.includes(normB) || normB.includes(normA)) {
    const minLen = Math.min(normA.length, normB.length);
    const maxLen = Math.max(normA.length, normB.length);
    const substringScore = minLen / maxLen;
    return Math.max(0.75, substringScore);
  }

  // Token Jaccard similarity
  const tokensA = normA.split(' ').filter(Boolean);
  const tokensB = normB.split(' ').filter(Boolean);
  const setB = new Set(tokensB);

  const intersection = tokensA.filter((t) => setB.has(t));
  const union = new Set([...tokensA, ...tokensB]);
  const jaccard = union.size > 0 ? intersection.length / union.size : 0;

  if (jaccard >= 0.5) {
    return jaccard;
  }

  // Levenshtein distance untuk typo
  const m = normA.length;
  const n = normB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normA[i - 1] === normB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  const levDistance = dp[m][n];
  const maxLen = Math.max(m, n);
  const levSimilarity = maxLen > 0 ? (maxLen - levDistance) / maxLen : 0;

  return Math.max(jaccard, levSimilarity);
}

export interface SimilarProductResult {
  isExact: boolean;
  isSimilar: boolean;
  matchedProduct?: { id: string; name: string };
  similarityScore: number;
}

/**
 * Mencari apakah nama produk yang diucapkan memiliki padanan persis atau mirip
 * di daftar produk yang sudah dimiliki pedagang.
 */
export function findSimilarProduct(
  candidateName: string,
  existingProducts: Array<{ id: string; name: string }>
): SimilarProductResult {
  const normCandidate = normalizeProductName(candidateName);
  if (!normCandidate || !existingProducts || existingProducts.length === 0) {
    return { isExact: false, isSimilar: false, similarityScore: 0 };
  }

  // 1. Cek Exact Match (Persis sama setelah normalisasi)
  for (const prod of existingProducts) {
    if (normalizeProductName(prod.name) === normCandidate) {
      return {
        isExact: true,
        isSimilar: false,
        matchedProduct: prod,
        similarityScore: 1.0,
      };
    }
  }

  // 2. Cek Kemiripan Tertinggi (Fuzzy / Substring / Token overlap)
  let bestMatch: { id: string; name: string } | undefined;
  let highestScore = 0;

  for (const prod of existingProducts) {
    const score = calculateProductSimilarity(candidateName, prod.name);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = prod;
    }
  }

  // Ambang batas kemiripan ramah pedagang (>= 0.60)
  if (highestScore >= 0.60 && bestMatch) {
    return {
      isExact: false,
      isSimilar: true,
      matchedProduct: bestMatch,
      similarityScore: Math.round(highestScore * 100) / 100,
    };
  }

  return {
    isExact: false,
    isSimilar: false,
    similarityScore: Math.round(highestScore * 100) / 100,
  };
}

