import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { apiFetch } from '../lib/api';
import { getGuestSession, getGuestSessionSync } from '../lib/guest-session';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F3E7', padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600' },
  price: { fontSize: 16, fontWeight: '700', color: '#C9961A' },
  removeBtn: { color: '#B42318', marginTop: 8 },
  checkoutBtn: { backgroundColor: '#C9961A', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  checkoutText: { color: '#0D0D0D', fontWeight: '700', fontSize: 18 },
  loginBtn: { backgroundColor: '#4B2E1E', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5DDD3', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 10 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  total: { fontSize: 20, fontWeight: '700', marginVertical: 16, textAlign: 'center', color: '#C9961A' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#0D0D0D' },
});

export default function CartScreen({ locale, token, onLogin }: { locale: 'ar' | 'en'; token: string | null; onLogin: (token: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const isGuest = !token;
  const sessionId = getGuestSessionSync();

  const loadCart = () => {
    if (isGuest) {
      apiFetch<any>(`/guest-cart?sessionId=${sessionId}`)
        .then(cart => setItems(cart.items || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      apiFetch<any>('/cart', { token })
        .then(cart => setItems(cart.items || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { loadCart(); }, [token]);

  const removeItem = async (itemId: string) => {
    if (isGuest) {
      await apiFetch(`/guest-cart/items/${itemId}?sessionId=${sessionId}`, { method: 'DELETE' });
    } else {
      await apiFetch(`/cart/items/${itemId}`, { method: 'DELETE', token });
    }
    loadCart();
  };

  const placeOrder = async () => {
    const pickupTime = new Date(Date.now() + 30 * 60000).toISOString();
    try {
      if (isGuest) {
        if (!guestName.trim() || !guestPhone.trim()) {
          setShowGuestForm(true);
          return;
        }
        await apiFetch('/orders/guest', {
          method: 'POST',
          body: JSON.stringify({ sessionId, guestName, guestPhone, pickupTime }),
        });
        Alert.alert(
          locale === 'ar' ? 'تم الطلب' : 'Order Placed',
          locale === 'ar' ? 'تم تأكيد طلبك! احصل على مكافآتك بإنشاء حساب.' : 'Order confirmed! Create an account to claim your rewards.'
        );
      } else {
        await apiFetch('/orders', {
          method: 'POST', token,
          body: JSON.stringify({ pickupTime }),
        });
        Alert.alert(locale === 'ar' ? 'تم الطلب' : 'Order Placed', locale === 'ar' ? 'طلبك قيد التجهيز' : 'Your order is being prepared');
      }
      setItems([]);
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const total = items.reduce((sum: number, i: any) => {
    const price = i.variant?.prices?.[0]?.amount || 0;
    return sum + price * i.quantity;
  }, 0);

  if (items.length === 0 && !loading) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: '#7A6A58', fontSize: 18 }}>
          {locale === 'ar' ? 'السلة فارغة' : 'Cart is empty'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={({ item: i }) => {
          const trans = i.product?.translations?.find((t: any) => t.locale === locale);
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <View>
                  <Text style={styles.name}>{trans?.name || 'Product'}</Text>
                  {i.variant?.name && <Text style={{ color: '#7A6A58', fontSize: 13 }}>{i.variant.name}</Text>}
                </View>
                <Text style={styles.price}>{((i.variant?.prices?.[0]?.amount || 0) * i.quantity).toLocaleString()} SYP</Text>
              </View>
              <Text style={{ color: '#7A6A58', fontSize: 13 }}>x{i.quantity}</Text>
              <TouchableOpacity onPress={() => removeItem(i.id)}>
                <Text style={styles.removeBtn}>{locale === 'ar' ? 'إزالة' : 'Remove'}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
      <Text style={styles.total}>{locale === 'ar' ? 'المجموع' : 'Total'}: {total.toLocaleString()} SYP</Text>

      {isGuest && showGuestForm && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>{locale === 'ar' ? 'معلومات الاستلام' : 'Pickup Info'}</Text>
          <TextInput style={styles.input} placeholder={locale === 'ar' ? 'الاسم' : 'Name'} value={guestName} onChangeText={setGuestName} />
          <TextInput style={styles.input} placeholder="09XXXXXXXX" value={guestPhone} onChangeText={setGuestPhone} keyboardType="phone-pad" />
        </View>
      )}

      <TouchableOpacity style={styles.checkoutBtn} onPress={placeOrder}>
        <Text style={styles.checkoutText}>{locale === 'ar' ? 'تأكيد الطلب' : 'Place Order'}</Text>
      </TouchableOpacity>

      {isGuest && !showGuestForm && (
        <TouchableOpacity style={styles.loginBtn} onPress={() => onLogin && Alert.alert(
          locale === 'ar' ? 'تسجيل الدخول' : 'Login',
          locale === 'ar' ? 'سجل دخولك لمتابعة الطلبات والمكافآت' : 'Login to track orders and rewards'
        )}>
          <Text style={{ color: '#C9961A', fontWeight: '700', fontSize: 14 }}>
            {locale === 'ar' ? 'تسجيل الدخول للمكافآت' : 'Login for Rewards'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
