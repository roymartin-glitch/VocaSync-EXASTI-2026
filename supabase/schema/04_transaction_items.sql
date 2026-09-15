-- ==============================================================================
-- TABEL 4: TRANSACTION_ITEMS
-- Deskripsi: Rincian item per transaksi.
-- CATATAN PENTING: unit_price adalah satu-satunya sumber kebenaran harga modal & harga jual.
-- ==============================================================================

-- 1. Buat Tabel transaction_items
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0)
);

-- Index untuk join transaksi dan kalkulasi produk
CREATE INDEX IF NOT EXISTS idx_transaction_items_tx ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product ON public.transaction_items(product_id);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS (Diwariskan dari kepemilikan tabel transaksi induk)
DROP POLICY IF EXISTS "Users can view own transaction items" ON public.transaction_items;
CREATE POLICY "Users can view own transaction items" 
  ON public.transaction_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE public.transactions.id = public.transaction_items.transaction_id 
      AND public.transactions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own transaction items" ON public.transaction_items;
CREATE POLICY "Users can insert own transaction items" 
  ON public.transaction_items FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE public.transactions.id = public.transaction_items.transaction_id 
      AND public.transactions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own transaction items" ON public.transaction_items;
CREATE POLICY "Users can update own transaction items" 
  ON public.transaction_items FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE public.transactions.id = public.transaction_items.transaction_id 
      AND public.transactions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own transaction items" ON public.transaction_items;
CREATE POLICY "Users can delete own transaction items" 
  ON public.transaction_items FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE public.transactions.id = public.transaction_items.transaction_id 
      AND public.transactions.user_id = auth.uid()
    )
  );
