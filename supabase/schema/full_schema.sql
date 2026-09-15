-- ==============================================================================
-- VOKASYNC FULL DATABASE SCHEMA (EXASTI 2.0 - SDGs 9)
-- Seluruh 7 Tabel + RLS Policies + Triggers Otomatis
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABEL PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT DEFAULT 'Kios Berkah Sayur',
  owner_name TEXT DEFAULT 'Pak Budi',
  business_type TEXT DEFAULT 'pasar' CHECK (business_type IN ('pasar', 'kuliner', 'kriya', 'kelontong', 'lainnya')),
  margin_alert_threshold NUMERIC DEFAULT 20,
  low_stock_threshold NUMERIC DEFAULT 20,
  supplier_cost_increase_threshold NUMERIC DEFAULT 5,
  sound_alert_enabled BOOLEAN DEFAULT false,
  sound_alert_volume NUMERIC DEFAULT 80,
  text_size TEXT DEFAULT 'normal',
  theme TEXT DEFAULT 'terang',
  default_unit TEXT DEFAULT 'kg',
  analysis_period TEXT DEFAULT '7d',
  app_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger auto create profile on user registration (dynamically extracts registered names)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    business_name,
    owner_name,
    business_type,
    margin_alert_threshold,
    low_stock_threshold,
    supplier_cost_increase_threshold,
    theme,
    text_size
  )
  VALUES (
    new.id,
    COALESCE(NULLIF(new.raw_user_meta_data->>'business_name', ''), 'Kios Dagang Saya'),
    COALESCE(NULLIF(new.raw_user_meta_data->>'owner_name', ''), split_part(new.email, '@', 1)),
    COALESCE(NULLIF(new.raw_user_meta_data->>'business_type', ''), 'pasar'),
    20,
    20,
    5,
    'terang',
    'normal'
  )
  ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    owner_name = EXCLUDED.owner_name,
    business_type = EXCLUDED.business_type;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. TABEL PRODUCTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_unit TEXT NOT NULL DEFAULT 'kg',
  image_url TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own products" ON public.products;
CREATE POLICY "Users can view own products" ON public.products FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
CREATE POLICY "Users can insert own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own products" ON public.products;
CREATE POLICY "Users can update own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Users can delete own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. TABEL TRANSACTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('voice', 'manual')),
  raw_voice_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(user_id, type);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. TABEL TRANSACTION_ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_transaction_items_tx ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product ON public.transaction_items(product_id);

ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transaction items" ON public.transaction_items;
CREATE POLICY "Users can view own transaction items" ON public.transaction_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.transactions WHERE public.transactions.id = public.transaction_items.transaction_id AND public.transactions.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own transaction items" ON public.transaction_items;
CREATE POLICY "Users can insert own transaction items" ON public.transaction_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.transactions WHERE public.transactions.id = public.transaction_items.transaction_id AND public.transactions.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own transaction items" ON public.transaction_items;
CREATE POLICY "Users can update own transaction items" ON public.transaction_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.transactions WHERE public.transactions.id = public.transaction_items.transaction_id AND public.transactions.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own transaction items" ON public.transaction_items;
CREATE POLICY "Users can delete own transaction items" ON public.transaction_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.transactions WHERE public.transactions.id = public.transaction_items.transaction_id AND public.transactions.user_id = auth.uid())
);

-- ------------------------------------------------------------------------------
-- 5. TABEL AI_INSIGHTS
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_created ON public.ai_insights(user_id, created_at DESC);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own insights" ON public.ai_insights;
CREATE POLICY "Users can view own insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own insights" ON public.ai_insights;
CREATE POLICY "Users can insert own insights" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own insights" ON public.ai_insights;
CREATE POLICY "Users can delete own insights" ON public.ai_insights FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. TABEL EXPERIMENTS
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_experiments_user_status ON public.experiments(user_id, status);

ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own experiments" ON public.experiments;
CREATE POLICY "Users can view own experiments" ON public.experiments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own experiments" ON public.experiments;
CREATE POLICY "Users can insert own experiments" ON public.experiments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own experiments" ON public.experiments;
CREATE POLICY "Users can update own experiments" ON public.experiments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own experiments" ON public.experiments;
CREATE POLICY "Users can delete own experiments" ON public.experiments FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. TABEL EXPERIMENT_RESULTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.experiment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_metric JSONB NOT NULL DEFAULT '{}'::JSONB,
  evaluation_status TEXT CHECK (evaluation_status IN ('in_progress', 'success', 'partial', 'failed')),
  ai_verdict_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experiment_results_exp ON public.experiment_results(experiment_id, recorded_at DESC);

ALTER TABLE public.experiment_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own experiment results" ON public.experiment_results;
CREATE POLICY "Users can view own experiment results" ON public.experiment_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.experiments WHERE public.experiments.id = public.experiment_results.experiment_id AND public.experiments.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own experiment results" ON public.experiment_results;
CREATE POLICY "Users can insert own experiment results" ON public.experiment_results FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.experiments WHERE public.experiments.id = public.experiment_results.experiment_id AND public.experiments.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own experiment results" ON public.experiment_results;
CREATE POLICY "Users can update own experiment results" ON public.experiment_results FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.experiments WHERE public.experiments.id = public.experiment_results.experiment_id AND public.experiments.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own experiment results" ON public.experiment_results;
CREATE POLICY "Users can delete own experiment results" ON public.experiment_results FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.experiments WHERE public.experiments.id = public.experiment_results.experiment_id AND public.experiments.user_id = auth.uid())
);

-- ------------------------------------------------------------------------------
-- 8. TABEL STOCK_BATCHES (FIFO Inventory Tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  initial_quantity NUMERIC NOT NULL CHECK (initial_quantity > 0),
  remaining_quantity NUMERIC NOT NULL CHECK (remaining_quantity >= 0),
  cost_price NUMERIC NOT NULL CHECK (cost_price >= 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'depleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_batches_fifo ON public.stock_batches(product_id, status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_stock_batches_user ON public.stock_batches(user_id, status);

ALTER TABLE public.stock_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own stock batches" ON public.stock_batches;
CREATE POLICY "Users can manage own stock batches" ON public.stock_batches FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 9. SUPABASE STORAGE (Bucket product-images)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
CREATE POLICY "Users can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Users can update their product images" ON storage.objects;
CREATE POLICY "Users can update their product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Users can delete their product images" ON storage.objects;
CREATE POLICY "Users can delete their product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');


