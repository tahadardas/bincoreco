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

const whatsappMessages: Partial<Record<OrderStatus, string>> = {
  ACCEPTED: 'مرحباً {name}، تم قبول طلبك رقم {orderNumber} من Banco Ricco ☕\nسنبدأ بتحضيره قريباً.',
  PREPARING: 'مرحباً {name}، طلبك رقم {orderNumber} قيد التحضير الآن ☕',
  READY_FOR_PICKUP: 'مرحباً {name}، طلبك رقم {orderNumber} جاهز للاستلام من Banco Ricco ☕\nبانتظارك.',
  PICKED_UP: 'شكراً لك {name} لاستلام طلبك رقم {orderNumber} من Banco Ricco ☕\nنتمنى لك يوماً بطعم القهوة الجميل.',
  CANCELLED: 'مرحباً {name}، نعتذر، تم إلغاء طلبك رقم {orderNumber}.\nالسبب: {reason}',
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

function normalizePhoneForWhatsApp(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  if (cleaned.startsWith('00963')) cleaned = '963' + cleaned.slice(5);
  if (cleaned.startsWith('963')) return cleaned;
  if (cleaned.startsWith('09') && cleaned.length >= 10) return '963' + cleaned.slice(1);
  if (cleaned.startsWith('0')) return '963' + cleaned.slice(1);
  if (/^\d{7,15}$/.test(cleaned)) return cleaned;
  return null;
}

function getOrderCustomerPhone(order: Order): string | null {
  return order.customer?.phone || order.guestPhone || null;
}

function buildWhatsAppMessage(order: Order, newStatus: OrderStatus, reason?: string): string {
  const name = order.customer?.fullName || order.guestName || 'عميل';
  const msg = whatsappMessages[newStatus] || '';
  return msg
    .replace('{name}', name)
    .replace('{orderNumber}', order.orderNumber)
    .replace('{reason}', reason || '');
}

function openWhatsApp(phone: string, message: string) {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return;
  const url = `https://web.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
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
  const [toast, setToast] = useState<string | null>(null);
  const [autoWhatsApp, setAutoWhatsApp] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('br_open_whatsapp_on_status_change') !== 'false';
    }
    return true;
  });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    localStorage.setItem('br_open_whatsapp_on_status_change', String(autoWhatsApp));
  }, [autoWhatsApp]);

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
      if (!input?.trim()) return;
      reason = input.trim();
    }

    setUpdatingId(order.id);
    try {
      await adminFetch(`/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      });
      const phone = getOrderCustomerPhone(order);
      const statusMsg = statusLabels[status];
      showToast(`تم تغيير حالة الطلب ${order.orderNumber} إلى ${statusMsg}`);

      if (phone && autoWhatsApp && status !== 'PENDING') {
        const message = buildWhatsAppMessage(order, status, reason);
        const normalized = normalizePhoneForWhatsApp(phone);
        if (normalized) {
          const confirmed = window.confirm(`تم تغيير حالة الطلب. هل تريد فتح واتساب لإبلاغ العميل؟`);
          if (confirmed) {
            openWhatsApp(phone, message);
            showToast(`تم فتح واتساب ويب برسالة جاهزة`);
          }
        }
      } else if (!phone) {
        showToast(`تم تحديث الحالة، لكن لا يوجد رقم هاتف لإرسال واتساب`);
      }

      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث حالة الطلب');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleManualWhatsApp = (order: Order) => {
    const phone = getOrderCustomerPhone(order);
    if (!phone) {
      showToast('لا يوجد رقم هاتف لإرسال واتساب');
      return;
    }
    const message = buildWhatsAppMessage(order, order.status);
    openWhatsApp(phone, message);
    showToast(`تم فتح واتساب ويب برسالة للحالة الحالية`);
  };

  return (
    <div dir="rtl">
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>الطلبات</h1>
          <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>متابعة طلبات الاستلام وتغيير حالتها بوضوح.</p>
        </div>
        <div className="admin-actions-row">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--br-muted)' }}>
            <input type="checkbox" checked={autoWhatsApp} onChange={e => setAutoWhatsApp(e.target.checked)} />
            فتح واتساب تلقائياً بعد تغيير الحالة
          </label>
          <button onClick={loadOrders} className="btn" style={{ background: 'var(--br-black)', color: 'white' }}>
            تحديث
          </button>
        </div>
      </div>

      {toast && (
        <div className="card" style={{ color: 'var(--br-success)', marginBottom: 16, padding: 16, fontWeight: 700 }}>
          {toast}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
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

        <div className="admin-filter-grid" style={{ gridTemplateColumns: 'minmax(220px, 1.4fr) repeat(2, minmax(160px, 0.8fr))' }}>
          <input className="input" placeholder="بحث برقم الطلب أو اسم العميل أو اسم الزائر" value={search} onChange={event => setSearch(event.target.value)} />
          <input type="date" className="input" value={fromDate} onChange={event => setFromDate(event.target.value)} />
          <input type="date" className="input" value={toDate} onChange={event => setToDate(event.target.value)} />
        </div>
      </div>

      {loading && <div style={{ padding: 40, textAlign: 'center' }}>جاري تحميل الطلبات...</div>}
      {error && !loading && <div className="card" style={{ color: 'var(--br-danger)', padding: 16 }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => {
            const phone = getOrderCustomerPhone(order);
            return (
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

                <div className="admin-actions-row">
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
                  {phone && (
                    <button
                      onClick={() => handleManualWhatsApp(order)}
                      className="btn btn-sm"
                      style={{ background: '#25D366', color: '#fff' }}
                      title="إرسال واتساب للحالة الحالية"
                    >
                      📱 واتساب
                    </button>
                  )}
                </div>
              </div>
            );
          })}

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
