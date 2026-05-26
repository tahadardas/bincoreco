'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/login'); return; }
    const u = localStorage.getItem('admin_user');
    if (u) setUser(JSON.parse(u));
  }, []);

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  const links = [
    { href: '/dashboard', label: 'الرئيسية' },
    { href: '/dashboard/orders', label: 'الطلبات' },
    { href: '/dashboard/products', label: 'المنتجات' },
    { href: '/dashboard/categories', label: 'التصنيفات' },
    { href: '/dashboard/grind-options', label: 'خيارات الطحن' },
    { href: '/dashboard/loyalty', label: 'الولاء' },
    { href: '/dashboard/banners', label: 'البنرات' },
    { href: '/dashboard/reports', label: 'التقارير' },
  ];

  return (
    <div>
      <div className="sidebar">
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--br-gold)', marginBottom: 24, textAlign: 'center' }}>
          Banco Ricco
        </div>
        <div style={{ fontSize: 12, color: 'var(--br-muted)', marginBottom: 16 }}>
          {user?.fullName || 'مايسترو'}
        </div>
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? 'active' : ''}
          >
            {link.label}
          </Link>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={logout} style={{
          background: 'rgba(255,255,255,0.1)', color: 'var(--br-muted)',
          padding: '12px 16px', borderRadius: 8, textAlign: 'right', fontSize: 14,
        }}>
          تسجيل الخروج
        </button>
      </div>
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
