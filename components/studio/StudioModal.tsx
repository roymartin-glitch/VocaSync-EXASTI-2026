import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Palette,
  Upload,
  Camera,
  Image as ImageIcon,
  Check,
  Download,
  Wand2,
  RefreshCw,
  ChevronRight,
  MessageCircle,
  Loader2,
  Package,
  Zap,
  Sparkles,
} from 'lucide-react';
import { ProductAnalysisItem } from '@/types';

interface StudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  initialImage?: string;
  price?: number;
  unit?: string;
  storeName?: string;
  phone?: string;
  products?: ProductAnalysisItem[];
  onSelectProduct?: (product: ProductAnalysisItem) => void;
}

export function StudioModal({
  isOpen,
  onClose,
  productName: initialProductName = 'Bawang Merah Brebes',
  initialImage,
  price: initialPrice = 40000,
  unit: initialUnit = 'kg',
  storeName,
  phone = '0812-3456-7890',
  products = [],
  onSelectProduct,
}: StudioModalProps) {
  const effectiveStoreName =
    storeName ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('vokasync_business_name') || 'Kios Berkah Sayur'
      : 'Kios Berkah Sayur');

  const [activeProductName, setActiveProductName] = useState(initialProductName);
  const [activePrice, setActivePrice] = useState(Number(initialPrice) || 0);
  const [activeUnit, setActiveUnit] = useState(initialUnit);
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialImage || null);
  const [originalRawImage, setOriginalRawImage] = useState<string | null>(initialImage || null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFrame, setSelectedFrame] = useState<
    'pasar' | 'minimalis' | 'kriya' | 'neon' | 'panen' | 'royal' | 'canva-pastel' | 'genz-aesthetic'
  >('pasar');
  const [copyStyle, setCopyStyle] = useState<'pasar' | 'fomo' | 'elegan'>('pasar');
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const safePrice = Number(activePrice) || 0;
  const formattedPrice = safePrice > 0 ? `Rp${safePrice.toLocaleString('id-ID')}/${activeUnit || 'kg'}` : `Hubungi Kios`;

  const [promoText, setPromoText] = useState(
    `*PROMO SPESIAL ${effectiveStoreName.toUpperCase()}*\n\n` +
    `Segar langsung dari petani: *${activeProductName}* kualitas pilihan, bersih, dan segar.\n\n` +
    `*Harga Promo:* ${formattedPrice}\n` +
    `*Pesan Antar:* Siap kirim langsung ke alamat Anda.\n\n` +
    `Pesan sekarang via WhatsApp sebelum kehabisan.`
  );

  const [copyProvider, setCopyProvider] = useState<string>('gemini');

  // Sync state when props change
  useEffect(() => {
    if (initialProductName) setActiveProductName(initialProductName);
    if (initialPrice !== undefined) setActivePrice(Number(initialPrice) || 0);
    if (initialUnit) setActiveUnit(initialUnit);
    if (initialImage !== undefined) setUploadedImage(initialImage || null);
  }, [initialProductName, initialPrice, initialUnit, initialImage]);

  // Otomatis buatkan copywriting promosi segar dari Gemini AI saat modal studio dibuka atau komoditas berganti
  useEffect(() => {
    if (isOpen && activeProductName) {
      fetchAiCopy(activeProductName, activePrice, activeUnit, copyStyle);
    }
  }, [isOpen, activeProductName]);

  // Handler for picking product inside StudioModal
  const handlePickProduct = (prod: ProductAnalysisItem) => {
    setActiveProductName(prod.name);
    setActivePrice(Number(prod.selling_price) || 0);
    setActiveUnit(prod.unit || 'kg');
    setUploadedImage(prod.image_url || null);
    if (onSelectProduct) onSelectProduct(prod);
    fetchAiCopy(prod.name, Number(prod.selling_price) || 0, prod.unit || 'kg', copyStyle);
  };

  const fetchAiCopy = async (
    pName = activeProductName,
    pPrice = activePrice,
    pUnit = activeUnit,
    style = copyStyle
  ) => {
    setIsGeneratingCopy(true);
    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: pName,
          price: pPrice,
          unit: pUnit,
          phone,
          storeName: effectiveStoreName,
          style,
        }),
      });
      const data = await res.json();
      if (data.success && data.text) {
        setPromoText(data.text);
        if (data.provider) setCopyProvider(data.provider);
      }
    } catch (e) {
      console.warn('Fallback copywriting on network error:', e);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  // Resize high-resolution camera photo (e.g. 12-48MP from phone) to max 1000px before sending to WASM AI
  // This drastically speeds up background removal from 20s down to ~2-3s with crisp visual quality
  const downscaleImage = (file: File, maxDim = 1000): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim) {
          resolve(file);
          return;
        }
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      img.src = objectUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setOriginalRawImage(url);
      setUploadedImage(url);
      processBackgroundRemoval(file, url);
    }
  };

  // Client-side AI background removal processing with accelerated configuration & pre-downscaling
  const processBackgroundRemoval = async (file: File, fallbackUrl: string) => {
    setIsRemovingBg(true);
    try {
      // 1. Rapid pre-downscale to prevent WASM browser memory stall on high-res camera shots
      const preparedBlob = await downscaleImage(file, 1000);
      const imgly = await import('@imgly/background-removal');
      // Use optimized quantized model for rapid background segmentation
      const blob = await imgly.removeBackground(preparedBlob, {
        model: 'isnet_quint8',
        output: {
          format: 'image/webp',
          quality: 0.9,
        },
      });
      const cleanUrl = URL.createObjectURL(blob);
      setUploadedImage(cleanUrl);
    } catch (err) {
      console.info('Client-side background removal fallback to original photo:', err);
      setUploadedImage(fallbackUrl);
    } finally {
      setIsRemovingBg(false);
      setStep(2);
    }
  };

  // Toggle to revert to original raw photo if user wants instant photo without waiting
  const handleUseOriginalPhoto = () => {
    if (originalRawImage) {
      setUploadedImage(originalRawImage);
      setIsRemovingBg(false);
      setStep(2);
    }
  };

  const handleCopyStyleChange = async (style: 'pasar' | 'fomo' | 'elegan') => {
    setCopyStyle(style);
    await fetchAiCopy(activeProductName, activePrice, activeUnit, style);
  };

  // Generate real-time copy whenever modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAiCopy(activeProductName, activePrice, activeUnit, copyStyle);
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(promoText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Render high-definition 1080x1080 flyer to HTML5 Canvas
  const drawFlyerToCanvas = (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');

      // 1. Draw Background Gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      if (selectedFrame === 'pasar') {
        bgGradient.addColorStop(0, '#064e3b'); // Emerald-900
        bgGradient.addColorStop(0.6, '#0f172a'); // Slate-900
        bgGradient.addColorStop(1, '#022c22'); // Emerald-950
      } else if (selectedFrame === 'minimalis') {
        bgGradient.addColorStop(0, '#f8fafc'); // Slate-50
        bgGradient.addColorStop(1, '#e2e8f0'); // Slate-200
      } else if (selectedFrame === 'kriya') {
        bgGradient.addColorStop(0, '#7c2d12'); // Orange-900
        bgGradient.addColorStop(0.7, '#1c1917'); // Stone-900
        bgGradient.addColorStop(1, '#451a03'); // Amber-950
      } else if (selectedFrame === 'neon') {
        bgGradient.addColorStop(0, '#090d16'); // Dark Void
        bgGradient.addColorStop(0.5, '#1e1b4b'); // Indigo-950
        bgGradient.addColorStop(1, '#020617'); // Slate-950
      } else if (selectedFrame === 'panen') {
        bgGradient.addColorStop(0, '#14532d'); // Green-900
        bgGradient.addColorStop(0.5, '#15803d'); // Green-700
        bgGradient.addColorStop(1, '#052e16'); // Forest-950
      } else if (selectedFrame === 'canva-pastel') {
        bgGradient.addColorStop(0, '#fce7f3'); // Soft Pink-100
        bgGradient.addColorStop(0.5, '#ede9fe'); // Soft Lavender-100
        bgGradient.addColorStop(1, '#e0f2fe'); // Soft Sky-100
      } else if (selectedFrame === 'genz-aesthetic') {
        bgGradient.addColorStop(0, '#0f172a'); // Slate-900
        bgGradient.addColorStop(0.5, '#831843'); // Pink-900
        bgGradient.addColorStop(1, '#312e81'); // Indigo-900
      } else {
        // 'royal' gold & burgundy
        bgGradient.addColorStop(0, '#4a044e'); // Fuchsia-950
        bgGradient.addColorStop(0.6, '#2e1065'); // Purple-950
        bgGradient.addColorStop(1, '#1e1b4b'); // Indigo-950
      }
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1080, 1080);

      // 2. Decorative Outer Border
      ctx.strokeStyle =
        selectedFrame === 'minimalis'
          ? '#cbd5e1'
          : selectedFrame === 'neon'
          ? '#06b6d4'
          : selectedFrame === 'panen'
          ? '#86efac'
          : selectedFrame === 'royal'
          ? '#fbbf24'
          : selectedFrame === 'canva-pastel'
          ? '#f472b6'
          : selectedFrame === 'genz-aesthetic'
          ? '#a855f7'
          : 'rgba(52, 211, 153, 0.35)';
      ctx.lineWidth = selectedFrame === 'royal' || selectedFrame === 'neon' || selectedFrame === 'genz-aesthetic' ? 10 : 8;
      ctx.strokeRect(36, 36, 1008, 1008);

      // Inner subtle border
      ctx.strokeStyle =
        selectedFrame === 'minimalis'
          ? '#e2e8f0'
          : selectedFrame === 'neon'
          ? 'rgba(168, 85, 247, 0.4)'
          : selectedFrame === 'royal'
          ? 'rgba(251, 191, 36, 0.4)'
          : selectedFrame === 'canva-pastel'
          ? 'rgba(244, 114, 182, 0.35)'
          : selectedFrame === 'genz-aesthetic'
          ? 'rgba(56, 189, 248, 0.5)'
          : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 48, 984, 984);

      // 3. Header Store Branding (Clean, Centered, Professional)
      ctx.textAlign = 'center';
      const headerBg = ctx.createLinearGradient(340, 70, 740, 70);
      if (selectedFrame === 'minimalis') {
        headerBg.addColorStop(0, '#0f172a');
        headerBg.addColorStop(1, '#1e293b');
      } else if (selectedFrame === 'canva-pastel') {
        headerBg.addColorStop(0, '#db2777');
        headerBg.addColorStop(1, '#9333ea');
      } else if (selectedFrame === 'neon') {
        headerBg.addColorStop(0, '#06b6d4');
        headerBg.addColorStop(1, '#8b5cf6');
      } else if (selectedFrame === 'royal') {
        headerBg.addColorStop(0, '#d97706');
        headerBg.addColorStop(1, '#b45309');
      } else {
        headerBg.addColorStop(0, '#059669');
        headerBg.addColorStop(1, '#047857');
      }

      // Elegant Pill Banner in Top Center
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = headerBg;
      ctx.beginPath();
      ctx.roundRect(320, 70, 440, 68, 34);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(effectiveStoreName.toUpperCase(), 540, 113);

      // 4. Draw Product on Studio Stage (Seamless Pedestal & Natural Shadow)
      const renderProductImage = () => {
        if (uploadedImage) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const centerX = 540;
            const centerY = 410;

            // A. Ambient Spotlight Glow Behind Product
            ctx.save();
            const spotGlow = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 320);
            if (selectedFrame === 'minimalis') {
              spotGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
              spotGlow.addColorStop(1, 'rgba(241, 245, 249, 0)');
            } else if (selectedFrame === 'canva-pastel') {
              spotGlow.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
              spotGlow.addColorStop(0.5, 'rgba(253, 230, 242, 0.5)');
              spotGlow.addColorStop(1, 'rgba(240, 249, 255, 0)');
            } else if (selectedFrame === 'neon') {
              spotGlow.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
              spotGlow.addColorStop(0.6, 'rgba(168, 85, 247, 0.15)');
              spotGlow.addColorStop(1, 'rgba(2, 6, 23, 0)');
            } else {
              spotGlow.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
              spotGlow.addColorStop(0.6, 'rgba(16, 185, 129, 0.15)');
              spotGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            }
            ctx.fillStyle = spotGlow;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 320, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // B. Circular Studio Stage / Disc Base
            ctx.save();
            const discGrad = ctx.createLinearGradient(centerX - 240, centerY + 180, centerX + 240, centerY + 240);
            if (selectedFrame === 'minimalis') {
              discGrad.addColorStop(0, '#ffffff');
              discGrad.addColorStop(1, '#e2e8f0');
            } else if (selectedFrame === 'canva-pastel') {
              discGrad.addColorStop(0, '#ffffff');
              discGrad.addColorStop(1, '#fbcfe8');
            } else if (selectedFrame === 'neon') {
              discGrad.addColorStop(0, '#1e1b4b');
              discGrad.addColorStop(1, '#0f172a');
            } else {
              discGrad.addColorStop(0, '#065f46');
              discGrad.addColorStop(1, '#022c22');
            }
            ctx.fillStyle = discGrad;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + 195, 260, 48, 0, 0, Math.PI * 2);
            ctx.fill();

            // Disc edge highlight
            ctx.strokeStyle =
              selectedFrame === 'canva-pastel'
                ? 'rgba(244, 114, 182, 0.5)'
                : selectedFrame === 'neon'
                ? '#22d3ee'
                : 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.restore();

            // C. Realistic Soft Contact Drop Shadow directly under product
            ctx.save();
            const contactShadow = ctx.createRadialGradient(centerX, centerY + 185, 10, centerX, centerY + 185, 200);
            contactShadow.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
            contactShadow.addColorStop(0.4, 'rgba(0, 0, 0, 0.25)');
            contactShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = contactShadow;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + 185, 200, 28, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // D. Draw Product Image (Proportionally fit, not stretched or boxed)
            ctx.save();
            const maxBoxSize = 460;
            const imgAspect = (img.width || 1) / (img.height || 1);
            let drawW = maxBoxSize;
            let drawH = maxBoxSize;
            if (imgAspect > 1) {
              drawH = maxBoxSize / imgAspect;
            } else {
              drawW = maxBoxSize * imgAspect;
            }
            const drawX = centerX - drawW / 2;
            const drawY = centerY - drawH / 2 + 10;

            // Photography lighting & vibrancy filter
            ctx.filter = 'contrast(1.08) saturate(1.18) brightness(1.03)';
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.restore();

            finishDrawingTypography();
          };
          img.onerror = () => finishDrawingTypography();
          img.src = uploadedImage;
        } else {
          // Placeholder
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.beginPath();
          ctx.roundRect(320, 200, 440, 440, 36);
          ctx.fill();

          ctx.fillStyle = selectedFrame === 'minimalis' ? '#64748b' : '#94a3b8';
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Foto Produk', 540, 430);
          ctx.restore();

          finishDrawingTypography();
        }
      };

      const finishDrawingTypography = () => {
        // 5. Product Title (Clear, Premium Headline)
        ctx.textAlign = 'center';
        ctx.fillStyle =
          selectedFrame === 'minimalis'
            ? '#0f172a'
            : selectedFrame === 'canva-pastel'
            ? '#831843'
            : '#ffffff';
        ctx.font = 'bold 56px sans-serif';
        ctx.fillText(activeProductName, 540, 745);

        // Subtitle / Guarantee line
        ctx.fillStyle =
          selectedFrame === 'minimalis'
            ? '#64748b'
            : selectedFrame === 'canva-pastel'
            ? '#9d174d'
            : '#94a3b8';
        ctx.font = '600 28px sans-serif';
        ctx.fillText('Kualitas Pilihan Super • Segar & Amanah', 540, 792);

        // 6. Price Badge Banner (Modern Card with Soft Shadow)
        ctx.save();
        const priceBg = ctx.createLinearGradient(290, 830, 790, 915);
        if (selectedFrame === 'minimalis') {
          priceBg.addColorStop(0, '#059669');
          priceBg.addColorStop(1, '#047857');
        } else if (selectedFrame === 'canva-pastel') {
          priceBg.addColorStop(0, '#ec4899');
          priceBg.addColorStop(1, '#db2777');
        } else if (selectedFrame === 'neon') {
          priceBg.addColorStop(0, '#9333ea');
          priceBg.addColorStop(1, '#6366f1');
        } else if (selectedFrame === 'royal') {
          priceBg.addColorStop(0, '#f59e0b');
          priceBg.addColorStop(1, '#d97706');
        } else {
          priceBg.addColorStop(0, '#10b981');
          priceBg.addColorStop(1, '#059669');
        }

        ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = priceBg;
        ctx.beginPath();
        ctx.roundRect(290, 830, 500, 86, 26);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.fillText(`Harga: ${formattedPrice}`, 540, 890);

        // 7. Footer Contact WhatsApp (Clean Pill with WhatsApp icon feel)
        ctx.fillStyle =
          selectedFrame === 'minimalis'
            ? '#334155'
            : selectedFrame === 'canva-pastel'
            ? '#475569'
            : 'rgba(255, 255, 255, 0.95)';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`Pesan via WhatsApp: ${phone}`, 540, 985);
        ctx.textAlign = 'left';

        resolve(canvas.toDataURL('image/png'));
      };

      renderProductImage();
    });
  };

  // Real Download handler: downloads flyer as high-res PNG
  const handleDownloadImage = async () => {
    setIsDownloading(true);
    try {
      const dataUrl = await drawFlyerToCanvas();
      if (!dataUrl) throw new Error('Gagal merender gambar.');

      const link = document.createElement('a');
      link.download = `Promo-${activeProductName.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (e: any) {
      alert('Gagal mengunduh gambar: ' + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper: Convert dataUrl to Blob File for native Web Share API
  const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: 'image/png' });
  };

  // WhatsApp Direct sender with Dual Delivery (Web Share API for native image+text sharing, Cloudinary link fallback)
  const handleSendWA = async () => {
    setIsUploadingToCloud(true);
    let finalUrl = cloudinaryUrl;

    try {
      // 1. Generate flyer from Canvas
      const flyerDataUrl = await drawFlyerToCanvas();
      if (!flyerDataUrl) throw new Error('Brosur belum siap');

      // 2. Priority: Web Share API (Direct Image + Text into WhatsApp)
      // Supported on Chrome Android, Safari iOS, Edge Mobile, and modern browsers
      const flyerFileName = `Promo-${activeProductName.replace(/\s+/g, '-')}.png`;
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        try {
          const flyerFile = await dataUrlToFile(flyerDataUrl, flyerFileName);
          if (navigator.canShare && navigator.canShare({ files: [flyerFile] })) {
            await navigator.share({
              title: `Promo Spesial: ${activeProductName}`,
              text: promoText,
              files: [flyerFile],
            });
            setIsUploadingToCloud(false);
            return;
          }
        } catch (shareErr: any) {
          // If user aborted or canceled share dialog, stop quietly
          if (shareErr?.name === 'AbortError') {
            setIsUploadingToCloud(false);
            return;
          }
          console.info('Native share unavailable, proceeding to WhatsApp link fallback:', shareErr);
        }
      }

      // 3. Fallback for Desktop: Auto-copy promo text, auto-download flyer image, upload link to WhatsApp
      try {
        await navigator.clipboard.writeText(promoText);
        setIsCopied(true);
      } catch (_) {}

      // Auto download image flyer for desktop so user can immediately drag/paste to WhatsApp
      const downloadLink = document.createElement('a');
      downloadLink.download = flyerFileName;
      downloadLink.href = flyerDataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Upload to Cloudinary to provide public image preview link in message
      if (!finalUrl) {
        const res = await fetch('/api/upload-studio-flyer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: flyerDataUrl,
            productName: activeProductName,
          }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          finalUrl = data.url;
          setCloudinaryUrl(data.url);
        }
      }

      let fullMessage = promoText;
      if (finalUrl) {
        fullMessage += `\n\n*Brosur Promo:* ${finalUrl}`;
      }

      setShareNotice('Brosur telah diunduh dan teks disalin! WhatsApp sedang dibuka...');
      setTimeout(() => setShareNotice(null), 4000);

      const encoded = encodeURIComponent(fullMessage);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    } catch (err) {
      console.warn('WhatsApp share fallback notice:', err);
      const encoded = encodeURIComponent(promoText);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 px-5 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl flex-shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">Studio Brosur & Promosi WhatsApp</h3>
              <p className="text-[11px] text-slate-500">Rapikan foto produk otomatis & susun pesan promosi siap kirim</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
            <div className={`flex items-center gap-2 font-bold text-sm ${step >= 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">1</span>
              <span>Foto Produk</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <div className={`flex items-center gap-2 font-bold text-sm ${step >= 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">2</span>
              <span>Studio Frame</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <div className={`flex items-center gap-2 font-bold text-sm ${step >= 3 ? 'text-emerald-700' : 'text-slate-400'}`}>
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">3</span>
              <span>Kirim WhatsApp</span>
            </div>
          </div>

          {/* Product Picker if multiple products provided */}
          {products && products.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-emerald-700" />
                  <span>Pilih Produk Toko:</span>
                </span>
                <span className="text-xs text-slate-500">{products.length} barang tersedia</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                {products.map((p) => {
                  const isSelected = activeProductName.toLowerCase() === p.name.toLowerCase();
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePickProduct(p)}
                      className={`min-h-[40px] px-4 py-2 rounded-xl border text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>{p.name}</span>
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Context */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex items-center gap-3 text-emerald-950">
            <Wand2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            <span className="text-sm">
              Target Kampanye: <strong>{activeProductName}</strong> ({formattedPrice}). Promosi visual profesional akan memulihkan penjualan produk ini ke pelanggan langganan.
            </span>
          </div>

          {/* Visual Canvas Header & Controls */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span>Visual Studio Mockup Canvas</span>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-600" /> AI Cepat
                </span>
              </label>
              
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {/* Kamera Button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="min-h-[38px] text-white bg-emerald-700 hover:bg-emerald-800 font-bold flex items-center gap-1.5 cursor-pointer px-3.5 py-1.5 rounded-xl shadow-xs transition-colors text-xs active:scale-95"
                  title="Ambil foto langsung dari kamera HP atau perangkat"
                >
                  <Camera className="w-4 h-4" />
                  <span>Kamera</span>
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Upload File Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[38px] text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 font-bold flex items-center gap-1.5 cursor-pointer px-3.5 py-1.5 rounded-xl transition-colors text-xs active:scale-95"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Unggah Galeri</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {shareNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-900 text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">{shareNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShareNotice(null)}
                  className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div
              className={`relative aspect-video rounded-3xl overflow-hidden p-6 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-300 ${
                selectedFrame === 'pasar'
                  ? 'bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white'
                  : selectedFrame === 'minimalis'
                  ? 'bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-900 border-4 border-slate-300'
                  : selectedFrame === 'kriya'
                  ? 'bg-gradient-to-br from-amber-800 via-orange-900 to-stone-900 text-amber-50'
                  : selectedFrame === 'neon'
                  ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-cyan-300 border-2 border-cyan-500/50'
                  : selectedFrame === 'panen'
                  ? 'bg-gradient-to-br from-green-800 via-emerald-700 to-green-950 text-white'
                  : selectedFrame === 'canva-pastel'
                  ? 'bg-gradient-to-br from-pink-100 via-purple-100 to-sky-100 text-slate-800 border-4 border-pink-300/80 shadow-md'
                  : selectedFrame === 'genz-aesthetic'
                  ? 'bg-gradient-to-br from-slate-950 via-pink-950 to-indigo-950 text-pink-200 border-2 border-purple-500/80 shadow-indigo-500/20'
                  : 'bg-gradient-to-br from-fuchsia-950 via-purple-950 to-indigo-950 text-amber-100 border-2 border-amber-400/60'
              }`}
            >
              {/* Studio Frame Overlay Graphic */}
              <div
                className={`absolute inset-3 border-2 rounded-2xl pointer-events-none flex flex-col justify-between p-3.5 ${
                  selectedFrame === 'minimalis'
                    ? 'border-slate-400/40'
                    : selectedFrame === 'neon'
                    ? 'border-cyan-400/60'
                    : selectedFrame === 'panen'
                    ? 'border-emerald-300/60'
                    : selectedFrame === 'royal'
                    ? 'border-amber-400/70'
                    : selectedFrame === 'canva-pastel'
                    ? 'border-pink-400/60'
                    : selectedFrame === 'genz-aesthetic'
                    ? 'border-purple-400/70 ring-1 ring-pink-400/40'
                    : 'border-emerald-300/40'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-md shadow-sm ${
                      selectedFrame === 'minimalis'
                        ? 'bg-slate-900 text-white'
                        : selectedFrame === 'neon'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500'
                        : selectedFrame === 'royal'
                        ? 'bg-amber-500 text-purple-950 font-black'
                        : selectedFrame === 'canva-pastel'
                        ? 'bg-pink-600 text-white'
                        : selectedFrame === 'genz-aesthetic'
                        ? 'bg-purple-600 text-white border border-pink-400'
                        : 'bg-emerald-950/80 text-emerald-200'
                    }`}
                  >
                    {effectiveStoreName.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold opacity-80">Pesanan WA: {phone}</span>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                    {selectedFrame === 'royal'
                      ? 'Pilihan Sultan'
                      : selectedFrame === 'canva-pastel'
                      ? 'Trendy & Aesthetic'
                      : selectedFrame === 'genz-aesthetic'
                      ? 'Viral & Stylish'
                      : 'Kualitas Pilihan'}
                  </span>
                </div>
              </div>

              {/* Product Image Stage */}
              {isRemovingBg ? (
                <div className="flex flex-col items-center gap-3 py-6 animate-pulse z-20">
                  <RefreshCw className="w-9 h-9 animate-spin text-emerald-400" />
                  <div className="text-center">
                    <p className="font-bold text-sm text-white">Sedang merapikan foto produk...</p>
                    <p className="text-[11px] text-emerald-200 mt-0.5">Model AI dipercepat & dioptimalkan</p>
                  </div>
                  {originalRawImage && (
                    <button
                      type="button"
                      onClick={handleUseOriginalPhoto}
                      className="mt-2 text-[11px] font-bold text-white/90 underline hover:text-white bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-md cursor-pointer transition-colors"
                    >
                      Gunakan Foto Asli Langsung (Instan) &rarr;
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 z-10 w-full flex flex-col items-center">
                  {/* Studio Spotlight & Pedestal Stage */}
                  <div className="relative group">
                    {/* Background Radial Glow */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-amber-400/20 to-sky-500/20 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />

                    {/* Product Container */}
                    <div className="relative w-36 h-36 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto shadow-2xl border border-white/40 overflow-hidden">
                      {uploadedImage ? (
                        <img
                          src={uploadedImage}
                          alt="Product"
                          className="w-full h-full object-cover rounded-3xl filter brightness-105 contrast-105 saturate-115 transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-2">
                          <Package className="w-10 h-10 text-white/90 mb-1" />
                          <span className="text-[10px] font-bold text-white/80">Produk Segar</span>
                        </div>
                      )}

                      {/* Gloss Highlight Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-transparent pointer-events-none rounded-3xl" />
                    </div>

                    {/* 3D Ground Pedestal Shadow */}
                    <div className="w-28 h-3.5 mx-auto mt-1 rounded-full bg-black/35 blur-xs" />
                  </div>

                  <h4 className="text-2xl font-black tracking-tight">{activeProductName}</h4>
                  <p className="text-sm opacity-90 max-w-sm mx-auto">
                    Kualitas Super • Langsung Petani • Garansi Segar
                  </p>
                </div>
              )}
            </div>

            {/* Frame Choice */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="font-semibold text-slate-700 text-sm">Pilih Template Frame Studio:</span>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'pasar', label: 'Pasar Tradisional' },
                  { id: 'minimalis', label: 'Minimalis Elegan' },
                  { id: 'canva-pastel', label: 'Pastel Lembut' },
                  { id: 'genz-aesthetic', label: 'Modern Dinamis' },
                  { id: 'kriya', label: 'Kuliner & Kriya' },
                  { id: 'neon', label: 'Neon Midnight' },
                  { id: 'panen', label: 'Panen Kebun' },
                  { id: 'royal', label: 'Royal Gold' },
                ].map((fr) => (
                  <button
                    key={fr.id}
                    type="button"
                    onClick={() => setSelectedFrame(fr.id as any)}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl border font-bold transition-all cursor-pointer text-xs sm:text-sm ${
                      selectedFrame === fr.id
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-800 shadow-sm ring-2 ring-emerald-600/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {fr.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Copywriting Section */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-700" />
                  <span>Pesan Promosi Siap Kirim WhatsApp</span>
                </label>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-violet-100 text-violet-900 border border-violet-300/80 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-violet-700 animate-pulse" />
                  <span>{copyProvider === 'gemini' ? 'Disusun oleh Google Gemini AI' : 'VokaSync AI Copywriter'}</span>
                </span>
              </div>

              {/* Tone style toggles & Regenerate */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: 'pasar', label: 'Ramah Pasar' },
                  { id: 'fomo', label: 'Promo Kilat' },
                  { id: 'elegan', label: 'Elegan & Profesional' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isGeneratingCopy}
                    onClick={() => handleCopyStyleChange(s.id as any)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      copyStyle === s.id
                        ? 'bg-emerald-800 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={isGeneratingCopy}
                  onClick={() => handleCopyStyleChange(copyStyle)}
                  title="Buat ulang variasi kalimat baru"
                  className="min-h-[40px] px-4 py-2 rounded-xl text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isGeneratingCopy ? 'animate-spin' : ''}`} />
                  <span>Ganti Kalimat</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={5}
                value={promoText}
                onChange={(e) => setPromoText(e.target.value)}
                disabled={isGeneratingCopy}
                className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:bg-white focus:outline-emerald-600 transition-all leading-relaxed font-medium"
              />
              {isGeneratingCopy && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-emerald-800">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
                  <span>Menyusun pesan promosi otomatis...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Pesan terhubung langsung dengan nama & harga barang toko.
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="min-h-[40px] text-sm text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-2 cursor-pointer bg-emerald-50 border border-emerald-200/80 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-700 stroke-[3]" /> : null}
                <span>{isCopied ? 'Tersalin ke WhatsApp!' : 'Salin Teks'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hidden Canvas for High-Res 1080x1080 Flyer Generation */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-5 px-4 sm:px-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-b-3xl flex-shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-800 px-3 py-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            {/* Real Download Button */}
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadImage}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 border text-xs sm:text-sm font-bold px-3 sm:px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                downloadSuccess
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
              }`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  <span>Merender...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Simpan Brosur</span>
                </>
              )}
            </button>

            {/* Real WhatsApp Direct Sender */}
            <button
              type="button"
              disabled={isUploadingToCloud}
              onClick={handleSendWA}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold px-4 sm:px-6 py-2.5 rounded-xl shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            >
              {isUploadingToCloud ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cloud WA...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span>Kirim WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
