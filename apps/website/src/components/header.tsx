'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen, closeMenu]);

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
          ref={toggleRef}
          className="br-menu-toggle"
          type="button"
          aria-label={menuOpen ? (locale === 'ar' ? 'إغلاق القائمة' : 'Close navigation') : (locale === 'ar' ? 'فتح القائمة' : 'Open navigation')}
          aria-expanded={menuOpen}
          aria-controls="mobile-drawer-nav"
          onClick={() => setMenuOpen(open => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        {/* Desktop nav */}
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

      {/* Mobile drawer */}
      <div
        ref={drawerRef}
        className={`br-mobile-drawer ${menuOpen ? 'is-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <div className="br-mobile-drawer__overlay" onClick={closeMenu} />
        <nav id="mobile-drawer-nav" className="br-mobile-drawer__nav" aria-label={locale === 'ar' ? 'القائمة الرئيسية' : 'Mobile navigation'}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={closeMenu}>{link.label}</Link>
          ))}
          <div className="br-mobile-drawer__controls">
            <CurrencySwitcher />
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
