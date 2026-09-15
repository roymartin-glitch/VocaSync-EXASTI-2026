-- ==============================================================================
-- TABEL 1: PROFILES & TRIGGER
-- Deskripsi: Menyimpan profil toko, pemilik, dan ambang batas peringatan margin
-- ==============================================================================

-- 1. Buat Tabel profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT DEFAULT 'Kios Berkah Sayur',
  owner_name TEXT DEFAULT 'Pak Budi',
  business_type TEXT DEFAULT 'pasar' CHECK (business_type IN ('pasar', 'kuliner', 'kriya', 'kelontong', 'lainnya')),
  margin_alert_threshold NUMERIC DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS (Pengguna hanya dapat mengelola baris miliknya)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 4. Function & Trigger untuk membuat baris profile otomatis saat user baru sign up di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, business_name, owner_name, business_type, margin_alert_threshold)
  VALUES (
    new.id,
    COALESCE(NULLIF(new.raw_user_meta_data->>'business_name', ''), 'Kios Berkah Sayur'),
    COALESCE(NULLIF(new.raw_user_meta_data->>'owner_name', ''), 'Pak Budi'),
    COALESCE(NULLIF(new.raw_user_meta_data->>'business_type', ''), 'pasar'),
    20
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
