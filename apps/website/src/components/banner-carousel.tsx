'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { resolveMediaUrl } from '@/lib/media';
import EspressoButton from '@/components/espresso-button';
import Link from 'next/link';

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
  ctaTextAr?: string | null;
  ctaTextEn?: string | null;
  ctaUrl?: string | null;
  animationType?: string;
  displayMode?: string;
  overlayOpacity?: number;
  textPosition?: string;
  textColor?: string;
  sortOrder: number;
  translations: BannerTranslation[];
}

type BannerCarouselProps = {
  banners: Banner[];
  locale: string;
  autoplayMs?: number;
  className?: string;
};

const ANIM_DURATION = 500;

const isRtlLocale = (locale: string) => locale === 'ar' || locale === 'fa' || locale === 'he';

function getTranslateX(fromLeft: boolean, isRtl: boolean): string {
  if (fromLeft) return isRtl ? '100%' : '-100%';
  return isRtl ? '-100%' : '100%';
}

function getEnterKeyframes(type: string, isRtl: boolean): string {
  switch (type) {
    case 'slideLeft': {
      const x = getTranslateX(false, isRtl);
      return `translateX(${x})`;
    }
    case 'slideRight': {
      const x = getTranslateX(true, isRtl);
      return `translateX(${x})`;
    }
    case 'slideUp': return 'translateY(4rem)';
    case 'slideDown': return 'translateY(-4rem)';
    case 'zoomIn': return 'scale(0.85)';
    case 'parallax': return 'translateY(2rem)';
    case 'none': return '';
    default: return getTranslateX(false, isRtl);
  }
}

function getExitKeyframes(type: string, isRtl: boolean): string {
  switch (type) {
    case 'slideLeft': {
      const x = getTranslateX(true, isRtl);
      return `translateX(${x})`;
    }
    case 'slideRight': {
      const x = getTranslateX(false, isRtl);
      return `translateX(${x})`;
    }
    case 'slideUp': return 'translateY(-4rem)';
    case 'slideDown': return 'translateY(4rem)';
    case 'zoomIn': return 'scale(1.05)';
    case 'parallax': return 'translateY(-2rem)';
    case 'none': return '';
    default: return getTranslateX(true, isRtl);
  }
}

export default function BannerCarousel({
  banners,
  locale,
  autoplayMs = 5000,
  className = '',
}: BannerCarouselProps) {
  const isRtl = isRtlLocale(locale);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [exitingIndex, setExitingIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const totalSlides = banners.length;

  const safeIndex = useCallback((index: number) => {
    if (totalSlides === 0) return 0;
    return ((index % totalSlides) + totalSlides) % totalSlides;
  }, [totalSlides]);

  const goTo = useCallback((index: number) => {
    if (totalSlides < 2 || index === current) return;
    setDirection(index > current || (current === totalSlides - 1 && index === 0) ? 'next' : 'prev');
    setExitingIndex(current);
    setCurrent(index);
  }, [current, totalSlides]);

  const next = useCallback(() => {
    if (totalSlides < 2) return;
    goTo(safeIndex(current + 1));
  }, [totalSlides, current, goTo, safeIndex]);

  const prev = useCallback(() => {
    if (totalSlides < 2) return;
    goTo(safeIndex(current - 1));
  }, [totalSlides, current, goTo, safeIndex]);

  const startAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (totalSlides >= 2) {
      timerRef.current = setInterval(next, autoplayMs);
    }
  }, [totalSlides, autoplayMs, next]);

  const stopAutoplay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  useEffect(() => {
    return () => stopAutoplay();
  }, [stopAutoplay]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      isRtl ? next() : prev();
    } else if (e.key === 'ArrowRight') {
      isRtl ? prev() : next();
    }
  }, [isRtl, next, prev]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 50 && dy < Math.abs(dx) * 0.6) {
      if (dx > 0) isRtl ? prev() : next();
      else isRtl ? next() : prev();
    }
  }, [isRtl, next, prev]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
  }, []);

  const getAnimStyle = useCallback((isEntering: boolean, animType?: string) => {
    if (prefersReducedMotion) return {};
    const type = animType || banners[current]?.animationType || 'fade';
    if (isEntering) {
      const transform = getEnterKeyframes(type, isRtl);
      return {
        transform: transform || undefined,
        opacity: type !== 'none' ? 0 : undefined,
      };
    }
    const transform = getExitKeyframes(type, isRtl);
    return {
      transform: transform || undefined,
      opacity: type !== 'none' ? 0 : undefined,
    };
  }, [banners, current, isRtl, prefersReducedMotion]);

  if (!banners || banners.length === 0) return null;

  const currentBanner = banners[current];
  const t = (banner: Banner) => banner.translations?.find(tr => tr.locale === locale) || banner.translations?.[0];
  const trans = t(currentBanner);
  const isRtlDoc = isRtl;

  const isDarkText = currentBanner.textColor === 'dark';
  const overlayOpacity = currentBanner.overlayOpacity ?? 0.35;
  const textColorCSS = isDarkText ? 'var(--br-black)' : 'var(--br-white)';
  const textShadowCSS = isDarkText ? 'none' : '0 2px 20px rgba(0,0,0,0.35)';
  const textPosition = currentBanner.textPosition || 'center';

  const contentAlign = textPosition === 'left' ? 'flex-start'
    : textPosition === 'right' ? 'flex-end'
    : textPosition === 'bottom' ? 'flex-end'
    : 'center';

  const contentJustify = textPosition === 'bottom' ? 'flex-end'
    : textPosition === 'center' ? 'center'
    : 'center';

  const imageUrl = resolveMediaUrl(currentBanner.imageUrl);
  const mobileImageUrl = resolveMediaUrl(currentBanner.mobileImageUrl || currentBanner.imageUrl);

  const hasCta = currentBanner.ctaUrl && (currentBanner.ctaTextAr || currentBanner.ctaTextEn);
  const ctaText = isRtl ? currentBanner.ctaTextAr : currentBanner.ctaTextEn;
  const ctaUrl = currentBanner.ctaUrl;

  const slideContent = (
    <div className="banner-carousel__slide-inner">
      <picture className="banner-carousel__media">
        <source media="(max-width: 640px)" srcSet={mobileImageUrl || ''} />
        <img
          src={imageUrl || ''}
          alt={trans?.title || ''}
          onError={handleImageError}
          className="banner-carousel__img"
          loading="eager"
        />
      </picture>
      {!imageUrl && (
        <div className="banner-carousel__fallback">
          <div className="banner-carousel__fallback-icon">BR</div>
        </div>
      )}
      <div
        className="banner-carousel__overlay"
        style={{ opacity: overlayOpacity }}
      />
      {(trans?.title || trans?.subtitle || hasCta) && (
        <div
          className="banner-carousel__content"
          style={{
            alignItems: contentAlign,
            justifyContent: contentJustify,
            textAlign: textPosition === 'left' ? 'start' : textPosition === 'right' ? 'end' : 'center',
          }}
        >
          <div className="banner-carousel__text-box">
            {trans?.title && (
              <h2
                className="banner-carousel__title"
                style={{
                  color: textColorCSS,
                  textShadow: textShadowCSS,
                }}
              >
                {trans.title}
              </h2>
            )}
            {trans?.subtitle && (
              <p
                className="banner-carousel__subtitle"
                style={{
                  color: isDarkText ? 'rgba(0,0,0,0.7)' : 'rgba(255,250,240,0.85)',
                  textShadow: textShadowCSS,
                }}
              >
                {trans.subtitle}
              </p>
            )}
            {hasCta && (
              <div className="banner-carousel__cta">
                {ctaUrl?.startsWith('/') || ctaUrl?.startsWith('http') ? (
                  <Link href={ctaUrl} target={ctaUrl.startsWith('http') ? '_blank' : undefined} rel={ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}>
                    <EspressoButton size="medium">{ctaText}</EspressoButton>
                  </Link>
                ) : (
                  <EspressoButton size="medium" onClick={() => {}}>{ctaText}</EspressoButton>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`banner-carousel ${className}`}
      dir={isRtlDoc ? 'rtl' : 'ltr'}
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label={isRtlDoc ? 'عرض البنرات' : 'Banner carousel'}
      aria-roledescription="carousel"
    >
      <div
        className="banner-carousel__viewport"
        ref={viewportRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {exitingIndex !== null && exitingIndex !== current && (
          <div
            key={`exit-${exitingIndex}`}
            className="banner-carousel__slide banner-carousel__slide--exit"
            style={{
              ...(!prefersReducedMotion ? {
                transition: `transform ${ANIM_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${ANIM_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`,
              } : {}),
              ...getAnimStyle(false, banners[exitingIndex]?.animationType),
            }}
            onTransitionEnd={() => setExitingIndex(null)}
          >
            {banners[exitingIndex] && (
              <BannerSlideContent
                banner={banners[exitingIndex]}
                locale={locale}
                isRtl={isRtlDoc}
                handleImageError={handleImageError}
              />
            )}
          </div>
        )}
        <div
          key={`enter-${current}`}
          className="banner-carousel__slide banner-carousel__slide--active"
          style={{
            ...(!prefersReducedMotion ? {
              animation: `banner-enter ${ANIM_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            } : {}),
            ...(prefersReducedMotion ? getAnimStyle(true, banners[current]?.animationType) : {}),
          }}
        >
          {slideContent}
        </div>
      </div>

      {totalSlides > 1 && (
        <>
          <button
            className="banner-carousel__arrow banner-carousel__arrow--prev"
            onClick={prev}
            aria-label={isRtlDoc ? 'التالي' : 'Previous'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="banner-carousel__arrow banner-carousel__arrow--next"
            onClick={next}
            aria-label={isRtlDoc ? 'السابق' : 'Next'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 4L14 10L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="banner-carousel__dots" role="tablist" aria-label={isRtlDoc ? 'اختيار بنر' : 'Select banner'}>
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                className={`banner-carousel__dot ${i === current ? 'banner-carousel__dot--active' : ''}`}
                onClick={() => goTo(i)}
                role="tab"
                aria-selected={i === current}
                aria-label={isRtlDoc ? `البنر ${i + 1}` : `Banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BannerSlideContent({
  banner,
  locale,
  isRtl,
  handleImageError,
}: {
  banner: Banner;
  locale: string;
  isRtl: boolean;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}) {
  const isDarkText = banner.textColor === 'dark';
  const t = banner.translations?.find(tr => tr.locale === locale) || banner.translations?.[0];
  const imgUrl = resolveMediaUrl(banner.imageUrl);
  const mobileImgUrl = resolveMediaUrl(banner.mobileImageUrl || banner.imageUrl);
  const overlayOpacity = banner.overlayOpacity ?? 0.35;
  const textColorCSS = isDarkText ? 'var(--br-black)' : 'var(--br-white)';
  const textShadowCSS = isDarkText ? 'none' : '0 2px 20px rgba(0,0,0,0.35)';
  const textPosition = banner.textPosition || 'center';
  const contentAlign = textPosition === 'left' ? 'flex-start'
    : textPosition === 'right' ? 'flex-end'
    : textPosition === 'bottom' ? 'flex-end'
    : 'center';
  const contentJustify = textPosition === 'bottom' ? 'flex-end' : 'center';
  const hasCta = banner.ctaUrl && (banner.ctaTextAr || banner.ctaTextEn);
  const ctaText = isRtl ? banner.ctaTextAr : banner.ctaTextEn;
  const ctaUrl = banner.ctaUrl;

  return (
    <div className="banner-carousel__slide-inner">
      <picture className="banner-carousel__media">
        <source media="(max-width: 640px)" srcSet={mobileImgUrl || ''} />
        <img
          src={imgUrl || ''}
          alt={t?.title || ''}
          onError={handleImageError}
          className="banner-carousel__img"
          loading="eager"
        />
      </picture>
      {!imgUrl && (
        <div className="banner-carousel__fallback">
          <div className="banner-carousel__fallback-icon">BR</div>
        </div>
      )}
      <div
        className="banner-carousel__overlay"
        style={{ opacity: overlayOpacity }}
      />
      {(t?.title || t?.subtitle || hasCta) && (
        <div
          className="banner-carousel__content"
          style={{
            alignItems: contentAlign,
            justifyContent: contentJustify,
            textAlign: textPosition === 'left' ? 'start' : textPosition === 'right' ? 'end' : 'center',
          }}
        >
          <div className="banner-carousel__text-box">
            {t?.title && (
              <h2 className="banner-carousel__title" style={{ color: textColorCSS, textShadow: textShadowCSS }}>{t.title}</h2>
            )}
            {t?.subtitle && (
              <p className="banner-carousel__subtitle" style={{ color: isDarkText ? 'rgba(0,0,0,0.7)' : 'rgba(255,250,240,0.85)', textShadow: textShadowCSS }}>{t.subtitle}</p>
            )}
            {hasCta && ctaUrl && (
              <div className="banner-carousel__cta">
                {ctaUrl.startsWith('/') || ctaUrl.startsWith('http') ? (
                  <Link href={ctaUrl} target={ctaUrl.startsWith('http') ? '_blank' : undefined} rel={ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}>
                    <EspressoButton size="medium">{ctaText}</EspressoButton>
                  </Link>
                ) : (
                  <EspressoButton size="medium">{ctaText}</EspressoButton>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
