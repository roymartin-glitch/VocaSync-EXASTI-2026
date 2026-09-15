'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNav } from './bottom-nav';
interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  const [businessName, setBusinessName] = useState<string>('Toko Saya');
  const [ownerName, setOwnerName] = useState<string>('Pedagang');

  // Apply text size and theme to root documentElement
  useEffect(() => {
    const applyTextSize = (size: string) => {
      if (typeof document === 'undefined') return;
      document.documentElement.classList.remove(
        'text-size-kecil',
        'text-size-normal',
        'text-size-besar',
        'text-size-sangat-besar'
      );
      document.documentElement.classList.add(`text-size-${size || 'normal'}`);
    };

    const applyTheme = (theme: string) => {
      if (typeof document === 'undefined') return;
      document.documentElement.classList.remove('theme-terang', 'theme-gelap', 'theme-3d');
      document.documentElement.classList.add(`theme-${theme || 'terang'}`);
    };

    // 1. Initial values from localStorage
    const cachedSize = localStorage.getItem('vokasync_text_size') || 'normal';
    applyTextSize(cachedSize);

    const cachedTheme = localStorage.getItem('vokasync_theme') || 'terang';
    applyTheme(cachedTheme);

    const cachedOwner = localStorage.getItem('vokasync_owner_name');
    if (cachedOwner) setOwnerName(cachedOwner);

    const cachedBusiness = localStorage.getItem('vokasync_business_name');
    if (cachedBusiness) setBusinessName(cachedBusiness);

    // 2. Fetch profile & settings (throttled to once per 60s per session to keep navigation fast)
    const lastSynced = sessionStorage.getItem('vokasync_settings_synced');
    const now = Date.now();
    if (!lastSynced || now - Number(lastSynced) > 60000) {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            sessionStorage.setItem('vokasync_settings_synced', String(Date.now()));
            if (data.data.business_name) {
              setBusinessName(data.data.business_name);
              localStorage.setItem('vokasync_business_name', data.data.business_name);
            }
            if (data.data.owner_name) {
              setOwnerName(data.data.owner_name);
              localStorage.setItem('vokasync_owner_name', data.data.owner_name);
            }
            if (data.data.text_size) {
              applyTextSize(data.data.text_size);
              localStorage.setItem('vokasync_text_size', data.data.text_size);
            }
            if (data.data.theme) {
              applyTheme(data.data.theme);
              localStorage.setItem('vokasync_theme', data.data.theme);
            }
          }
        })
        .catch(() => {});
    }

    // 3. Listen to settings changed event for real-time reactivity without refresh
    const handleSettingsChange = (e: any) => {
      const detail = e.detail;
      if (detail?.text_size) {
        applyTextSize(detail.text_size);
        localStorage.setItem('vokasync_text_size', detail.text_size);
      }
      if (detail?.theme) {
        applyTheme(detail.theme);
        localStorage.setItem('vokasync_theme', detail.theme);
      }
      if (detail?.business_name) setBusinessName(detail.business_name);
      if (detail?.owner_name) setOwnerName(detail.owner_name);
    };

    window.addEventListener('vokasync-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('vokasync-settings-changed', handleSettingsChange);
  }, []);

  const isHomePage = pathname === '/dashboard' || pathname === '/';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F4] flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Sidebar for Desktop & Tablet */}
      <Sidebar
        businessName={businessName}
        ownerName={ownerName}
      />

      {/* Main Content Area (offset by sidebar width on desktop/tablet) */}
      <div className="flex-1 flex flex-col md:pl-20 lg:pl-64 transition-all duration-300">
        {isHomePage && (
          <Header
            ownerName={ownerName}
            businessName={businessName}
          />
        )}

        <main className={`flex-1 px-4 md:px-8 pb-20 md:pb-12 max-w-7xl w-full ${!isHomePage ? 'pt-6 md:pt-8' : ''}`}>
          {children}
        </main>
      </div>

      {/* Bottom Nav for Mobile */}
      <BottomNav />
    </div>
  );
}

