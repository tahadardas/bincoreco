'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/media';

interface BannerTranslation {
  locale: string;
  title?: string | null;
  subtitle?: string | null;
}

interface Banner {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  linkUrl?: string | null;
  sortOrder: number;
  translations: BannerTranslation[];
}

type BannerCarouselProps = {
  locale: string;
  autoplayMs?: number;
};

export default function BannerCarousel({ locale, autoplayMs = 5000 }: BannerCarouselProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStart = useRef(0);

  useEffect(() => {
    api.get<Banner[]>('/banners')
      .then(setBanners)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 'next' : 'prev');
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => {
    if (banners.length < 2) return;
    setDirection('next');
    setCurrent(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    if (banners.length < 2) return;
    setDirection('prev');
    setCurrent(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length < 2) return;
    timerRef.current = setInterval(next, autoplayMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length, autoplayMs, next]);

  const pause = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const resume = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (banners.length >= 2) timerRef.current = setInterval(next, autoplayMs);
  };

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
  };

  if (loading) return <div style={{ height: 340, background: 'var(--br-espresso)', borderRadius: 16 }} />;
  if (banners.length === 0) return null;

  const t = (banner: Banner) => banner.translations.find(tr => tr.locale === locale) || banner.translations[0];
  const currentBanner = banners[current];

  return (
    <div
      className="carousel"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, height: 340, background: 'var(--br-espresso)' }}
    >
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          style={{
            position: 'absolute', inset: 0,
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: i === current ? 1 : 0,
            transform: i === current ? 'translateX(0)' : `translateX(${i < current ? '-100%' : '100%'})`,
            pointerEvents: i === current ? 'auto' : 'none',
          }}
        >
          <picture>
            <source
              media="(max-width: 640px)"
              srcSet={resolveMediaUrl(banner.mobileImageUrl || banner.imageUrl) || ''}
            />
            <img
              src={resolveMediaUrl(banner.imageUrl) || ''}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </picture>
          {(t(banner)?.title || t(banner)?.subtitle) && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              padding: 32,
            }}>
              {t(banner)?.title && <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 900 }}>{t(banner)!.title}</h2>}
              {t(banner)?.subtitle && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>{t(banner)!.subtitle}</p>}
            </div>
          )}
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  width: i === current ? 24 : 8, height: 8, borderRadius: 4, border: 'none',
                  background: i === current ? 'var(--br-gold)' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', transition: 'all 0.3s',
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={prev}
            style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Previous"
          >‹</button>
          <button
            onClick={next}
            style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Next"
          >›</button>
        </>
      )}
    </div>
  );
}
