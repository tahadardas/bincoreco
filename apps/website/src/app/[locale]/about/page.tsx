'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { useBrand } from '@/lib/brand-context';
import { api } from '@/lib/api';
import EspressoButton from '@/components/espresso-button';
import { RevealSection } from '@/components/scroll-reveal';

const aboutFields = [
  'hero_title', 'hero_sub',
  'story_title', 'story_p1', 'story_p2',
  'philosophy_title', 'philosophy_p1', 'philosophy_p2',
  'maestro_title', 'maestro_p1',
  'experience_title', 'experience_p1', 'experience_p2', 'experience_p3', 'experience_p4',
  'cta_title', 'cta_sub',
  'order_now', 'view_products',
] as const;

type AboutContent = Record<string, string>;

export default function AboutPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const { resolvedMark } = useBrand();
  const [content, setContent] = useState<AboutContent>({});

  useEffect(() => {
    api.get<Record<string, string | null>>('/settings/public-brand').then(data => {
      if (!data) return;
      const c: AboutContent = {};
      for (const f of aboutFields) {
        const val = data[`about_${f}_${locale}`];
        if (val) c[f] = val;
      }
      setContent(c);
    }).catch(() => {});
  }, [locale]);

  const t = (field: string, fallback: string) => content[field] || fallback;

  return (
    <div>
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
        <div className="container" style={{ position: 'relative' }}>
          <div style={{ maxWidth: 720 }}>
            <div className="section-eyebrow" style={{ color: 'var(--br-gold-light)', marginBottom: 12 }}>
              Banco Ricco
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', lineHeight: 1.06, fontWeight: 900, color: 'var(--br-gold-light)', marginBottom: 18 }}>
              {t('hero_title', dict.about.heroTitle)}
            </h1>
            <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'rgba(255,250,240,0.86)', maxWidth: 600, marginBottom: 30 }}>
              {t('hero_sub', dict.about.heroSub)}
            </p>
          </div>
        </div>
      </section>

      <RevealSection>
        <section className="page-shell">
          <div className="container">
            <div className="section-heading">
              <div>
                <div className="section-eyebrow">Banco Ricco</div>
                <h2 className="section-title">{t('story_title', dict.about.storyTitle)}</h2>
              </div>
            </div>
            <div className="grid grid-2" style={{ gap: 28 }}>
              <div className="card" style={{
                padding: 32,
                background: 'linear-gradient(180deg, #faf6ef, #ede4d3)',
                fontSize: 16, lineHeight: 1.8,
              }}>
                <p>{t('story_p1', dict.about.storyP1)}</p>
              </div>
              <div className="card" style={{
                padding: 32,
                background: 'linear-gradient(135deg, #2c1810, #3d2317)',
                color: 'rgba(255,250,240,0.9)',
                fontSize: 16, lineHeight: 1.8,
              }}>
                <p>{t('story_p2', dict.about.storyP2)}</p>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection>
        <section className="dark-section" style={{ padding: '64px 0', background: 'var(--br-espresso)', color: 'var(--br-white)' }}>
          <div className="container">
            <div className="section-heading">
              <div>
                <div className="section-eyebrow" style={{ color: 'rgba(237,196,91,0.7)' }}>{t('hero_sub', dict.about.heroSub)}</div>
                <h2 className="section-title">{t('philosophy_title', dict.about.philosophyTitle)}</h2>
              </div>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
              border: '1px solid rgba(201,150,26,0.28)',
              borderRadius: 8, padding: 32,
              background: 'rgba(255,250,240,0.06)',
            }}>
              <div style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(255,250,240,0.88)' }}>
                <p>{t('philosophy_p1', dict.about.philosophyP1)}</p>
              </div>
              <div style={{
                fontSize: 16, lineHeight: 1.8, color: 'var(--br-gold-light)',
                borderInlineStart: '2px solid rgba(201,150,26,0.4)',
                paddingInlineStart: 24,
              }}>
                <p>{t('philosophy_p2', dict.about.philosophyP2)}</p>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection>
        <section className="page-shell">
          <div className="container">
            <div className="section-heading">
              <div>
                <div className="section-eyebrow">{t('hero_sub', dict.about.heroSub)}</div>
                <h2 className="section-title">{t('maestro_title', dict.about.maestroTitle)}</h2>
              </div>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, alignItems: 'center',
            }}>
              <div className="card" style={{
                padding: 32,
                background: 'linear-gradient(180deg, #faf6ef, #ede4d3)',
                fontSize: 16, lineHeight: 1.8,
              }}>
                <p>{t('maestro_p1', dict.about.maestroP1)}</p>
              </div>
              <div style={{
                border: '1px solid rgba(201,150,26,0.38)',
                borderRadius: 8, padding: 24,
                background: 'rgba(255,250,240,0.06)',
                textAlign: 'center',
                display: 'grid', placeItems: 'center', gap: 16,
                aspectRatio: '1 / 1',
              }}>
                <img
                  src={resolvedMark}
                  alt="BR"
                  style={{ width: '60%', maxHeight: '60%', objectFit: 'contain', opacity: 0.6 }}
                />
                <div style={{ color: 'var(--br-gold-light)', fontWeight: 800, fontSize: 18 }}>
                  {t('maestro_title', dict.about.maestroTitle)}
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection>
        <section className="dark-section" style={{ padding: '64px 0', background: 'var(--br-espresso)', color: 'var(--br-white)' }}>
          <div className="container">
            <div className="section-heading">
              <div>
                <div className="section-eyebrow" style={{ color: 'rgba(237,196,91,0.7)' }}>Banco Ricco</div>
                <h2 className="section-title">{t('experience_title', dict.about.experienceTitle)}</h2>
              </div>
            </div>
            <div className="feature-grid">
              <div className="card" style={{
                padding: 28, textAlign: 'center',
                background: 'rgba(255,250,240,0.06)',
                border: '1px solid rgba(201,150,26,0.28)',
                color: 'rgba(255,250,240,0.88)',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>☕</div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--br-gold-light)', marginBottom: 8 }}>
                  {t('experience_p1', dict.about.experienceP1)}
                </h3>
              </div>
              <div className="card" style={{
                padding: 28, textAlign: 'center',
                background: 'rgba(255,250,240,0.06)',
                border: '1px solid rgba(201,150,26,0.28)',
                color: 'rgba(255,250,240,0.88)',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🪙</div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--br-gold-light)', marginBottom: 8 }}>
                  {t('experience_p2', dict.about.experienceP2)}
                </h3>
              </div>
              <div className="card" style={{
                padding: 28, textAlign: 'center',
                background: 'rgba(255,250,240,0.06)',
                border: '1px solid rgba(201,150,26,0.28)',
                color: 'rgba(255,250,240,0.88)',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--br-gold-light)', marginBottom: 8 }}>
                  {t('experience_p3', dict.about.experienceP3)}
                </h3>
              </div>
              <div className="card" style={{
                padding: 28, textAlign: 'center',
                background: 'rgba(255,250,240,0.06)',
                border: '1px solid rgba(201,150,26,0.28)',
                color: 'rgba(255,250,240,0.88)',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🫘</div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--br-gold-light)', marginBottom: 8 }}>
                  {t('experience_p4', dict.about.experienceP4)}
                </h3>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection>
        <section className="page-shell">
          <div className="container">
            <div className="card bg-hero-dark" style={{
              padding: 48, textAlign: 'center',
              color: 'var(--br-white)',
              border: '1px solid rgba(201,150,26,0.38)',
            }}>
              <h2 style={{ fontSize: 36, fontWeight: 900, color: 'var(--br-gold-light)', marginBottom: 12 }}>
                {t('cta_title', dict.about.ctaTitle)}
              </h2>
              <p style={{ fontSize: 18, color: 'rgba(255,250,240,0.8)', marginBottom: 28, maxWidth: 520, marginInline: 'auto' }}>
                {t('cta_sub', dict.about.ctaSub)}
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                <EspressoButton size="large" onClick={() => router.push(`/${locale}/products`)}>
                  {t('order_now', dict.about.orderNow)}
                </EspressoButton>
                <EspressoButton tone="outline" size="large" onClick={() => router.push(`/${locale}/products`)}>
                  {t('view_products', dict.about.viewProducts)}
                </EspressoButton>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>
    </div>
  );
}
