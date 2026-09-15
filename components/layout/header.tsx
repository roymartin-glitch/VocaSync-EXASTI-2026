'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Plus, Settings } from 'lucide-react';

interface HeaderProps {
  ownerName?: string;
  businessName?: string;
}

export function Header({ ownerName = 'Pedagang', businessName = 'Toko Saya' }: HeaderProps) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="bg-transparent px-4 md:px-8 pt-6 pb-2">
      {/* Desktop Header Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Sistem Pencatatan Toko
          </p>
          <h1 suppressHydrationWarning className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Halo, {ownerName}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm font-semibold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span suppressHydrationWarning className="font-bold text-slate-800">{businessName}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">Asisten Keuangan</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div suppressHydrationWarning className="flex items-center gap-2 bg-white border-2 border-slate-200 px-4 py-2.5 rounded-2xl text-sm font-bold text-slate-800 shadow-2xs">
            <Calendar className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
            <span>{currentDate}</span>
          </div>

          <Link
            href="/settings"
            title="Pengaturan Toko & Profil"
            className="w-11 h-11 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-600 shadow-2xs transition-all flex items-center justify-center cursor-pointer active:scale-95"
          >
            <Settings className="w-5 h-5 stroke-[2.2]" />
          </Link>

          <Link
            href="/catat"
            className="flex items-center gap-2 bg-[#00875A] hover:bg-[#059669] text-white font-bold text-sm px-5 py-2.5 rounded-2xl shadow-sm hover:shadow transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Catat Transaksi</span>
          </Link>
        </div>
      </div>

      {/* Mobile Header Layout */}
      <div className="flex md:hidden flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Buku Keuangan
            </p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight truncate">
              {ownerName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-semibold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse flex-shrink-0" />
              <span className="font-bold text-slate-800 truncate">{businessName}</span>
            </div>
          </div>

          <Link
            href="/settings"
            title="Pengaturan"
            className="w-10 h-10 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-600 shadow-2xs transition-all flex items-center justify-center flex-shrink-0 active:scale-95"
          >
            <Settings className="w-5 h-5 stroke-[2.2]" />
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-slate-200 py-2.5 px-3 rounded-2xl text-xs font-bold text-slate-800 shadow-2xs">
            <Calendar className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
            <span className="truncate">{currentDate}</span>
          </div>

          <Link
            href="/catat"
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#00875A] hover:bg-[#059669] text-white font-bold text-xs py-2.5 px-3 rounded-2xl shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Catat Transaksi</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
