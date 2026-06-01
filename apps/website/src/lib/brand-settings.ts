import { resolveMediaUrl } from './media';
import { getApiBaseUrl } from './api';

export interface PublicBrandSettings {
  brand_logo_main: string | null;
  brand_logo_dark: string | null;
  brand_logo_light: string | null;
  brand_mark: string | null;
  brand_favicon: string | null;
  brand_fallback_image: string | null;
  brand_pattern: string | null;
  brand_footer_logo: string | null;
  brand_pattern_opacity: string | null;
}

export const defaultBrandSettings: PublicBrandSettings = {
  brand_logo_main: null,
  brand_logo_dark: null,
  brand_logo_light: null,
  brand_mark: '/brand/br-monogram.png',
  brand_favicon: '/favicon.ico',
  brand_fallback_image: null,
  brand_pattern: '/brand/banco-arabesque-pattern.svg',
  brand_footer_logo: null,
  brand_pattern_opacity: null,
};

export async function getPublicBrandSettings(): Promise<PublicBrandSettings> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/settings/public-brand`, {
      cache: 'no-store',
    });
    if (!res.ok) return { ...defaultBrandSettings };
    const json = await res.json();
    if (!json.success) return { ...defaultBrandSettings };
    const data = json.data as Record<string, string | null>;

    if (process.env.NODE_ENV === 'development') {
      console.info('[BrandSettings] Public settings loaded', data);
    }

    return {
      brand_logo_main: data.brand_logo_main ?? defaultBrandSettings.brand_logo_main,
      brand_logo_dark: data.brand_logo_dark ?? defaultBrandSettings.brand_logo_dark,
      brand_logo_light: data.brand_logo_light ?? defaultBrandSettings.brand_logo_light,
      brand_mark: data.brand_mark ?? defaultBrandSettings.brand_mark,
      brand_favicon: data.brand_favicon ?? defaultBrandSettings.brand_favicon,
      brand_fallback_image: data.brand_fallback_image ?? defaultBrandSettings.brand_fallback_image,
      brand_pattern: data.brand_pattern ?? defaultBrandSettings.brand_pattern,
      brand_footer_logo: data.brand_footer_logo ?? defaultBrandSettings.brand_footer_logo,
      brand_pattern_opacity: data.brand_pattern_opacity ?? defaultBrandSettings.brand_pattern_opacity,
    };
  } catch {
    return { ...defaultBrandSettings };
  }
}

export function resolveBrandAsset(url: string | null, fallback: string): string {
  if (!url) return fallback;
  const resolved = resolveMediaUrl(url);
  if (!resolved) return fallback;
  return resolved;
}
