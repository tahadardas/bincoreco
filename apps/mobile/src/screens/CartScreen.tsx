import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { apiFetch } from '../lib/api';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F3E7', padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600' },
  price: { fontSize: 16, fontWeight: '700', color: '#C9961A' },
  removeBtn: { color: '#B42318', marginTop: 8 },
  checkoutBtn: { backgroundColor: '#C9961A', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  checkoutText: { color: '#0D0D0D', fontWeight: '700', fontSize: 18 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  total: { fontSize: 20, fontWeight: '700', marginVertical: 16, textAlign: 'center', color: '#C9961A' },
});

export default function CartScreen({ locale, token }: { locale: 'ar' | 'en'; token: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCart = () => {
    apiFetch<any>('/cart', { token })
      .then(cart => setItems(cart.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCart(); }, [token]);

  const removeItem = async (itemId: string) => {
    await apiFetch(`/cart/items/${itemId}`, { method: 'DELETE', token });
    loadCart();
  };

  const placeOrder = async () => {
    const pickupTime = new Date(Date.now() + 30 * 60000).toISOString();
    try {
      await apiFetch('/orders', {
        method: 'POST', token,
        body: JSON.stringify({ pickupTime }),
      });
      Alert.alert(locale === 'ar' ? 'تم الطلب' : 'Order Placed', locale === 'ar' ? 'طلبك قيد التجهيز' : 'Your order is being prepared');
      loadCart();
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const total = items.reduce((sum: number, i: any) => {
    const price = i.variant?.prices?.[0]?.amount || 0;
    return sum + price * i.quantity;
  }, 0);

  if (items.length === 0) {
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
        renderItem={({ item: i }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{i.product?.translations?.find((t: any) => t.locale === locale)?.name || 'Product'}</Text>
              <Text style={styles.price}>{((i.variant?.prices?.[0]?.amount || 0) * i.quantity).toLocaleString()} SYP</Text>
            </View>
            <Text style={{ color: '#7A6A58', fontSize: 13 }}>x{i.quantity}</Text>
            <TouchableOpacity onPress={() => removeItem(i.id)}>
              <Text style={styles.removeBtn}>{locale === 'ar' ? 'إزالة' : 'Remove'}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <Text style={styles.total}>{locale === 'ar' ? 'المجموع' : 'Total'}: {total.toLocaleString()} SYP</Text>
      <TouchableOpacity style={styles.checkoutBtn} onPress={placeOrder}>
        <Text style={styles.checkoutText}>{locale === 'ar' ? 'تأكيد الطلب' : 'Place Order'}</Text>
      </TouchableOpacity>
    </View>
  );
}
