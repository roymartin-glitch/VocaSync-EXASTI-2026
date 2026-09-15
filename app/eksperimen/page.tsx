'use client';

import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  RefreshCw,
  Lightbulb,
  ArrowRight,
  Plus,
  X,
  Loader2,
  TrendingUp,
  AlertCircle,
  Play,
  Check,
  Calendar,
  Sparkles,
  Pin,
  Trash2,
} from 'lucide-react';
import { Experiment } from '@/types';

export default function EksperimenPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'running' | 'completed'>('all');
  const [isNewExpModalOpen, setIsNewExpModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [deletingExpId, setDeletingExpId] = useState<string | null>(null);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [targetMargin, setTargetMargin] = useState('25');
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [isLoadingRec, setIsLoadingRec] = useState(false);

  const fetchAiRecommendations = async () => {
    setIsLoadingRec(true);
    try {
      const res = await fetch('/api/experiments/recommendations');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Double check against local catalog to guarantee deleted products never appear
        let validRecs = data.data;
        if (typeof window !== 'undefined') {
          try {
            const userKey =
              localStorage.getItem('vokasync_user_id') ||
              (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
            const localSaved = JSON.parse(
              localStorage.getItem(`vokasync_products_${userKey}`) || '[]'
            );
            if (Array.isArray(localSaved) && localSaved.length > 0) {
              const activeNames = new Set(localSaved.map((p: any) => (p.name || '').trim().toLowerCase()));
              validRecs = validRecs.filter((r: any) =>
                !r.productName || activeNames.has((r.productName || '').trim().toLowerCase())
              );
            }
          } catch (_) {}
        }

        // DEDUP: 1 produk HANYA BOLEH memiliki maksimal 1 rekomendasi strategi
        const seenProd = new Set<string>();
        const uniqueRecs: any[] = [];
        for (const r of validRecs) {
          const norm = (r.productName || '').trim().toLowerCase();
          if (norm && seenProd.has(norm)) continue;
          if (norm) seenProd.add(norm);
          uniqueRecs.push(r);
        }

        setAiRecommendations(uniqueRecs);
        try {
          sessionStorage.setItem('vokasync_exp_rec_cache', JSON.stringify({ data: uniqueRecs, ts: Date.now() }));
        } catch (_) { }
      }
    } catch (err) {
      console.warn('AI recommendations fetch failed:', err);
    } finally {
      setIsLoadingRec(false);
    }
  };

  const fetchUserProducts = async () => {
    try {
      const userKey =
        typeof window !== 'undefined'
          ? localStorage.getItem('vokasync_user_id') ||
          (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest')
          : 'guest';

      const res = await fetch('/api/product-analysis');
      const data = await res.json();

      let list = data.success && Array.isArray(data.data) ? [...data.data] : [];

      if (typeof window !== 'undefined') {
        try {
          const localSaved = JSON.parse(
            localStorage.getItem(`vokasync_products_${userKey}`) || '[]'
          );
          if (Array.isArray(localSaved) && localSaved.length > 0) {
            const localMap = new Map<string, any>(localSaved.map((lp: any) => [lp.id, lp]));
            list = list.map((sp: any) => {
              const localOverride = localMap.get(sp.id);
              if (localOverride) {
                const spSelling = Number(localOverride.selling_price ?? sp.selling_price) || 0;
                const spCost = Number(localOverride.cost_price ?? sp.cost_price) || 0;
                const spMargin =
                  spSelling > 0
                    ? Math.round(((spSelling - spCost) / spSelling) * 1000) / 10
                    : sp.margin_percentage;
                return {
                  ...sp,
                  name: localOverride.name ?? sp.name,
                  unit: localOverride.unit ?? sp.unit,
                  selling_price: spSelling,
                  cost_price: spCost,
                  margin_percentage: spMargin,
                  remaining_stock: localOverride.remaining_stock ?? sp.remaining_stock,
                };
              }
              return sp;
            });
          }
        } catch (_) { }
      }

      if (list.length > 0) {
        setUserProducts(list);
        if (!newProductName) {
          setNewProductName(list[0].name);
        }
      }
    } catch (_) { }
  };

  const fetchExperiments = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/experiments');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        let validExps = data.data;

        // Verify with active local products catalog: if a product was deleted, exclude its experiments
        if (typeof window !== 'undefined') {
          try {
            const userKey =
              localStorage.getItem('vokasync_user_id') ||
              (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
            const localSaved = JSON.parse(
              localStorage.getItem(`vokasync_products_${userKey}`) || '[]'
            );
            if (Array.isArray(localSaved) && localSaved.length > 0) {
              const activeNames = new Set(localSaved.map((p: any) => (p.name || '').trim().toLowerCase()));
              const activeIds = new Set(localSaved.map((p: any) => p.id));
              validExps = validExps.filter((exp: any) => {
                if (exp.product_id && !activeIds.has(exp.product_id)) {
                  // If product id is specified but not in active products, check if name matches
                  if (exp.product_name && exp.product_name !== 'Produk Umum') {
                    return activeNames.has(exp.product_name.trim().toLowerCase());
                  }
                  return false;
                }
                if (exp.product_name && exp.product_name !== 'Produk Umum') {
                  return activeNames.has(exp.product_name.trim().toLowerCase());
                }
                return true;
              });
            }
          } catch (_) {}
        }

        setExperiments(validExps);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('vokasync_exp_cache', JSON.stringify(validExps));
          } catch (_) { }
        }
      }
    } catch (e) {
      console.warn('Experiments fetch fallback:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProducts();

    // Load AI recommendations: check cache first (max 30 min old), then fetch fresh
    if (typeof window !== 'undefined') {
      try {
        const recCache = sessionStorage.getItem('vokasync_exp_rec_cache');
        if (recCache) {
          const parsed = JSON.parse(recCache);
          const ageMs = Date.now() - (parsed.ts || 0);
          if (Array.isArray(parsed.data) && parsed.data.length > 0 && ageMs < 30 * 60 * 1000) {
            const seen = new Set<string>();
            const deduped = parsed.data.filter((r: any) => {
              const norm = (r.productName || '').trim().toLowerCase();
              if (norm && seen.has(norm)) return false;
              if (norm) seen.add(norm);
              return true;
            });
            setAiRecommendations(deduped);
          } else {
            fetchAiRecommendations();
          }
        } else {
          fetchAiRecommendations();
        }
      } catch (_) {
        fetchAiRecommendations();
      }
    } else {
      fetchAiRecommendations();
    }

    let hasCache = false;
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('vokasync_exp_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const userKey =
              localStorage.getItem('vokasync_user_id') ||
              (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
            const localSaved = JSON.parse(
              localStorage.getItem(`vokasync_products_${userKey}`) || '[]'
            );
            let validCached = parsed;
            if (Array.isArray(localSaved) && localSaved.length > 0) {
              const activeNames = new Set(localSaved.map((p: any) => (p.name || '').trim().toLowerCase()));
              const activeIds = new Set(localSaved.map((p: any) => p.id));
              validCached = parsed.filter((exp: any) => {
                if (exp.product_id && !activeIds.has(exp.product_id)) {
                  if (exp.product_name && exp.product_name !== 'Produk Umum') {
                    return activeNames.has(exp.product_name.trim().toLowerCase());
                  }
                  return false;
                }
                if (exp.product_name && exp.product_name !== 'Produk Umum') {
                  return activeNames.has(exp.product_name.trim().toLowerCase());
                }
                return true;
              });
            }
            setExperiments(validCached);
            setIsLoading(false);
            hasCache = true;
          }
        }
      } catch (_) { }
    }
    fetchExperiments(hasCache);

    const handleDataChanged = () => {
      fetchUserProducts();
      fetchExperiments(true);
      // Invalidate recommendation cache so fresh AI recs load
      try { sessionStorage.removeItem('vokasync_exp_rec_cache'); } catch (_) { }
      fetchAiRecommendations();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('vokasync-products-changed', handleDataChanged);
      window.addEventListener('vokasync-transaction-saved', handleDataChanged);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('vokasync-products-changed', handleDataChanged);
        window.removeEventListener('vokasync-transaction-saved', handleDataChanged);
      }
    };
  }, []);

  const filteredExperiments = experiments.filter((exp) => {
    if (activeTab === 'running') return exp.status === 'running';
    if (activeTab === 'completed') return exp.status === 'completed';
    return true;
  });

  const handleCompleteExperiment = async (expId: string) => {
    setCompletingId(expId);
    try {
      const res = await fetch('/api/experiments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId: expId, status: 'completed' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchExperiments();
      } else {
        alert(data.error || 'Gagal mengevaluasi eksperimen.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setCompletingId(null);
    }
  };

  const handleDeleteExperiment = async (expId: string, title: string) => {
    if (!window.confirm(`Hapus eksperimen "${title}"?`)) return;
    setDeletingExpId(expId);
    try {
      const res = await fetch(`/api/experiments?id=${expId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setExperiments((prev) => prev.filter((exp) => exp.id !== expId));
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('vokasync_exp_cache');
            sessionStorage.removeItem('vokasync_exp_rec_cache');
          } catch (_) {}
        }
      } else {
        alert(data.error || 'Gagal menghapus eksperimen.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingExpId(null);
    }
  };

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          productName: newProductName,
          targetMargin: parseFloat(targetMargin) || 20,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsNewExpModalOpen(false);
        setNewTitle('');
        fetchExperiments();
      } else {
        alert(data.error || 'Gagal membuat eksperimen.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
              <FlaskConical className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.3]" />
            </div>
            <span>Coba &amp; Pantau Hasilnya</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium max-w-2xl leading-relaxed">
            Uji coba strategi harga dan promo toko Anda berdasarkan data penjualan nyata, lalu pantau evaluasinya secara otomatis.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewExpModalOpen(true)}
          className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm px-4 sm:px-5 py-3 rounded-2xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Coba Tindakan Baru</span>
        </button>
      </div>

      {/* Alur Siklus Penasihat Bisnis VokaSync */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 self-start">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Siklus Penasihat Bisnis VokaSync</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Alur otomatis: dari data transaksi harian hingga evaluasi laba nyata
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { step: '01', title: 'Kondisi Bisnis', desc: 'Analisis laba dan stok harian', active: false },
            { step: '02', title: 'Temukan Peluang', desc: 'Temukan hal yang perlu diperbaiki', active: false },
            { step: '03', title: 'Rekomendasi', desc: 'Saran berdasarkan kondisi usaha', active: false },
            { step: '04', title: 'Coba Strategi', desc: 'Terapkan strategi pada usaha', active: false },
            { step: '05', title: 'Pantau Hasil', desc: 'Lihat perubahan setelah diterapkan', active: false },
            { step: '06', title: 'Evaluasi Hasil', desc: 'Bandingkan hasil usaha', active: false },
          ].map((item, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[78px] ${item.active
                ? 'bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white border-emerald-400/90 shadow-2xs ring-1 ring-emerald-500/20'
                : 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-200/80'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${item.active ? 'text-emerald-800' : 'text-slate-500'
                  }`}>
                  Langkah {item.step}
                </span>
                {item.active && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                )}
              </div>
              <div>
                <h4 className={`text-xs font-black leading-tight ${item.active ? 'text-emerald-950' : 'text-slate-800'
                  }`}>
                  {item.title}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'Semua', count: experiments.length },
          {
            id: 'running',
            label: 'Sedang Dicoba',
            count: experiments.filter((e) => e.status === 'running').length,
          },
          {
            id: 'completed',
            label: 'Selesai Dievaluasi',
            count: experiments.filter((e) => e.status === 'completed').length,
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-xs sm:text-sm px-4 py-2 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${isActive
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/90'
                }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isActive ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-100 text-slate-600'
                }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Experiments Card List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
            <span>Memuat data eksperimen...</span>
          </div>
        ) : (
          filteredExperiments.map((exp, expIdx) => {
            const isCompleted = exp.status === 'completed';
            const latestResult = exp.results?.[0];

            // Hitung pertumbuhan margin riil
            const baseMargin = Number(exp.baseline_metric?.margin) || 0;
            const resMargin = isCompleted ? (Number(latestResult?.current_metric?.margin) || baseMargin) : (Number(exp.target_metric?.margin) || baseMargin);
            const marginDiff = Math.round((resMargin - baseMargin) * 10) / 10;
            const isSuccess = marginDiff >= 0;

            const baseProfit = Number(exp.baseline_metric?.daily_profit) || 0;
            const currProfit = Number(latestResult?.current_metric?.daily_profit) || 0;
            const profitDiffPct = baseProfit > 0 && currProfit > 0
              ? Math.round(((currProfit - baseProfit) / baseProfit) * 100)
              : null;

            const startedDateStr = exp.started_at
              ? new Date(exp.started_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
              : 'Baru saja';

            return (
              <div
                key={exp.id}
                className={`bg-white rounded-3xl border-2 shadow-sm overflow-hidden transition-all ${isCompleted ? 'border-emerald-300 ring-1 ring-emerald-200/50' : 'border-slate-200'
                  }`}
              >
                {/* Header: Experiment Index & Status Badge */}
                <div
                  className={`p-5 px-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isCompleted ? 'bg-emerald-50/60 border-emerald-100' : 'bg-slate-50 border-slate-200/80'
                    }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        Eksperimen #{String(expIdx + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${isCompleted ? 'bg-emerald-700 text-white' : 'bg-amber-600 text-white'
                          }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Selesai Dievaluasi
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> Sedang Dicoba di Kios
                          </>
                        )}
                      </span>
                      {exp.product_name && (
                        <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          Produk: {exp.product_name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5 mt-1">
                      <Pin className="w-4 h-4 text-emerald-700 shrink-0 rotate-45" />
                      <span>{exp.title}</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Mulai: {startedDateStr} • Durasi: 7 Hari</span>
                    </div>

                    <button
                      type="button"
                      disabled={deletingExpId === exp.id}
                      onClick={() => handleDeleteExperiment(exp.id, exp.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      title="Hapus eksperimen ini"
                    >
                      {deletingExpId === exp.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Structured 4-Step Cycle Display */}
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Grid 2 Kolom: Kondisi Sebelum vs Kondisi Sesudah / Target */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tahap 1: Kondisi Bisnis Awal */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Kondisi Awal Kios
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-800">
                          {baseMargin}%
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">Margin Awal</span>
                      </div>
                      {baseProfit > 0 && (
                        <p className="text-xs text-slate-500 font-medium">
                          Estimasi Laba Harian: Rp{baseProfit.toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>

                    {/* Tahap 2: Hasil Nyata / Target */}
                    <div
                      className={`p-4 rounded-2xl border space-y-1.5 ${isCompleted
                        ? isSuccess
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                          : 'bg-amber-50/80 border-amber-300 text-amber-950'
                        : 'bg-teal-50/60 border-teal-200 text-teal-950'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
                          {isCompleted ? 'Hasil Terealisasi' : 'Target Strategi'}
                        </span>
                        {isCompleted && (
                          <span className={`text-xs font-black px-2 py-0.5 rounded-md ${isSuccess ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>
                            {marginDiff >= 0 ? `+${marginDiff}%` : `${marginDiff}%`} Margin
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black">
                          {resMargin}%
                        </span>
                        <span className="text-xs opacity-80 font-semibold">
                          {isCompleted ? 'Margin Riil Transaksi' : 'Target Margin'}
                        </span>
                      </div>

                      {isCompleted && currProfit > 0 && (
                        <p className="text-xs font-bold">
                          Laba Riil: Rp{currProfit.toLocaleString('id-ID')}
                          {profitDiffPct !== null && (
                            <span className={profitDiffPct >= 0 ? ' text-emerald-700 ml-1' : ' text-rose-600 ml-1'}>
                              ({profitDiffPct >= 0 ? `+${profitDiffPct}%` : `${profitDiffPct}%`})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tahap 3: Hasil Evaluasi AI Advisor */}
                  {isCompleted && latestResult?.ai_verdict_text && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/90 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                        <h4 className="font-black text-xs uppercase tracking-wider text-emerald-950">
                          Evaluasi AI VokaSync:
                        </h4>
                        <span className="ml-auto text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          🟢 Strategi Berhasil
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                        &ldquo;{latestResult.ai_verdict_text}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-400 font-medium">
                      {isCompleted
                        ? 'Strategi ini sudah dievaluasi dari catatan penjualan nyata kios Anda.'
                        : 'Lakukan penjualan di kios sesuai strategi ini, VokaSync memantau otomatis.'}
                    </span>

                    {!isCompleted ? (
                      <button
                        type="button"
                        disabled={completingId === exp.id}
                        onClick={() => handleCompleteExperiment(exp.id)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        {completingId === exp.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Mengevaluasi Transaksi...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Selesai & Lihat Evaluasi</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span>Strategi Berhasil & Telah Diterapkan</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Recommendation Ideas */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Rekomendasi Strategi Usaha</h3>
              <p className="text-xs text-slate-500">Dianalisis dari data produk &amp; riwayat transaksi kios Anda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              try { sessionStorage.removeItem('vokasync_exp_rec_cache'); } catch (_) { }
              fetchAiRecommendations();
            }}
            disabled={isLoadingRec}
            className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 disabled:opacity-50 cursor-pointer px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRec ? 'animate-spin' : ''}`} />
            <span>{isLoadingRec ? 'Memuat...' : 'Perbarui Rekomendasi'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {isLoadingRec ? (
            // Loading skeleton
            [0, 1].map((i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-20 bg-slate-200 rounded-full" />
                  <div className="h-3 w-24 bg-slate-100 rounded-full" />
                </div>
                <div className="h-3.5 w-full bg-slate-200 rounded-full" />
                <div className="h-3 w-5/6 bg-slate-100 rounded-full" />
                <div className="h-3 w-4/6 bg-slate-100 rounded-full" />
                <div className="h-3 w-16 bg-emerald-100 rounded-full" />
              </div>
            ))
          ) : aiRecommendations.length > 0 ? (
            aiRecommendations.map((rec, idx) => (
              <div key={rec.id || idx} className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm transition-all bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Target {rec.targetMargin}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {rec.actionType === 'bundling' ? 'Bundling' : rec.actionType === 'promosi' ? 'Promosi' : rec.actionType === 'stok' ? 'Stok' : 'Harga'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">• {rec.productName}</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 leading-snug">{rec.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{rec.description}</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewTitle(rec.title);
                      setNewProductName(rec.productName);
                      setTargetMargin(String(rec.targetMargin));
                      setIsNewExpModalOpen(true);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Coba Tindakan Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  {rec.baselineMargin > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      Baseline: {rec.baselineMargin}%
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 p-8 text-center text-slate-400 space-y-2">
              <Lightbulb className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">Belum ada rekomendasi strategi.</p>
              <p className="text-xs text-slate-400">Tambahkan produk dengan harga beli &amp; jual agar sistem dapat menganalisis peluang bisnis Anda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isNewExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-slate-900">Mulai Coba Tindakan Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewExpModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExperiment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Rencana Tindakan
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="mis: Naikkan harga bawang Rp1.000 atau buat paket hemat"
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Produk Fokus</label>
                {userProducts.length > 0 ? (
                  <select
                    value={newProductName}
                    onChange={(e) => {
                      setNewProductName(e.target.value);
                      const selectedProd = userProducts.find(p => p.name === e.target.value);
                      if (selectedProd && selectedProd.price > 0 && selectedProd.buyPrice > 0) {
                        const curMargin = Math.round(((selectedProd.price - selectedProd.buyPrice) / selectedProd.price) * 100);
                        setTargetMargin(String(Math.min(90, Math.max(15, curMargin + 5))));
                      }
                    }}
                    required
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900"
                  >
                    <option value="">-- Pilih Produk dari Toko Anda --</option>
                    {userProducts.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} {p.price ? `(Jual: Rp${p.price.toLocaleString('id-ID')})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="mis: Bawang Merah, Telur Ayam"
                    required
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Margin (%)</label>
                <input
                  type="number"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value)}
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewExpModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
                >
                  Mulai Tindakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
