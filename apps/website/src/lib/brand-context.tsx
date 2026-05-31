'use client';
import { createContext, useContext, ReactNode } from 'react';
import { PublicBrandSettings, defaultBrandSettings } from './brand-settings';
import { resolveMediaUrl } from './media';

type BrandContextValue = {
  settings: PublicBrandSettings;
  resolvedMark: string;
  resolvedFallbackImage: string | null;
  resolvedPattern: string;
  resolvedFavicon: string;
};

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({
  settings,
  children,
}: {
  settings: PublicBrandSettings;
  children: ReactNode;
}) {
  const resolvedMark = resolveMediaUrl(settings.brand_mark) || '/brand/br-monogram.png';
  const resolvedFallbackImage = settings.brand_fallback_image ? resolveMediaUrl(settings.brand_fallback_image) : null;
  const resolvedPattern = resolveMediaUrl(settings.brand_pattern) || '/brand/banco-arabesque-pattern.svg';
  const resolvedFavicon = resolveMediaUrl(settings.brand_favicon) || '/favicon.ico';

  return (
    <BrandContext.Provider value={{ settings, resolvedMark, resolvedFallbackImage, resolvedPattern, resolvedFavicon }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    return {
      settings: defaultBrandSettings,
      resolvedMark: '/brand/br-monogram.png',
      resolvedFallbackImage: null,
      resolvedPattern: '/brand/banco-arabesque-pattern.svg',
      resolvedFavicon: '/favicon.ico',
    };
  }
  return ctx;
}
