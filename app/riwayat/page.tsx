'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Mic,
  Edit2,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  Calendar,
  Filter,
  Loader2,
  FileText,
  Receipt,
  Printer,
  Share2,
  Download,
} from 'lucide-react';
import { Transaction } from '@/types';

type DatePreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editAmount, setEditAmount] = useState('');

  // Delete Dialog State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Receipt Modal State
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [shopName, setShopName] = useState('Kios Berkah Sayur');

  // Load shop profile on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('vokasync_user_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed.business_name) setShopName(parsed.business_name);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const shareToWhatsApp = (tx: Transaction) => {
    const item = tx.items?.[0];
    const isIncome = tx.type === 'income';
    const total = (tx.total_amount || 0).toLocaleString('id-ID');
    const dateStr = new Date(tx.created_at || Date.now()).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const text = `*NOTA TRANSAKSI - ${shopName.toUpperCase()}*
----------------------------------------
*Status:* ${isIncome ? 'PENJUALAN (UANG MASUK)' : 'PENGELUARAN (UANG KELUAR)'}
*Waktu:* ${dateStr}
*Barang:* ${item?.product_name || 'Item Dagangan'}
*Jumlah:* ${item?.quantity || 1} ${item?.unit || 'unit'}
*Total:* Rp ${total}
----------------------------------------
_Terima kasih atas kerja sama dan kepercayaan Anda!_
_Dicatat otomatis via VokaSync_`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrintReceipt = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Set date ranges helper
  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const todayStr = formatDate(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = formatDate(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'week') {
      const w = new Date();
      w.setDate(w.getDate() - 7);
      setStartDate(formatDate(w));
      setEndDate(formatDate(now));
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(now));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const fetchTransactions = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      let url = '/api/transactions';
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (searchQuery) params.append('search', searchQuery);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        let list = [...data.data].filter((tx: any) => tx.items && tx.items.length > 0);
        if (typeof window !== 'undefined') {
          try {
            const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
            // Purge old unscoped keys so they never leak old transactions into new accounts
            localStorage.removeItem('vokasync_local_txs');
            sessionStorage.removeItem('vokasync_tx_cache');
            if (userKey !== 'guest') {
              localStorage.removeItem('vokasync_local_txs_guest');
              sessionStorage.removeItem('vokasync_tx_cache_guest');
            }

            const rawProds = localStorage.getItem(`vokasync_products_${userKey}`);
            const activeProds: any[] | null = rawProds ? JSON.parse(rawProds) : null;
            const activeProdNames = activeProds ? new Set(activeProds.map((p: any) => p.name.toLowerCase())) : null;
            const activeProdIds = activeProds ? new Set(activeProds.map((p: any) => p.id)) : null;

            const localTxs = JSON.parse(localStorage.getItem(`vokasync_local_txs_${userKey}`) || '[]');
            const validLocalTxs: any[] = [];

            for (const l of localTxs) {
              if (!l || !l.id) continue;
              if (l.user_id && l.user_id !== userKey) continue;
              if (!l.items || l.items.length === 0) continue;

              // Jika produk telah dihapus dari sistem, buang transaksi lokalnya
              if (activeProds !== null) {
                const itemMatchesActive = l.items.some((it: any) => {
                  const idMatch = it.product_id && activeProdIds?.has(it.product_id);
                  const nameMatch = it.product_name && activeProdNames?.has(it.product_name.toLowerCase());
                  return idMatch || nameMatch;
                });
                if (!itemMatchesActive) continue;
              }

              validLocalTxs.push(l);
            }

            if (validLocalTxs.length !== localTxs.length) {
              localStorage.setItem(`vokasync_local_txs_${userKey}`, JSON.stringify(validLocalTxs));
            }

            const existingIds = new Set(list.map((t: any) => t.id));
            for (const l of validLocalTxs) {
              if (!existingIds.has(l.id)) {
                list.unshift(l);
                existingIds.add(l.id);
              }
            }

            // Jika daftar produk diketahui (misal 0 produk aktif), pastikan list juga tidak menampilkan transaksi produk terhapus
            if (activeProds !== null) {
              list = list.filter((t: any) => {
                if (!t.items || t.items.length === 0) return false;
                return t.items.some((it: any) => {
                  const idMatch = it.product_id && activeProdIds?.has(it.product_id);
                  const nameMatch = it.product_name && activeProdNames?.has(it.product_name.toLowerCase());
                  return idMatch || nameMatch;
                });
              });
            }
          } catch (_) {}
        }
        setTransactions(list);
        // Cache default view per user
        if (filterType === 'all' && !searchQuery && !startDate && !endDate && typeof window !== 'undefined') {
          try {
            const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
            sessionStorage.setItem(`vokasync_tx_cache_${userKey}`, JSON.stringify(list));
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn('Transactions fetch fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let hasCache = false;
    if (filterType === 'all' && !searchQuery && !startDate && !endDate && typeof window !== 'undefined') {
      try {
        const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
        sessionStorage.removeItem('vokasync_tx_cache');
        if (userKey !== 'guest') {
          sessionStorage.removeItem('vokasync_tx_cache_guest');
        }
        const cached = sessionStorage.getItem(`vokasync_tx_cache_${userKey}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTransactions(parsed);
            setIsLoading(false);
            hasCache = true;
          }
        }
      } catch (_) {}
    }
    fetchTransactions(hasCache);

    const handleSync = () => {
      if (typeof window !== 'undefined') {
        const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
        sessionStorage.removeItem(`vokasync_tx_cache_${userKey}`);
        sessionStorage.removeItem('vokasync_tx_cache');
      }
      fetchTransactions(false);
    };

    window.addEventListener('vokasync-transaction-saved', handleSync);
    window.addEventListener('vokasync-settings-changed', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('vokasync-transaction-saved', handleSync);
      window.removeEventListener('vokasync-settings-changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [filterType, searchQuery, startDate, endDate]);

  // Client-side date filter fallback for offline/instant feel
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesProduct = tx.items?.some((it) =>
          it.product_name ? it.product_name.toLowerCase().includes(query) : false
        );
        const matchesVoice = tx.raw_voice_text?.toLowerCase().includes(query);
        if (!matchesProduct && !matchesVoice) return false;
      }
      if (startDate) {
        const txDate = tx.transaction_date.split('T')[0];
        if (txDate < startDate) return false;
      }
      if (endDate) {
        const txDate = tx.transaction_date.split('T')[0];
        if (txDate > endDate) return false;
      }
      return true;
    });
  }, [transactions, filterType, searchQuery, startDate, endDate]);

  // Calculate totals for filtered range
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx) => {
      const amt = tx.total_amount || 0;
      if (tx.type === 'income') income += amt;
      else expense += amt;
    });
    return {
      income,
      expense,
      profit: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    const item = tx.items?.[0];
    setEditProductName(item?.product_name || '');
    setEditQuantity(item?.quantity?.toString() || '1');
    setEditAmount(tx.total_amount?.toString() || '0');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    try {
      const res = await fetch(`/api/transactions/${editingTx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: editProductName,
          quantity: editQuantity,
          totalAmount: editAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditModalOpen(false);
        showToast('Catatan transaksi berhasil diperbarui!');
        fetchTransactions();
      } else {
        alert(data.error || 'Gagal mengubah transaksi.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const openDelete = (tx: Transaction) => {
    setTxToDelete(tx);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!txToDelete) return;

    try {
      const res = await fetch(`/api/transactions/${txToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== 'undefined') {
          const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
          const localTxs = JSON.parse(localStorage.getItem(`vokasync_local_txs_${userKey}`) || '[]');
          const updated = localTxs.filter((t: any) => t.id !== txToDelete.id);
          localStorage.setItem(`vokasync_local_txs_${userKey}`, JSON.stringify(updated));

          sessionStorage.removeItem(`vokasync_tx_cache_${userKey}`);
          sessionStorage.removeItem(`vokasync_laporan_cache_${userKey}`);
          sessionStorage.removeItem(`vokasync_dash_cache_${userKey}`);
          sessionStorage.removeItem('vokasync_tx_cache');
          sessionStorage.removeItem('vokasync_laporan_cache');
          sessionStorage.removeItem('vokasync_dash_cache');

          window.dispatchEvent(new Event('vokasync-transaction-saved'));
        }

        setIsDeleteModalOpen(false);
        showToast('Catatan transaksi berhasil dihapus!');
        fetchTransactions();
      } else {
        alert(data.error || 'Gagal menghapus transaksi.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Clock className="w-8 h-8 text-[#00875A] stroke-[2.5]" />
            <span>Riwayat Transaksi</span>
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Lihat, cari, dan telusuri seluruh catatan uang masuk dan uang keluar kios Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Link
            href="/laporan"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-white hover:bg-emerald-50/70 text-emerald-900 border border-slate-200 hover:border-emerald-400 font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            title="Buka Rekap Laporan Keuangan & Kas"
          >
            <FileText className="w-4 h-4 text-[#00875A] stroke-[2.5]" />
            <span>Laporan Keuangan</span>
          </Link>

          <Link
            href="/catat"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#00875A] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            <span>Catat Transaksi</span>
          </Link>
        </div>
      </div>

      {/* Date Filter & Preset Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm sm:text-base font-black text-slate-900">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#00875A] stroke-[2.5]" />
            <span>Periode Waktu</span>
          </div>

          <button
            type="button"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200/80 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-[#00875A]" />
            <span>{isFilterExpanded ? 'Sembunyikan Filter' : 'Filter Kustom'}</span>
          </button>
        </div>

        {/* Date Presets Pills - Horizontal swipeable on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'today', label: 'Hari Ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: 'week', label: '7 Hari' },
            { id: 'month', label: 'Bulan Ini' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id as DatePreset)}
              className={`text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                datePreset === preset.id
                  ? 'bg-[#00875A] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Quick Search on mobile */}
        <div className="relative pt-1 sm:hidden">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi / barang..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:border-[#00875A] outline-hidden"
          />
        </div>

        {/* Custom Date Range & Advanced Filters */}
        {isFilterExpanded && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 items-end animate-in fade-in duration-150">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Dari Tanggal:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setStartDate(e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-[#00875A] outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Sampai Tanggal:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setEndDate(e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-[#00875A] outline-hidden"
              />
            </div>

            {/* Type Filter */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Jenis Transaksi:
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-[#00875A] outline-hidden cursor-pointer"
              >
                <option value="all">Semua Jenis</option>
                <option value="income">Uang Masuk (Penjualan)</option>
                <option value="expense">Uang Keluar (Belanja)</option>
              </select>
            </div>

            {/* Desktop Search Input */}
            <div className="hidden lg:block">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Cari Nama Barang:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Contoh: Bawang..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold text-slate-800 focus:border-[#00875A] outline-hidden"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards for Selected Date Range - Compact on mobile */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {/* Total Uang Masuk */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider truncate">
            Uang Masuk
          </div>
          <div className="text-base sm:text-2xl lg:text-3xl font-black text-[#00875A] mt-1 sm:mt-1.5 tracking-tight truncate">
            Rp{summary.income.toLocaleString('id-ID')}
          </div>
          <div className="hidden sm:block text-xs font-medium text-slate-400 mt-1">
            Penjualan periode ini
          </div>
        </div>

        {/* Total Uang Keluar */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] sm:text-xs font-bold text-rose-800 uppercase tracking-wider truncate">
            Uang Keluar
          </div>
          <div className="text-base sm:text-2xl lg:text-3xl font-black text-rose-600 mt-1 sm:mt-1.5 tracking-tight truncate">
            Rp{summary.expense.toLocaleString('id-ID')}
          </div>
          <div className="hidden sm:block text-xs font-medium text-slate-400 mt-1">
            Belanja periode ini
          </div>
        </div>

        {/* Sisa Uang / Sisa Saldo */}
        <div className="bg-[#A3E635] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#84CC16] shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] sm:text-xs font-black text-slate-950 uppercase tracking-wider truncate">
            Sisa Saldo
          </div>
          <div className="text-base sm:text-2xl lg:text-3xl font-black text-slate-950 mt-1 sm:mt-1.5 tracking-tight truncate">
            Rp{summary.profit.toLocaleString('id-ID')}
          </div>
          <div className="hidden sm:block text-xs font-bold text-slate-800 mt-1">
            {summary.count} transaksi
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-bold flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#00875A]" />
            <span>Memuat catatan transaksi...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <p className="text-base sm:text-lg font-bold">Tidak ada catatan transaksi pada tanggal ini.</p>
            <p className="text-xs text-slate-400">Silakan ubah pilihan tanggal atau catat transaksi baru.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const item = tx.items?.[0];
              const dateStr = new Date(tx.transaction_date).toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const timeStr = new Date(tx.transaction_date).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/90 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4"
                >
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs ${
                        isIncome ? 'bg-emerald-100 text-[#00875A]' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.8]" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.8]" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-black text-slate-900 truncate">
                          {item?.product_name || 'Catatan Dagang'}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isIncome ? 'Uang Masuk' : 'Uang Keluar'}
                        </span>
                        {tx.source === 'voice' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A3E635] text-slate-950">
                            <Mic className="w-3 h-3 stroke-[2.5]" /> Suara
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-slate-500">
                        {item ? `${item.quantity} ${item.unit} • ` : ''}
                        {dateStr}, Jam {timeStr}
                      </p>

                      {tx.raw_voice_text && (
                        <p className="text-xs text-slate-600 italic bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80 mt-1 max-w-xl">
                          &ldquo;{tx.raw_voice_text}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-100 flex-shrink-0">
                    <div className="text-left md:text-right">
                      <div
                        className={`text-lg sm:text-xl font-black tracking-tight ${
                          isIncome ? 'text-[#00875A]' : 'text-rose-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'}Rp{(tx.total_amount || 0).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptTx(tx)}
                        className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:border-emerald-600 hover:text-[#00875A] text-slate-600 transition-all cursor-pointer bg-slate-50 hover:bg-emerald-50"
                        title="Lihat & Cetak Struk"
                      >
                        <Receipt className="w-4 h-4 stroke-[2.3]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(tx)}
                        className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:border-emerald-600 hover:text-[#00875A] text-slate-600 transition-all cursor-pointer bg-slate-50 hover:bg-emerald-50"
                        title="Ubah"
                      >
                        <Edit2 className="w-4 h-4 stroke-[2.3]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(tx)}
                        className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:border-rose-600 hover:text-rose-600 text-slate-600 transition-all cursor-pointer bg-slate-50 hover:bg-rose-50"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.3]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Ubah Catatan</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Nama Barang
                </label>
                <input
                  type="text"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-base font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Jumlah
                </label>
                <input
                  type="number"
                  step="any"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-base font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Total Nominal (Rp)
                </label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-base font-bold text-slate-900"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#00875A] hover:bg-[#059669] text-white font-black text-sm shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-200 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Hapus Catatan Ini?</h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                Catatan {txToDelete.items?.[0]?.product_name || 'transaksi'} sebesar Rp
                {(txToDelete.total_amount || 0).toLocaleString('id-ID')} akan dihapus.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Digital Receipt Modal */}
      {selectedReceiptTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#00875A] flex items-center justify-center">
                  <Receipt className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Struk Transaksi</h3>
                  <p className="text-[11px] font-bold text-slate-400">Siap Cetak atau Kirim WA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptTx(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Printable Receipt Paper Style */}
            <div
              id="printable-receipt"
              className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 font-mono text-xs text-slate-800 space-y-3"
            >
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <p className="font-black text-sm tracking-wider uppercase text-slate-900">{shopName}</p>
                <p className="text-[11px] text-slate-500 font-sans font-semibold">Nota Transaksi Resmi</p>
                <p className="text-[10px] text-slate-400">
                  {new Date(selectedReceiptTx.created_at || Date.now()).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-start">
                  <span className="font-bold">
                    {selectedReceiptTx.items?.[0]?.product_name || 'Barang Dagang'}
                  </span>
                  <span>
                    {selectedReceiptTx.items?.[0]?.quantity || 1} {selectedReceiptTx.items?.[0]?.unit || 'unit'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Tipe:</span>
                  <span className="font-semibold uppercase">
                    {selectedReceiptTx.type === 'income' ? 'Penjualan' : 'Pengeluaran'}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between items-center font-bold text-sm text-slate-900">
                <span>TOTAL:</span>
                <span className="text-[#00875A] font-black">
                  Rp{(selectedReceiptTx.total_amount || 0).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-400 font-sans">
                Terima kasih atas kunjungan Anda!
              </div>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => shareToWhatsApp(selectedReceiptTx)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-sm shadow-sm transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                Kirim Struk ke WhatsApp
              </button>

              <button
                type="button"
                onClick={handlePrintReceipt}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 stroke-[2.5]" />
                Cetak / Simpan PDF
              </button>

              <button
                type="button"
                onClick={() => setSelectedReceiptTx(null)}
                className="w-full py-2.5 px-4 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
