-- ==============================================================================
-- 08_STOCK_BATCHES.SQL
-- Tabel pelacakan stok batch untuk metode FIFO (First-In, First-Out)
-- VokaSync — AI Business Advisor untuk Pedagang Pasar & UMKM
-- ==============================================================================

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing untuk query FIFO cepat (berurutan dari yang paling lama masuk)
CREATE INDEX IF NOT EXISTS idx_stock_batches_fifo 
  ON public.stock_batches(product_id, status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_stock_batches_user 
  ON public.stock_batches(user_id, status);

-- Row Level Security (RLS)
ALTER TABLE public.stock_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own stock batches"
  ON public.stock_batches
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
