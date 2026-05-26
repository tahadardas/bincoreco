'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { useAuth } from '@/lib/auth-context';

interface Order {
  id: string; orderNumber: string; status: string;
  total: number; pickupTime: string; notes: string | null;
  createdAt: string;
  items: { id: string; productNameSnapshot: string; quantity: number; unitPrice: number; total: number }[];
}

export default function OrdersPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.push(`/${locale}/?login=1`); return; }
    api.get<Order[]>('/orders/my', token)
      .then((data: any) => setOrders(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (!user) return null;
  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}>Loading...</div>;

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32 }}>{dict.order.title}</h1>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--br-muted)' }}>{dict.order.noOrders}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {orders.map(order => (
            <div key={order.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>
                    {dict.order.number} {order.orderNumber}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--br-muted)' }}>
                    {new Date(order.createdAt).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                  </div>
                </div>
                <span className={`badge ${order.status === 'CANCELLED' ? '' : 'badge-gold'}`}
                  style={{
                    background: order.status === 'CANCELLED' ? 'var(--br-danger)' :
                      order.status === 'READY_FOR_PICKUP' ? 'var(--br-success)' :
                      order.status === 'PICKED_UP' ? 'var(--br-muted)' : 'var(--br-gold)',
                    color: order.status === 'CANCELLED' ? 'white' : 'var(--br-black)',
                  }}
                >
                  {(dict.order as any)[order.status] || order.status}
                </span>
              </div>
              <div style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
                    <span>{item.productNameSnapshot} x{item.quantity}</span>
                    <span>{item.total.toLocaleString()} SYP</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #eee', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>{dict.order.total}</span>
                <span>{order.total.toLocaleString()} SYP</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--br-muted)', marginTop: 8 }}>
                {dict.order.pickupTime}: {new Date(order.pickupTime).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
