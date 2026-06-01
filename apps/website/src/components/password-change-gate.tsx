'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { Locale } from '@/lib/dictionaries';

export default function PasswordChangeGate({ locale }: { locale: Locale }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user?.mustChangePassword) {
      return;
    }

    const target = `/${locale}/account/change-password`;
    if (pathname !== target) {
      router.replace(target);
    }
  }, [loading, locale, pathname, router, user?.mustChangePassword]);

  return null;
}
