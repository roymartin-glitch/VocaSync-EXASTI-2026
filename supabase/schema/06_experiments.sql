-- ==============================================================================
-- TABEL 6: EXPERIMENTS
-- Deskripsi: Tracking tindakan bisnis rekomendasi AI yang dijalankan pengguna
-- ==============================================================================

-- 1. Buat Tabel experiments
CREATE TABLE IF NOT EXISTS public.experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed')),
  baseline_metric JSONB NOT NULL DEFAULT '{}'::JSONB,
  target_metric JSONB DEFAULT '{}'::JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk filter status eksperimen per user
CREATE INDEX IF NOT EXISTS idx_experiments_user_status ON public.experiments(user_id, status);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS
DROP POLICY IF EXISTS "Users can view own experiments" ON public.experiments;
CREATE POLICY "Users can view own experiments" 
  ON public.experiments FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own experiments" ON public.experiments;
CREATE POLICY "Users can insert own experiments" 
  ON public.experiments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own experiments" ON public.experiments;
CREATE POLICY "Users can update own experiments" 
  ON public.experiments FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own experiments" ON public.experiments;
CREATE POLICY "Users can delete own experiments" 
  ON public.experiments FOR DELETE 
  USING (auth.uid() = user_id);
