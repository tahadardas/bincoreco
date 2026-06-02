'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/api';
import { formatMoney, MoneyAmount } from '@/lib/money';
import { DashboardSkeleton } from './skeleton';
import { Alert } from './alert';

interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  currencyCode: string;
  totalQuantity: number;
  totalRevenue: MoneyAmount;
}

interface DashboardData {
  todayOrders: number;
  todayRevenue: MoneyAmount;
  pendingOrders: number;
  preparingOrders: number;
  totalActiveProducts: number;
  totalCustomers: number;
  topProducts: TopProduct[];
  warnings?: string[];
  generatedAt?: string;
}

function StatCard({
  label,
  value,
  tone = 'gold',
}: {
  label: string;
  value: string | number;
  tone?: 'gold' | 'warning' | 'coffee' | 'neutral';
}) {
  const colorMap = {
    gold: 'var(--br-gold)',
    warning: 'var(--br-warning)',
    coffee: 'var(--br-coffee)',
    neutral: 'var(--br-black)',
  };

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 34, fontWeight: 700, color: colorMap[tone] }}>{value}</div>
      <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    try {
      const result = await adminFetch<DashboardData>('/admin/dashboard');
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل لوحة التحكم');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  useEffect(() => {
    const interval = setInterval(() => fetchDashboard(), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SY', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(date);
  };

  if (error && !data) {
    return (
      <div dir="rtl">
        <div className="admin-page-header">
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>لوحة التحكم</h1>
        </div>
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div dir="rtl">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div dir="rtl">
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>لوحة التحكم</h1>
          <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>نظرة اليوم التشغيلية للطلبات والمبيعات.</p>
          {lastUpdated && (
            <p style={{ color: 'var(--br-muted)', fontSize: 12, marginTop: 4 }}>
              آخر تحديث: {formatTimestamp(lastUpdated)}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => fetchDashboard(true)}
            className="btn btn-sm"
            style={{ background: 'var(--br-cream)' }}
            disabled={refreshing}
          >
            {refreshing ? 'جاري التحديث...' : 'تحديث'}
          </button>
          <Link href="/dashboard/orders" className="btn btn-primary">إدارة الطلبات</Link>
          <Link href="/dashboard/products" className="btn" style={{ background: 'var(--br-black)', color: 'white' }}>إدارة المنتجات</Link>
        </div>
      </div>

      {data.warnings && data.warnings.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {data.warnings.map((w, i) => (
            <Alert key={i} tone="warning">{w}</Alert>
          ))}
        </div>
      )}

      <div className="grid-stats">
        <StatCard label="طلبات اليوم" value={data.todayOrders} />
        <StatCard label="مبيعات اليوم" value={formatMoney(data.todayRevenue)} />
        <StatCard label="طلبات معلقة" value={data.pendingOrders} tone="warning" />
        <StatCard label="قيد التحضير" value={data.preparingOrders} tone="coffee" />
        <StatCard label="منتجات نشطة" value={data.totalActiveProducts} tone="neutral" />
        <StatCard label="عملاء" value={data.totalCustomers} tone="neutral" />
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>أفضل 5 منتجات اليوم</h2>
            <p style={{ color: 'var(--br-muted)', fontSize: 13, marginTop: 4 }}>محسوبة من عناصر الطلب المخزنة، مع استبعاد الطلبات الملغاة.</p>
          </div>
          <Link href="/dashboard/reports" className="btn btn-sm" style={{ background: 'var(--br-cream)' }}>التقارير</Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>المنتج</th>
              <th>SKU</th>
              <th>الكمية</th>
              <th>الإيرادات</th>
            </tr>
          </thead>
          <tbody>
            {data.topProducts.map((product, index) => (
              <tr key={`${product.productId}-${product.currencyCode}`}>
                <td>{index + 1}</td>
                <td style={{ fontWeight: 700 }}>{product.productName}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{product.sku}</td>
                <td>{product.totalQuantity}</td>
                <td style={{ fontWeight: 700, color: 'var(--br-gold)' }}>{formatMoney(product.totalRevenue, product.currencyCode)}</td>
              </tr>
            ))}
            {data.topProducts.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--br-muted)', padding: 28 }}>
                  لا توجد مبيعات مكتملة اليوم حتى الآن
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
