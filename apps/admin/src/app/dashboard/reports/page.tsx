'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';
import { formatMoney, MoneyAmount } from '@/lib/money';

interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  currencyCode: string;
  totalQuantity: number;
  totalRevenue: MoneyAmount;
}

interface DailySalesRow {
  date: string;
  totalOrders: number;
  cancelledOrders: number;
  totalRevenue: MoneyAmount;
  revenueByCurrency: Record<string, MoneyAmount>;
}

interface DailySales {
  totalOrders: number;
  totalRevenue: MoneyAmount;
  revenueByCurrency: Record<string, MoneyAmount>;
  dailySales: DailySalesRow[];
  ordersByStatus: Record<string, number>;
  averagePreparationTime: number;
  preparationSampleSize: number;
  cancelledOrders: number;
}

const statusLabels: Record<string, string> = {
  PENDING: 'بانتظار القبول',
  ACCEPTED: 'مقبول',
  PREPARING: 'قيد التحضير',
  READY_FOR_PICKUP: 'جاهز للاستلام',
  PICKED_UP: 'تم الاستلام',
  CANCELLED: 'ملغي',
};

function formatCurrencyBreakdown(values: Record<string, MoneyAmount>) {
  const entries = Object.entries(values);
  if (!entries.length) {
    return formatMoney(0);
  }
  return entries.map(([currencyCode, amount]) => formatMoney(amount, currencyCode)).join(' / ');
}

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat('ar-SY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: 'gold' | 'danger' | 'coffee';
}) {
  const color = tone === 'danger'
    ? 'var(--br-danger)'
    : tone === 'coffee'
      ? 'var(--br-coffee)'
      : 'var(--br-gold)';

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>{label}</div>
    </div>
  );
}

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailySales, setDailySales] = useState<DailySales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const from = new Date(`${fromDate}T00:00:00`).toISOString();
    const to = new Date(`${toDate}T23:59:59.999`).toISOString();

    Promise.all([
      adminFetch<TopProduct[]>(`/admin/reports/top-products?fromDate=${encodeURIComponent(from)}&toDate=${encodeURIComponent(to)}`),
      adminFetch<DailySales>(`/admin/reports/daily-sales?fromDate=${encodeURIComponent(from)}&toDate=${encodeURIComponent(to)}`),
    ])
      .then(([products, sales]) => {
        setTopProducts(products);
        setDailySales(sales);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'تعذر تحميل التقارير'))
      .finally(() => setLoading(false));
  }, [fromDate, toDate]);

  return (
    <div dir="rtl">
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>التقارير</h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 180 }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 14 }}>من تاريخ</label>
            <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div style={{ minWidth: 180 }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 14 }}>إلى تاريخ</label>
            <input type="date" className="input" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
        </div>
      </div>

      {loading && <div style={{ padding: 40 }}>جاري تحميل التقارير...</div>}
      {error && !loading && (
        <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 24 }}>
          {error}
        </div>
      )}

      {!loading && !error && dailySales && (
        <>
          <div className="grid-stats" style={{ marginBottom: 32 }}>
            <StatCard label="إجمالي الطلبات" value={dailySales.totalOrders} />
            <StatCard label="إجمالي المبيعات" value={formatCurrencyBreakdown(dailySales.revenueByCurrency)} />
            <StatCard label="طلبات ملغاة" value={dailySales.cancelledOrders} tone="danger" />
            <StatCard
              label={`متوسط التجهيز (${dailySales.preparationSampleSize} طلب)`}
              value={`${dailySales.averagePreparationTime} دقيقة`}
              tone="coffee"
            />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>المبيعات اليومية</h2>
          <div className="card" style={{ padding: 0, marginBottom: 32, overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الطلبات</th>
                  <th>الملغاة</th>
                  <th>الإيرادات</th>
                </tr>
              </thead>
              <tbody>
                {dailySales.dailySales.map(row => (
                  <tr key={row.date}>
                    <td style={{ fontWeight: 600 }}>{formatDateLabel(row.date)}</td>
                    <td>{row.totalOrders}</td>
                    <td>{row.cancelledOrders}</td>
                    <td style={{ fontWeight: 700, color: 'var(--br-gold)' }}>{formatCurrencyBreakdown(row.revenueByCurrency)}</td>
                  </tr>
                ))}
                {dailySales.dailySales.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--br-muted)' }}>لا توجد بيانات ضمن هذا النطاق</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>الأصناف الأكثر مبيعاً</h2>
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>المنتج</th>
                  <th>SKU</th>
                  <th>العملة</th>
                  <th>الكمية المباعة</th>
                  <th>الإيرادات</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={`${product.productId}-${product.currencyCode}-${index}`}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{product.productName}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{product.sku}</td>
                    <td>{product.currencyCode}</td>
                    <td>{product.totalQuantity}</td>
                    <td style={{ fontWeight: 700, color: 'var(--br-gold)' }}>{formatMoney(product.totalRevenue, product.currencyCode)}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--br-muted)' }}>لا توجد بيانات ضمن هذا النطاق</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 600, margin: '32px 0 16px' }}>الطلبات حسب الحالة</h2>
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr><th>الحالة</th><th>العدد</th></tr>
              </thead>
              <tbody>
                {Object.entries(dailySales.ordersByStatus).map(([status, count]) => (
                  <tr key={status}>
                    <td><span className="badge badge-gold">{statusLabels[status] || status}</span></td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
