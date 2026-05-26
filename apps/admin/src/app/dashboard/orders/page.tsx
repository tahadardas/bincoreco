'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/api';

interface Order {
  id: string; orderNumber: string; status: string;
  total: number; pickupTime: string; createdAt: string;
  customer: { fullName: string; phone: string | null };
  items: { id: string; productNameSnapshot: string; quantity: number }[];
}

const STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/admin/orders?limit=50${statusFilter ? `&status=${statusFilter}` : ''}`;
      const data: any = await adminFetch(url);
      setOrders(data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminFetch(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      loadOrders();
    } catch (err: any) { alert(err.message); }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'var(--br-warning)',
    ACCEPTED: 'var(--br-gold)',
    PREPARING: 'var(--br-coffee)',
    READY_FOR_PICKUP: 'var(--br-success)',
    PICKED_UP: 'var(--br-muted)',
    CANCELLED: 'var(--br-danger)',
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>الطلبات</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setStatusFilter('')} className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : ''}`}>الكل</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : ''}`}>
            {s}
          </button>
        ))}
      </div>
      {loading ? <div style={{ padding: 40 }}>جاري التحميل...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
            <div key={order.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{order.orderNumber}</span>
                  <span style={{ color: 'var(--br-muted)', fontSize: 13, marginRight: 12 }}>
                    {order.customer.fullName} - {order.customer.phone || ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge" style={{ background: statusColors[order.status] || '#ddd', color: order.status === 'CANCELLED' ? 'white' : 'var(--br-black)' }}>
                    {order.status}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--br-gold)' }}>{order.total.toLocaleString()} SYP</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--br-muted)', marginBottom: 12 }}>
                {order.items.map(i => `${i.productNameSnapshot} x${i.quantity}`).join(' | ')}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {order.status === 'PENDING' && (
                  <>
                    <button onClick={() => updateStatus(order.id, 'ACCEPTED')} className="btn btn-sm btn-primary">قبول</button>
                    <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="btn btn-sm btn-danger">إلغاء</button>
                  </>
                )}
                {order.status === 'ACCEPTED' && (
                  <button onClick={() => updateStatus(order.id, 'PREPARING')} className="btn btn-sm btn-primary">بدء التحضير</button>
                )}
                {order.status === 'PREPARING' && (
                  <button onClick={() => updateStatus(order.id, 'READY_FOR_PICKUP')} className="btn btn-sm btn-primary">جاهز للاستلام</button>
                )}
                {order.status === 'READY_FOR_PICKUP' && (
                  <button onClick={() => updateStatus(order.id, 'PICKED_UP')} className="btn btn-sm btn-primary">تم الاستلام</button>
                )}
              </div>
            </div>
          ))}
          {orders.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--br-muted)' }}>لا توجد طلبات</div>}
        </div>
      )}
    </div>
  );
}
