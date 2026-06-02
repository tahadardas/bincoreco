'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { useAuth } from '@/lib/auth-context';
import { formatMoney, MoneyAmount } from '@/lib/money';
import { useCurrency } from '@/lib/currency-context';
import EspressoButton from '@/components/espresso-button';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonCard } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Alert } from '@/components/ui/Alert';

interface OrderItem {
  id: string;
  productNameSnapshot: string;
  quantity: number;
  unitPrice: MoneyAmount;
  total: MoneyAmount;
  currencyCode?: string;
  grindType?: 'whole_bean' | 'ground' | null;
  grindOptionNameAr?: string | null;
  grindOptionNameEn?: string | null;
  variantSnapshot?: { name?: string; sizeValue?: number; sizeUnit?: string } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: MoneyAmount;
  currencyCode?: string;
  pickupTime: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
  guestName?: string | null;
  guestPhone?: string | null;
}

const STATUS_ORDER = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP'];

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function itemDetails(item: OrderItem, locale: Locale) {
  const parts = [item.variantSnapshot?.name];
  if (item.variantSnapshot?.sizeValue && item.variantSnapshot?.sizeUnit) {
    parts.push(`${item.variantSnapshot.sizeValue}${item.variantSnapshot.sizeUnit}`);
  }
  if (item.grindType === 'ground') parts.push(locale === 'ar' ? 'مطحون' : 'Ground');
  if (item.grindType === 'whole_bean') parts.push(locale === 'ar' ? 'حب كامل' : 'Whole Bean');
  const grind = locale === 'ar' ? item.grindOptionNameAr : item.grindOptionNameEn;
  if (grind) parts.push(grind);
  return parts.filter(Boolean).join(' · ');
}

function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';

  return (
    <div style={{ display: 'flex', gap: 0, alignItems: 'center', marginTop: 14, marginBottom: 14 }}>
      {STATUS_ORDER.map((status, i) => {
        const done = !isCancelled && i <= currentIndex;
        const isCurrent = status === currentStatus;
        return (
          <div key={status} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: isCurrent ? 'var(--br-gold)' : done ? 'var(--br-success)' : 'var(--br-line)',
              color: done ? '#fff' : 'var(--br-muted)',
              display: 'grid', placeItems: 'center',
              fontSize: 12, fontWeight: 700, margin: '0 auto',
              boxShadow: isCurrent ? '0 0 0 3px rgba(201,150,26,0.3)' : 'none',
            }}>
              {done ? '✓' : i + 1}
            </div>
            {i < STATUS_ORDER.length - 1 && (
              <div style={{
                position: 'absolute', top: 14, left: '50%', width: '100%', height: 2,
                background: done && !isCancelled ? 'var(--br-success)' : 'var(--br-line)',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const { user, token } = useAuth();
  const { selectedCurrency } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackNumber, setTrackNumber] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get<any>('/orders/my', token)
      .then((data: any) => setOrders(Array.isArray(data) ? data : data.items || []))
      .catch(err => setError(locale === 'ar' ? 'تعذر تحميل الطلبات' : 'Unable to load orders'))
      .finally(() => setLoading(false));
  }, [token, locale]);

  const handleTrack = async () => {
    if (!trackNumber.trim() || !trackPhone.trim()) return;
    setTracking(true);
    setError(null);
    try {
      const order = await api.get<Order>(`/orders/number/${trackNumber.trim()}/lookup?phone=${trackPhone.trim()}`);
      setTrackedOrder(order);
    } catch (err) {
      setError(locale === 'ar' ? 'الطلب غير موجود' : 'Order not found');
      setTrackedOrder(null);
    } finally {
      setTracking(false);
    }
  };

  const renderOrder = (order: Order, isGuestView = false) => (
    <div key={order.id} className="card" style={{ padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16, marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>
            {dict.order.number} {order.orderNumber}
          </div>
          <div style={{ fontSize: 14, color: 'var(--br-muted)' }}>{formatDate(order.createdAt, locale)}</div>
          {(order.guestName || isGuestView) && (
            <div style={{ fontSize: 13, color: 'var(--br-coffee)', marginTop: 4 }}>
              {order.guestName} {order.guestPhone ? `· ${order.guestPhone}` : ''}
            </div>
          )}
        </div>
        <StatusBadge status={order.status} label={(dict.order as Record<string, string>)[order.status]} />
      </div>

      <OrderTimeline currentStatus={order.status} />

      <div style={{ borderTop: '1px solid var(--br-line)', paddingTop: 12, display: 'grid', gap: 8 }}>
        {order.items.map(item => {
          const details = itemDetails(item, locale);
          return (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
              <span>
                <strong>{item.productNameSnapshot}</strong> x{item.quantity}
                {details && <span style={{ color: 'var(--br-muted)' }}> · {details}</span>}
              </span>
              <span>{formatMoney(item.total, selectedCurrency || 'SYP')}</span>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid var(--br-line)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
        <span>{dict.order.total}</span>
        <span className="money">{formatMoney(order.total, selectedCurrency || 'SYP')}</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--br-muted)', marginTop: 8 }}>
        {dict.order.pickupTime}: {formatDate(order.pickupTime, locale)}
      </div>
      {order.notes && (
        <div style={{ fontSize: 13, color: 'var(--br-muted)', marginTop: 4, fontStyle: 'italic' }}>
          📝 {order.notes}
        </div>
      )}
    </div>
  );

  return (
    <div className="page-shell">
      <div className="container">
        <PageHeader
          eyebrow="Pickup Ledger"
          title={dict.order.title}
          description={dict.home.pickupCopy}
        />

        <div className="card" style={{ padding: 20, marginBottom: 24, background: 'linear-gradient(135deg, var(--br-porcelain), #f7f3ed)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>
            {locale === 'ar' ? 'تتبع الطلب' : 'Track Order'}
          </h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                {locale === 'ar' ? 'رقم الطلب' : 'Order #'}
              </label>
              <input value={trackNumber} onChange={e => setTrackNumber(e.target.value)} className="input" placeholder="BR-..." />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                {locale === 'ar' ? 'رقم الهاتف' : 'Phone'}
              </label>
              <input value={trackPhone} onChange={e => setTrackPhone(e.target.value)} className="input" placeholder="09XXXXXXXX" />
            </div>
            <EspressoButton onClick={handleTrack} loading={tracking} size="small">
              {locale === 'ar' ? 'تتبع' : 'Track'}
            </EspressoButton>
          </div>
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        {trackedOrder && !token && renderOrder(trackedOrder, true)}

        {token && loading && (
          <div style={{ display: 'grid', gap: 18 }}>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={4} />)}
          </div>
        )}

        {token && !loading && orders.length === 0 && (
          <EmptyState
            title={dict.order.noOrders}
            description={locale === 'ar' ? 'عندما تطلب، ستظهر طلباتك هنا' : 'When you place an order, it will appear here'}
            icon="📋"
            action={
              <EspressoButton onClick={() => router.push(`/${locale}/products`)} size="small">
                {dict.home.orderNow}
              </EspressoButton>
            }
          />
        )}

        {token && !loading && orders.length > 0 && (
          <div style={{ display: 'grid', gap: 18 }}>
            {orders.map(order => renderOrder(order))}
          </div>
        )}
      </div>
    </div>
  );
}
