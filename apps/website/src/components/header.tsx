'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getDictionary, Locale } from '@/lib/dictionaries';

export default function Header() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const { user, logout } = useAuth();

  return (
    <header style={{
      background: 'var(--br-black)',
      color: 'var(--br-white)',
      padding: '16px 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/${locale}`} style={{ fontSize: 24, fontWeight: 700, color: 'var(--br-gold)' }}>
          Banco Ricco
        </Link>
        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href={`/${locale}`}>{dict.nav.home}</Link>
          <Link href={`/${locale}/products`}>{dict.nav.products}</Link>
          <Link href={`/${locale}/cart`}>{dict.nav.cart}</Link>
          {user && <Link href={`/${locale}/orders`}>{dict.nav.orders}</Link>}
          {user && <Link href={`/${locale}/loyalty`}>{dict.nav.loyalty}</Link>}
          <Link href={`/${locale === 'ar' ? 'en' : 'ar'}`} style={{ color: 'var(--br-gold)' }}>
            {locale === 'ar' ? 'EN' : 'AR'}
          </Link>
          {user ? (
            <button onClick={logout} style={{ background: 'none', color: 'var(--br-white)' }}>
              {dict.nav.logout}
            </button>
          ) : (
            <Link href={`/${locale}/?login=1`} style={{ color: 'var(--br-gold)' }}>
              {dict.nav.login}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
