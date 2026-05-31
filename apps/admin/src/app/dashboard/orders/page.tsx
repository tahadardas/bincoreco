'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/api';
import { formatMoney, MoneyAmount } from '@/lib/money';

interface OrderItem {
  id: string;
  productNameSnapshot: string;
  quantity: number;
  grindType?: string | null;
  grindOptionNameAr?: string | null;
  grindOptionNameEn?: string | null;
  variantSnapshot?: { name?: string; sizeValue?: number; sizeUnit?: string } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: MoneyAmount;
  currencyCode?: string;
  pickupTime: string;
  createdAt: string;
  cancellationReason?: string | null;
  customer: { fullName: string; phone: string | null } | null;
  guestName?: string | null;
  guestPhone?: string | null;
  items: OrderItem[];
}

type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'PICKED_UP' | 'CANCELLED';

const statuses: { value: '' | OrderStatus; label: string }[] = [
  { value: '', label: 'الكل' },
  { value: 'PENDING', label: 'معلق' },
  { value: 'ACCEPTED', label: 'مقبول' },
  { value: 'PREPARING', label: 'قيد التحضير' },
  { value: 'READY_FOR_PICKUP', label: 'جاهز' },
  { value: 'PICKED_UP', label: 'تم الاستلام' },
  { value: 'CANCELLED', label: 'ملغي' },
];

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'معلق',
  ACCEPTED: 'مقبول',
  PREPARING: 'قيد التحضير',
  READY_FOR_PICKUP: 'جاهز للاستلام',
  PICKED_UP: 'تم الاستلام',
  CANCELLED: 'ملغي',
};

const statusColors: Record<OrderStatus, { background: string; color: string }> = {
  PENDING: { background: 'var(--br-warning)', color: 'white' },
  ACCEPTED: { background: 'var(--br-gold)', color: 'var(--br-black)' },
  PREPARING: { background: 'var(--br-coffee)', color: 'white' },
  READY_FOR_PICKUP: { background: 'var(--br-success)', color: 'white' },
  PICKED_UP: { background: 'var(--br-muted)', color: 'white' },
  CANCELLED: { background: 'var(--br-danger)', color: 'white' },
};

const nextStatusActions: Partial<Record<OrderStatus, { status: OrderStatus; label: string; danger?: boolean }[]>> = {
  PENDING: [
    { status: 'ACCEPTED', label: 'قبول' },
    { status: 'CANCELLED', label: 'إلغاء', danger: true },
  ],
  ACCEPTED: [
    { status: 'PREPARING', label: 'بدء التحضير' },
    { status: 'CANCELLED', label: 'إلغاء', danger: true },
  ],
  PREPARING: [
    { status: 'READY_FOR_PICKUP', label: 'جاهز للاستلام' },
    { status: 'CANCELLED', label: 'إلغاء', danger: true },
  ],
  READY_FOR_PICKUP: [
    { status: 'PICKED_UP', label: 'تم الاستلام' },
    { status: 'CANCELLED', label: 'إلغاء', danger: true },
  ],
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ar-SY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function describeItem(item: OrderItem) {
  const variantName = item.variantSnapshot?.name;
  const size = item.variantSnapshot?.sizeValue && item.variantSnapshot?.sizeUnit
    ? `${item.variantSnapshot.sizeValue}${item.variantSnapshot.sizeUnit}`
    : '';
  const form = item.grindType === 'ground'
    ? 'مطحون'
    : item.grindType === 'whole_bean'
      ? 'حب كامل'
      : null;
  const grind = item.grindOptionNameAr || item.grindOptionNameEn;
  const details = [variantName, size, form, grind].filter(Boolean).join(' · ');

  return details
    ? `${item.productNameSnapshot} (${details}) × ${item.quantity}`
    : `${item.productNameSnapshot} × ${item.quantity}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<'' | OrderStatus>('PENDING');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const query = new URLSearchParams({ limit: '50' });
    if (statusFilter) query.set('status', statusFilter);
    if (search.trim()) query.set('search', search.trim());
    if (fromDate) query.set('fromDate', new Date(`${fromDate}T00:00:00`).toISOString());
    if (toDate) query.set('toDate', new Date(`${toDate}T23:59:59.999`).toISOString());
    return query.toString();
  }, [fromDate, search, statusFilter, toDate]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<Order[]>(`/admin/orders?${queryString}`);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const updateStatus = async (order: Order, status: OrderStatus) => {
    let reason: string | undefined;
    if (status === 'CANCELLED') {
      const input = window.prompt('اكتب سبب الإلغاء');
      if (!input?.trim()) {
        return;
      }
      reason = input.trim();
    }

    setUpdatingId(order.id);
    try {
      await adminFetch(`/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      });
      await loadOrders();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'تعذر تحديث حالة الطلب');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>الطلبات</h1>
          <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>متابعة طلبات الاستلام وتغيير حالتها بوضوح.</p>
        </div>
        <button onClick={loadOrders} className="btn" style={{ background: 'var(--br-black)', color: 'white' }}>
          تحديث
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {statuses.map(status => (
            <button
              key={status.value || 'ALL'}
              onClick={() => setStatusFilter(status.value)}
              className={`btn btn-sm ${statusFilter === status.value ? 'btn-primary' : ''}`}
              style={statusFilter === status.value ? undefined : { background: 'var(--br-cream)' }}
            >
              {status.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.4fr) repeat(2, minmax(160px, 0.8fr))', gap: 12 }}>
          <input
            className="input"
            placeholder="بحث برقم الطلب أو اسم العميل أو اسم الزائر"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <input type="date" className="input" value={fromDate} onChange={event => setFromDate(event.target.value)} />
          <input type="date" className="input" value={toDate} onChange={event => setToDate(event.target.value)} />
        </div>
      </div>

      {loading && <div style={{ padding: 40 }}>جاري تحميل الطلبات...</div>}
      {error && !loading && <div className="card" style={{ color: 'var(--br-danger)' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
            <div key={order.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start', marginBottom: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{order.orderNumber}</span>
                    <span className="badge" style={statusColors[order.status]}>{statusLabels[order.status]}</span>
                  </div>
                  <div style={{ color: 'var(--br-muted)', fontSize: 13, marginTop: 6 }}>
                    {order.customer?.fullName || order.guestName || 'زائر'} · {order.customer?.phone || order.guestPhone || 'بدون رقم'} · الاستلام {formatDateTime(order.pickupTime)}
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, color: 'var(--br-gold)', fontSize: 18 }}>
                    {formatMoney(order.total, order.currencyCode || 'SYP')}
                  </div>
                  <div style={{ color: 'var(--br-muted)', fontSize: 12, marginTop: 4 }}>
                    أنشئ {formatDateTime(order.createdAt)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ background: 'var(--br-cream)', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}>
                    {describeItem(item)}
                  </div>
                ))}
              </div>

              {order.status === 'CANCELLED' && order.cancellationReason && (
                <div style={{ color: 'var(--br-danger)', fontSize: 13, marginBottom: 12 }}>
                  سبب الإلغاء: {order.cancellationReason}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(nextStatusActions[order.status] || []).map(action => (
                  <button
                    key={action.status}
                    onClick={() => updateStatus(order, action.status)}
                    disabled={updatingId === order.id}
                    className={`btn btn-sm ${action.danger ? 'btn-danger' : 'btn-primary'}`}
                  >
                    {updatingId === order.id ? 'جاري التحديث...' : action.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--br-muted)' }}>
              لا توجد طلبات ضمن الفلاتر الحالية
            </div>
          )}
        </div>
      )}
    </div>
  );
}
