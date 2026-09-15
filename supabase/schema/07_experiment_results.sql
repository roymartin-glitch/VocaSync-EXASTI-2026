-- ==============================================================================
-- TABEL 7: EXPERIMENT_RESULTS
-- Deskripsi: Checkpoint berkala evaluasi metrik dan narasi evaluasi (verdict) AI
-- ==============================================================================

-- 1. Buat Tabel experiment_results
CREATE TABLE IF NOT EXISTS public.experiment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_metric JSONB NOT NULL DEFAULT '{}'::JSONB,
  evaluation_status TEXT CHECK (evaluation_status IN ('in_progress', 'success', 'partial', 'failed')),
  ai_verdict_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk checkpoint eksperimen
CREATE INDEX IF NOT EXISTS idx_experiment_results_exp ON public.experiment_results(experiment_id, recorded_at DESC);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.experiment_results ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS (Diwariskan dari kepemilikan tabel experiments induk)
DROP POLICY IF EXISTS "Users can view own experiment results" ON public.experiment_results;
CREATE POLICY "Users can view own experiment results" 
  ON public.experiment_results FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.experiments 
      WHERE public.experiments.id = public.experiment_results.experiment_id 
      AND public.experiments.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own experiment results" ON public.experiment_results;
CREATE POLICY "Users can insert own experiment results" 
  ON public.experiment_results FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.experiments 
      WHERE public.experiments.id = public.experiment_results.experiment_id 
      AND public.experiments.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own experiment results" ON public.experiment_results;
CREATE POLICY "Users can update own experiment results" 
  ON public.experiment_results FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.experiments 
      WHERE public.experiments.id = public.experiment_results.experiment_id 
      AND public.experiments.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own experiment results" ON public.experiment_results;
CREATE POLICY "Users can delete own experiment results" 
  ON public.experiment_results FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.experiments 
      WHERE public.experiments.id = public.experiment_results.experiment_id 
      AND public.experiments.user_id = auth.uid()
    )
  );
