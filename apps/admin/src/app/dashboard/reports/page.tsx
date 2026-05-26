'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';

interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface DailySales {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<string, number>;
  averagePreparationTime: number;
  cancelledOrders: number;
}

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailySales, setDailySales] = useState<DailySales | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const from = new Date(fromDate).toISOString();
    const to = new Date(toDate + 'T23:59:59').toISOString();
    Promise.all([
      adminFetch<TopProduct[]>(`/admin/reports/top-products?fromDate=${from}&toDate=${to}`),
      adminFetch<DailySales>(`/admin/reports/daily-sales?fromDate=${from}&toDate=${to}`),
    ]).then(([products, sales]) => {
      setTopProducts(products);
      setDailySales(sales);
    }).catch(console.error).finally(() => setLoading(false));
  }, [fromDate, toDate]);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>التقارير</h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 14 }}>من تاريخ</label>
            <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 14 }}>إلى تاريخ</label>
            <input type="date" className="input" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? <div style={{ padding: 40 }}>جاري التحميل...</div> : (
        <>
          {dailySales && (
            <div className="grid-stats" style={{ marginBottom: 32 }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--br-gold)' }}>{dailySales.totalOrders}</div>
                <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>إجمالي الطلبات</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--br-gold)' }}>{dailySales.totalRevenue.toLocaleString()}</div>
                <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>إجمالي المبيعات (SYP)</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--br-danger)' }}>{dailySales.cancelledOrders}</div>
                <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>طلبات ملغاة</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 700 }}>{dailySales.averagePreparationTime}</div>
                <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>متوسط وقت التجهيز (دقيقة)</div>
              </div>
            </div>
          )}

          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>الأصناف الأكثر مبيعاً</h2>
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>المنتج</th>
                  <th>SKU</th>
                  <th>الكمية المباعة</th>
                  <th>الإيرادات</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.productId}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{p.productName}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{p.sku}</td>
                    <td>{p.totalQuantity}</td>
                    <td style={{ fontWeight: 700, color: 'var(--br-gold)' }}>{p.totalRevenue.toLocaleString()} SYP</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--br-muted)' }}>لا توجد بيانات</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {dailySales && Object.keys(dailySales.ordersByStatus).length > 0 && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 600, margin: '32px 0 16px' }}>الطلبات حسب الحالة</h2>
              <div className="card">
                <table className="table">
                  <thead>
                    <tr><th>الحالة</th><th>العدد</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(dailySales.ordersByStatus).map(([status, count]) => (
                      <tr key={status}>
                        <td><span className="badge badge-gold">{status}</span></td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
