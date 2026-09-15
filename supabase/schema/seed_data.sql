-- ==============================================================================
-- SEED DATA UNTUK PENGUJIAN / DEMO JURI (GANTI auth.uid() ATAU JALANKAN SETELAH LOGIN)
-- ==============================================================================

-- Catatan: Ganti 'YOUR_USER_ID' dengan UUID akun Anda dari auth.users (atau jalankan script ini dari client yang terautentikasi)
DO $$
DECLARE
  v_user_id UUID;
  v_prod_bawang_merah UUID := gen_random_uuid();
  v_prod_bawang_putih UUID := gen_random_uuid();
  v_prod_cabai UUID := gen_random_uuid();
  v_prod_bombay UUID := gen_random_uuid();
  v_prod_jahe UUID := gen_random_uuid();
  v_tx1 UUID := gen_random_uuid();
  v_tx2 UUID := gen_random_uuid();
  v_tx3 UUID := gen_random_uuid();
  v_exp1 UUID := gen_random_uuid();
BEGIN
  -- Ambil ID user pertama yang ada di profiles
  SELECT id INTO v_user_id FROM public.profiles LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- 1. Seed Products
    INSERT INTO public.products (id, user_id, name, default_unit) VALUES
      (v_prod_bawang_merah, v_user_id, 'Bawang Merah Brebes', 'kg'),
      (v_prod_bawang_putih, v_user_id, 'Bawang Putih Kating', 'kg'),
      (v_prod_cabai, v_user_id, 'Cabai Rawit Merah', 'kg'),
      (v_prod_bombay, v_user_id, 'Bawang Bombay', 'kg'),
      (v_prod_jahe, v_user_id, 'Jahe Gajah', 'kg')
    ON CONFLICT DO NOTHING;

    -- 2. Seed Transactions (Expense Kulakan)
    INSERT INTO public.transactions (id, user_id, type, transaction_date, source, raw_voice_text) VALUES
      (v_tx1, v_user_id, 'expense', NOW() - INTERVAL '6 hours', 'manual', NULL)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.transaction_items (transaction_id, product_id, quantity, unit, unit_price) VALUES
      (v_tx1, v_prod_bawang_merah, 20, 'kg', 34000)
    ON CONFLICT DO NOTHING;

    -- 3. Seed Transactions (Income Penjualan)
    INSERT INTO public.transactions (id, user_id, type, transaction_date, source, raw_voice_text) VALUES
      (v_tx2, v_user_id, 'income', NOW() - INTERVAL '3 hours', 'voice', 'Jual bawang merah 5 kilo dapat 200 ribu'),
      (v_tx3, v_user_id, 'income', NOW() - INTERVAL '1 hour', 'manual', NULL)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.transaction_items (transaction_id, product_id, quantity, unit, unit_price) VALUES
      (v_tx2, v_prod_bawang_merah, 5, 'kg', 40000),
      (v_tx3, v_prod_bawang_putih, 3, 'kg', 49000)
    ON CONFLICT DO NOTHING;

    -- 4. Seed AI Insights
    INSERT INTO public.ai_insights (user_id, product_id, severity, message, has_quick_action, metric_snapshot) VALUES
      (v_user_id, v_prod_bawang_merah, 'red', 'Pak Budi, margin Bawang Merah tergerus turun ke 14,3% (di bawah target 20%). Penyebabnya: harga beli kulakan naik menjadi Rp34.000/kg namun harga jual masih Rp40.000/kg.', TRUE, '{"current_margin": 14.3, "threshold": 20}'::jsonb),
      (v_user_id, v_prod_bawang_putih, 'green', 'Bawang Putih mencatat margin paling sehat sebesar 42,8% dengan penjualan stabil 15 kg/hari.', FALSE, '{"current_margin": 42.8}'::jsonb)
    ON CONFLICT DO NOTHING;

    -- 5. Seed Experiments
    INSERT INTO public.experiments (id, user_id, product_id, title, status, baseline_metric, target_metric, started_at, target_end_at) VALUES
      (v_exp1, v_user_id, v_prod_bawang_merah, 'Naikkan harga jual Bawang Merah ke Rp42.000/kg', 'running', '{"margin": 15.0, "price": 40000}'::jsonb, '{"margin": 19.0, "price": 42000}'::jsonb, NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.experiment_results (experiment_id, recorded_at, current_metric, evaluation_status, ai_verdict_text) VALUES
      (v_exp1, NOW() - INTERVAL '1 hour', '{"margin": 19.0, "daily_volume": 23}'::jsonb, 'in_progress', 'Hingga hari ke-3, volume penjualan stabil dan margin pulih mendekati target 20%.')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
