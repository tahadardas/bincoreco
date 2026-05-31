import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { apiFetch } from '../lib/api';

const API_URL = 'http://10.0.2.2:4000/api';

function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${API_URL.replace('/api', '')}${url}`;
  return url;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F3E7', padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, flexDirection: 'row', overflow: 'hidden' },
  cardImage: { width: 100, height: 100 },
  cardBody: { flex: 1, padding: 16 },
  cardFallback: { width: 100, height: 100, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' },
  cardFallbackText: { color: '#C9961A', fontSize: 18, fontWeight: '900' },
  title: { fontSize: 18, fontWeight: '600' },
  price: { fontSize: 16, fontWeight: '700', color: '#C9961A', marginTop: 8 },
  badgeRow: { flexDirection: 'row', gap: 4, marginBottom: 6 },
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
      renderItem={({ item: p }) => {
        const imgUrl = resolveMediaUrl(p.imageUrl || p.images?.[0]?.url);
        return (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ProductDetail', { id: p.id })}>
            {imgUrl ? (
              <Image source={{ uri: imgUrl }} style={styles.cardImage} />
            ) : (
              <View style={styles.cardFallback}>
                <Text style={styles.cardFallbackText}>BR</Text>
              </View>
            )}
            <View style={styles.cardBody}>
              <View style={styles.badgeRow}>
                {p.isBestSeller && <View style={styles.badge}><Text style={styles.badgeText}>Best</Text></View>}
                {p.isMaestroPick && <View style={styles.badge}><Text style={styles.badgeText}>Maestro</Text></View>}
              </View>
              <Text style={styles.title}>{getName(p)}</Text>
              <Text style={styles.price}>{p.variants?.[0]?.prices?.[0]?.amount?.toLocaleString()} SYP</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}
