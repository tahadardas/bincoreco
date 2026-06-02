import { CSSProperties, ReactNode } from 'react';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { BrandProvider } from '@/lib/brand-context';
import { CurrencyProvider } from '@/lib/currency-context';
import Header from '@/components/header';
import LocaleHeadUpdater from '@/components/locale-head-updater';
import PasswordChangeGate from '@/components/password-change-gate';
import { getPublicBrandSettings, resolveBrandAsset } from '@/lib/brand-settings';
import { resolveMediaUrl } from '@/lib/media';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isAr = params.locale === 'ar';
  return {
    title: isAr ? 'Banco Ricco | تجربة قهوة فاخرة في دمشق' : 'Banco Ricco | Premium Coffee Experience',
    description: isAr
      ? 'اطلب قهوتك للاستلام، اختر البن والطحن المناسب، واجمع B.R Coins مع Banco Ricco.'
      : 'Order premium coffee for pickup, choose beans and grind options, and collect B.R Coins.',
    alternates: {
      canonical: `${siteUrl}/${params.locale}`,
      languages: {
        ar: `${siteUrl}/ar`,
        en: `${siteUrl}/en`,
      },
    },
    openGraph: {
      locale: isAr ? 'ar_SY' : 'en_US',
      alternateLocale: isAr ? 'en_US' : 'ar_SY',
      title: isAr ? 'Banco Ricco | تجربة قهوة فاخرة في دمشق' : 'Banco Ricco | Premium Coffee Experience',
      description: isAr
        ? 'اطلب قهوتك للاستلام، اختر البن والطحن المناسب، واجمع B.R Coins مع Banco Ricco.'
        : 'Order premium coffee for pickup, choose beans and grind options, and collect B.R Coins.',
    },
  };
}

function normalizePatternOpacity(value: string | null): number {
  if (!value) return 0.1;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0.1;
  return Math.min(0.18, Math.max(0.04, parsed));
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: { locale: string } }) {
  const dir = params.locale === 'ar' ? 'rtl' : 'ltr';
  const brand = await getPublicBrandSettings();

  const markUrl = resolveBrandAsset(brand.brand_mark, '/brand/br-monogram.png');
  const footerLogoUrl = resolveBrandAsset(brand.brand_footer_logo || brand.brand_mark, '/brand/br-monogram.png');
  const patternUrl = resolveBrandAsset(brand.brand_pattern, '/brand/banco-arabesque-pattern.svg');
  const faviconUrl = resolveMediaUrl(brand.brand_favicon) || '/favicon.ico';

  const patternOpacity = normalizePatternOpacity(brand.brand_pattern_opacity);

  const brandVars = {
    '--br-brand-pattern-url': `url("${patternUrl}")`,
    '--br-brand-pattern-opacity': patternOpacity,
    '--br-brand-pattern-size': '420px',
    '--br-pattern-opacity': patternOpacity,
    '--br-pattern-size': '420px',
  } as CSSProperties;

  return (
    <AuthProvider>
      <PasswordChangeGate locale={params.locale === 'ar' ? 'ar' : 'en'} />
      <CurrencyProvider>
      <BrandProvider settings={brand}>
        <LocaleHeadUpdater lang={params.locale === 'ar' ? 'ar' : 'en'} favicon={faviconUrl} />
        <div dir={dir} className="site-shell" style={brandVars}>
          <Header brandMark={markUrl} />
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
                <div style={{ fontWeight: 900, color: 'var(--br-gold)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {footerLogoUrl && (
                    <img src={footerLogoUrl} alt="Banco Ricco" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                  )}
                  Banco Ricco
                </div>
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
        </div>
      </BrandProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
