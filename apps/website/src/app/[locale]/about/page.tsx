'use client';
import { useParams, useRouter } from 'next/navigation';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { api } from '@/lib/api';
import EspressoButton from '@/components/espresso-button';
import { RevealSection } from '@/components/scroll-reveal';

export default function AboutPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div>
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, rgba(11,10,8,0.98), rgba(27,16,11,0.94)), repeating-linear-gradient(45deg, rgba(201,150,26,0.16) 0 1px, transparent 1px 18px)',
        color: 'var(--br-white)',
        padding: '82px 0 58px',
      }}>
        <img
          src="/brand/br-monogram.png"
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
            <h1 style={{ fontSize: 56, lineHeight: 1.06, fontWeight: 900, color: 'var(--br-gold-light)', marginBottom: 18 }}>
              {dict.about.heroTitle}
            </h1>
            <p style={{ fontSize: 20, color: 'rgba(255,250,240,0.86)', maxWidth: 600, marginBottom: 30 }}>
              {dict.about.heroSub}
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
                <h2 className="section-title">{dict.about.storyTitle}</h2>
              </div>
            </div>
            <div className="grid grid-2" style={{ gap: 28 }}>
              <div className="card" style={{
                padding: 32,
                background: 'linear-gradient(180deg, #faf6ef, #ede4d3)',
                fontSize: 16, lineHeight: 1.8,
              }}>
                <p>{dict.about.storyP1}</p>
              </div>
              <div className="card" style={{
                padding: 32,
                background: 'linear-gradient(135deg, #2c1810, #3d2317)',
                color: 'rgba(255,250,240,0.9)',
                fontSize: 16, lineHeight: 1.8,
              }}>
                <p>{dict.about.storyP2}</p>
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
                <div className="section-eyebrow" style={{ color: 'rgba(237,196,91,0.7)' }}>{dict.about.heroSub}</div>
                <h2 className="section-title">{dict.about.philosophyTitle}</h2>
              </div>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
              border: '1px solid rgba(201,150,26,0.28)',
              borderRadius: 8, padding: 32,
              background: 'rgba(255,250,240,0.06)',
            }}>
              <div style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(255,250,240,0.88)' }}>
                <p>{dict.about.philosophyP1}</p>
              </div>
              <div style={{
                fontSize: 16, lineHeight: 1.8, color: 'var(--br-gold-light)',
                borderInlineStart: '2px solid rgba(201,150,26,0.4)',
                paddingInlineStart: 24,
              }}>
                <p>{dict.about.philosophyP2}</p>
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
                <div className="section-eyebrow">{dict.about.heroSub}</div>
                <h2 className="section-title">{dict.about.maestroTitle}</h2>
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
                <p>{dict.about.maestroP1}</p>
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
                  src="/brand/br-monogram.png"
                  alt="BR"
                  style={{ width: '60%', maxHeight: '60%', objectFit: 'contain', opacity: 0.6 }}
                />
                <div style={{ color: 'var(--br-gold-light)', fontWeight: 800, fontSize: 18 }}>
                  {dict.about.maestroTitle}
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
                <h2 className="section-title">{dict.about.experienceTitle}</h2>
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
                  {dict.about.experienceP1}
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
                  {dict.about.experienceP2}
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
                  {dict.about.experienceP3}
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
                  {dict.about.experienceP4}
                </h3>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      <RevealSection>
        <section className="page-shell">
          <div className="container">
            <div className="card" style={{
              padding: 48, textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(11,10,8,0.98), rgba(27,16,11,0.94)), repeating-linear-gradient(45deg, rgba(201,150,26,0.16) 0 1px, transparent 1px 18px)',
              color: 'var(--br-white)',
              border: '1px solid rgba(201,150,26,0.38)',
            }}>
              <h2 style={{ fontSize: 36, fontWeight: 900, color: 'var(--br-gold-light)', marginBottom: 12 }}>
                {dict.about.ctaTitle}
              </h2>
              <p style={{ fontSize: 18, color: 'rgba(255,250,240,0.8)', marginBottom: 28, maxWidth: 520, marginInline: 'auto' }}>
                {dict.about.ctaSub}
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                <EspressoButton size="large" onClick={() => router.push(`/${locale}/products`)}>
                  {dict.about.orderNow}
                </EspressoButton>
                <EspressoButton tone="outline" size="large" onClick={() => router.push(`/${locale}/products`)}>
                  {dict.about.viewProducts}
                </EspressoButton>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>
    </div>
  );
}
