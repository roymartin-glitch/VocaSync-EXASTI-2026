'use client';

import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  MessageCircle,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  Package,
  ArrowUpRight,
  Lightbulb,
} from 'lucide-react';
import { AIInsight } from '@/types';

interface AdvisorCardProps {
  insight?: AIInsight | null;
  onOpenStudio?: () => void;
}

export function AdvisorCard({ insight, onOpenStudio }: AdvisorCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ownerName, setOwnerName] = useState('Juragan');
  const isAlert = insight?.severity === 'red' || insight?.severity === 'yellow';

  // Waktu sapaan dinamis (Pagi, Siang, Sore, Malam)
  const [timeGreeting, setTimeGreeting] = useState('Halo');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 11) {
        setTimeGreeting('Selamat pagi');
      } else if (hour >= 11 && hour < 15) {
        setTimeGreeting('Selamat siang');
      } else if (hour >= 15 && hour < 18) {
        setTimeGreeting('Selamat sore');
      } else {
        setTimeGreeting('Selamat malam');
      }

      const savedProfile = localStorage.getItem('vokasync_user_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed.business_name) {
            setOwnerName(parsed.business_name);
          } else if (parsed.name) {
            setOwnerName(parsed.name);
          }
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Format teks lengkap untuk dibacakan suara
  const textToSpeak = [
    insight?.growth_text || insight?.headline || insight?.message,
    insight?.most_profitable ? `Produk paling menguntungkan adalah ${insight.most_profitable.name} dengan margin ${insight.most_profitable.margin} persen.` : '',
    insight?.least_profitable ? `Perhatian untuk ${insight.least_profitable.name}, margin berada di ${insight.least_profitable.margin} persen.` : '',
    insight?.stock_alert ? `Stok ${insight.stock_alert.name} tersisa ${insight.stock_alert.remaining} ${insight.stock_alert.unit}.` : '',
    insight?.recommendation ? `Saran: ${insight.recommendation}` : '',
  ].filter(Boolean).join(' ');

  // Helper untuk membaca saran secara natural dengan suara asisten ramah bahasa Indonesia
  const speakInsight = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();

      if (isSpeaking) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text || textToSpeak);
      utterance.lang = 'id-ID';
      utterance.rate = 0.92;
      utterance.pitch = 1.05;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  };

  // Otomatis bersuara jika ada peringatan baru dan fitur suara diaktifkan
  useEffect(() => {
    if (!insight?.message) return;
    const isSoundActive = typeof window !== 'undefined' ? localStorage.getItem('vokasync_sound_alert') !== 'false' : true;
    if (!isSoundActive) return;

    const timer = setTimeout(() => {
      const spokenKey = `vokasync_spoken_insight_${insight.id || insight.message}`;
      const alreadySpoken = sessionStorage.getItem(spokenKey);
      if (!alreadySpoken && isAlert) {
        sessionStorage.setItem(spokenKey, 'true');
        speakInsight(textToSpeak);
      }
    }, 1200);

    return () => {
      clearTimeout(timer);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [insight?.id, insight?.message, isAlert, textToSpeak]);

  return (
    <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col justify-between space-y-5">
      {/* Header: Insight VokaSync with Brain Badge & Audio speaker */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-2xs flex-shrink-0 ${
              isAlert ? 'bg-amber-500' : 'bg-[#00875A]'
            }`}
          >
            <Brain className="w-6 h-6 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Penasihat Bisnis
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug mt-0.5">
              Insight VokaSync
            </h3>
          </div>
        </div>

        {/* Tombol Suara / Dengarkan Asisten Bicara */}
        <button
          type="button"
          onClick={() => speakInsight(textToSpeak)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95 ${
            isSpeaking
              ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 animate-pulse'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
          }`}
          title={isSpeaking ? 'Klik untuk berhenti bicara' : 'Dengarkan asisten berbicara'}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-4 h-4 text-amber-700 stroke-[2.5]" />
              <span className="hidden sm:inline">Hentikan</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
              <span>Dengarkan</span>
            </>
          )}
        </button>
      </div>

      {/* Main Insight Body - Data-Driven & Structured */}
      <div className="space-y-3.5">
        {/* 1. Headline Narasi Pertumbuhan / Kondisi Bisnis Riil */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Kondisi Penjualan
          </p>
          <p className="text-sm font-black text-slate-900 leading-snug">
            &ldquo;{insight?.growth_text || insight?.headline || insight?.message || `${timeGreeting}, pantau catatan keuangan toko Anda hari ini.`}&rdquo;
          </p>
        </div>

        {/* 2. Produk Paling Menguntungkan */}
        {insight?.most_profitable && (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Produk Paling Menguntungkan
                </span>
                <span className="text-sm font-extrabold text-slate-900 truncate block">
                  {insight.most_profitable.name}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-2xs">
                Margin {insight.most_profitable.margin}%
              </span>
            </div>
          </div>
        )}

        {/* 3. Peringatan Margin Tertekan (Jika ada) */}
        {insight?.least_profitable && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Margin Perlu Penyesuaian
                </span>
                <span className="text-sm font-extrabold text-slate-900 truncate block">
                  {insight.least_profitable.name}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 bg-amber-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-2xs">
                Margin {insight.least_profitable.margin}%
              </span>
            </div>
          </div>
        )}

        {/* 4. Peringatan Stok Menipis (Jika ada) */}
        {insight?.stock_alert && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-950">
              <Package className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Stok Menipis: {insight.stock_alert.name}</span>
            </div>
            <span className="text-xs font-black text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md">
              Sisa {insight.stock_alert.remaining} {insight.stock_alert.unit}
            </span>
          </div>
        )}

        {/* 5. Saran Tindakan AI Advisor */}
        <div className="bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/90 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950 uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
            <span>Saran untuk Anda:</span>
          </div>
          <p className="text-xs text-slate-800 font-semibold leading-relaxed">
            {insight?.recommendation || insight?.message || 'Pertahankan pencatatan transaksi secara berkala untuk memantau laba kotor harian.'}
          </p>
        </div>
      </div>

      {/* Action Button: Buat Promo WhatsApp */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onOpenStudio}
          className="w-full flex items-center justify-center gap-2.5 bg-[#00875A] hover:bg-[#059669] text-white text-sm sm:text-base font-extrabold py-3.5 px-6 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer"
        >
          <MessageCircle className="w-5 h-5 fill-white" />
          <span>Buat Promo WhatsApp</span>
        </button>
        <p className="text-[11px] text-center text-slate-500 font-semibold mt-2">
          Asisten akan membuatkan materi promosi untuk produk andalan Anda.
        </p>
      </div>
    </div>
  );
}
