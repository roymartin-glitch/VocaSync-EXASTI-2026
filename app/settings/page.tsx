'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Store,
  User,
  Percent,
  Lock,
  LogOut,
  Save,
  CheckCircle2,
  Loader2,
  Bell,
  Volume2,
  VolumeX,
  Eye,
  Calendar,
  AlertTriangle,
  Package,
  TrendingUp,
  Play,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowLeft,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { TextSizeSetting, AnalysisPeriodSetting, AppThemeSetting } from '@/types';

export default function SettingsPage() {
  // Navigation view state: null (Main list view) | 'profile' | 'alerts' | 'voice' | 'display' | 'analysis' | 'password'
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const openSubSection = (section: string) => {
    setActiveSection(section);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const backToMainList = () => {
    setActiveSection(null);
  };
  // 1. Profil Toko (Deterministic initial server state to avoid hydration mismatch)
  const [businessName, setBusinessName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [businessType, setBusinessType] = useState('Sayur & Buah');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2. Peringatan (Sederhana & Ramah Pedagang)
  const [marginThreshold, setMarginThreshold] = useState('20');
  const [lowStockThreshold, setLowStockThreshold] = useState('2');
  const [supplierCostThreshold, setSupplierCostThreshold] = useState('5');

  // 3. Suara (2 Pilihan: Aktif vs Mati)
  const [soundAlertEnabled, setSoundAlertEnabled] = useState<boolean>(false);
  const [soundAlertVolume, setSoundAlertVolume] = useState(80);
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState(false);

  // 4. Tampilan
  const [textSize, setTextSize] = useState<TextSizeSetting>('normal');
  const [theme, setTheme] = useState<AppThemeSetting>('terang');
  const [defaultUnit, setDefaultUnit] = useState('kg');

  // 5. Analisis
  const [analysisPeriod, setAnalysisPeriod] = useState<AnalysisPeriodSetting>('7d');

  // State status
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showSuccess = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Load existing settings on mount
  useEffect(() => {
    setIsMounted(true);

    const cachedBusiness = localStorage.getItem('vokasync_business_name');
    if (cachedBusiness) setBusinessName(cachedBusiness);

    const cachedOwner = localStorage.getItem('vokasync_owner_name');
    if (cachedOwner) setOwnerName(cachedOwner);

    const cachedSound = localStorage.getItem('vokasync_sound_alert');
    if (cachedSound !== null) setSoundAlertEnabled(cachedSound === 'true');
    // 1. Instant check local storage for instant sync
    const cachedTheme = localStorage.getItem('vokasync_theme') as AppThemeSetting;
    if (cachedTheme) setTheme(cachedTheme);

    const cachedMargin = localStorage.getItem('vokasync_margin_threshold');
    if (cachedMargin) setMarginThreshold(cachedMargin);

    const cachedLowStock = localStorage.getItem('vokasync_low_stock_threshold');
    if (cachedLowStock) setLowStockThreshold(cachedLowStock);

    const cachedSupplierCost = localStorage.getItem('vokasync_supplier_cost_threshold');
    if (cachedSupplierCost) setSupplierCostThreshold(cachedSupplierCost);

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const p = data.data;
          if (p.business_name) {
            setBusinessName(p.business_name);
            localStorage.setItem('vokasync_business_name', p.business_name);
          }
          if (p.owner_name) {
            setOwnerName(p.owner_name);
            localStorage.setItem('vokasync_owner_name', p.owner_name);
          }
          if (p.business_type) {
            // Map legacy 'pasar' to 'Sayur & Buah'
            if (p.business_type === 'pasar') setBusinessType('Sayur & Buah');
            else if (p.business_type === 'kuliner') setBusinessType('Kuliner Rumahan');
            else if (p.business_type === 'kriya') setBusinessType('Kriya & Fashion');
            else setBusinessType(p.business_type);
          }
          if (p.margin_alert_threshold !== undefined) {
            const val = p.margin_alert_threshold.toString();
            setMarginThreshold(val);
            localStorage.setItem('vokasync_margin_threshold', val);
          }
          if (p.low_stock_threshold !== undefined) {
            const rawVal = Number(p.low_stock_threshold);
            const val = rawVal > 15 ? '2' : rawVal.toString();
            setLowStockThreshold(val);
            localStorage.setItem('vokasync_low_stock_threshold', val);
          }
          if (p.supplier_cost_increase_threshold !== undefined) {
            const val = p.supplier_cost_increase_threshold.toString();
            setSupplierCostThreshold(val);
            localStorage.setItem('vokasync_supplier_cost_threshold', val);
          }
          if (p.sound_alert_enabled !== undefined) {
            const isEnabled = Boolean(p.sound_alert_enabled);
            setSoundAlertEnabled(isEnabled);
            localStorage.setItem('vokasync_sound_alert', isEnabled ? 'true' : 'false');
          }
          if (p.sound_alert_volume !== undefined) setSoundAlertVolume(Number(p.sound_alert_volume));
          if (p.text_size) setTextSize(p.text_size as TextSizeSetting);
          if (p.theme) setTheme(p.theme as AppThemeSetting);
          if (p.default_unit) setDefaultUnit(p.default_unit);
          if (p.analysis_period) {
            setAnalysisPeriod(p.analysis_period as AnalysisPeriodSetting);
            localStorage.setItem('vokasync_analysis_period', p.analysis_period);
          }
        }
      })
      .catch((e) => console.warn('Settings fetch fallback:', e))
      .finally(() => setIsLoading(false));
  }, []);

  // Real-time Text Size application on change
  const handleTextSizeChange = (size: TextSizeSetting) => {
    setTextSize(size);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove(
        'text-size-kecil',
        'text-size-normal',
        'text-size-besar',
        'text-size-sangat-besar'
      );
      document.documentElement.classList.add(`text-size-${size}`);
      localStorage.setItem('vokasync_text_size', size);
      window.dispatchEvent(new CustomEvent('vokasync-settings-changed', { detail: { text_size: size } }));
    }
  };

  // Real-time Theme application on change
  const handleThemeChange = (newTheme: AppThemeSetting) => {
    setTheme(newTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('theme-terang', 'theme-gelap', 'theme-3d');
      document.documentElement.classList.add(`theme-${newTheme}`);
      localStorage.setItem('vokasync_theme', newTheme);
      window.dispatchEvent(new CustomEvent('vokasync-settings-changed', { detail: { theme: newTheme } }));
    }
  };

  // Test play speech sound
  const handleTestVoiceSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Browser Anda tidak mendukung Speech Synthesis.');
      return;
    }

    setIsPlayingTestVoice(true);
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      `Halo Pak ${ownerName || 'Pedagang'}, suara peringatan VokaSync aktif dengan volume ${soundAlertVolume} persen.`
    );
    utterance.lang = 'id-ID';
    utterance.volume = soundAlertVolume / 100;
    utterance.rate = 1.0;

    utterance.onend = () => setIsPlayingTestVoice(false);
    utterance.onerror = () => setIsPlayingTestVoice(false);

    window.speechSynthesis.speak(utterance);
  };

  // Helper to immediately persist settings changes to Supabase in real-time
  const saveSettingsPatch = async (partialUpdates: Record<string, any>) => {
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialUpdates),
      });
    } catch (e) {
      console.warn('Real-time settings sync fallback:', e);
    }
  };

  // Save all settings
  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        business_name: businessName,
        owner_name: ownerName,
        business_type: businessType,
        margin_alert_threshold: parseFloat(marginThreshold) || 20,
        low_stock_threshold: parseFloat(lowStockThreshold) || 2,
        supplier_cost_increase_threshold: parseFloat(supplierCostThreshold) || 5,
        sound_alert_enabled: soundAlertEnabled,
        sound_alert_volume: soundAlertVolume,
        text_size: textSize,
        theme: theme,
        default_unit: defaultUnit,
        analysis_period: analysisPeriod,
      };

      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('vokasync_sound_alert', soundAlertEnabled ? 'true' : 'false');
        localStorage.setItem('vokasync_business_name', businessName);
        localStorage.setItem('vokasync_owner_name', ownerName);
        localStorage.setItem('vokasync_analysis_period', analysisPeriod);

        // Invalidate caches across app so all pages reflect new threshold and store profile immediately
        const userKey = typeof window !== 'undefined'
          ? (localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest'))
          : 'guest';
        sessionStorage.removeItem(`vokasync_dash_cache_${userKey}`);
        sessionStorage.removeItem('vokasync_dash_cache');
        sessionStorage.removeItem(`vokasync_laporan_cache_${userKey}`);
        sessionStorage.removeItem('vokasync_laporan_cache');
        sessionStorage.removeItem(`vokasync_products_cache_${userKey}`);
        sessionStorage.removeItem('vokasync_products_cache');

        showSuccess('Pengaturan toko berhasil diperbarui!');
        // Broadcast updates to Header and Sidebar
        window.dispatchEvent(
          new CustomEvent('vokasync-settings-changed', {
            detail: {
              business_name: businessName,
              owner_name: ownerName,
              text_size: textSize,
              theme: theme,
              sound_alert_enabled: soundAlertEnabled,
              margin_alert_threshold: parseFloat(marginThreshold) || 20,
              analysis_period: analysisPeriod,
            },
          })
        );
      } else {
        alert(data.error || 'Gagal menyimpan pengaturan.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Password update (Real Supabase Auth & Local Accounts update)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      alert('Kata sandi baru dan konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (newPassword.length < 6) {
      alert('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // 1. Update di Supabase Auth jika login cloud
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error && !error.message.includes('Auth session missing')) {
          console.warn('Supabase password update note:', error.message);
        }
      } catch (_) {}

      // 2. Update di penyimpanan akun terdaftar lokal jika pengguna login lokal
      if (typeof window !== 'undefined') {
        try {
          const userEmail = localStorage.getItem('vokasync_user_email');
          const userId = localStorage.getItem('vokasync_user_id');
          const registeredUsers = JSON.parse(localStorage.getItem('vokasync_registered_users') || '[]');

          let matched = false;
          const updatedUsers = registeredUsers.map((u: any) => {
            if ((userEmail && u.email?.toLowerCase() === userEmail.toLowerCase()) || (userId && u.id === userId)) {
              matched = true;
              return { ...u, password: newPassword };
            }
            return u;
          });

          if (matched) {
            localStorage.setItem('vokasync_registered_users', JSON.stringify(updatedUsers));
          }
        } catch (_) {}
      }

      showSuccess('Kata sandi berhasil diperbarui dengan aman!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      alert('Gagal memperbarui kata sandi: ' + err.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* JIKA ACTIVE SECTION NULL: TAMPILKAN MENU UTAMA SEPERTI APLIKASI NATIVE   */}
      {/* ========================================================================= */}
      {!activeSection ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Settings className="w-7 h-7 text-emerald-700" />
              <span>Pengaturan</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Pilih menu pengaturan untuk menyesuaikan profil toko, batas peringatan, suara asisten, dan kenyamanan tampilan.
            </p>
          </div>

          {/* List Card Menu Pengaturan (Sesuai Referensi Pengguna) */}
          <div className="space-y-3">
            {/* 1. Kelola Profil Toko */}
            <button
              type="button"
              onClick={() => openSubSection('profile')}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between text-left shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Store className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    Kelola Profil Toko
                  </h3>
                  <p suppressHydrationWarning className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {businessName || 'Nama Toko'} • {ownerName || 'Nama Pemilik'} ({businessType})
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>

            {/* 2. Pengaturan Peringatan Untung & Stok */}
            <button
              type="button"
              onClick={() => openSubSection('alerts')}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between text-left shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-800 border border-amber-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-amber-800 transition-colors">
                    Peringatan Untung & Stok
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    Untung min. {marginThreshold}% • Sisa stok {lowStockThreshold} {defaultUnit} • Batas modal {supplierCostThreshold}%
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>

            {/* 3. Suara Asisten Bicara */}
            <button
              type="button"
              onClick={() => openSubSection('voice')}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between text-left shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-800 border border-teal-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Volume2 className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-teal-800 transition-colors">
                    Suara Asisten Bicara
                  </h3>
                  <p suppressHydrationWarning className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    Status: {soundAlertEnabled ? `Aktif (${soundAlertVolume}%)` : 'Mode Hening (Mati)'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>

            {/* 4. Tampilan, Tema & Satuan */}
            <button
              type="button"
              onClick={() => openSubSection('display')}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between text-left shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-800 border border-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Eye className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-indigo-800 transition-colors">
                    Tampilan, Tema & Satuan
                  </h3>
                  <p suppressHydrationWarning className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    Tema: {theme} • Font: {textSize} • Satuan Default: {defaultUnit || 'kg'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>

            {/* 5. Periode Default Analisis */}
            <button
              type="button"
              onClick={() => openSubSection('analysis')}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between text-left shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-cyan-50 text-cyan-800 border border-cyan-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-cyan-800 transition-colors">
                    Periode Analisis Evaluasi
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    Default: {analysisPeriod === '7d' ? '7 Hari (Mingguan)' : analysisPeriod === '30d' ? '30 Hari (Bulanan)' : '3 Bulan'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>

            {/* 6. Keamanan & Sandi */}
            <button
              type="button"
              onClick={() => openSubSection('password')}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between text-left shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Lock className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-slate-700 transition-colors">
                    Keamanan & Kata Sandi
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    Perbarui kata sandi untuk mengamankan akun toko Anda
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>

            {/* 7. Pusat Bantuan & Tanya Jawab */}
            <Link
              href="/settings/bantuan"
              className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between text-left shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      Pusat Bantuan & Tanya Jawab
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      Panduan
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    Panduan lengkap cara catat suara, kelola barang, paham laba kotor, dan fitur AI
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          </div>

          {/* Tombol Logout Sesi di Bawah Menu */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex items-center justify-between shadow-2xs mt-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900">Keluar dari Sesi</h4>
              <p className="text-xs text-slate-500">Keluarkan akun dari perangkat ini dengan aman.</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (confirm('Apakah Anda yakin ingin keluar dari akun?')) {
                  const { logoutUser } = await import('@/lib/supabase/auth-client');
                  await logoutUser();
                }
              }}
              className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-rose-200/60 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* JIKA ACTIVE SECTION ADA: TAMPILKAN SUB-HALAMAN DENGAN TOMBOL KEMBALI      */
        /* ========================================================================= */
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
          {/* Header Sub-Halaman dengan Navigasi Kembali */}
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
            <button
              type="button"
              onClick={backToMainList}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Kembali ke Pengaturan</span>
            </button>

            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {activeSection === 'profile' && 'Profil Toko'}
              {activeSection === 'alerts' && 'Batas Peringatan'}
              {activeSection === 'voice' && 'Suara Asisten'}
              {activeSection === 'display' && 'Tampilan & Satuan'}
              {activeSection === 'analysis' && 'Periode Analisis'}
              {activeSection === 'password' && 'Kata Sandi'}
            </span>
          </div>

          <form onSubmit={handleSaveAllSettings} className="space-y-6">
            {/* SUB-HALAMAN 1: PROFIL TOKO */}
            {activeSection === 'profile' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Store className="w-5 h-5 stroke-[2.3]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Kelola Profil Toko</h2>
                    <p className="text-xs text-slate-500 font-medium">Identitas usaha yang digunakan VokaSync untuk menyapa Anda dan analisis pasar.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      <span>Nama Toko / Kios</span>
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-emerald-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Nama Pemilik</span>
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-emerald-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jenis Komoditas / Usaha
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:bg-white focus:outline-emerald-600 transition-all cursor-pointer"
                  >
                    <option value="Sayur & Buah">Sayur & Buah</option>
                    <option value="Daging & Ikan">Daging & Ikan</option>
                    <option value="Kuliner Rumahan">Kuliner Rumahan</option>
                    <option value="Kriya & Fashion">Kriya & Fashion</option>
                    <option value="Kelontong">Kelontong</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={backToMainList}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            )}

            {/* SUB-HALAMAN 2: PERINGATAN */}
            {activeSection === 'alerts' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 stroke-[2.3]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Batas Peringatan Untung & Stok</h2>
                    <p className="text-xs text-slate-500 font-medium">Atur batas pengingat sederhana agar Anda selalu mendapat sinyal cepat sebelum barang habis atau rugi.</p>
                  </div>
                </div>

                {/* Batas Untung Minimal */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Batas Untung Minimal (%)</span>
                    </label>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      VokaSync akan beri tahu jika untung jualan turun di bawah angka ini.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={marginThreshold}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMarginThreshold(val);
                        if (val) {
                          localStorage.setItem('vokasync_margin_threshold', val);
                          window.dispatchEvent(
                            new CustomEvent('vokasync-settings-changed', {
                              detail: { margin_alert_threshold: parseFloat(val) || 20 },
                            })
                          );
                        }
                      }}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value) || 20;
                        saveSettingsPatch({ margin_alert_threshold: num });
                        showSuccess(`Batas untung minimal diperbarui ke ${num}%`);
                      }}
                      className="w-24 text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 font-black text-slate-900 focus:outline-emerald-600 text-center"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>

                {/* Pengingat Sisa Stok Barang */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pengingat Sisa Stok Barang</span>
                    </label>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Beri tahu jika stok barang dagangan tinggal sedikit (misal: sisa 1 atau 2 {defaultUnit}).
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <span className="text-xs font-bold text-slate-600">Sisa</span>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={lowStockThreshold}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLowStockThreshold(val);
                        if (val) {
                          localStorage.setItem('vokasync_low_stock_threshold', val);
                          window.dispatchEvent(
                            new CustomEvent('vokasync-settings-changed', {
                              detail: { low_stock_threshold: parseFloat(val) || 2 },
                            })
                          );
                        }
                      }}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value) || 2;
                        saveSettingsPatch({ low_stock_threshold: num });
                        showSuccess(`Pengingat sisa stok diperbarui ke ${num}`);
                      }}
                      className="w-20 text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 font-black text-slate-900 focus:outline-emerald-600 text-center"
                    />
                    <span className="text-xs font-bold text-slate-700 bg-slate-200/80 px-2.5 py-1.5 rounded-xl">
                      {defaultUnit || 'pcs/kg'}
                    </span>
                  </div>
                </div>

                {/* Batas Kenaikan Harga Beli Modal */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                      <span>Batas Kenaikan Harga Beli Modal (%)</span>
                    </label>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      VokaSync akan beri tahu jika harga beli modal dari pemasok naik melebihi batas ini.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={supplierCostThreshold}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSupplierCostThreshold(val);
                        if (val) {
                          localStorage.setItem('vokasync_supplier_cost_threshold', val);
                          window.dispatchEvent(
                            new CustomEvent('vokasync-settings-changed', {
                              detail: { supplier_cost_increase_threshold: parseFloat(val) || 5 },
                            })
                          );
                        }
                      }}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value) || 5;
                        saveSettingsPatch({ supplier_cost_increase_threshold: num });
                        showSuccess(`Batas kenaikan harga beli diperbarui ke ${num}%`);
                      }}
                      className="w-24 text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 font-black text-slate-900 focus:outline-emerald-600 text-center"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={backToMainList}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>
            )}

            {/* SUB-HALAMAN 3: SUARA ASISTEN */}
            {activeSection === 'voice' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 stroke-[2.3]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Suara Asisten Bicara</h2>
                    <p className="text-xs text-slate-500 font-medium">Pilih apakah asisten VokaSync boleh bersuara berbicara atau tetap hening saat bertransaksi.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Pilihan 1: Suara Aktif */}
                  <button
                    type="button"
                    onClick={() => {
                      setSoundAlertEnabled(true);
                      localStorage.setItem('vokasync_sound_alert', 'true');
                      saveSettingsPatch({ sound_alert_enabled: true });
                      showSuccess('Suara asisten aktif berhasil diaktifkan');
                      window.dispatchEvent(
                        new CustomEvent('vokasync-settings-changed', {
                          detail: { sound_alert_enabled: true },
                        })
                      );
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                      soundAlertEnabled
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        soundAlertEnabled ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Volume2 className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-slate-900">Suara Aktif</span>
                        {soundAlertEnabled && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Asisten bersuara ramah membaca transaksi & untung.
                      </p>
                    </div>
                  </button>

                  {/* Pilihan 2: Suara Mati */}
                  <button
                    type="button"
                    onClick={() => {
                      setSoundAlertEnabled(false);
                      localStorage.setItem('vokasync_sound_alert', 'false');
                      saveSettingsPatch({ sound_alert_enabled: false });
                      showSuccess('Mode hening berhasil diaktifkan');
                      window.dispatchEvent(
                        new CustomEvent('vokasync-settings-changed', {
                          detail: { sound_alert_enabled: false },
                        })
                      );
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                      !soundAlertEnabled
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        !soundAlertEnabled ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <VolumeX className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-slate-900">Mode Hening</span>
                        {!soundAlertEnabled && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Tanpa suara ucapan, cocok untuk suasana tenang.
                      </p>
                    </div>
                  </button>
                </div>

                {soundAlertEnabled && (
                  <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900">Volume Suara Asisten</label>
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        {soundAlertVolume}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <VolumeX className="w-4 h-4 text-slate-400" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={soundAlertVolume}
                        onChange={(e) => setSoundAlertVolume(parseInt(e.target.value, 10))}
                        className="w-full accent-emerald-700 cursor-pointer"
                      />
                      <Volume2 className="w-4 h-4 text-emerald-700" />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleTestVoiceSpeech}
                        disabled={isPlayingTestVoice}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-emerald-800" />
                        <span>{isPlayingTestVoice ? 'Sedang Berbicara...' : 'Coba Tes Suara'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={backToMainList}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>
            )}

            {/* SUB-HALAMAN 4: TAMPILAN & SATUAN */}
            {activeSection === 'display' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                    <Eye className="w-5 h-5 stroke-[2.3]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Pengaturan Tampilan, Tema & Satuan</h2>
                    <p className="text-xs text-slate-500 font-medium">Sesuaikan kenyamanan visual layar dan satuan utama produk yang dipakai di kios Anda.</p>
                  </div>
                </div>

                {/* Satuan Default */}
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-900 block">Satuan Default Penjualan</label>
                    <p className="text-xs text-slate-500">
                      Pilih atau ketik satuan yang otomatis muncul saat mencatat transaksi atau menambah produk.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {[
                      'kg', 'pcs', 'ikat', 'butir', 'liter', 'bungkus',
                      'karung', 'renteng', 'gram', 'pack', 'porsi', 'lusin'
                    ].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setDefaultUnit(u)}
                        className={`text-xs py-2 px-1.5 rounded-xl font-bold border transition-all cursor-pointer text-center ${
                          defaultUnit.toLowerCase() === u.toLowerCase()
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-slate-600 flex-shrink-0">Satuan Terpilih:</span>
                    <input
                      type="text"
                      placeholder="Ketik satuan kustom..."
                      value={defaultUnit}
                      onChange={(e) => setDefaultUnit(e.target.value)}
                      className="w-40 text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-emerald-600"
                    />
                  </div>
                </div>

                {/* Pilihan Tema Web */}
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-900 block">Tema Tampilan Web</label>
                    <p className="text-xs text-slate-500">
                      Pilih suasana warna yang paling nyaman di mata Anda.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'terang', label: 'Terang (Standar)', note: 'Bersih, kontras tinggi ramah lansia', badge: 'Siang' },
                      { id: 'gelap', label: 'Gelap (Malam)', note: 'Latar hitam emerald, tidak silau', badge: 'Malam' },
                      { id: '3d', label: 'Tampilan 3D', note: 'Tombol timbul nyata membal disentuh', badge: 'Timbul 3D' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleThemeChange(item.id as AppThemeSetting)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          theme === item.id
                            ? 'bg-[#00875A] text-white border-[#00744D] shadow-xs font-bold'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black">{item.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            theme === item.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className={`text-[11px] leading-snug ${
                          theme === item.id ? 'text-emerald-100' : 'text-slate-500'
                        }`}>
                          {item.note}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ukuran Teks */}
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-900 block">Ukuran Teks</label>
                    <p className="text-xs text-slate-500">
                      Sesuaikan ukuran tulisan di seluruh aplikasi dari kecil hingga ekstra besar.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'kecil', label: 'Kecil', note: '15px (Ringkas)' },
                      { id: 'normal', label: 'Normal', note: '18px (Standar)' },
                      { id: 'besar', label: 'Besar', note: '20px (Mudah Dibaca)' },
                      { id: 'sangat-besar', label: 'Sangat Besar', note: '22px (Ekstra Jelas)' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTextSizeChange(item.id as TextSizeSetting)}
                        className={`p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                          textSize === item.id
                            ? 'bg-[#00875A] text-white border-[#00744D] shadow-2xs font-bold'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 font-medium'
                        }`}
                      >
                        <div className="text-xs font-black">{item.label}</div>
                        <div className={`text-[10px] mt-0.5 ${textSize === item.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {item.note}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={backToMainList}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>
            )}

            {/* SUB-HALAMAN 5: PERIODE ANALISIS */}
            {activeSection === 'analysis' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center">
                    <Calendar className="w-5 h-5 stroke-[2.3]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Periode Default Analisis</h2>
                    <p className="text-xs text-slate-500 font-medium">Tentukan rentang waktu evaluasi performa penjualan dan laba dagangan Anda.</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
                  <label className="text-xs font-bold text-slate-900 block">Periode Default Analisis Produk</label>
                  <p className="text-xs text-slate-500">
                    Periode yang dipakai untuk menghitung margin dan omset produk Anda.
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { id: '7d', label: '7 Hari', note: 'Pantauan Mingguan' },
                      { id: '30d', label: '30 Hari', note: 'Pantauan Bulanan' },
                      { id: '3m', label: '3 Bulan', note: 'Pantauan Triwulan' },
                    ].map((period) => (
                      <button
                        key={period.id}
                        type="button"
                        onClick={() => setAnalysisPeriod(period.id as AnalysisPeriodSetting)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          analysisPeriod === period.id
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs font-bold'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 font-medium'
                        }`}
                      >
                        <div className="text-xs font-extrabold">{period.label}</div>
                        <div className={`text-[10px] mt-0.5 ${analysisPeriod === period.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {period.note}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={backToMainList}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* SUB-HALAMAN 6: KATA SANDI (FORM TERPISAH) */}
          {activeSection === 'password' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Lock className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Ubah Kata Sandi</h2>
                  <p className="text-xs text-slate-500 font-medium">Perbarui kata sandi untuk mengamankan akun toko Anda.</p>
                </div>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi Baru</label>
                    <input
                      type="password"
                      placeholder="Minimal 6 karakter..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-emerald-600 transition-all text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Konfirmasi Kata Sandi</label>
                    <input
                      type="password"
                      placeholder="Ulangi kata sandi baru..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-emerald-600 transition-all text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={backToMainList}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memperbarui...</span>
                      </>
                    ) : (
                      <span>Perbarui Kata Sandi</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
