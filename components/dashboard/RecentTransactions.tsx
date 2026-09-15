'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, Mic } from 'lucide-react';
import { Transaction } from '@/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-black text-xl text-slate-900 tracking-tight">Transaksi Hari Ini</h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Catatan penjualan dan belanja terbaru</p>
        </div>
        <Link
          href="/riwayat"
          className="text-xs font-bold text-slate-800 border-2 border-slate-200 hover:border-emerald-600 hover:text-emerald-700 px-4 py-2 rounded-full transition-all cursor-pointer"
        >
          Lihat Semua
        </Link>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="py-8 px-4 text-center space-y-3 bg-slate-50/70 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-sm font-bold text-slate-700">Belum ada catatan transaksi hari ini</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tekan tombol di bawah untuk mulai mencatat transaksi jualan atau belanja pertama Anda.
            </p>
            <Link
              href="/catat"
              className="inline-flex items-center gap-2 bg-[#00875A] hover:bg-[#059669] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <span>+ Catat Transaksi Baru</span>
            </Link>
          </div>
        ) : (
          transactions.slice(0, 4).map((tx) => {
            const isIncome = tx.type === 'income';
            const primaryItem = tx.items?.[0];
            const timeStr = new Date(tx.transaction_date).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl border-2 border-slate-100 hover:border-slate-200 bg-white transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-5 h-5 stroke-[2.8]" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 stroke-[2.8]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-black text-slate-900 truncate">
                        {primaryItem?.product_name || 'Transaksi'}
                      </p>
                      {tx.source === 'voice' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-900 border border-emerald-300/60">
                          <Mic className="w-3 h-3 stroke-[2.5] text-emerald-700" /> Suara
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {primaryItem ? `${primaryItem.quantity} ${primaryItem.unit} • ` : ''}
                      Jam {timeStr}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p
                    className={`text-base sm:text-lg font-black tracking-tight ${
                      isIncome ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {isIncome ? '+' : '-'}Rp{(tx.total_amount || 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
