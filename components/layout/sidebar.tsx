'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  PlusCircle,
  Package,
  FileText,
  History,
  Settings,
  LogOut,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  ownerName?: string;
  businessName?: string;
}

const navItems = [
  { name: 'Beranda', href: '/dashboard', icon: LayoutGrid },
  { name: 'Catat', href: '/catat', icon: PlusCircle },
  { name: 'Barang', href: '/produk', icon: Package },
  { name: 'Coba & Pantau', href: '/eksperimen', icon: TrendingUp },
  { name: 'Laporan', href: '/laporan', icon: FileText },
  { name: 'Riwayat', href: '/riwayat', icon: History },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
];

export function Sidebar({ businessName = 'Toko Saya' }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col fixed top-0 left-0 h-screen z-30 bg-[#0A2619] border-r border-[#123825] transition-all duration-300 md:w-20 lg:w-64 select-none">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-4 lg:px-6 border-b border-[#123825] justify-center lg:justify-start gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-md flex-shrink-0 p-1.5">
          <img src="/icon.png" alt="VokaSync Logo" className="w-full h-full object-contain" />
        </div>
        <div className="hidden lg:block overflow-hidden">
          <h1 className="font-extrabold text-white text-lg tracking-tight leading-tight">VokaSync</h1>
          <p suppressHydrationWarning className="text-xs text-emerald-200/70 truncate max-w-[150px] font-medium">{businessName}</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-base transition-all duration-150 justify-center lg:justify-start ${
                isActive
                  ? 'bg-[#22C55E] text-[#0A2619] shadow-md'
                  : 'text-emerald-100/80 hover:bg-[#123825] hover:text-white'
              }`}
              title={item.name}
            >
              <Icon
                className={`w-6 h-6 flex-shrink-0 ${
                  isActive ? 'text-[#0A2619] stroke-[2.5]' : 'text-emerald-200/70'
                }`}
              />
              <span className="hidden lg:inline truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Action / Logout */}
      <div className="p-4 border-t border-[#123825]">
        <button
          type="button"
          onClick={async () => {
            if (confirm('Apakah Anda yakin ingin keluar dari akun?')) {
              const { logoutUser } = await import('@/lib/supabase/auth-client');
              await logoutUser();
            }
          }}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-base font-bold text-emerald-100/70 hover:bg-rose-950/40 hover:text-rose-400 transition-colors justify-center lg:justify-start cursor-pointer"
          title="Keluar"
        >
          <LogOut className="w-6 h-6 flex-shrink-0" />
          <span className="hidden lg:inline">Keluar</span>
        </button>
      </div>
    </aside>
  );
}
