-- ==============================================================================
-- TABEL 5: AI_INSIGHTS
-- Deskripsi: Riwayat narasi insight, peringatan, dan severity deterministik AI
-- ==============================================================================

-- 1. Buat Tabel ai_insights
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('red', 'yellow', 'green')),
  message TEXT NOT NULL,
  has_quick_action BOOLEAN NOT NULL DEFAULT FALSE,
  metric_snapshot JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk feed kronologis per user
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_created ON public.ai_insights(user_id, created_at DESC);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS
DROP POLICY IF EXISTS "Users can view own insights" ON public.ai_insights;
CREATE POLICY "Users can view own insights" 
  ON public.ai_insights FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own insights" ON public.ai_insights;
CREATE POLICY "Users can insert own insights" 
  ON public.ai_insights FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own insights" ON public.ai_insights;
CREATE POLICY "Users can delete own insights" 
  ON public.ai_insights FOR DELETE 
  USING (auth.uid() = user_id);
