'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mic,
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  Minus,
  Plus,
  Volume2,
  Clock,
  Check,
  Package,
  Edit3,
  X,
} from 'lucide-react';
import { TransactionType } from '@/types';
import { findSimilarProduct, determineActionCategory } from '@/lib/calculations/financial';

/**
 * Pembersih cerdas untuk mengatasi bug akumulasi dan pengulangan suara pada Web Speech API
 * Contoh: "saya beli kangkung saya beli kangkung" -> "saya beli kangkung"
 * Contoh: "beli kangkung 10 ikat beli kangkung 10 ikat" -> "beli kangkung 10 ikat"
 */
function cleanRepeatedVoicePhrases(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // 1. Pangkas pengulangan 2 sampai 6 kata yang berulang berurutan
  for (let n = 6; n >= 2; n--) {
    const regex = new RegExp(`\\b((?:[a-zA-Z0-9가-힣]+\\s+){${n - 1}}[a-zA-Z0-9가-힣]+)\\s+\\1\\b`, 'gi');
    cleaned = cleaned.replace(regex, '$1');
  }

  // 2. Pangkas kata tunggal yang berulang langsung (misal: "kangkung kangkung" -> "kangkung")
  cleaned = cleaned.replace(/\b([a-zA-Z0-9]+)\s+\1\b/gi, '$1');

  // 3. Deteksi pengulangan paruh kalimat yang persis sama
  const words = cleaned.split(/\s+/);
  if (words.length >= 4 && words.length % 2 === 0) {
    const half = words.length / 2;
    const firstHalf = words.slice(0, half).join(' ').toLowerCase();
    const secondHalf = words.slice(half).join(' ').toLowerCase();
    if (firstHalf === secondHalf) {
      cleaned = words.slice(0, half).join(' ');
    }
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

export default function CatatPage() {
  const router = useRouter();

  // Form states (for manual fallback)
  const [type, setType] = useState<TransactionType>('income');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('Kilogram (kg)');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [basePricePerKg, setBasePricePerKg] = useState<number | null>(null);

  // Autocomplete state for Nama Barang
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const productSearchRef = useRef<HTMLDivElement>(null);



  // Voice recording & patient auto-save states
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rawVoiceText, setRawVoiceText] = useState<string | null>(null);
  const [collectedTranscript, setCollectedTranscript] = useState<string>('');
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedRef = useRef<string>('');
  const isListeningRef = useRef(false);
  const isProcessingVoiceRef = useRef(false);
  const isSavingRef = useRef(false);

  const [autoSavedInfo, setAutoSavedInfo] = useState<{
    productName: string;
    quantity: number;
    unit: string;
    totalAmount: number;
    type: string;
    isNewProduct?: boolean;
  } | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Voice Review & Confirmation Modal
  const [voiceConfirmation, setVoiceConfirmation] = useState<{
    isOpen: boolean;
    data: any;
    transcript: string;
    isSimilar?: boolean;
    existingProduct?: any;
    isEditing?: boolean;
  } | null>(null);

  // Products list for fuzzy matching & autocomplete
  const [productsList, setProductsList] = useState<any[]>([]);

  // Filter products based on search query (declared after productsList)
  const filteredProducts = productSearch.trim().length > 0
    ? productsList.filter((p: any) =>
        (p.name || '').toLowerCase().includes(productSearch.toLowerCase())
      ).slice(0, 8)
    : productsList.slice(0, 8);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userKey = localStorage.getItem('vokasync_user_id') ||
          (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');

        // Coba dari session cache dengan key yang benar (scoped per user)
        const cached =
          sessionStorage.getItem(`vokasync_products_cache_${userKey}`) ||
          sessionStorage.getItem('vokasync_products_cache'); // fallback legacy
        if (cached) {
          const parsed = JSON.parse(cached);
          const list = Array.isArray(parsed) ? parsed : parsed.data;
          if (Array.isArray(list)) {
            setProductsList(list);
          }
        } else {
          // Coba dari localStorage jika session kosong
          const localProds = JSON.parse(localStorage.getItem(`vokasync_products_${userKey}`) || '[]');
          if (localProds.length > 0) setProductsList(localProds);
        }
      } catch (_) {}
    }

    fetch('/api/product-analysis')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setProductsList(data.data);
        }
      })
      .catch((err) => console.warn('Product list fallback:', err));

    return () => {
      clearSilenceTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const clearSilenceTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSilenceCountdown(null);
  };

  const speakConfirmation = (
    product: string,
    qty: number,
    unitName: string,
    amount: number,
    isIncome: boolean,
    isNewProduct = false
  ) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const isSoundActive = localStorage.getItem('vokasync_sound_alert') !== 'false';
    if (!isSoundActive) return;

    try {
      window.speechSynthesis.cancel();
      const actionWord = isIncome ? 'Jual' : 'Beli';
      const cleanUnit = unitName.replace(/\s*\(.*\)/, '');
      const newProdSentence = isNewProduct
        ? ` dan barang baru ${product} sudah otomatis masuk ke daftar barang Anda`
        : '';
      const textToSpeak = `Catatan ${actionWord} ${product} ${qty} ${cleanUnit} sebesar ${amount.toLocaleString('id-ID')} rupiah sudah tersimpan ya${newProdSentence}.`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      const savedVol = typeof window !== 'undefined' ? localStorage.getItem('vokasync_sound_volume') : null;
      utterance.volume = savedVol !== null ? Math.max(0, Math.min(1, Number(savedVol) / 100)) : 0.8;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis confirmation info:', e);
    }
  };

  // Save transaction executor
  const executeSaveTransaction = async (
    finalProductName: string,
    d: any,
    transcript: string
  ) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsAutoSaving(true);
    try {
      const saveRes = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: d.type || 'income',
          productName: finalProductName,
          quantity: d.quantity || 1,
          unit: d.unit || 'kg',
          totalAmount: d.total_price || 0,
          source: 'voice',
          rawVoiceText: transcript,
        }),
      });

      const saveResult = await saveRes.json();
      if (saveResult.success) {
        const isNew = Boolean(saveResult.data?.is_new_product);
        setAutoSavedInfo({
          productName: finalProductName,
          quantity: d.quantity || 1,
          unit: d.unit || 'kg',
          totalAmount: d.total_price || 0,
          type: d.type || 'income',
          isNewProduct: isNew,
        });
        setShowSuccessToast(true);

        // Clear session caches and save to local transactions to guarantee instant fresh data across all tabs
        if (typeof window !== 'undefined') {
          try {
            const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
            if (saveResult.data) {
              const currentLocal = JSON.parse(localStorage.getItem(`vokasync_local_txs_${userKey}`) || '[]');
              const txWithUser = { ...saveResult.data, user_id: userKey };
              currentLocal.unshift(txWithUser);
              localStorage.setItem(`vokasync_local_txs_${userKey}`, JSON.stringify(currentLocal.slice(0, 100)));
            }
            // Selalu simpan atau perbarui data produk agar barang baru dari voice langsung ada di halaman Barang
            const isExpense = (d.type || 'income') === 'expense';
            const totalP = Number(d.total_price) || 0;
            const qNum = Number(d.quantity) || 1;
            const uPrice = Math.round(totalP / (qNum || 1));

            const effectiveProduct = saveResult.product || {
              id: saveResult.productId || 'prod-' + Date.now(),
              user_id: userKey,
              name: finalProductName,
              unit: d.unit || 'kg',
              cost_price: isExpense ? uPrice : 0,
              selling_price: !isExpense ? uPrice : 0,
              margin_percentage: 0,
              action_category: 'pertahankan',
              avg_daily_volume: qNum,
              total_revenue_7d: isExpense ? 0 : totalP,
              remaining_stock: qNum,
              is_stock_low: false,
            };

            const currentProds = JSON.parse(localStorage.getItem(`vokasync_products_${userKey}`) || '[]');
            const pIdx = currentProds.findIndex(
              (p: any) =>
                p.id === effectiveProduct.id ||
                p.name.toLowerCase() === effectiveProduct.name.toLowerCase()
            );
            if (pIdx !== -1) {
              const prev = currentProds[pIdx];
              // KUNCI: Saat PENJUALAN, harga beli (modal) TIDAK BOLEH naik mengikuti harga jual!
              const cost = isExpense
                ? (uPrice > 0 ? uPrice : (prev.cost_price || 0))
                : (prev.cost_price && prev.cost_price > 0 ? prev.cost_price : (saveResult.product?.cost_price || 0));

              const selling = !isExpense
                ? (uPrice > 0 ? uPrice : (prev.selling_price || 0))
                : (prev.selling_price && prev.selling_price > 0 ? prev.selling_price : (saveResult.product?.selling_price || 0));

              const currentStock = Number(prev.remaining_stock) || 0;
              const newStock = isExpense
                ? currentStock + qNum
                : Math.max(0, currentStock - qNum);

              const margin = selling > 0 && cost > 0
                ? Math.round(((selling - cost) / selling) * 100)
                : 0;

              const category = determineActionCategory(margin, 20);

              currentProds[pIdx] = {
                ...prev,
                ...effectiveProduct,
                cost_price: cost,
                selling_price: selling,
                margin_percentage: margin,
                action_category: category,
                remaining_stock: newStock,
                is_stock_low: newStock <= 2,
              };
            } else {
              currentProds.unshift(effectiveProduct);
            }
            localStorage.setItem(`vokasync_products_${userKey}`, JSON.stringify(currentProds));

            sessionStorage.removeItem(`vokasync_products_cache_${userKey}`);
            sessionStorage.removeItem(`vokasync_dash_cache_${userKey}`);
            sessionStorage.removeItem(`vokasync_laporan_cache_${userKey}`);
            sessionStorage.removeItem(`vokasync_tx_cache_${userKey}`);
            sessionStorage.removeItem('vokasync_products_cache');
            sessionStorage.removeItem('vokasync_dash_cache');
            sessionStorage.removeItem('vokasync_laporan_cache');
            sessionStorage.removeItem('vokasync_tx_cache');

            // Dispatch instant synchronization event to Beranda, Laporan, and Riwayat
            window.dispatchEvent(new CustomEvent('vokasync-transaction-saved', { detail: saveResult.data }));
            window.dispatchEvent(new CustomEvent('vokasync-settings-changed', { detail: { timestamp: Date.now() } }));
          } catch (_) {}
        }

        // Suara balasan asisten berbicara ramah kepada pedagang
        speakConfirmation(
          finalProductName,
          d.quantity || 1,
          d.unit || 'kg',
          d.total_price || 0,
          (d.type || 'income') === 'income',
          isNew
        );

        // Beri jeda singkat 900ms agar toast terlihat sekilas lalu langsung masuk ke Beranda
        setTimeout(() => {
          router.push('/dashboard');
        }, 900);
      } else {
        alert(saveResult.error || 'Gagal menyimpan transaksi.');
      }
    } catch (saveErr) {
      console.error('Error executing save transaction:', saveErr);
      alert('Terjadi kesalahan saat menyimpan catatan.');
    } finally {
      setIsAutoSaving(false);
      isSavingRef.current = false;
    }
  };

  // Process voice calmly
  const processVoiceAndSave = async (transcript: string) => {
    if (isProcessingVoiceRef.current) return;
    isProcessingVoiceRef.current = true;
    clearSilenceTimers();
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsProcessingVoice(true);

    const cleanTranscript = cleanRepeatedVoicePhrases(transcript);
    setRawVoiceText(`"${cleanTranscript}"`);

    try {
      const res = await fetch('/api/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: cleanTranscript }),
      });
      const result = await res.json();

      if (result.success && result.data) {
        const d = result.data;
        setType(d.type || 'income');
        setProductName(d.product_name);
        setQuantity(d.quantity || 1);
        setTotalAmount(d.total_price || 0);

        const simCheck = findSimilarProduct(d.product_name, productsList);

        setVoiceConfirmation({
          isOpen: true,
          data: d,
          transcript: cleanTranscript,
          isSimilar: simCheck.isSimilar || simCheck.isExact,
          existingProduct: simCheck.matchedProduct || null,
        });
      } else {
        alert('Kalimat belum jelas. Silakan ucapkan dengan santai, contoh: "Beli kangkung 10 ikat 20 ribu"');
      }
    } catch (err) {
      console.error('Error processing voice:', err);
      alert('Gagal memproses suara. Silakan coba bicara kembali.');
    } finally {
      setIsProcessingVoice(false);
      isProcessingVoiceRef.current = false;
    }
  };

  // Start voice recognition with patient pause-handling
  const startListening = () => {
    if (isProcessingVoiceRef.current) return;
    clearSilenceTimers();
    accumulatedRef.current = '';
    setCollectedTranscript('');
    setRawVoiceText(null);
    isListeningRef.current = true;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Browser HP Anda belum mendukung suara langsung. Silakan gunakan formulir manual di bawah.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'id-ID';
      recognition.continuous = true; // Biarkan mendengarkan lebih lama tanpa terputus cepat
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setRawVoiceText('Mendengarkan... Silakan bicara dengan santai');
      };

      recognition.onresult = (event: any) => {
        clearSilenceTimers();
        let finalStr = '';
        let interimStr = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalStr += res[0].transcript + ' ';
          } else {
            interimStr += res[0].transcript;
          }
        }

        const combinedRaw = (finalStr + ' ' + interimStr).trim();
        const cleanedText = cleanRepeatedVoicePhrases(combinedRaw);

        if (cleanedText) {
          accumulatedRef.current = cleanRepeatedVoicePhrases(finalStr).trim();
          setCollectedTranscript(cleanedText);
          setRawVoiceText(`"${cleanedText}"`);

          // Jeda santai: Berikan waktu 3 detik setelah ucapan terakhir sebelum menyarankan simpan
          startGentleSilenceTimer(cleanedText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech event info:', event.error);
        if (event.error === 'no-speech') {
          // Jangan hentikan terburu-buru, beri kesempatan pedagang bersiap
          setRawVoiceText('Silakan bicara... kami masih mendengarkan dengan santai');
        } else if (event.error === 'not-allowed') {
          setRawVoiceText('Izin mikrofon belum aktif di HP Anda.');
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setIsListening(false);
        // Cegah perulangan ganda jika proses submit suara sedang berjalan
        if (isProcessingVoiceRef.current) return;
        const current = cleanRepeatedVoicePhrases(accumulatedRef.current || collectedTranscript).trim();
        if (current.length > 2 && !silenceTimerRef.current) {
          startGentleSilenceTimer(current);
        }
      };

      recognition.start();
    } catch (e) {
      console.error('Speech start error:', e);
      isListeningRef.current = false;
      setIsListening(false);
    }
  };

  // Timer santai dengan jeda bicara 2 detik agar pedagang leluasa berbicara tanpa terpotong
  const startGentleSilenceTimer = (text: string) => {
    if (isProcessingVoiceRef.current) return;
    clearSilenceTimers();
    let secondsLeft = 2;
    setSilenceCountdown(secondsLeft);

    countdownIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        setSilenceCountdown(secondsLeft);
      } else {
        clearSilenceTimers();
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (_) {}
        }
        processVoiceAndSave(text);
      }
    }, 1000);
  };

  // Stop manually when user is ready
  const finishAndSaveNow = () => {
    clearSilenceTimers();
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    const raw = collectedTranscript.trim() || accumulatedRef.current.trim();
    const text = cleanRepeatedVoicePhrases(raw);
    if (text && text.length > 2) {
      processVoiceAndSave(text);
    } else {
      alert('Belum ada ucapan yang terdengar. Silakan tekan tombol mic dan bicara santai.');
    }
  };

  const cancelListening = () => {
    clearSilenceTimers();
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setCollectedTranscript('');
    setRawVoiceText(null);
  };

  // Manual Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !quantity || !totalAmount) {
      alert('Harap lengkapi nama barang, jumlah, dan nominal uang.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanUnit = unit.replace(/\s*\(.*\)/, '');
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          productName,
          quantity,
          unit: cleanUnit,
          totalAmount,
          source: 'manual',
        }),
      });

      const result = await res.json();
      if (result.success) {
        // Clear session caches and save to local transactions to guarantee instant fresh data in Riwayat, Laporan, Beranda
        if (typeof window !== 'undefined') {
          try {
            const userKey = localStorage.getItem('vokasync_user_id') || (localStorage.getItem('vokasync_is_demo') === 'true' ? 'demo' : 'guest');
            if (result.data) {
              const currentLocal = JSON.parse(localStorage.getItem(`vokasync_local_txs_${userKey}`) || '[]');
              const txWithUser = { ...result.data, user_id: userKey };
              currentLocal.unshift(txWithUser);
              localStorage.setItem(`vokasync_local_txs_${userKey}`, JSON.stringify(currentLocal.slice(0, 100)));
            }

            // Sinkronisasi stok produk lokal (vokasync_products_${userKey}) agar halaman Barang langsung berkurang/bertambah seketika
            const isExpense = type === 'expense';
            const totalP = Number(totalAmount) || 0;
            const qNum = Number(quantity) || 1;
            // Jika transaksi dalam 'Ons' dan barang berdasar kg, harga dasar per kg adalah uPrice * 10
            const rawUnit = (cleanUnit || '').toLowerCase();
            const uPrice = Math.round(totalP / (qNum || 1));
            const pricePerKg = rawUnit === 'ons' ? uPrice * 10 : uPrice;

            const effectiveProduct = result.product || {
              id: result.productId || selectedProductId || 'prod-' + Date.now(),
              user_id: userKey,
              name: productName,
              unit: rawUnit === 'ons' ? 'kg' : (cleanUnit || 'kg'),
              cost_price: isExpense ? pricePerKg : 0,
              selling_price: !isExpense ? pricePerKg : 0,
              margin_percentage: 0,
              action_category: 'pertahankan',
              avg_daily_volume: qNum,
              total_revenue_7d: isExpense ? 0 : totalP,
              remaining_stock: isExpense ? qNum : Math.max(0, 10 - qNum),
              is_stock_low: false,
            };

            const currentProds = JSON.parse(localStorage.getItem(`vokasync_products_${userKey}`) || '[]');
            const pIdx = currentProds.findIndex(
              (p: any) =>
                (selectedProductId && p.id === selectedProductId) ||
                p.id === effectiveProduct.id ||
                (p.name && p.name.trim().toLowerCase() === productName.trim().toLowerCase())
            );

            if (pIdx !== -1) {
              const prev = currentProds[pIdx];
              const isProdKg = (prev.unit || 'kg').toLowerCase().includes('kg') || (prev.unit || '').toLowerCase().includes('kilo');
              const effectivePrice = (rawUnit === 'ons' && isProdKg) ? uPrice * 10 : uPrice;

              // KUNCI: Saat PENJUALAN, harga beli (modal) TIDAK BOLEH naik mengikuti harga jual!
              const cost = isExpense
                ? (effectivePrice > 0 ? effectivePrice : (prev.cost_price || 0))
                : (prev.cost_price && prev.cost_price > 0 ? prev.cost_price : (result.product?.cost_price || 0));

              const selling = !isExpense
                ? (effectivePrice > 0 ? effectivePrice : (prev.selling_price || 0))
                : (prev.selling_price && prev.selling_price > 0 ? prev.selling_price : (result.product?.selling_price || 0));
              const effectiveDelta = (cleanUnit.toLowerCase() === 'ons' && isProdKg)
                ? Math.round(qNum * 0.1 * 100) / 100
                : qNum;

              const currentStock = Number(prev.remaining_stock) || 0;
              const newStock = isExpense
                ? currentStock + effectiveDelta
                : Math.max(0, currentStock - effectiveDelta);

              const margin = selling > 0 && cost > 0
                ? Math.round(((selling - cost) / selling) * 100)
                : 0;

              const category = determineActionCategory(margin, 20);

              currentProds[pIdx] = {
                ...prev,
                ...effectiveProduct,
                cost_price: cost,
                selling_price: selling,
                margin_percentage: margin,
                action_category: category,
                remaining_stock: newStock,
                is_stock_low: newStock <= 2,
              };
            } else {
              currentProds.unshift(effectiveProduct);
            }
            localStorage.setItem(`vokasync_products_${userKey}`, JSON.stringify(currentProds));

            sessionStorage.removeItem(`vokasync_tx_cache_${userKey}`);
            sessionStorage.removeItem(`vokasync_dash_cache_${userKey}`);
            sessionStorage.removeItem(`vokasync_laporan_cache_${userKey}`);
            sessionStorage.removeItem(`vokasync_products_cache_${userKey}`);
            sessionStorage.removeItem('vokasync_tx_cache');
            sessionStorage.removeItem('vokasync_dash_cache');
            sessionStorage.removeItem('vokasync_laporan_cache');
            sessionStorage.removeItem('vokasync_products_cache');

            // Dispatch instant synchronization event to Beranda, Laporan, and Riwayat
            window.dispatchEvent(new CustomEvent('vokasync-transaction-saved', { detail: result.data }));
            window.dispatchEvent(new CustomEvent('vokasync-settings-changed', { detail: { timestamp: Date.now() } }));
          } catch (_) {}
        }

        setShowSuccessToast(true);
        speakConfirmation(productName, quantity, unit, totalAmount, type === 'income');
        setTimeout(() => {
          router.push('/dashboard');
        }, 900);
      } else {
        alert(result.error || 'Gagal menyimpan transaksi.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Navigation Back Pill */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-full border-2 border-slate-200 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Catat Transaksi
        </h1>
        <p className="text-sm sm:text-base font-semibold text-slate-500 mt-1.5 leading-relaxed">
          Setiap kali Anda menjual atau belanja, catat di sini supaya untung Anda selalu terpantau.
        </p>
      </div>

      {/* Calm Success Notification */}
      {showSuccessToast && autoSavedInfo && (
        <div className="bg-[#00875A] text-white p-6 rounded-3xl shadow-xl space-y-2 animate-in fade-in slide-in-from-top-4 duration-300 border-2 border-[#00744D]">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 flex-shrink-0 text-white" />
            <div>
              <h4 className="font-black text-lg">Catatan Berhasil Disimpan!</h4>
              <p className="text-sm text-emerald-100 font-semibold">
                {autoSavedInfo.productName} ({autoSavedInfo.quantity} {autoSavedInfo.unit}) •{' '}
                {autoSavedInfo.type === 'income' ? '+' : '-'}Rp{autoSavedInfo.totalAmount.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          {autoSavedInfo.isNewProduct && (
            <div className="inline-flex items-center gap-2 bg-emerald-800/80 px-3 py-1.5 rounded-xl text-xs font-black text-white border border-emerald-400/40">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>Barang baru &apos;{autoSavedInfo.productName}&apos; otomatis ditambahkan ke daftar Barang Toko</span>
            </div>
          )}
          <p className="text-xs text-emerald-200 pt-1 font-medium">
            Membuka kembali Beranda untuk melihat pembaruan kas...
          </p>
        </div>
      )}



      {/* Voice Review & Confirmation Modal */}
      {voiceConfirmation?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  {voiceConfirmation.isEditing ? (
                    <Edit3 className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {voiceConfirmation.isEditing ? 'Ubah Rincian Catatan' : 'Konfirmasi Hasil Suara'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    {voiceConfirmation.isEditing ? 'Ketik langsung perbaikan di bawah' : 'Periksa kembali sebelum disimpan'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVoiceConfirmation(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Transcript yang didengar */}
            {!voiceConfirmation.isEditing && (
              <p className="text-xs text-slate-500 font-semibold italic text-center bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200/70">
                &quot;{voiceConfirmation.transcript}&quot;
              </p>
            )}

            {/* Tampilan Mode EDIT LANGSUNG vs Mode RINGKASAN */}
            {voiceConfirmation.isEditing ? (
              /* FORMULIR EDIT LANGSUNG DI MODAL */
              <div className="space-y-3.5 text-left pt-1">
                {/* Jenis Transaksi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">Jenis Transaksi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setVoiceConfirmation({
                          ...voiceConfirmation,
                          data: { ...voiceConfirmation.data, type: 'income' },
                        })
                      }
                      className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                        voiceConfirmation.data.type === 'income'
                          ? 'bg-[#00875A] text-white border-[#00744D] shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
                      <span>Uang Masuk</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setVoiceConfirmation({
                          ...voiceConfirmation,
                          data: { ...voiceConfirmation.data, type: 'expense' },
                        })
                      }
                      className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                        voiceConfirmation.data.type === 'expense'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                      <span>Uang Keluar</span>
                    </button>
                  </div>
                </div>

                {/* Nama Barang */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">Nama Barang</label>
                  <input
                    type="text"
                    value={voiceConfirmation.data.product_name || ''}
                    onChange={(e) =>
                      setVoiceConfirmation({
                        ...voiceConfirmation,
                        data: { ...voiceConfirmation.data, product_name: e.target.value },
                      })
                    }
                    placeholder="Contoh: Bawang Merah"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-[#00875A] focus:bg-white outline-hidden"
                  />
                </div>

                {/* Jumlah & Satuan */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Berapa Banyak?</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={voiceConfirmation.data.quantity || 1}
                      onChange={(e) =>
                        setVoiceConfirmation({
                          ...voiceConfirmation,
                          data: {
                            ...voiceConfirmation.data,
                            quantity: Math.max(1, parseFloat(e.target.value) || 1),
                          },
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black text-slate-900 focus:border-[#00875A] focus:bg-white outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">Satuan</label>
                    <select
                      value={voiceConfirmation.data.unit || 'kg'}
                      onChange={(e) =>
                        setVoiceConfirmation({
                          ...voiceConfirmation,
                          data: { ...voiceConfirmation.data, unit: e.target.value },
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-[#00875A] focus:bg-white outline-hidden cursor-pointer"
                    >
                      <option value="kg">kg</option>
                      <option value="Ikat">Ikat</option>
                      <option value="Butir">Butir</option>
                      <option value="Liter">Liter</option>
                      <option value="Gram">Gram</option>
                      <option value="Pack">Pack</option>
                      <option value="Bungkus">Bungkus</option>
                    </select>
                  </div>
                </div>

                {/* Total Nominal Uang */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">Total Nominal Uang (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-700 pointer-events-none">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={
                        voiceConfirmation.data.total_price
                          ? Number(voiceConfirmation.data.total_price).toLocaleString('id-ID')
                          : ''
                      }
                      onChange={(e) => {
                        const numeric = e.target.value.replace(/\D/g, '');
                        setVoiceConfirmation({
                          ...voiceConfirmation,
                          data: {
                            ...voiceConfirmation.data,
                            total_price: numeric ? parseInt(numeric, 10) : 0,
                          },
                        });
                      }}
                      placeholder="0"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-base font-black text-slate-900 focus:border-[#00875A] focus:bg-white outline-hidden"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* DETECTED CARD RINGKASAN */
              <div className="bg-slate-50 border-2 border-slate-200/80 rounded-2xl p-4 space-y-3 text-left">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-2 border-b border-slate-200">
                  <span>Jenis Transaksi</span>
                  <span
                    className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                      voiceConfirmation.data.type === 'expense'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {voiceConfirmation.data.type === 'expense'
                      ? 'Belanja Modal Stok (Uang Keluar)'
                      : 'Penjualan (Uang Masuk)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Barang Dagangan</span>
                  <span className="text-sm font-black text-slate-900">
                    {voiceConfirmation.data.product_name}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Jumlah</span>
                  <span className="text-sm font-black text-slate-800">
                    {voiceConfirmation.data.quantity} {voiceConfirmation.data.unit || 'kg'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-2 border-t border-slate-200">
                  <span>Total Nominal</span>
                  <span className="text-base font-black text-emerald-800">
                    Rp{(voiceConfirmation.data.total_price || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {!voiceConfirmation.isEditing && voiceConfirmation.isSimilar && voiceConfirmation.existingProduct && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  Cocok dengan barang di kios: <strong>{voiceConfirmation.existingProduct.name}</strong>
                </span>
              </div>
            )}

            {/* Tombol Aksi */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                disabled={isAutoSaving}
                onClick={() => {
                  if (isSavingRef.current || isAutoSaving) return;
                  const { data, transcript } = voiceConfirmation;
                  const finalName =
                    !voiceConfirmation.isEditing && voiceConfirmation.isSimilar && voiceConfirmation.existingProduct
                      ? voiceConfirmation.existingProduct.name
                      : data.product_name;
                  setVoiceConfirmation(null);
                  executeSaveTransaction(finalName, data, transcript);
                }}
                className={`w-full py-3.5 px-4 rounded-2xl bg-[#00875A] hover:bg-[#059669] text-white font-black text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isAutoSaving ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {isAutoSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 stroke-[2.5]" />
                    <span>{voiceConfirmation.isEditing ? 'Simpan Perubahan' : 'Simpan ke Catatan'}</span>
                  </>
                )}
              </button>

              {!voiceConfirmation.isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    // Masuk ke mode edit langsung di dalam modal
                    setVoiceConfirmation({
                      ...voiceConfirmation,
                      isEditing: true,
                    });
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Perbaiki / Edit Tulisan Ini</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    // Batalkan mode edit, kembali ke ringkasan suara
                    setVoiceConfirmation({
                      ...voiceConfirmation,
                      isEditing: false,
                    });
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Batal Edit (Kembali ke Ringkasan)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CALM & PATIENT VOICE CARD */}
      <div className="bg-[#EAF7ED] border-2 border-[#C7EED0] rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-xs">
        {/* Badge Pill */}
        <div className="inline-flex items-center gap-1.5 bg-[#00875A] text-white px-4 py-1.5 rounded-full text-xs font-black shadow-2xs">
          <Mic className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Cara Termudah</span>
        </div>

        {/* Big Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            Cukup Ucapkan, Tidak Perlu Mengetik
          </h2>
          <p className="text-sm sm:text-base font-semibold text-slate-600 max-w-lg mx-auto leading-relaxed">
            Tekan tombol mic di bawah, lalu bicara santai tanpa terburu-buru. Suara Anda akan didengarkan dengan tenang.
          </p>
        </div>

        {/* Huge Circular Mic Button with Gentle State */}
        <div className="py-2 space-y-3">
          <button
            type="button"
            onClick={isListening ? finishAndSaveNow : startListening}
            disabled={isProcessingVoice || isAutoSaving}
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center mx-auto shadow-xl transition-all duration-300 cursor-pointer ${
              isListening
                ? 'bg-emerald-600 text-white ring-8 ring-emerald-200 scale-105 animate-pulse'
                : isProcessingVoice || isAutoSaving
                ? 'bg-amber-600 text-white animate-spin'
                : 'bg-[#00875A] hover:bg-[#059669] text-white hover:scale-105 active:scale-95 shadow-emerald-700/25'
            }`}
          >
            {isListening ? (
              <Volume2 className="w-12 h-12 stroke-[2.5]" />
            ) : isProcessingVoice || isAutoSaving ? (
              <Loader2 className="w-12 h-12 animate-spin" />
            ) : (
              <Mic className="w-12 h-12 stroke-[2.5]" />
            )}
          </button>

          <p className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center gap-2">
            {isListening ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span>Sedang mendengarkan... Bicara dengan santai</span>
              </>
            ) : isProcessingVoice ? (
              'Sedang memahami ucapan Anda...'
            ) : isAutoSaving ? (
              'Menyimpan catatan...'
            ) : (
              'Tekan lalu bicara'
            )}
          </p>

          {/* Transcript Display Box */}
          {rawVoiceText && (
            <div className="bg-white/90 border-2 border-emerald-300 p-3.5 rounded-2xl max-w-md mx-auto shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Yang Didengar:
              </span>
              <p className="text-base font-black text-slate-900 leading-snug">
                {rawVoiceText}
              </p>
              {silenceCountdown !== null && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 pt-1">
                  <Clock className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                  <span>Menyimpan otomatis dalam {silenceCountdown} detik... Atau tekan tombol di bawah jika sudah selesai.</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons while listening (gives full patient control) */}
          {isListening && (
            <div className="flex items-center justify-center gap-3 pt-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={finishAndSaveNow}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#00875A] hover:bg-[#059669] text-white py-3 px-4 rounded-2xl font-black text-sm shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Selesai & Simpan</span>
              </button>
              <button
                type="button"
                onClick={cancelListening}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 px-4 rounded-2xl font-bold text-sm cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}
        </div>

        {/* Expanded Voice Guide & Examples */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">
              CONTOH KALIMAT SUARA (KLIK LANGSUNG COBA)
            </p>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Paham Jual & Belanja Stok
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto text-left">
            {/* Penjualan Examples */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-[#00875A] uppercase tracking-wide flex items-center gap-1">
                Contoh Penjualan (Uang Masuk)
              </span>
              {[
                'Jual bawang merah 5 kilo dapat 200 ribu',
                'Jual beras pandan 1 karung 150 ribu',
                'Jual minyak goreng 2 pcs 32 ribu',
                'Jual telur ayam 1 karpet 55 ribu',
              ].map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => processVoiceAndSave(phrase)}
                  className="w-full text-left bg-white hover:bg-emerald-50/70 border-2 border-slate-200/90 hover:border-emerald-500 rounded-2xl py-2.5 px-3.5 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs transition-all cursor-pointer active:scale-98 flex items-center justify-between group"
                >
                  <span className="line-clamp-1">&ldquo;{phrase}&rdquo;</span>
                  <span className="text-[10px] text-emerald-600 group-hover:translate-x-0.5 transition-transform">Tes &rarr;</span>
                </button>
              ))}
            </div>

            {/* Belanja Stok / Pengeluaran Modal Examples */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-rose-600 uppercase tracking-wide flex items-center gap-1">
                Contoh Belanja Stok / Biaya Modal (Uang Keluar)
              </span>
              {[
                'Beli kangkung 10 ikat bayar 100 ribu',
                'Belanja cabai rawit 3 kilo habis 120 ribu',
                'Beli plastik kresek 5 pak 45 ribu',
                'Belanja ayam potong 10 ekor 350 ribu',
              ].map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => processVoiceAndSave(phrase)}
                  className="w-full text-left bg-white hover:bg-rose-50/70 border-2 border-slate-200/90 hover:border-rose-400 rounded-2xl py-2.5 px-3.5 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs transition-all cursor-pointer active:scale-98 flex items-center justify-between group"
                >
                  <span className="line-clamp-1">&ldquo;{phrase}&rdquo;</span>
                  <span className="text-[10px] text-rose-600 group-hover:translate-x-0.5 transition-transform">Tes &rarr;</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 font-medium text-center space-y-0.5">
            <p className="font-extrabold text-emerald-800">Tips Berbicara Cepat & Lancar:</p>
            <p className="text-[11px] text-emerald-700">
              Sebut kata kunci <strong>&quot;Jual&quot;</strong> atau <strong>&quot;Beli / Belanja&quot;</strong> + <strong>Nama Barang</strong> + <strong>Jumlah &amp; Satuan</strong> (kilo, ikat, karung, pcs, ekor) + <strong>Harga / Total</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t-2 border-slate-200" />
        <span className="flex-shrink mx-4 text-sm font-extrabold text-slate-400 uppercase tracking-wider">
          Atau isi sendiri
        </span>
        <div className="flex-grow border-t-2 border-slate-200" />
      </div>

      {/* MANUAL FORM CARD */}
      <form
        onSubmit={handleManualSubmit}
        className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
      >
        {/* Catatan Apa? */}
        <div className="space-y-3">
          <label className="block text-lg font-black text-slate-900">
            Ini catatan apa?
          </label>
          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-4 px-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-[#00875A] text-white border-2 border-[#00744D] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-2 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowDownLeft className="w-5 h-5 stroke-[3]" />
              <span>Uang Masuk</span>
            </button>

            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-4 px-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-600 text-white border-2 border-rose-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-2 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowUpRight className="w-5 h-5 stroke-[3]" />
              <span>Uang Keluar</span>
            </button>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {type === 'income'
              ? 'Pilih ini untuk mencatat transaksi penjualan barang dan penerimaan uang.'
              : 'Pilih ini untuk mencatat belanja persediaan stok atau pengeluaran biaya modal operasional.'}
          </p>
        </div>

        {/* Nama Barang — Autocomplete dari produk nyata */}
        <div className="space-y-2" ref={productSearchRef}>
          <label className="block text-lg font-black text-slate-900 flex items-center gap-2">
            Nama barang
            {selectedProductId && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                ✓ Dari Katalog Kios
              </span>
            )}
          </label>

          {/* Input with dropdown */}
          <div className="relative">
            <input
              id="manual-product-name"
              type="text"
              autoComplete="off"
              value={productSearch}
              onChange={(e) => {
                const val = e.target.value;
                setProductSearch(val);
                setProductName(val);
                setSelectedProductId(null); // reset pilihan jika user mengetik ulang
                setShowProductDropdown(true);
              }}
              onFocus={() => setShowProductDropdown(true)}
              placeholder="Ketik untuk cari produk di kios Anda..."
              className={`w-full bg-slate-50 border-2 rounded-full px-6 py-4 text-base sm:text-lg font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white outline-hidden transition-all ${
                selectedProductId
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-slate-200 focus:border-[#00875A]'
              }`}
              required
            />
            {/* Clear button */}
            {productSearch && (
              <button
                type="button"
                onClick={() => {
                  setProductSearch('');
                  setProductName('');
                  setSelectedProductId(null);
                  setUnit('Kilogram (kg)');
                  setShowProductDropdown(false);
                }}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dropdown produk */}
            {showProductDropdown && (
              <div className="absolute z-40 top-full mt-2 left-0 right-0 bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
                {filteredProducts.length > 0 ? (
                  <>
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Daftar Produk Kios ({filteredProducts.length})
                      </p>
                    </div>
                    <ul className="max-h-56 overflow-y-auto">
                      {filteredProducts.map((p: any) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => {
                              const unitRaw = p.unit || 'kg';
                              // Map unit to select option value
                              const unitMap: Record<string, string> = {
                                kg: 'Kilogram (kg)',
                                kilo: 'Kilogram (kg)',
                                kilogram: 'Kilogram (kg)',
                                ons: 'Ons',
                                ikat: 'Ikat',
                                butir: 'Butir',
                                liter: 'Liter',
                                gr: 'Gram (gr)',
                                gram: 'Gram (gr)',
                                pack: 'Pack',
                                bungkus: 'Bungkus',
                              };
                              const mappedUnit = unitMap[unitRaw.toLowerCase()] || 'Kilogram (kg)';
                              const itemPrice = type === 'expense'
                                ? (Number(p.cost_price) || Number(p.selling_price) || 0)
                                : (Number(p.selling_price) || Number(p.cost_price) || 0);

                              setProductSearch(p.name);
                              setProductName(p.name);
                              setSelectedProductId(p.id);
                              setUnit(mappedUnit);

                              if (itemPrice > 0) {
                                setBasePricePerKg(itemPrice);
                                const q = quantity || 1;
                                if (mappedUnit === 'Ons') {
                                  // 1 kg = 10 ons -> 1 ons = harga kg / 10
                                  setTotalAmount(Math.round((itemPrice / 10) * q));
                                } else {
                                  setTotalAmount(Math.round(itemPrice * q));
                                }
                              }
                              setShowProductDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors flex items-center justify-between gap-3 border-b border-slate-100 last:border-0 cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <Package className="w-4 h-4 text-emerald-700" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-slate-900 truncate">{p.name}</p>
                                <p className="text-[11px] text-slate-500 font-medium">{p.unit || 'kg'}</p>
                              </div>
                            </div>
                            {p.margin_percentage !== undefined && (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${
                                p.margin_percentage >= 20
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.margin_percentage >= 10
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {p.margin_percentage.toFixed(0)}% margin
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {/* Opsi tambah produk baru */}
                    {productSearch.trim().length > 1 && !filteredProducts.some((p: any) =>
                      p.name.toLowerCase() === productSearch.toLowerCase()
                    ) && (
                      <div className="border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            const newName = productSearch.trim();
                            const titleCased = newName.charAt(0).toUpperCase() + newName.slice(1);
                            setProductSearch(titleCased);
                            setProductName(titleCased);
                            setSelectedProductId(null);
                            setShowProductDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Plus className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-700">Tambah "{productSearch.trim()}" sebagai produk baru</p>
                            <p className="text-[11px] text-slate-400 font-medium">Akan otomatis masuk ke daftar barang kios</p>
                          </div>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <p className="text-sm font-bold text-slate-500">Belum ada produk ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Tambahkan produk dari menu <strong>Barang</strong> terlebih dahulu</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Helper text */}
          {!selectedProductId && productsList.length > 0 && !productSearch && (
            <p className="text-xs text-slate-400 font-medium px-2">
              Ketik nama barang untuk mencari dari {productsList.length} produk di kios Anda
            </p>
          )}
        </div>

        {/* Stepper Jumlah & Satuan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Berapa Banyak? */}
          <div className="space-y-2">
            <label className="block text-lg font-black text-slate-900">
              Berapa banyak?
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const newQ = Math.max(1, quantity - 1);
                  setQuantity(newQ);
                  if (basePricePerKg && basePricePerKg > 0) {
                    if (unit === 'Ons') {
                      setTotalAmount(Math.round((basePricePerKg / 10) * newQ));
                    } else if (unit === 'Kilogram (kg)') {
                      setTotalAmount(Math.round(basePricePerKg * newQ));
                    }
                  }
                }}
                className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-800 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                <Minus className="w-6 h-6 stroke-[3]" />
              </button>

              <input
                type="number"
                min="1"
                step="any"
                value={quantity}
                onChange={(e) => {
                  const newQ = Math.max(1, parseFloat(e.target.value) || 1);
                  setQuantity(newQ);
                  if (basePricePerKg && basePricePerKg > 0) {
                    if (unit === 'Ons') {
                      setTotalAmount(Math.round((basePricePerKg / 10) * newQ));
                    } else if (unit === 'Kilogram (kg)') {
                      setTotalAmount(Math.round(basePricePerKg * newQ));
                    }
                  }
                }}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3.5 text-center text-2xl font-black text-slate-900 focus:border-[#00875A] focus:bg-white outline-hidden"
              />

              <button
                type="button"
                onClick={() => {
                  const newQ = quantity + 1;
                  setQuantity(newQ);
                  if (basePricePerKg && basePricePerKg > 0) {
                    if (unit === 'Ons') {
                      setTotalAmount(Math.round((basePricePerKg / 10) * newQ));
                    } else if (unit === 'Kilogram (kg)') {
                      setTotalAmount(Math.round(basePricePerKg * newQ));
                    }
                  }
                }}
                className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-800 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Satuan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-lg font-black text-slate-900">
                Satuan
              </label>
              {unit === 'Ons' && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  1 Ons = 0.1 Kg (Realistis)
                </span>
              )}
            </div>
            <select
              value={unit}
              onChange={(e) => {
                const nextUnit = e.target.value;
                setUnit(nextUnit);
                if (basePricePerKg && basePricePerKg > 0) {
                  const q = quantity || 1;
                  if (nextUnit === 'Ons') {
                    // Realistis: 1 kg = 10 ons
                    setTotalAmount(Math.round((basePricePerKg / 10) * q));
                  } else if (nextUnit === 'Kilogram (kg)') {
                    setTotalAmount(Math.round(basePricePerKg * q));
                  }
                }
              }}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-base sm:text-lg font-bold text-slate-900 focus:border-[#00875A] focus:bg-white outline-hidden cursor-pointer"
            >
              <option value="Kilogram (kg)">Kilogram (kg)</option>
              <option value="Ons">Ons (100 gram / 0.1 kg)</option>
              <option value="Ikat">Ikat</option>
              <option value="Butir">Butir</option>
              <option value="Liter">Liter</option>
              <option value="Gram (gr)">Gram (gr)</option>
              <option value="Pack">Pack</option>
              <option value="Bungkus">Bungkus</option>
            </select>
          </div>
        </div>

        {/* Uang yang Anda terima / bayar */}
        <div className="space-y-2">
          <label className="block text-lg font-black text-slate-900">
            {type === 'income' ? 'Uang yang Anda terima' : 'Uang yang Anda bayar'}
          </label>
          <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-700 pointer-events-none">
              Rp
            </span>
            <input
              type="text"
              value={totalAmount ? totalAmount.toLocaleString('id-ID') : ''}
              onChange={(e) => {
                const numeric = e.target.value.replace(/\D/g, '');
                setTotalAmount(numeric ? parseInt(numeric, 10) : 0);
              }}
              placeholder="0"
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-full pl-16 pr-6 py-4 text-xl sm:text-2xl font-black text-slate-900 focus:border-[#00875A] focus:bg-white outline-hidden transition-all"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#00875A] hover:bg-[#059669] text-white py-4 px-6 rounded-2xl font-black text-xl shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>Simpan Catatan</span>
          )}
        </button>
      </form>
    </div>
  );
}
