import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'VokaSync — Asisten Bisnis Pedagang Pasar & UMKM',
  description:
    'Aplikasi pintar asisten bisnis dan visual marketing otomatis untuk pedagang pasar tradisional dan pelaku UMKM Indonesia (SDGs 9).',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#F4F6F4] min-h-screen text-slate-900 font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
