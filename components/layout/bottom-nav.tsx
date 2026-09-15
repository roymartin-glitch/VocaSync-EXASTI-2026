'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Mic, Package, History, Settings } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const isTabActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A2619] border-t border-[#123825] shadow-[0_-4px_20px_rgba(0,0,0,0.35)] px-2 py-1 pb-[max(env(safe-area-inset-bottom,4px),4px)] select-none">
      <div className="flex items-center justify-between max-w-md mx-auto relative h-12">
        {/* 1. Beranda */}
        <Link
          href="/dashboard"
          className={`flex-1 flex flex-col items-center justify-center py-0.5 transition-all ${
            isTabActive('/dashboard') ? 'text-[#22C55E]' : 'text-emerald-100/70 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg transition-all ${isTabActive('/dashboard') ? 'scale-105 bg-[#123825]' : ''}`}>
            <LayoutGrid className={`w-4 h-4 stroke-[2.3] ${isTabActive('/dashboard') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`} />
          </div>
          <span className={`text-[9px] font-bold tracking-tight ${isTabActive('/dashboard') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`}>
            Beranda
          </span>
        </Link>

        {/* 2. Barang */}
        <Link
          href="/produk"
          className={`flex-1 flex flex-col items-center justify-center py-0.5 transition-all ${
            isTabActive('/produk') ? 'text-[#22C55E]' : 'text-emerald-100/70 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg transition-all ${isTabActive('/produk') ? 'scale-105 bg-[#123825]' : ''}`}>
            <Package className={`w-4 h-4 stroke-[2.3] ${isTabActive('/produk') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`} />
          </div>
          <span className={`text-[9px] font-bold tracking-tight ${isTabActive('/produk') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`}>
            Barang
          </span>
        </Link>

        {/* 3. CENTER FLOATING VOICE ACTION BUTTON (COMPACT) */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-4 z-10">
          <Link
            href="/catat"
            className="group relative flex flex-col items-center cursor-pointer"
            title="Catat Transaksi Suara"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#00875A] to-[#22C55E] flex items-center justify-center text-white shadow-md shadow-emerald-950/60 ring-3 ring-[#0A2619] group-active:scale-95 group-hover:scale-105 transition-all duration-150">
              <Mic className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[9px] font-black text-[#22C55E] tracking-tight">
              Catat
            </span>
          </Link>
        </div>

        {/* 4. Riwayat */}
        <Link
          href="/riwayat"
          className={`flex-1 flex flex-col items-center justify-center py-0.5 transition-all ${
            isTabActive('/riwayat') ? 'text-[#22C55E]' : 'text-emerald-100/70 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg transition-all ${isTabActive('/riwayat') ? 'scale-105 bg-[#123825]' : ''}`}>
            <History className={`w-4 h-4 stroke-[2.3] ${isTabActive('/riwayat') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`} />
          </div>
          <span className={`text-[9px] font-bold tracking-tight ${isTabActive('/riwayat') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`}>
            Riwayat
          </span>
        </Link>

        {/* 5. Pengaturan */}
        <Link
          href="/settings"
          className={`flex-1 flex flex-col items-center justify-center py-0.5 transition-all ${
            isTabActive('/settings') ? 'text-[#22C55E]' : 'text-emerald-100/70 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg transition-all ${isTabActive('/settings') ? 'scale-105 bg-[#123825]' : ''}`}>
            <Settings className={`w-4 h-4 stroke-[2.3] ${isTabActive('/settings') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`} />
          </div>
          <span className={`text-[9px] font-bold tracking-tight ${isTabActive('/settings') ? 'text-[#22C55E]' : 'text-emerald-200/70'}`}>
            Pengaturan
          </span>
        </Link>
      </div>
    </nav>
  );
}

