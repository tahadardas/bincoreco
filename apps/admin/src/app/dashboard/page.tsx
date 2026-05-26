'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';

interface DashboardData {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  preparingOrders: number;
  totalActiveProducts: number;
  totalCustomers: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    adminFetch<DashboardData>('/admin/dashboard').then(setData).catch(console.error);
  }, []);

  if (!data) return <div style={{ padding: 40 }}>جاري التحميل...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>لوحة التحكم</h1>
      <div className="grid-stats">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--br-gold)' }}>{data.todayOrders}</div>
          <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>طلبات اليوم</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--br-gold)' }}>{data.todayRevenue.toLocaleString()}</div>
          <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>مبيعات اليوم (SYP)</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--br-warning)' }}>{data.pendingOrders}</div>
          <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>طلبات معلقة</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--br-coffee)' }}>{data.preparingOrders}</div>
          <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>قيد التحضير</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700 }}>{data.totalActiveProducts}</div>
          <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>منتجات نشطة</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 700 }}>{data.totalCustomers}</div>
          <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>عملاء</div>
        </div>
      </div>
    </div>
  );
}
