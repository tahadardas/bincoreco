import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import Header from '@/components/header';

export default function LocaleLayout({ children, params }: { children: ReactNode; params: { locale: string } }) {
  const dir = params.locale === 'ar' ? 'rtl' : 'ltr';
  const lang = params.locale === 'ar' ? 'ar' : 'en';

  return (
    <html lang={lang} dir={dir}>
      <head>
        <title>Banco Ricco</title>
        <meta name="description" content="Banco Ricco - Premium Coffee Experience" />
      </head>
      <body>
        <AuthProvider>
          <Header />
          <main style={{ minHeight: 'calc(100vh - 80px)' }}>
            {children}
          </main>
          <footer style={{
            background: 'var(--br-black)',
            color: 'var(--br-muted)',
            textAlign: 'center',
            padding: '24px',
            fontSize: 14,
            borderTop: '1px solid rgba(201, 150, 26, 0.2)',
          }}>
            &copy; {new Date().getFullYear()} Banco Ricco · {params.locale === 'ar' ? 'نحترم البن' : 'We Respect the Beans'}
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
