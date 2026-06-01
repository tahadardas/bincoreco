'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AdminUser {
  fullName?: string;
  role?: string;
}

const links = [
  { href: '/dashboard', label: 'الرئيسية', icon: 'DB' },
  { href: '/dashboard/orders', label: 'الطلبات', icon: 'OR' },
  { href: '/dashboard/products', label: 'المنتجات', icon: 'PR' },
  { href: '/dashboard/categories', label: 'التصنيفات', icon: 'CA' },
  { href: '/dashboard/grind-options', label: 'خيارات الطحن', icon: 'GR' },
  { href: '/dashboard/members', label: 'الأعضاء', icon: 'MB' },
  { href: '/dashboard/reviews', label: 'التقييمات', icon: 'RV' },
  { href: '/dashboard/contact-messages', label: 'رسائل التواصل', icon: 'CM' },
  { href: '/dashboard/loyalty', label: 'الولاء', icon: 'BR' },
  { href: '/dashboard/currencies', label: 'العملات', icon: 'FX' },
  { href: '/dashboard/banners', label: 'البنرات', icon: 'BN' },
  { href: '/dashboard/reports', label: 'التقارير', icon: 'RP' },
  { href: '/dashboard/settings/brand', label: 'العلامة التجارية', icon: 'ID' },
  { href: '/dashboard/settings/about-page', label: 'صفحة من نحن', icon: 'AB' },
  { href: '/dashboard/settings/contact-page', label: 'صفحة اتصل بنا', icon: 'CT' },
  { href: '/dashboard/settings/experience', label: 'التجربة', icon: 'EX' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    const storedUser = localStorage.getItem('admin_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  return (
    <div className="admin-shell" dir="rtl">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">Banco Ricco</div>
        {user && (
          <div className="admin-sidebar-user">
            {user.fullName || 'مايسترو'}{user.role ? ` · ${user.role}` : ''}
          </div>
        )}
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={
              'admin-sidebar-link' +
              (pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(`${link.href}/`))
                ? ' active'
                : '')
            }
          >
            <span className="admin-sidebar-icon">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
        <button onClick={logout} className="admin-sidebar-logout">
          تسجيل الخروج
        </button>
      </aside>
      <div className="admin-main">
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
