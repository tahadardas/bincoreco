import { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '../providers/query-provider';

export const metadata: Metadata = {
  title: 'Banco Ricco - Admin',
  description: 'Banco Ricco Admin Dashboard',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
