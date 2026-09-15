-- ==============================================================================
-- 09_EXTENDED_SETTINGS.SQL
-- Kolom tambahan untuk pengaturan profil, peringatan, suara, tampilan, dan analisis
-- VokaSync — AI Business Advisor untuk Pedagang Pasar & UMKM
-- ==============================================================================

-- 1. Tambah kolom pengaturan ke tabel profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS low_stock_threshold NUMERIC DEFAULT 20,
  ADD COLUMN IF NOT EXISTS supplier_cost_increase_threshold NUMERIC DEFAULT 5,
  ADD COLUMN IF NOT EXISTS sound_alert_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sound_alert_volume NUMERIC DEFAULT 80,
  ADD COLUMN IF NOT EXISTS text_size TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'terang',
  ADD COLUMN IF NOT EXISTS default_unit TEXT DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS analysis_period TEXT DEFAULT '7d',
  ADD COLUMN IF NOT EXISTS app_settings JSONB DEFAULT '{}';

-- 2. Komentar dokumentasi kolom
COMMENT ON COLUMN public.profiles.low_stock_threshold IS 'Batas sisa stok hampir habis (%) dari kulakan awal (1-99)';
COMMENT ON COLUMN public.profiles.supplier_cost_increase_threshold IS 'Batas kenaikan harga beli dari supplier (%) yang memicu peringatan (1-99)';
COMMENT ON COLUMN public.profiles.sound_alert_enabled IS 'Toggle suara peringatan bersuara otomatis';
COMMENT ON COLUMN public.profiles.sound_alert_volume IS 'Volume audio peringatan (0-100)';
COMMENT ON COLUMN public.profiles.text_size IS 'Ukuran font teks aplikasi: normal, besar, sangat-besar';
COMMENT ON COLUMN public.profiles.default_unit IS 'Satuan komoditas default pada pencatatan transaksi';
COMMENT ON COLUMN public.profiles.analysis_period IS 'Periode waktu analisis laba default: 7d, 30d, 3m';
