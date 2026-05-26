import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { apiFetch } from '../lib/api';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F3E7', padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  title: { fontSize: 18, fontWeight: '600' },
  price: { fontSize: 16, fontWeight: '700', color: '#C9961A', marginTop: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: { backgroundColor: '#C9961A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#0D0D0D' },
});

export default function ProductsScreen({ navigation, locale }: { navigation: any; locale: 'ar' | 'en' }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<any>(`/products?locale=${locale}`)
      .then((data: any) => setProducts(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [locale]);

  const getName = (p: any) => p.translations?.find((t: any) => t.locale === locale)?.name || p.sku;

  if (loading) return <ActivityIndicator size="large" color="#C9961A" style={{ marginTop: 40 }} />;

  return (
    <FlatList
      style={styles.container}
      data={products}
      keyExtractor={p => p.id}
      renderItem={({ item: p }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ProductDetail', { id: p.id })}>
          <View style={styles.badgeRow}>
            {p.isBestSeller && <View style={styles.badge}><Text style={styles.badgeText}>Best</Text></View>}
            {p.isMaestroPick && <View style={styles.badge}><Text style={styles.badgeText}>Maestro</Text></View>}
          </View>
          <Text style={styles.title}>{getName(p)}</Text>
          <Text style={styles.price}>{p.variants?.[0]?.prices?.[0]?.amount?.toLocaleString()} SYP</Text>
        </TouchableOpacity>
      )}
    />
  );
}
