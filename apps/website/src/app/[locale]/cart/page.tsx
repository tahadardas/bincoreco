'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { useAuth } from '@/lib/auth-context';
import { formatMoney, MoneyAmount, toMoneyNumber } from '@/lib/money';
import { useCurrency } from '@/lib/currency-context';
import { getGuestSession } from '@/lib/guest-session';
import EspressoButton from '@/components/espresso-button';
import RewardModal from '@/components/reward-modal';

interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  selectedOptions: {
    grindType?: 'whole_bean' | 'ground';
    grindOptionNameAr?: string;
    grindOptionNameEn?: string;
  } | null;
  product: { translations: { locale: string; name: string }[] };
  variant: { name: string; prices: { amount: MoneyAmount; currencyCode?: string }[] } | null;
}

function toDatetimeLocal(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function displayName(item: CartItem, locale: Locale) {
  return item.product.translations.find(t => t.locale === locale)?.name
    || item.product.translations[0]?.name
    || 'Product';
}

function grindLabel(item: CartItem, locale: Locale) {
  if (!item.selectedOptions?.grindType) return null;
  if (item.selectedOptions.grindType === 'ground') {
    const grind = locale === 'ar' ? item.selectedOptions.grindOptionNameAr : item.selectedOptions.grindOptionNameEn;
    return `مطحون${grind ? ` · ${grind}` : ''}`;
  }
  return 'حب كامل';
}

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const { user, token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [pickupTime, setPickupTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestInfo, setGuestInfo] = useState({ name: '', phone: '' });
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [rewardModal, setRewardModal] = useState<{
    id: string; orderNumber: string; pendingCoins: number;
    pendingStamps: number; rewardClaimToken?: string;
  } | null>(null);

  const isGuest = !token;
  const { selectedCurrency } = useCurrency();
  const sessionId = useMemo(() => isGuest ? getGuestSession() : '', [isGuest]);
  const minimumPickup = useMemo(() => toDatetimeLocal(new Date(Date.now() + 15 * 60_000)), []);

  useEffect(() => {
    if (!isGuest) {
      api.get<any>('/cart', token).then(cart => {
        setItems(cart.items || []);
        setPickupTime(toDatetimeLocal(new Date(Date.now() + 30 * 60_000)));
      }).catch(err => setError(err instanceof Error ? err.message : 'Unable to load cart')).finally(() => setLoading(false));
    } else {
      api.get<any>(`/guest-cart?sessionId=${sessionId}`).then(cart => {
        setItems(cart.items || []);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [token, sessionId, isGuest]);

  const removeItem = async (itemId: string) => {
    if (isGuest) {
      await api.delete(`/guest-cart/items/${itemId}?sessionId=${sessionId}`);
    } else {
      await api.delete(`/cart/items/${itemId}`, token);
    }
    setItems(items.filter(item => item.id !== itemId));
  };

  const isPickupValid = pickupTime ? new Date(pickupTime).getTime() >= Date.now() + 15 * 60_000 : false;

  const placeOrder = async () => {
    if (!pickupTime || !isPickupValid) {
      setError(dict.cart.invalidPickup);
      return;
    }

    if (isGuest && !showGuestForm) {
      setShowGuestForm(true);
      return;
    }

    if (isGuest && (!guestInfo.name.trim() || !guestInfo.phone.trim())) {
      setError('Please enter your name and phone number');
      return;
    }

    setOrdering(true);
    setError(null);
    try {
      if (isGuest) {
        const order = await api.post<any>('/orders/guest', {
          sessionId,
          guestName: guestInfo.name,
          guestPhone: guestInfo.phone,
          pickupTime: new Date(pickupTime).toISOString(),
          notes: notes || undefined,
        });
        setRewardModal({
          id: order.id,
          orderNumber: order.orderNumber,
          pendingCoins: order.pendingCoins || 0,
          pendingStamps: order.pendingStamps || 0,
          rewardClaimToken: order.rewardClaimToken,
        });
      } else {
        const order = await api.post<any>('/orders', {
          pickupTime: new Date(pickupTime).toISOString(),
          notes: notes || undefined,
        }, token);
        const pendingCoins = Math.floor(total / 1000);
        setRewardModal({
          id: order.id,
          orderNumber: order.orderNumber,
          pendingCoins,
          pendingStamps: 1,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.cart.unavailable);
    } finally {
      setOrdering(false);
    }
  };

  const total = items.reduce((sum, item) => {
    const selectedPrice = item.variant?.prices.find(p => p.currencyCode === (selectedCurrency?.code || 'SYP')) || item.variant?.prices[0];
    return sum + toMoneyNumber(selectedPrice?.amount) * item.quantity;
  }, 0);

  if (loading) return <div className="page-shell" style={{ textAlign: 'center' }}>Loading...</div>;

  return (
    <><div className="page-shell">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="section-eyebrow">Pickup</div>
            <h1 className="section-title">{dict.cart.title}</h1>
          </div>
          <p className="section-copy">{dict.cart.cashOnly}</p>
        </div>

        {error && <div className="card" style={{ padding: 16, color: 'var(--br-danger)', marginBottom: 16, fontWeight: 700 }}>{error}</div>}

        {items.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--br-muted)' }}>{dict.cart.empty}</div>
        ) : (
          <div className="checkout-grid">
            <div style={{ display: 'grid', gap: 14 }}>
              {items.map(item => {
    const selectedPrice = item.variant?.prices.find(p => p.currencyCode === (selectedCurrency?.code || 'SYP')) || item.variant?.prices[0];
                const grind = grindLabel(item, locale);
                return (
                  <div key={item.id} className="card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' }}>
                      <div>
                        <h2 style={{ fontSize: 18, fontWeight: 900 }}>{displayName(item, locale)}</h2>
                        {item.variant && <div style={{ fontSize: 14, color: 'var(--br-muted)' }}>{item.variant.name}</div>}
                        {grind && <div style={{ fontSize: 14, color: 'var(--br-coffee)', fontWeight: 700 }}>{grind}</div>}
                        <div style={{ fontSize: 14, color: 'var(--br-muted)' }}>{dict.product.quantity}: {item.quantity}</div>
                      </div>
                      <div style={{ textAlign: 'end' }}>
                        <div className="money">{formatMoney(toMoneyNumber(selectedPrice?.amount) * item.quantity, selectedCurrency || 'SYP')}</div>
                        <button onClick={() => removeItem(item.id)} style={{ background: 'none', color: 'var(--br-danger)', fontSize: 13, marginTop: 6 }}>
                          {dict.cart.remove}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="card" style={{ padding: 22 }}>
              <div style={{ fontSize: 15, color: 'var(--br-muted)' }}>{dict.cart.total}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--br-gold-dark)', marginBottom: 18 }}>{formatMoney(total, selectedCurrency || 'SYP')}</div>

              {isGuest && showGuestForm && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontWeight: 900, display: 'block', marginBottom: 6, fontSize: 14 }}>
                      {locale === 'ar' ? 'الاسم' : 'Name'}
                    </label>
                    <input value={guestInfo.name} onChange={e => setGuestInfo(prev => ({ ...prev, name: e.target.value }))} className="input" placeholder={locale === 'ar' ? 'اسمك' : 'Your name'} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 900, display: 'block', marginBottom: 6, fontSize: 14 }}>
                      {locale === 'ar' ? 'رقم الهاتف' : 'Phone'}
                    </label>
                    <input value={guestInfo.phone} onChange={e => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))} className="input" placeholder="09XXXXXXXX" />
                  </div>
                </>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 900, display: 'block', marginBottom: 6, fontSize: 14 }}>{dict.cart.pickup}</label>
                <input type="datetime-local" value={pickupTime} min={minimumPickup} onChange={e => setPickupTime(e.target.value)} className="input" />
                {!isPickupValid && <div style={{ color: 'var(--br-danger)', fontSize: 13, marginTop: 7 }}>{dict.cart.invalidPickup}</div>}
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 900, display: 'block', marginBottom: 6, fontSize: 14 }}>{dict.cart.notes}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="textarea" />
              </div>

              <div style={{ color: 'var(--br-muted)', fontSize: 13, marginBottom: 18 }}>{dict.cart.cashOnly}</div>

              <EspressoButton onClick={placeOrder} disabled={ordering || !isPickupValid} loading={ordering} style={{ width: '100%' }}>
                {dict.cart.placeOrder}
              </EspressoButton>
            </aside>
          </div>
        )}
      </div>
    </div>

    {rewardModal && (
      <RewardModal
        locale={locale}
        order={rewardModal}
        onClose={() => { setRewardModal(null); router.push(`/${locale}/orders`); }}
      />
    )}
    </>
  );
}
