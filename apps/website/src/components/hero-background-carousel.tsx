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

type HeroBackgroundCarouselProps = {
  slides: Banner[];
  locale: string;
  className?: string;
};

const ANIM_DURATION = 500;

const isRtlLocale = (locale: string) => locale === 'ar' || locale === 'fa' || locale === 'he';

function getEnterKeyframes(type: string, isRtl: boolean): string {
  switch (type) {
    case 'slideLeft': return isRtl ? 'translateX(100%)' : 'translateX(-100%)';
    case 'slideRight': return isRtl ? 'translateX(-100%)' : 'translateX(100%)';
    case 'slideUp': return 'translateY(4rem)';
    case 'slideDown': return 'translateY(-4rem)';
    case 'zoomIn': return 'scale(0.85)';
    case 'parallax': return 'translateY(2rem)';
    case 'none': return '';
    default: return isRtl ? 'translateX(100%)' : 'translateX(-100%)';
  }
}

function getExitKeyframes(type: string, isRtl: boolean): string {
  switch (type) {
    case 'slideLeft': return isRtl ? 'translateX(-100%)' : 'translateX(100%)';
    case 'slideRight': return isRtl ? 'translateX(100%)' : 'translateX(-100%)';
    case 'slideUp': return 'translateY(-4rem)';
    case 'slideDown': return 'translateY(4rem)';
    case 'zoomIn': return 'scale(1.05)';
    case 'parallax': return 'translateY(-2rem)';
    case 'none': return '';
    default: return isRtl ? 'translateX(-100%)' : 'translateX(100%)';
  }
}

export default function HeroBackgroundCarousel({
  slides,
  locale,
  className = '',
}: HeroBackgroundCarouselProps) {
  const isRtl = isRtlLocale(locale);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [exitingIndex, setExitingIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const totalSlides = slides.length;

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
      const ms = 5000 + Math.floor(Math.random() * 2000);
      timerRef.current = setInterval(next, ms);
    }
  }, [totalSlides, next]);

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

  const getAnimStyle = useCallback((isEntering: boolean, animType?: string) => {
    if (prefersReducedMotion) return {};
    const type = animType || slides[current]?.animationType || 'fade';
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
  }, [slides, current, isRtl, prefersReducedMotion]);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[current];
  const t = (banner: Banner) => banner.translations?.find(tr => tr.locale === locale) || banner.translations?.[0];
  const trans = t(currentSlide);

  const isDarkText = currentSlide.textColor === 'dark';
  const overlayOpacity = currentSlide.overlayOpacity ?? 0.35;
  const textColorCSS = isDarkText ? 'var(--br-black)' : 'var(--br-white)';
  const textShadowCSS = isDarkText ? 'none' : '0 2px 20px rgba(0,0,0,0.35)';
  const textPosition = currentSlide.textPosition || 'center';

  const contentAlign = textPosition === 'left' ? 'flex-start'
    : textPosition === 'right' ? 'flex-end'
    : textPosition === 'bottom' ? 'flex-end'
    : 'center';

  const contentJustify = textPosition === 'bottom' ? 'flex-end'
    : textPosition === 'center' ? 'center'
    : 'center';

  const imageUrl = resolveMediaUrl(currentSlide.imageUrl);
  const mobileImageUrl = resolveMediaUrl(currentSlide.mobileImageUrl || currentSlide.imageUrl);

  const hasCta = currentSlide.ctaUrl && (currentSlide.ctaTextAr || currentSlide.ctaTextEn);
  const ctaText = isRtl ? currentSlide.ctaTextAr : currentSlide.ctaTextEn;
  const ctaUrl = currentSlide.ctaUrl;

  const slideContent = (
    <div className="hero-bg-carousel__slide-inner">
      <div
        className="hero-bg-carousel__bg"
        style={{
          backgroundImage: `url(${imageUrl || ''})`,
        }}
      />
      <div
        className="hero-bg-carousel__bg-mobile"
        style={{
          backgroundImage: `url(${mobileImageUrl || imageUrl || ''})`,
        }}
      />
      {!imageUrl && (
        <div className="hero-bg-carousel__fallback">
          <div className="hero-bg-carousel__fallback-icon">BR</div>
        </div>
      )}
      <div
        className="hero-bg-carousel__overlay"
        style={{ opacity: overlayOpacity }}
      />
      {(trans?.title || trans?.subtitle || hasCta) && (
        <div
          className="hero-bg-carousel__content"
          style={{
            alignItems: contentAlign,
            justifyContent: contentJustify,
            textAlign: textPosition === 'left' ? 'start' : textPosition === 'right' ? 'end' : 'center',
          }}
        >
          <div className="hero-bg-carousel__text-box">
            {trans?.title && (
              <h2
                className="hero-bg-carousel__title"
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
                className="hero-bg-carousel__subtitle"
                style={{
                  color: isDarkText ? 'rgba(0,0,0,0.7)' : 'rgba(255,250,240,0.85)',
                  textShadow: textShadowCSS,
                }}
              >
                {trans.subtitle}
              </p>
            )}
            {hasCta && (
              <div className="hero-bg-carousel__cta">
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
      className={`hero-bg-carousel ${className}`}
      dir={isRtl ? 'rtl' : 'ltr'}
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label={isRtl ? 'عرض الشرائح' : 'Hero background carousel'}
      aria-roledescription="carousel"
    >
      <div
        className="hero-bg-carousel__viewport"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {exitingIndex !== null && exitingIndex !== current && (
          <div
            key={`exit-${exitingIndex}`}
            className="hero-bg-carousel__slide hero-bg-carousel__slide--exit"
            style={{
              ...(!prefersReducedMotion ? {
                transition: `transform ${ANIM_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${ANIM_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`,
              } : {}),
              ...getAnimStyle(false, slides[exitingIndex]?.animationType),
            }}
            onTransitionEnd={() => setExitingIndex(null)}
          >
            {slides[exitingIndex] && (
              <SlideContent
                slide={slides[exitingIndex]}
                locale={locale}
                isRtl={isRtl}
              />
            )}
          </div>
        )}
        <div
          key={`enter-${current}`}
          className="hero-bg-carousel__slide hero-bg-carousel__slide--active"
          style={{
            ...(!prefersReducedMotion ? {
              animation: `hero-bg-enter ${ANIM_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            } : {}),
            ...(prefersReducedMotion ? getAnimStyle(true, slides[current]?.animationType) : {}),
          }}
        >
          {slideContent}
        </div>
      </div>

      {totalSlides > 1 && (
        <>
          <button
            className="hero-bg-carousel__arrow hero-bg-carousel__arrow--prev"
            onClick={prev}
            aria-label={isRtl ? 'التالي' : 'Previous'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="hero-bg-carousel__arrow hero-bg-carousel__arrow--next"
            onClick={next}
            aria-label={isRtl ? 'السابق' : 'Next'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 4L14 10L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="hero-bg-carousel__dots" role="tablist" aria-label={isRtl ? 'اختيار شريحة' : 'Select slide'}>
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                className={`hero-bg-carousel__dot ${i === current ? 'hero-bg-carousel__dot--active' : ''}`}
                onClick={() => goTo(i)}
                role="tab"
                aria-selected={i === current}
                aria-label={isRtl ? `الشريحة ${i + 1}` : `Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SlideContent({
  slide,
  locale,
  isRtl,
}: {
  slide: Banner;
  locale: string;
  isRtl: boolean;
}) {
  const isDarkText = slide.textColor === 'dark';
  const t = slide.translations?.find(tr => tr.locale === locale) || slide.translations?.[0];
  const imgUrl = resolveMediaUrl(slide.imageUrl);
  const mobileImgUrl = resolveMediaUrl(slide.mobileImageUrl || slide.imageUrl);
  const overlayOpacity = slide.overlayOpacity ?? 0.35;
  const textColorCSS = isDarkText ? 'var(--br-black)' : 'var(--br-white)';
  const textShadowCSS = isDarkText ? 'none' : '0 2px 20px rgba(0,0,0,0.35)';
  const textPosition = slide.textPosition || 'center';
  const contentAlign = textPosition === 'left' ? 'flex-start'
    : textPosition === 'right' ? 'flex-end'
    : textPosition === 'bottom' ? 'flex-end'
    : 'center';
  const contentJustify = textPosition === 'bottom' ? 'flex-end' : 'center';
  const hasCta = slide.ctaUrl && (slide.ctaTextAr || slide.ctaTextEn);
  const ctaText = isRtl ? slide.ctaTextAr : slide.ctaTextEn;
  const ctaUrl = slide.ctaUrl;

  return (
    <div className="hero-bg-carousel__slide-inner">
      <div
        className="hero-bg-carousel__bg"
        style={{ backgroundImage: `url(${imgUrl || ''})` }}
      />
      <div
        className="hero-bg-carousel__bg-mobile"
        style={{ backgroundImage: `url(${mobileImgUrl || imgUrl || ''})` }}
      />
      {!imgUrl && (
        <div className="hero-bg-carousel__fallback">
          <div className="hero-bg-carousel__fallback-icon">BR</div>
        </div>
      )}
      <div
        className="hero-bg-carousel__overlay"
        style={{ opacity: overlayOpacity }}
      />
      {(t?.title || t?.subtitle || hasCta) && (
        <div
          className="hero-bg-carousel__content"
          style={{
            alignItems: contentAlign,
            justifyContent: contentJustify,
            textAlign: textPosition === 'left' ? 'start' : textPosition === 'right' ? 'end' : 'center',
          }}
        >
          <div className="hero-bg-carousel__text-box">
            {t?.title && (
              <h2 className="hero-bg-carousel__title" style={{ color: textColorCSS, textShadow: textShadowCSS }}>{t.title}</h2>
            )}
            {t?.subtitle && (
              <p className="hero-bg-carousel__subtitle" style={{ color: isDarkText ? 'rgba(0,0,0,0.7)' : 'rgba(255,250,240,0.85)', textShadow: textShadowCSS }}>{t.subtitle}</p>
            )}
            {hasCta && ctaUrl && (
              <div className="hero-bg-carousel__cta">
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
