'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getDictionary, Locale } from '@/lib/dictionaries';

type HeaderProps = {
  brandMark?: string;
};

export default function Header({ brandMark }: HeaderProps) {
  const params = useParams();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const { user, logout } = useAuth();

  return (
    <header className="br-header">
      <div className="container br-header__inner">
        <Link href={`/${locale}`} className="br-brand" aria-label="Banco Ricco">
          <img
            src={brandMark || '/brand/br-monogram.png'}
            alt=""
            className="br-brand__mark"
          />
          <span className="br-brand__name">
            <span className="br-brand__title">Banco Ricco</span>
            <span className="br-brand__subtitle">{dict.home.respectBeans}</span>
          </span>
        </Link>
        <nav className="br-nav" aria-label="Main navigation">
          <Link href={`/${locale}`}>{dict.nav.home}</Link>
          <Link href={`/${locale}/products`}>{dict.nav.products}</Link>
          <Link href={`/${locale}/about`}>{dict.nav.about}</Link>
          <Link href={`/${locale}/contact`}>{dict.nav.contact}</Link>
          <Link href={`/${locale}/cart`}>{dict.nav.cart}</Link>
          {user && <Link href={`/${locale}/orders`}>{dict.nav.orders}</Link>}
          {user && <Link href={`/${locale}/loyalty`}>{dict.nav.loyalty}</Link>}
          <Link href={`/${locale === 'ar' ? 'en' : 'ar'}`} className="lang-switch">
            {locale === 'ar' ? 'EN' : 'AR'}
          </Link>
          {user ? (
            <button onClick={logout}>{dict.nav.logout}</button>
          ) : (
            <Link href={`/${locale}/?login=1`} className="lang-switch">
              {dict.nav.login}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
