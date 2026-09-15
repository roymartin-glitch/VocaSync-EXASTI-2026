import { createClient, createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function getCurrentUser() {
  try {
    const serverClient = await createClient();
    const {
      data: { user },
      error,
    } = await serverClient.auth.getUser();

    if (user && !error) {
      return user;
    }
  } catch (e) {
    // Cookie reading might fail in non-request environments
  }
  return null;
}

export async function getActiveUserProfile() {
  const user = await getCurrentUser();
  const adminClient = createAdminClient();

  // 0. Check custom registered user cookie
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('vokasync_user')?.value;
    if (userCookie) {
      const parsed = JSON.parse(decodeURIComponent(userCookie));
      if (parsed.id && parsed.owner_name) {
        // Cek database Supabase terlebih dahulu untuk profile ter-update
        const { data: dbProfile } = await adminClient
          .from('profiles')
          .select('*')
          .eq('id', parsed.id)
          .maybeSingle();

        if (dbProfile) {
          return {
            user: { id: parsed.id, email: parsed.email } as any,
            profile: dbProfile,
          };
        }

        const customProfile = {
          id: parsed.id,
          owner_name: parsed.owner_name,
          business_name: parsed.business_name || 'Kios Saya',
          business_type: 'pasar',
          margin_alert_threshold: 20,
          low_stock_threshold: 20,
          supplier_cost_increase_threshold: 5,
          sound_alert_enabled: false,
          sound_alert_volume: 80,
          text_size: 'normal',
          theme: 'terang',
          default_unit: 'kg',
          analysis_period: '7d',
          app_settings: {},
        };
        return {
          user: { id: parsed.id, email: parsed.email } as any,
          profile: customProfile,
        };
      }
    }
  } catch (_) {}

  if (user) {
    // 1. Try to find profile by authenticated user ID
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      return { user, profile };
    }

    // 2. If profile record does not exist yet (e.g. newly registered user), create it from metadata
    const meta = user.user_metadata || {};
    const newProfile = {
      id: user.id,
      owner_name: meta.owner_name || user.email?.split('@')[0] || 'Pedagang Baru',
      business_name: meta.business_name || 'Kios Saya',
      business_type: meta.business_type || 'Sayur & Buah',
      margin_alert_threshold: 20,
      low_stock_threshold: 20,
      supplier_cost_increase_threshold: 5,
      sound_alert_enabled: false,
      sound_alert_volume: 80,
      text_size: 'normal',
      theme: 'terang',
      default_unit: 'kg',
      analysis_period: '7d',
      app_settings: {},
    };

    try {
      const { data: created } = await adminClient
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (created) {
        return { user, profile: created };
      }
    } catch (insertErr) {
      console.warn('Profile creation fallback:', insertErr);
    }

    return { user, profile: newProfile };
  }

  // 3. Fallback untuk akun demo (Pak Budi - Kios Berkah Sayur)
  const demoUuid = '34f9e50b-d4ba-41b1-807d-7807eb5e0d77';
  const { data: demoProfileInDb } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', demoUuid)
    .maybeSingle();

  if (demoProfileInDb) {
    return { user: { id: demoUuid, email: 'demo@vokasync.id' } as any, profile: demoProfileInDb };
  }

  const defaultDemo = {
    id: demoUuid,
    owner_name: 'Pak Budi',
    business_name: 'Kios Berkah Sayur',
    business_type: 'pasar',
    margin_alert_threshold: 20,
    low_stock_threshold: 20,
    supplier_cost_increase_threshold: 5,
    sound_alert_enabled: false,
    sound_alert_volume: 80,
    text_size: 'normal',
    default_unit: 'kg',
    analysis_period: '7d',
    app_settings: {},
  };

  try {
    const { data: upserted } = await adminClient
      .from('profiles')
      .upsert(defaultDemo)
      .select()
      .maybeSingle();

    if (upserted) {
      return { user: { id: demoUuid, email: 'demo@vokasync.id' } as any, profile: upserted };
    }
  } catch (_) {}

  return { user: { id: demoUuid, email: 'demo@vokasync.id' } as any, profile: defaultDemo };
}

