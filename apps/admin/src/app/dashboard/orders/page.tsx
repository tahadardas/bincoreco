'use client';
import { useCallback, useMemo, useState } from 'react';
import { useOrders, useUpdateOrderStatus } from '@/lib/admin-api';
import { formatMoney } from '@/lib/money';
import ConfirmDialog from '@/components/confirm-dialog';
import { OrderStatus } from '@banco-ricco/types';

type StatusOption = '' | OrderStatus;

const statusOptions: { value: StatusOption; label: string }[] = [
  { value: '', label: 'الكل' },
  { value: OrderStatus.PENDING, label: 'معلق' },
  { value: OrderStatus.ACCEPTED, label: 'مقبول' },
  { value: OrderStatus.PREPARING, label: 'قيد التحضير' },
  { value: OrderStatus.READY_FOR_PICKUP, label: 'جاهز' },
  { value: OrderStatus.PICKED_UP, label: 'تم الاستلام' },
  { value: OrderStatus.CANCELLED, label: 'ملغي' },
];

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'معلق',
  [OrderStatus.ACCEPTED]: 'مقبول',
  [OrderStatus.PREPARING]: 'قيد التحضير',
  [OrderStatus.READY_FOR_PICKUP]: 'جاهز للاستلام',
  [OrderStatus.PICKED_UP]: 'تم الاستلام',
  [OrderStatus.CANCELLED]: 'ملغي',
};

const statusColors: Record<OrderStatus, { background: string; color: string }> = {
  [OrderStatus.PENDING]: { background: 'var(--br-warning)', color: 'white' },
  [OrderStatus.ACCEPTED]: { background: 'var(--br-gold)', color: 'var(--br-black)' },
  [OrderStatus.PREPARING]: { background: 'var(--br-coffee)', color: 'white' },
  [OrderStatus.READY_FOR_PICKUP]: { background: 'var(--br-success)', color: 'white' },
  [OrderStatus.PICKED_UP]: { background: 'var(--br-muted)', color: 'white' },
  [OrderStatus.CANCELLED]: { background: 'var(--br-danger)', color: 'white' },
};

const nextStatusActions: Partial<Record<OrderStatus, { status: OrderStatus; label: string; danger?: boolean }[]>> = {
  [OrderStatus.PENDING]: [
    { status: OrderStatus.ACCEPTED, label: 'قبول' },
    { status: OrderStatus.CANCELLED, label: 'إلغاء', danger: true },
  ],
  [OrderStatus.ACCEPTED]: [
    { status: OrderStatus.PREPARING, label: 'بدء التحضير' },
    { status: OrderStatus.CANCELLED, label: 'إلغاء', danger: true },
  ],
  [OrderStatus.PREPARING]: [
    { status: OrderStatus.READY_FOR_PICKUP, label: 'جاهز للاستلام' },
    { status: OrderStatus.CANCELLED, label: 'إلغاء', danger: true },
  ],
  [OrderStatus.READY_FOR_PICKUP]: [
    { status: OrderStatus.PICKED_UP, label: 'تم الاستلام' },
    { status: OrderStatus.CANCELLED, label: 'إلغاء', danger: true },
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

function describeItem(item: { productNameSnapshot: string; quantity: number; grindType?: string | null; grindOptionNameAr?: string | null; grindOptionNameEn?: string | null; variantSnapshot?: { name?: string; sizeValue?: number; sizeUnit?: string } | null }) {
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

function normalizePhone(phone: string | null | undefined): string | null {
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

function getPhone(order: { customer: { phone: string | null } | null; guestPhone?: string | null }): string | null {
  return order.customer?.phone || order.guestPhone || null;
}

function buildMessage(order: { orderNumber: string; customer: { fullName: string } | null; guestName?: string | null }, status: OrderStatus, reason?: string): string {
  const name = order.customer?.fullName || order.guestName || 'عميل';
  const msg = whatsappMessages[status] || '';
  return msg.replace('{name}', name).replace('{orderNumber}', order.orderNumber).replace('{reason}', reason || '');
}

function openWhatsApp(phone: string, message: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) return;
  window.open(`https://web.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<'' | OrderStatus>(OrderStatus.PENDING);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [waDialog, setWaDialog] = useState<{ order: { id: string; orderNumber: string; customer: { fullName: string } | null; guestName?: string | null }; status: OrderStatus } | null>(null);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [autoWhatsApp, setAutoWhatsApp] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('br_open_whatsapp_on_status_change') !== 'false';
    return true;
  });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const filters = useMemo(() => {
    const q: Record<string, string> = { limit: '50' };
    if (statusFilter) q.status = statusFilter;
    if (search.trim()) q.search = search.trim();
    if (fromDate) q.fromDate = new Date(`${fromDate}T00:00:00`).toISOString();
    if (toDate) q.toDate = new Date(`${toDate}T23:59:59.999`).toISOString();
    return q;
  }, [statusFilter, search, fromDate, toDate]);

  const { data: orders = [], isLoading, error } = useOrders(filters);
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = async (order: { id: string; orderNumber: string; customer: { fullName: string; phone: string | null } | null; guestName?: string | null; guestPhone?: string | null; status: OrderStatus }, newStatus: OrderStatus) => {
    let reason: string | undefined;

    if (newStatus === 'CANCELLED') {
      const input = window.prompt('اكتب سبب الإلغاء');
      if (!input?.trim()) return;
      reason = input.trim();
    }

    try {
      await updateStatus.mutateAsync({ id: order.id, status: newStatus, reason });
      const statusMsg = statusLabels[newStatus];
      showToast(`تم تغيير حالة الطلب ${order.orderNumber} إلى ${statusMsg}`);

      const phone = getPhone(order);
      if (phone && newStatus !== 'PENDING') {
        if (autoWhatsApp) {
          setWaDialog({ order, status: newStatus });
        }
      } else if (!phone && newStatus !== 'PENDING') {
        showToast(`تم تحديث الحالة، لكن لا يوجد رقم هاتف`);
      }
    } catch {
      showToast('فشل تحديث حالة الطلب');
    }
  };

  const handleWaConfirm = () => {
    if (!waDialog) return;
    const phone = getPhone(waDialog.order as any);
    if (phone) {
      const msg = buildMessage(waDialog.order, waDialog.status);
      openWhatsApp(phone, msg);
      showToast('تم فتح واتساب ويب برسالة جاهزة');
    }
    setWaDialog(null);
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
            <input type="checkbox" checked={autoWhatsApp} onChange={e => { setAutoWhatsApp(e.target.checked); localStorage.setItem('br_open_whatsapp_on_status_change', String(e.target.checked)); }} />
            فتح واتساب تلقائياً بعد تغيير الحالة
          </label>
        </div>
      </div>

      {toast && (
        <div className="card" style={{ color: 'var(--br-success)', marginBottom: 16, padding: 16, fontWeight: 700 }}>
          {toast}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {statusOptions.map(opt => (
            <button
              key={opt.value || 'ALL'}
              onClick={() => setStatusFilter(opt.value)}
              className={`btn btn-sm ${statusFilter === opt.value ? 'btn-primary' : ''}`}
              style={statusFilter === opt.value ? undefined : { background: 'var(--br-cream)' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="admin-filter-grid">
          <input className="input" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} />
          <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <input type="date" className="input" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
      </div>

      {isLoading && <div style={{ padding: 40, textAlign: 'center' }}>جاري تحميل الطلبات...</div>}
      {error && !isLoading && <div className="card" style={{ color: 'var(--br-danger)', padding: 16 }}>{(error as Error).message}</div>}

      {!isLoading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => {
            const phone = getPhone(order);
            return (
              <div key={order.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start', marginBottom: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 16 }}>{order.orderNumber}</span>
                      <span className="badge" style={statusColors[order.status as OrderStatus]}>{statusLabels[order.status as OrderStatus]}</span>
                    </div>
                    <div style={{ color: 'var(--br-muted)', fontSize: 13, marginTop: 6 }}>
                      {order.customer?.fullName || order.guestName || 'زائر'} · {order.customer?.phone || order.guestPhone || 'بدون رقم'} · الاستلام {formatDateTime(order.pickupTime)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 800, color: 'var(--br-gold)', fontSize: 18 }}>
                      {order.total?.amount != null ? formatMoney(order.total.amount, order.currencyCode || 'SYP') : '-'}
                    </div>
                    <div style={{ color: 'var(--br-muted)', fontSize: 12, marginTop: 4 }}>
                      أنشئ {formatDateTime(order.createdAt)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                  {order.items.map((item: any) => (
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
                  {(nextStatusActions[order.status as OrderStatus] || []).map(action => (
                    <button
                      key={action.status}
                      onClick={() => handleStatusChange(order, action.status)}
                      disabled={updateStatus.isPending && updateStatus.variables?.id === order.id}
                      className={`btn btn-sm ${action.danger ? 'btn-danger' : 'btn-primary'}`}
                    >
                      {updateStatus.isPending && updateStatus.variables?.id === order.id ? 'جاري التحديث...' : action.label}
                    </button>
                  ))}
                  {phone && (
                    <button
                      onClick={() => {
                        const msg = buildMessage(order, order.status as OrderStatus);
                        openWhatsApp(phone, msg);
                        showToast('تم فتح واتساب ويب');
                      }}
                      className="btn btn-sm"
                      style={{ background: '#25D366', color: '#fff' }}
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

      <ConfirmDialog
        open={!!waDialog}
        title="واتساب ويب"
        description="هل تريد فتح واتساب لإبلاغ العميل بتحديث الطلب؟"
        confirmLabel="فتح واتساب"
        cancelLabel="تجاهل"
        icon="💬"
        onConfirm={handleWaConfirm}
        onCancel={() => setWaDialog(null)}
      />
    </div>
  );
}
