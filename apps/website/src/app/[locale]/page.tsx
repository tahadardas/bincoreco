'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { useBrand } from '@/lib/brand-context';
import AuthModal from '@/components/auth-modal';
import EspressoButton from '@/components/espresso-button';
import ProductCard, { ProductSummary } from '@/components/product-card';
import BannerCarousel from '@/components/banner-carousel';
import HeroBackgroundCarousel from '@/components/hero-background-carousel';
import { RevealSection } from '@/components/scroll-reveal';
import { HomePageSkeleton } from '@/components/ui/LoadingSkeleton';
import { Alert } from '@/components/ui/Alert';

interface Banner {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  linkUrl?: string | null;
  ctaTextAr?: string | null;
  ctaTextEn?: string | null;
  ctaUrl?: string | null;
  animationType?: string;
  displayMode?: string;
  overlayOpacity?: number;
  textPosition?: string;
  textColor?: string;
  sortOrder: number;
  translations: { locale: string; title: string | null; subtitle: string | null }[];
}

function SectionHeader({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <div className="section-eyebrow">{eyebrow}</div>
        <h2 className="section-title">{title}</h2>
      </div>
      {copy && <p className="section-copy">{copy}</p>}
    </div>
  );
}

export default function HomePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const { resolvedMark } = useBrand();
  const [heroSlides, setHeroSlides] = useState<Banner[]>([]);
  const [promoBanners, setPromoBanners] = useState<Banner[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductSummary[]>([]);
  const [maestroPicks, setMaestroPicks] = useState<ProductSummary[]>([]);
  const [beans, setBeans] = useState<ProductSummary[]>([]);
  const [specialCoffee, setSpecialCoffee] = useState<ProductSummary[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bannersError, setBannersError] = useState(false);
  const [productsError, setProductsError] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('login') === '1') {
      setShowAuth(true);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setBannersError(false);
    setProductsError(false);

    const bannersPromise = Promise.all([
      api.get<Banner[]>(`/banners?locale=${locale}&placement=HOME_HERO`).catch(() => { setBannersError(true); return []; }),
      api.get<Banner[]>(`/banners?locale=${locale}&placement=HOME_PROMO`).catch(() => { setBannersError(true); return []; }),
    ]);

    const productsPromise = Promise.all([
      api.get<ProductSummary[]>(`/products/best-sellers?locale=${locale}`).catch(() => { setProductsError(true); return []; }),
      api.get<ProductSummary[]>(`/products/maestro-picks?locale=${locale}`).catch(() => { setProductsError(true); return []; }),
      api.get<ProductSummary[]>(`/products?locale=${locale}&type=COFFEE_BEAN&limit=6`).catch(() => { setProductsError(true); return []; }),
      api.get<ProductSummary[]>(`/products?locale=${locale}&search=${encodeURIComponent('B.R Special')}&limit=2`).catch(() => { setProductsError(true); return []; }),
    ]);

    Promise.all([bannersPromise, productsPromise])
      .then(([[heroData, promoData], [best, picks, beanProducts, special]]) => {
        if (heroData) setHeroSlides(heroData);
        if (promoData) setPromoBanners(promoData);
        if (best) setBestSellers(best);
        if (picks) setMaestroPicks(picks);
        if (beanProducts) setBeans(beanProducts);
        if (special) setSpecialCoffee(special);
      })
      .finally(() => setLoading(false));
  }, [locale]);

  const labels = {
    bestSeller: dict.home.bestSellers,
    maestroPick: dict.home.maestroPicks,
    view: dict.home.viewDetails,
  };

  if (loading) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="page-pattern-surface">
      {(bannersError || productsError) && (
        <div className="container" style={{ paddingTop: 16 }}>
          <Alert tone="warning">
            {locale === 'ar' ? 'بعض الأقسام غير متاحة حالياً' : 'Some sections are currently unavailable'}
          </Alert>
        </div>
      )}

      {heroSlides.length > 0 ? (
        <HeroBackgroundCarousel slides={heroSlides} locale={locale} />
      ) : (
        <section className="bg-hero-dark" style={{
          position: 'relative',
          overflow: 'hidden',
          color: 'var(--br-white)',
          padding: '82px 0 58px',
        }}>
          <img
            src={resolvedMark}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              insetInlineEnd: '7%',
              top: 34,
              width: 'min(34vw, 360px)',
              opacity: 0.12,
              filter: 'drop-shadow(0 22px 40px rgba(0,0,0,0.25))',
            }}
          />
          <div className="container hero-grid" style={{ position: 'relative' }}>
            <div>
              <div className="section-eyebrow" style={{ color: 'var(--br-gold-light)', marginBottom: 12 }}>
                {dict.home.heroEyebrow}
              </div>
              <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', lineHeight: 1.06, fontWeight: 900, color: 'var(--br-gold-light)', marginBottom: 18 }}>
                {dict.home.title}
              </h1>
              <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'rgba(255,250,240,0.86)', maxWidth: 680, marginBottom: 30 }}>
                {dict.home.subtitle}
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <EspressoButton size="large" onClick={() => router.push(`/${locale}/products`)}>
                  {dict.home.orderNow}
                </EspressoButton>
                <EspressoButton tone="dark" size="large" onClick={() => router.push(`/${locale}/products?maestro=1`)}>
                  {dict.home.heroSecondary}
                </EspressoButton>
              </div>
            </div>
            <div style={{
              border: '1px solid rgba(201,150,26,0.38)',
              borderRadius: 8,
              padding: 20,
              background: 'rgba(255,250,240,0.06)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.24)',
            }}>
              <div style={{ aspectRatio: '1 / 1', display: 'grid', placeItems: 'center', border: '1px solid rgba(201,150,26,0.28)', borderRadius: 8 }}>
                <img src={resolvedMark} alt="BR Banco Ricco" style={{ width: '70%', maxHeight: '80%', objectFit: 'contain' }} />
              </div>
              <div style={{ marginTop: 14, color: 'rgba(255,250,240,0.8)', fontWeight: 700 }}>
                {dict.home.respectBeans}
              </div>
            </div>
          </div>
        </section>
      )}

      {promoBanners.length > 0 && (
        <section className="banner-carousel-section">
          <div className="container">
            <BannerCarousel banners={promoBanners} locale={locale} />
          </div>
        </section>
      )}

      {bestSellers.length > 0 && (
        <RevealSection>
          <section className="page-shell">
            <div className="container">
              <SectionHeader eyebrow="Banco Ricco" title={dict.home.bestSellers} />
              <div className="grid grid-3">
                {bestSellers.slice(0, 6).map(product => (
                  <ProductCard key={product.id} product={product} locale={locale} labels={labels} />
                ))}
              </div>
            </div>
          </section>
        </RevealSection>
      )}

      {maestroPicks.length > 0 && (
        <RevealSection>
          <section className="section-soft-surface">
            <div className="container">
              <SectionHeader eyebrow={dict.home.respectBeans} title={dict.home.maestroPicks} />
              <div className="grid grid-3">
                {maestroPicks.slice(0, 6).map(product => (
                  <ProductCard key={product.id} product={product} locale={locale} labels={labels} />
                ))}
              </div>
            </div>
          </section>
        </RevealSection>
      )}

      <RevealSection>
        <section className="page-shell">
          <div className="container">
            <SectionHeader eyebrow="Coffee Bank" title={dict.home.beans} copy={dict.home.beansCopy} />
            <div className="grid grid-3">
              {beans.slice(0, 6).map(product => (
                <ProductCard key={product.id} product={product} locale={locale} labels={labels} />
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {specialCoffee.length > 0 && (
        <RevealSection>
          <section className="dark-section" style={{ padding: '64px 0', background: 'var(--br-espresso)', color: 'var(--br-white)' }}>
            <div className="container">
              <SectionHeader eyebrow="Banco Signature" title={dict.home.specialCoffee} copy={dict.home.pickupCopy} />
              <div className="grid grid-2">
                {specialCoffee.map(product => (
                  <ProductCard key={product.id} product={product} locale={locale} labels={labels} />
                ))}
                <div style={{
                  border: '1px solid rgba(201,150,26,0.36)',
                  borderRadius: 8,
                  padding: 28,
                  display: 'grid',
                  alignContent: 'center',
                  gap: 14,
                  background: 'rgba(255,250,240,0.06)',
                }}>
                  <h3 style={{ color: 'var(--br-gold-light)', fontSize: 24, fontWeight: 900 }}>{dict.home.pickupTitle}</h3>
                  <p style={{ color: 'rgba(255,250,240,0.8)' }}>{dict.home.pickupCopy}</p>
                  <EspressoButton onClick={() => router.push(`/${locale}/products`)}>
                    {dict.home.orderNow}
                  </EspressoButton>
                </div>
              </div>
            </div>
          </section>
        </RevealSection>
      )}

      <RevealSection>
        <section className="section-transparent-shell">
          <div className="container feature-grid">
            <div className="card" style={{ padding: 24 }}>
              <div className="section-eyebrow">{dict.home.coinsTeaser}</div>
              <h3 style={{ fontSize: 22, fontWeight: 900, margin: '8px 0' }}>{dict.nav.loyalty}</h3>
              <p style={{ color: 'var(--br-muted)' }}>{dict.loyalty.subtitle}</p>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <div className="section-eyebrow">{dict.home.pickupTitle}</div>
              <h3 style={{ fontSize: 22, fontWeight: 900, margin: '8px 0' }}>{dict.cart.cashOnly}</h3>
              <p style={{ color: 'var(--br-muted)' }}>{dict.home.pickupCopy}</p>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <div className="section-eyebrow">{dict.home.moments}</div>
              <h3 style={{ fontSize: 22, fontWeight: 900, margin: '8px 0' }}>{dict.home.respectBeans}</h3>
              <p style={{ color: 'var(--br-muted)' }}>{dict.home.subtitle}</p>
            </div>
          </div>
        </section>
      </RevealSection>

      {showAuth && <AuthModal locale={locale} onClose={() => setShowAuth(false)} />}
    </div>
  );
}
