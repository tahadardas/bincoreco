'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getDictionary, Locale } from '@/lib/dictionaries';
import CurrencySwitcher from '@/components/currency-switcher';

type HeaderProps = {
  brandMark?: string;
};

export default function Header({ brandMark }: HeaderProps) {
  const params = useParams();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const navLinks = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/products`, label: dict.nav.products },
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/contact`, label: dict.nav.contact },
    { href: `/${locale}/cart`, label: dict.nav.cart },
    ...(user ? [
      { href: `/${locale}/orders`, label: dict.nav.orders },
      { href: `/${locale}/loyalty`, label: dict.nav.loyalty },
    ] : []),
  ];

  const authControl = user ? (
    <button onClick={() => { logout(); closeMenu(); }}>{dict.nav.logout}</button>
  ) : (
    <Link href={`/${locale}/?login=1`} className="lang-switch" onClick={closeMenu}>
      {dict.nav.login}
    </Link>
  );

  return (
    <header className="br-header">
      <div className="container br-header__inner">
        <Link href={`/${locale}`} className="br-brand" aria-label="Banco Ricco" onClick={closeMenu}>
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
        <button
          className="br-menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className="br-nav" aria-label="Main navigation">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
          <CurrencySwitcher />
          <Link href={`/${locale === 'ar' ? 'en' : 'ar'}`} className="lang-switch">
            {locale === 'ar' ? 'EN' : 'AR'}
          </Link>
          {authControl}
        </nav>
      </div>
      <div className={`br-mobile-drawer ${menuOpen ? 'is-open' : ''}`}>
        <nav className="br-mobile-drawer__nav" aria-label="Mobile navigation">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={closeMenu}>{link.label}</Link>
          ))}
          <div className="br-mobile-drawer__controls">
            <CurrencySwitcher className="lang-switch br-mobile-select" />
            <Link href={`/${locale === 'ar' ? 'en' : 'ar'}`} className="lang-switch" onClick={closeMenu}>
              {locale === 'ar' ? 'EN' : 'AR'}
            </Link>
            {authControl}
          </div>
        </nav>
      </div>
    </header>
  );
}
