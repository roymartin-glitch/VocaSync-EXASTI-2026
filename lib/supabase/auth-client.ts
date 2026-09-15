import { createClient } from './client';

/**
 * Membersihkan seluruh penyimpanan lokal sesi agar data akun demo
 * maupun akun sebelumnya tidak tertinggal saat berganti sesi atau login.
 */
export function clearAllLocalSessions() {
  if (typeof window !== 'undefined') {
    try {
      const savedAccounts = localStorage.getItem('vokasync_registered_users');
      localStorage.clear();
      sessionStorage.clear();
      if (savedAccounts) {
        localStorage.setItem('vokasync_registered_users', savedAccounts);
      }
      document.cookie = 'vokasync_user=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (e) {
      console.warn('Clear storage fallback:', e);
    }
  }
}

/**
 * Logout pengguna dengan aman:
 * 1. Sign out dari Supabase
 * 2. Mengosongkan total localStorage & sessionStorage
 * 3. Mengarahkan halaman ke /login
 */
export async function logoutUser() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('SignOut error:', e);
  }
  clearAllLocalSessions();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
