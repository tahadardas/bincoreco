'use client';
import { useEffect } from 'react';

export default function LocaleHeadUpdater({ lang, favicon }: { lang: string; favicon: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) {
      link.href = favicon;
    }
  }, [lang, favicon]);
  return null;
}
