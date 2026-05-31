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
            padding: '40px 24px 24px',
            fontSize: 14,
            borderTop: '1px solid rgba(201, 150, 26, 0.2)',
          }}>
            <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, marginBottom: 24 }}>
              <div>
                <div style={{ fontWeight: 900, color: 'var(--br-gold)', marginBottom: 12 }}>Banco Ricco</div>
                <p>{params.locale === 'ar' ? 'نحترم البن من المصدر حتى آخر رشفة.' : 'We respect the beans from source to last sip.'}</p>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--br-white)', marginBottom: 12 }}>{params.locale === 'ar' ? 'روابط' : 'Links'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a href={`/${params.locale}`} style={{ color: 'var(--br-muted)', textDecoration: 'none' }}>{params.locale === 'ar' ? 'الرئيسية' : 'Home'}</a>
                  <a href={`/${params.locale}/products`} style={{ color: 'var(--br-muted)', textDecoration: 'none' }}>{params.locale === 'ar' ? 'المنتجات' : 'Products'}</a>
                  <a href={`/${params.locale}/about`} style={{ color: 'var(--br-muted)', textDecoration: 'none' }}>{params.locale === 'ar' ? 'من نحن' : 'About'}</a>
                  <a href={`/${params.locale}/contact`} style={{ color: 'var(--br-muted)', textDecoration: 'none' }}>{params.locale === 'ar' ? 'اتصل بنا' : 'Contact'}</a>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--br-white)', marginBottom: 12 }}>{params.locale === 'ar' ? 'الخدمات' : 'Services'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a href={`/${params.locale}/loyalty`} style={{ color: 'var(--br-muted)', textDecoration: 'none' }}>B.R Coins</a>
                  <a href={`/${params.locale}/cart`} style={{ color: 'var(--br-muted)', textDecoration: 'none' }}>{params.locale === 'ar' ? 'السلة' : 'Cart'}</a>
                  <a href={`/${params.locale}/orders`} style={{ color: 'var(--br-muted)', textDecoration: 'none' }}>{params.locale === 'ar' ? 'طلباتي' : 'Orders'}</a>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
              &copy; {new Date().getFullYear()} Banco Ricco · {params.locale === 'ar' ? 'نحترم البن' : 'We Respect the Beans'}
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
