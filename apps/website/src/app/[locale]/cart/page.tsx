'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { useAuth } from '@/lib/auth-context';

interface CartItem {
  id: string; productId: string; variantId: string | null;
  quantity: number; selectedOptions: any;
  product: { translations: { locale: string; name: string }[] };
  variant: { name: string; prices: { amount: number }[] } | null;
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

  useEffect(() => {
    if (!token) { router.push(`/${locale}/?login=1`); return; }
    api.get<any>('/cart', token).then(cart => {
      setItems(cart.items || []);
      const defaultTime = new Date(Date.now() + 30 * 60000);
      setPickupTime(defaultTime.toISOString().slice(0, 16));
    }).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  const removeItem = async (itemId: string) => {
    await api.delete(`/cart/items/${itemId}`, token);
    setItems(items.filter(i => i.id !== itemId));
  };

  const placeOrder = async () => {
    if (!pickupTime) return;
    setOrdering(true);
    try {
      const order = await api.post('/orders', {
        pickupTime: new Date(pickupTime).toISOString(),
        notes: notes || undefined,
      }, token);
      router.push(`/${locale}/orders`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setOrdering(false);
    }
  };

  const total = items.reduce((sum, item) => {
    const price = item.variant?.prices[0]?.amount || 0;
    return sum + price * item.quantity;
  }, 0);

  if (!user) return null;
  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}>Loading...</div>;

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32 }}>{dict.cart.title}</h1>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--br-muted)' }}>{dict.cart.empty}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map(item => (
              <div key={item.id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.product.translations.find(t => t.locale === locale)?.name || 'Product'}</div>
                  {item.variant && <div style={{ fontSize: 14, color: 'var(--br-muted)' }}>{item.variant.name}</div>}
                  <div style={{ fontSize: 14, color: 'var(--br-muted)' }}>{dict.product.quantity}: {item.quantity}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--br-gold)' }}>
                    {((item.variant?.prices[0]?.amount || 0) * item.quantity).toLocaleString()} SYP
                  </div>
                  <button onClick={() => removeItem(item.id)} style={{ background: 'none', color: 'var(--br-danger)', fontSize: 13, marginTop: 4 }}>
                    {dict.cart.remove}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>{dict.cart.total}: {total.toLocaleString()} SYP</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 14 }}>{dict.cart.pickup}</label>
              <input
                type="datetime-local"
                value={pickupTime}
                onChange={e => setPickupTime(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd', width: '100%', fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 14 }}>{dict.cart.notes}</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd', width: '100%', fontSize: 14, resize: 'vertical' }}
              />
            </div>
            <button onClick={placeOrder} disabled={ordering || !pickupTime} className="btn btn-primary" style={{ width: '100%' }}>
              {ordering ? '...' : dict.cart.placeOrder}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
