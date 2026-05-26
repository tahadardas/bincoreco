'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { useAuth } from '@/lib/auth-context';
import AuthModal from '@/components/auth-modal';

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  translations: { locale: string; title: string | null; subtitle: string | null }[];
}

interface Product {
  id: string;
  sku: string;
  type: string;
  isBestSeller: boolean;
  isMaestroPick: boolean;
  isFeatured: boolean;
  imageUrl: string | null;
  basePreparationTimeMinutes: number;
  translations: { locale: string; name: string; shortDescription: string | null }[];
  variants: { id: string; name: string; prices: { amount: number; currencyCode: string }[] }[];
  category: { translations: { locale: string; name: string }[] };
}

export default function HomePage() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [maestroPicks, setMaestroPicks] = useState<Product[]>([]);
  const [beans, setBeans] = useState<Product[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === '1') setShowAuth(true);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get<Banner[]>(`/banners?locale=${locale}`),
      api.get<Product[]>(`/products/best-sellers?locale=${locale}`),
      api.get<Product[]>(`/products/maestro-picks?locale=${locale}`),
      api.get<Product[]>(`/products?locale=${locale}&type=COFFEE_BEAN`),
    ]).then(([bannerData, best, picks, beanProducts]) => {
      setBanners(bannerData);
      setBestSellers(best);
      setMaestroPicks(picks);
      setBeans(beanProducts);
    }).catch(console.error).finally(() => setLoading(false));
  }, [locale]);

  const getTranslatedName = (product: Product) =>
    product.translations.find(t => t.locale === locale)?.name || product.translations[0]?.name || '';

  const getTranslatedDesc = (product: Product) =>
    product.translations.find(t => t.locale === locale)?.shortDescription || '';

  const getPrice = (product: Product) => {
    const v = product.variants[0];
    if (!v || !v.prices[0]) return '';
    const amt = v.prices[0].amount;
    return amt.toLocaleString() + ' SYP';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <div style={{ fontSize: 24, color: 'var(--br-gold)' }}>Banco Ricco</div>
        <div style={{ marginTop: 16, color: 'var(--br-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <section style={{
        background: 'linear-gradient(135deg, var(--br-black) 0%, var(--br-espresso) 100%)',
        color: 'var(--br-white)',
        padding: '80px 16px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 16, color: 'var(--br-gold)' }}>
          {dict.home.title}
        </h1>
        <p style={{ fontSize: 20, color: 'var(--br-cream)', marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
          {dict.home.subtitle}
        </p>
        <Link href={`/${locale}/products`} className="btn btn-primary">
          {dict.home.orderNow}
        </Link>
      </section>

      {banners.length > 0 && (
        <section style={{ padding: '32px 16px', background: 'var(--br-white)' }}>
          <div className="container">
            {banners.map(banner => {
              const t = banner.translations.find(tr => tr.locale === locale);
              const content = (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--br-espresso), var(--br-black))',
                  borderRadius: 16, padding: '40px 32px', marginBottom: banner.sortOrder > 1 ? 16 : 0,
                  minHeight: 160, textAlign: 'center', position: 'relative', overflow: 'hidden',
                }}>
                  <div>
                    {t?.title && <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--br-gold)', marginBottom: 8 }}>{t.title}</h2>}
                    {t?.subtitle && <p style={{ fontSize: 16, color: 'var(--br-cream)' }}>{t.subtitle}</p>}
                  </div>
                </div>
              );
              return banner.linkUrl ? (
                <Link key={banner.id} href={banner.linkUrl} style={{ textDecoration: 'none' }}>{content}</Link>
              ) : <div key={banner.id}>{content}</div>;
            })}
          </div>
        </section>
      )}

      {bestSellers.length > 0 && (
        <section style={{ padding: '64px 16px' }}>
          <div className="container">
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
              {dict.home.bestSellers}
            </h2>
            <div className="grid grid-2">
              {bestSellers.map(product => (
                <Link key={product.id} href={`/${locale}/products/${product.id}`} className="card" style={{ display: 'flex', padding: 24 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{getTranslatedName(product)}</h3>
                    <p style={{ color: 'var(--br-muted)', marginBottom: 12, fontSize: 14 }}>{getTranslatedDesc(product)}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--br-gold)' }}>{getPrice(product)}</span>
                      <span className="badge badge-gold">{dict.home.orderNow}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {maestroPicks.length > 0 && (
        <section style={{ padding: '64px 16px', background: 'var(--br-white)' }}>
          <div className="container">
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
              {dict.home.maestroPicks}
            </h2>
            <div className="grid grid-2">
              {maestroPicks.map(product => (
                <Link key={product.id} href={`/${locale}/products/${product.id}`} className="card" style={{ display: 'flex', padding: 24 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{getTranslatedName(product)}</h3>
                    <p style={{ color: 'var(--br-muted)', marginBottom: 12, fontSize: 14 }}>{getTranslatedDesc(product)}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--br-gold)' }}>{getPrice(product)}</span>
                      <span className="badge badge-cream">{dict.home.viewDetails}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {beans.length > 0 && (
        <section style={{ padding: '64px 16px' }}>
          <div className="container">
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
              {dict.home.beans}
            </h2>
            <div className="grid grid-3">
              {beans.slice(0, 6).map(product => (
                <Link key={product.id} href={`/${locale}/products/${product.id}`} className="card" style={{ padding: 20, textAlign: 'center' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{getTranslatedName(product)}</h3>
                  <p style={{ color: 'var(--br-muted)', fontSize: 14, marginBottom: 12 }}>{getTranslatedDesc(product)}</p>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--br-gold)' }}>{getPrice(product)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {showAuth && <AuthModal locale={locale} onClose={() => setShowAuth(false)} />}
    </div>
  );
}
