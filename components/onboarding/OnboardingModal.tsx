'use client';

import React, { useState } from 'react';
import { 
  Mic, 
  Brain, 
  FlaskConical, 
  Palette, 
  Sparkles, 
  ArrowRight
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      id: 'welcome',
      tag: 'ASISTEN BISNIS DIGITAL',
      title: 'Kenali VokaSync',
      description: 'Asisten bisnis digital yang membantu Anda mengelola usaha dengan lebih mudah, cepat, dan cerdas.',
    },
    {
      id: 'voice',
      tag: 'CATAT PENJUALAN KASIR',
      title: 'Catat dengan Suara',
      description: 'Catat transaksi cukup dengan berbicara seperti biasa. Tangan basah atau repot memegang barang tidak lagi jadi kendala.',
    },
    {
      id: 'advisor',
      tag: 'PENASIHAT BISNIS REAL-TIME',
      title: 'Pahami Bisnis Anda',
      description: 'Dapatkan insight tentang penjualan, keuntungan, margin laba kotor, dan peringatan stok menipis langsung dari data nyata.',
    },
    {
      id: 'experiments',
      tag: 'LABORATORIUM STRATEGI',
      title: 'Coba Strategi',
      description: 'Dapatkan rekomendasi cerdas, coba strategi bisnis pada harga produk, lalu pantau evaluasi hasilnya secara akurat.',
    },
    {
      id: 'marketing',
      tag: 'PROMOSI & VISUAL STUDIO',
      title: 'Promosikan Produk',
      description: 'Buat materi promosi produk berkualitas tinggi secara otomatis dan bagikan langsung ke calon pelanggan lewat WhatsApp.',
    }
  ];

  const currentSlide = slides[currentStep];
  const isLast = currentStep === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, slides.length - 1));
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md mx-auto min-h-screen sm:min-h-dvh flex flex-col justify-between px-6 py-6 sm:py-8">
        
        {/* Top Bar: Brand & Skip */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/90 p-1.5 flex items-center justify-center shadow-xs">
              <img src="/icon.png" alt="VokaSync" className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-slate-900 text-lg tracking-tight">VokaSync</span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-xs sm:text-sm font-extrabold text-slate-500 hover:text-emerald-700 transition-colors py-1.5 px-3.5 rounded-full hover:bg-slate-100 active:scale-95 cursor-pointer"
          >
            Lewati
          </button>
        </div>

        {/* Slide Body */}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 sm:py-8 animate-in fade-in duration-300">
          {/* Visual Icon per slide */}
          <div className="mb-6 sm:mb-8">
            {currentStep === 0 && (
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-emerald-100 to-teal-50 border-2 border-emerald-200/80 flex items-center justify-center shadow-lg shadow-emerald-500/10 transform transition-transform hover:scale-105">
                <div className="relative">
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white p-3 shadow-md flex items-center justify-center border border-slate-100">
                    <img src="/icon.png" alt="VokaSync" className="w-full h-full object-contain" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-amber-100 to-orange-50 border-2 border-amber-200/80 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-24 h-24 bg-amber-400/20 rounded-full animate-ping" />
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md flex items-center justify-center">
                    <Mic className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2.2]" />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-emerald-100 to-teal-50 border-2 border-emerald-200/80 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-600 text-white shadow-md flex items-center justify-center">
                  <Brain className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2.2]" />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-indigo-100 to-blue-50 border-2 border-indigo-200/80 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-md flex items-center justify-center">
                  <FlaskConical className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2.2]" />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-purple-100 to-pink-50 border-2 border-purple-200/80 flex items-center justify-center shadow-lg shadow-purple-500/10">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-md flex items-center justify-center">
                  <Palette className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2.2]" />
                </div>
              </div>
            )}
          </div>

          {/* Tagline */}
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full mb-3.5">
            {currentSlide.tag}
          </span>

          {/* Title - Clean without any emojis/emotes */}
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-3">
            {currentSlide.title}
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xs sm:max-w-sm">
            {currentSlide.description}
          </p>
        </div>

        {/* Bottom Navigation & Controls */}
        <div className="pb-2 sm:pb-4 space-y-6">
          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentStep === idx
                    ? 'w-8 h-2.5 bg-emerald-700'
                    : 'w-2.5 h-2.5 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Ke slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base py-4 px-6 rounded-2xl shadow-md hover:shadow-lg shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <span>{isLast ? 'Mulai Menggunakan VokaSync' : 'Lanjut'}</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

      </div>
    </div>
  );
}
