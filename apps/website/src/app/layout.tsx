import { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Banco Ricco | Premium Coffee Experience',
    template: '%s | Banco Ricco',
  },
  description: 'Order premium coffee for pickup, choose beans and grind options, and collect B.R Coins with Banco Ricco.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    siteName: 'Banco Ricco',
    title: 'Banco Ricco | Premium Coffee Experience',
    description: 'Order premium coffee for pickup, choose beans and grind options, and collect B.R Coins with Banco Ricco.',
    locale: 'ar_SY',
    alternateLocale: 'en_US',
    images: [{ url: '/brand/og-default.jpg', width: 1200, height: 630, alt: 'Banco Ricco' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Banco Ricco',
    description: 'Premium coffee experience. Order for pickup, earn B.R Coins.',
    images: ['/brand/og-default.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      ar: `${siteUrl}/ar`,
      en: `${siteUrl}/en`,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
