import { ReactNode } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>Banco Ricco - Admin</title>
        <meta name="description" content="Banco Ricco Admin Dashboard" />
      </head>
      <body>{children}</body>
    </html>
  );
}
