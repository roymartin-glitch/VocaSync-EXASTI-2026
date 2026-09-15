'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Receipt,
  TrendingUp,
  Percent,
  Share2,
  FileText,
  Coins,
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { AdvisorCard } from '@/components/dashboard/AdvisorCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { StudioModal } from '@/components/studio/StudioModal';
import { calculateFinancialSummary } from '@/lib/calculations/financial';
import { AIInsight, DashboardMetrics, Transaction, TrendDayData } from '@/types';

export default function DashboardPage() {
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    today_income: 0,
    today_income_change: 0,
    today_expense: 0,
    today_expense_change: 0,
    today_profit: 0,
    today_profit_change: 0,
    today_margin: 0,
    today_margin_change: 0,
  });
  const [trendData, setTrendData] = useState<TrendDayData[]>([]);
  const [primaryInsight, setPrimaryInsight] = useState<AIInsight | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [userName, setUserName] = useState('Pedagang');
  const [businessName, setBusinessName] = useState('Toko Anda');
  const [analysisPeriod, setAnalysisPeriod] = useState<string>('7d');

  const fetchDashboardData = async () => {
    try {
      const savedPeriod = typeof window !== 'undefined'
        ? (localStorage.getItem('vokasync_analysis_period') || '7d')
        : '7d';
      setAnalysisPeriod(savedPeriod);

      // Parallelize insights and transactions fetching for instant display
      const [insightsResult, txResult] = await Promise.allSettled([
        fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysis_period: savedPeriod,
            localProducts: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(`vokasync_products_${localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest')}`) || '[]') : [],
            localTxs: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(`vokasync_local_txs_${localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest')}`) || '[]') : []
          })
        }).then((r) => r.json()),
        fetch('/api/transactions').then((r) => r.json()),
      ]);

      let newMetrics: DashboardMetrics | null = null;
      let newTrend: TrendDayData[] | null = null;
      let newInsight: AIInsight | null = null;
      let newTx: Transaction[] = [];

      if (txResult.status === 'fulfilled' && txResult.value.success) {
        let items = [...(txResult.value.data || [])].filter((tx: any) => tx.items && tx.items.length > 0);
        if (typeof window !== 'undefined') {
          try {
            const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
            const rawProds = localStorage.getItem(`vokasync_products_${userKey}`);
            const activeProds: any[] | null = rawProds ? JSON.parse(rawProds) : null;
            const activeProdNames = activeProds ? new Set(activeProds.map((p: any) => p.name.toLowerCase())) : null;
            const activeProdIds = activeProds ? new Set(activeProds.map((p: any) => p.id)) : null;

            const localTxs = JSON.parse(localStorage.getItem(`vokasync_local_txs_${userKey}`) || '[]');
            const existingIds = new Set(items.map((t: any) => t.id));
            for (const l of localTxs) {
              if (l && l.id && !existingIds.has(l.id)) {
                if (l.user_id && l.user_id === userKey && l.items && l.items.length > 0) {
                  if (activeProds !== null) {
                    const matches = l.items.some((it: any) => {
                      return (it.product_id && activeProdIds?.has(it.product_id)) ||
                             (it.product_name && activeProdNames?.has(it.product_name.toLowerCase()));
                    });
                    if (!matches) continue;
                  }
                  items.unshift(l);
                  existingIds.add(l.id);
                }
              }
            }

            if (activeProds !== null) {
              items = items.filter((t: any) => {
                if (!t.items || t.items.length === 0) return false;
                return t.items.some((it: any) => {
                  return (it.product_id && activeProdIds?.has(it.product_id)) ||
                         (it.product_name && activeProdNames?.has(it.product_name.toLowerCase()));
                });
              });
            }
          } catch (_) {}
        }
        setTransactions(items);
        newTx = items;
      }

      // Compute client-side financial summary for today's synchronization guarantee
      const todayDateStr = new Date().toISOString().split('T')[0];
      const clientCalc = calculateFinancialSummary(newTx, todayDateStr);

      if (insightsResult.status === 'fulfilled' && insightsResult.value.success) {
        const data = insightsResult.value;
        if (data.metrics) {
          const syncedMetrics: DashboardMetrics = {
            today_income: data.metrics.today_income || clientCalc.income,
            today_income_change: data.metrics.today_income_change ?? 0,
            today_expense: data.metrics.today_income > 0 ? (data.metrics.today_expense ?? clientCalc.expense) : clientCalc.expense,
            today_expense_change: data.metrics.today_expense_change ?? 0,
            today_profit: data.metrics.today_profit || clientCalc.profit,
            today_profit_change: data.metrics.today_profit_change ?? 0,
            today_margin: data.metrics.today_margin || clientCalc.margin,
            today_margin_change: data.metrics.today_margin_change ?? 0,
          };
          setMetrics(syncedMetrics);
          newMetrics = syncedMetrics;
        }
        if (data.analysis_period) {
          setAnalysisPeriod(data.analysis_period);
          if (typeof window !== 'undefined') {
            localStorage.setItem('vokasync_analysis_period', data.analysis_period);
          }
        }
        if (data.trendData) {
          setTrendData(data.trendData);
          newTrend = data.trendData;
        }
        if (data.primaryInsight) {
          setPrimaryInsight(data.primaryInsight);
          newInsight = data.primaryInsight;
        }
      } else {
        newMetrics = {
          today_income: clientCalc.income,
          today_income_change: 0,
          today_expense: clientCalc.expense,
          today_expense_change: 0,
          today_profit: clientCalc.profit,
          today_profit_change: 0,
          today_margin: clientCalc.margin,
          today_margin_change: 0,
        };
        setMetrics(newMetrics);
      }

      // Persist to session cache for 0ms instant display next time
      try {
        const userKey = typeof window !== 'undefined' ? (localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest')) : 'guest';
        sessionStorage.setItem(
          `vokasync_dash_cache_${userKey}`,
          JSON.stringify({
            metrics: newMetrics,
            trendData: newTrend,
            primaryInsight: newInsight,
            transactions: newTx,
          })
        );
      } catch (_) {}
    } catch (e) {
      console.warn('Dashboard live fetch fallback to seed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Instant 0ms cache hydrate
    try {
      sessionStorage.removeItem('vokasync_dash_cache'); // purge legacy unscoped
      const userKey = typeof window !== 'undefined' ? (localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest')) : 'guest';
      const cached = sessionStorage.getItem(`vokasync_dash_cache_${userKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.metrics) setMetrics(parsed.metrics);
        if (parsed.trendData?.length) setTrendData(parsed.trendData);
        if (parsed.primaryInsight) setPrimaryInsight(parsed.primaryInsight);
        if (parsed.transactions) setTransactions(parsed.transactions);
        setIsLoading(false);
      }

      if (typeof window !== 'undefined') {
        setUserName(localStorage.getItem('vokasync_owner_name') || 'Pedagang');
        setBusinessName(localStorage.getItem('vokasync_business_name') || 'Toko Anda');
      }
    } catch (_) {}

    // 2. Fetch fresh data in background
    fetchDashboardData();

    // 3. Listen to settings changed event for real-time reactivity across pages
    const handleSettingsChanged = (e?: any) => {
      if (e?.detail?.analysis_period) {
        setAnalysisPeriod(e.detail.analysis_period);
        if (typeof window !== 'undefined') {
          localStorage.setItem('vokasync_analysis_period', e.detail.analysis_period);
        }
      }
      const userKey = typeof window !== 'undefined'
        ? (localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest'))
        : 'guest';
      sessionStorage.removeItem(`vokasync_dash_cache_${userKey}`);
      sessionStorage.removeItem('vokasync_dash_cache');
      fetchDashboardData();
    };

    window.addEventListener('vokasync-settings-changed', handleSettingsChanged);
    window.addEventListener('vokasync-transaction-saved', handleSettingsChanged);
    window.addEventListener('vokasync-products-changed', handleSettingsChanged);
    window.addEventListener('storage', handleSettingsChanged);
    return () => {
      window.removeEventListener('vokasync-settings-changed', handleSettingsChanged);
      window.removeEventListener('vokasync-transaction-saved', handleSettingsChanged);
      window.removeEventListener('vokasync-products-changed', handleSettingsChanged);
      window.removeEventListener('storage', handleSettingsChanged);
    };
  }, []);

  const todayDateStr = typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '';
  const calculatedToday = useMemo(() => {
    return calculateFinancialSummary(transactions, todayDateStr);
  }, [transactions, todayDateStr]);

  const displayIncome = metrics.today_income || calculatedToday.income || 0;
  const displayExpense = metrics.today_income > 0 ? (metrics.today_expense ?? calculatedToday.expense) : calculatedToday.expense;
  const displayProfit = metrics.today_profit || calculatedToday.profit || 0;
  const displayMargin = metrics.today_margin || calculatedToday.margin || 0;

  // Hitung harga jual dan unit nyata dari transaksi untuk StudioModal
  const studioProductData = useMemo(() => {
    const targetName = primaryInsight?.product_name;
    if (!targetName || !transactions.length) return { price: 0, unit: 'kg' };
    const normTarget = targetName.toLowerCase();
    for (const tx of transactions) {
      if (tx.type !== 'income') continue;
      const items = (tx as any).transaction_items || (tx as any).items || [];
      for (const it of items) {
        const itName = (it.product_name || it.products?.name || '').toLowerCase();
        if (itName && itName.includes(normTarget.split(' ')[0])) {
          return {
            price: Math.round(Number(it.unit_price) || 0),
            unit: it.unit || 'kg',
          };
        }
      }
    }
    return { price: 0, unit: 'kg' };
  }, [primaryInsight, transactions]);

  const handleShareWhatsAppRekap = () => {
    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const income = displayIncome.toLocaleString('id-ID');
    const expense = displayExpense.toLocaleString('id-ID');
    const profit = displayProfit.toLocaleString('id-ID');
    const margin = displayMargin.toLocaleString('id-ID');

    const message = `*Rekap Keuangan Kios*\n${todayStr}\n\n• *Uang Masuk:* Rp${income}\n• *Uang Keluar:* Rp${expense}\n• *Laba Kotor:* Rp${profit} (${margin}%)\n\n_Dicatat dengan VokaSync — Pembukuan Pedagang Pasar & UMKM._`;

    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  return (
    <div className="space-y-8">


      {/* Ringkasan Hari Ini Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Ringkasan Hari Ini
          </h2>

          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <Link
              href="/eksperimen"
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-300 font-bold text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-2xs active:scale-95 transition-all text-center"
              title="Coba & Pantau Prediksi Keuntungan"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5] flex-shrink-0" />
              <span className="truncate">Coba & Pantau</span>
            </Link>

            <Link
              href="/laporan"
              className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-emerald-50/70 text-emerald-900 border border-emerald-300 hover:border-emerald-500 font-bold text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-2xs active:scale-95 transition-all text-center"
            >
              <FileText className="w-3.5 h-3.5 text-[#00875A] stroke-[2.5] flex-shrink-0" />
              <span className="truncate">Laporan</span>
            </Link>

            <button
              type="button"
              onClick={handleShareWhatsAppRekap}
              className="inline-flex items-center justify-center gap-1.5 bg-[#00875A] hover:bg-[#059669] text-white font-bold text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer border border-emerald-600/80 text-center"
            >
              <Share2 className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" />
              <span className="truncate">Kirim WA</span>
            </button>
          </div>
        </div>

        {/* 4 Accessible Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Card 1: Uang Masuk (Emerald) */}
          <MetricCard
            title="Uang Masuk"
            description="Total penjualan hari ini"
            value={`Rp${displayIncome.toLocaleString('id-ID')}`}
            changePercent={metrics.today_income_change ?? 0}
            variant="emerald"
            icon={<Wallet className="w-6 h-6 stroke-[2.5]" />}
          />

          {/* Card 2: Uang Keluar (White) */}
          <MetricCard
            title="Uang Keluar"
            description="Total belanja & biaya"
            value={`Rp${displayExpense.toLocaleString('id-ID')}`}
            changePercent={metrics.today_expense_change ?? 0}
            variant="white"
            isExpense={true}
            icon={<Receipt className="w-6 h-6 text-emerald-800 stroke-[2.5]" />}
          />

          {/* Card 3: Laba Kotor (Lime) */}
          <MetricCard
            title="Laba Kotor"
            description="Selisih penjualan & belanja"
            value={`Rp${displayProfit.toLocaleString('id-ID')}`}
            changePercent={metrics.today_profit_change ?? 0}
            variant="lime"
            icon={<TrendingUp className="w-6 h-6 stroke-[2.5]" />}
          />

          {/* Card 4: Persen Untung (White) */}
          <MetricCard
            title="Persen Untung"
            description="Untung dari setiap penjualan"
            value={`${displayMargin.toLocaleString('id-ID')}%`}
            changePercent={metrics.today_margin_change ?? 0}
            variant="white"
            icon={<Percent className="w-6 h-6 text-emerald-800 stroke-[2.5]" />}
          />
        </div>
      </section>

      {/* Bottom Section: Charts, Transactions & Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Trend Chart & Recent Transactions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Grafik {analysisPeriod === '30d' ? '30 Hari Terakhir' : analysisPeriod === '3m' ? '3 Bulan Terakhir' : '7 Hari Terakhir'}
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Bandingkan uang masuk dan uang keluar ({analysisPeriod === '30d' ? '30 hari' : analysisPeriod === '3m' ? '3 bulan' : '7 hari'})
              </p>
            </div>

            <TrendChart data={trendData} />
          </div>

          <RecentTransactions transactions={transactions} />
        </div>

        {/* Right Column: Saran untuk Anda */}
        <div className="lg:col-span-5">
          <AdvisorCard
            insight={primaryInsight}
            onOpenStudio={() => setIsStudioOpen(true)}
          />
        </div>
      </div>

      {/* Studio Promosi Modal */}
      <StudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        productName={primaryInsight?.product_name || 'Produk Unggulan'}
        price={studioProductData.price}
        unit={studioProductData.unit}
      />
    </div>
  );
}
