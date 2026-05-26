import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { apiFetch } from '../lib/api';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F3E7' },
  hero: { backgroundColor: '#0D0D0D', padding: 48, alignItems: 'center' },
  heroTitle: { fontSize: 32, fontWeight: '700', color: '#C9961A', marginBottom: 8 },
  heroSub: { fontSize: 16, color: '#F8F3E7', marginBottom: 24 },
  btn: { backgroundColor: '#C9961A', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8 },
  btnText: { color: '#0D0D0D', fontWeight: '600', fontSize: 16 },
  section: { padding: 24 },
  sectionTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: '#0D0D0D' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#7A6A58', marginBottom: 8 },
  cardPrice: { fontSize: 18, fontWeight: '700', color: '#C9961A' },
  badge: { backgroundColor: '#C9961A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#0D0D0D' },
});

export default function HomeScreen({ navigation, locale }: { navigation: any; locale: 'ar' | 'en' }) {
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<any[]>(`/products/best-sellers?locale=${locale}`)
      .then(setBestSellers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [locale]);

  const getName = (p: any) => p.translations?.find((t: any) => t.locale === locale)?.name || p.sku;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Banco Ricco</Text>
        <Text style={styles.heroSub}>{locale === 'ar' ? 'تجربة قهوة استثنائية' : 'Exceptional Coffee Experience'}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Products')}>
          <Text style={styles.btnText}>{locale === 'ar' ? 'اطلب للاستلام' : 'Order for Pickup'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#C9961A" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{locale === 'ar' ? 'الأكثر طلباً' : 'Best Sellers'}</Text>
          {bestSellers.map((p: any) => (
            <TouchableOpacity key={p.id} style={styles.card} onPress={() => navigation.navigate('ProductDetail', { id: p.id })}>
              <View style={styles.badge}><Text style={styles.badgeText}>{locale === 'ar' ? 'الأكثر طلباً' : 'Best Seller'}</Text></View>
              <Text style={styles.cardTitle}>{getName(p)}</Text>
              <Text style={styles.cardSub}>{p.translations?.find((t: any) => t.locale === locale)?.shortDescription || ''}</Text>
              <Text style={styles.cardPrice}>{p.variants?.[0]?.prices?.[0]?.amount?.toLocaleString()} SYP</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
