import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { apiFetch } from '../lib/api';
import { getGuestSessionSync } from '../lib/guest-session';

const API_URL = 'http://10.0.2.2:4000/api';

function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${API_URL.replace('/api', '')}${url}`;
  return url;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F3E7' },
  imageContainer: { width: '100%', height: 280, backgroundColor: '#0D0D0D' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  fallback: { width: '100%', height: 280, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' },
  fallbackText: { color: '#C9961A', fontSize: 32, fontWeight: '900' },
  body: { padding: 20 },
  name: { fontSize: 28, fontWeight: '700', color: '#0D0D0D', marginBottom: 8 },
  description: { fontSize: 15, color: '#7A6A58', lineHeight: 22, marginBottom: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badge: { backgroundColor: '#C9961A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#0D0D0D' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0D0D0D', marginBottom: 12, marginTop: 8 },
  variantCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' as any },
  variantCardSelected: { borderColor: '#C9961A' as any },
  variantName: { fontSize: 16, fontWeight: '600' },
  variantPrice: { fontSize: 18, fontWeight: '700', color: '#C9961A', marginTop: 4 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionBtn: { backgroundColor: '#FFF', borderRadius: 8, padding: 14, borderWidth: 2, borderColor: '#E5DDD3', minWidth: 100, alignItems: 'center' as any },
  optionBtnSelected: { borderColor: '#C9961A', backgroundColor: '#FFF8E7' },
  optionText: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  grindSection: { marginBottom: 20 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#C9961A', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 20, fontWeight: '700', color: '#0D0D0D' },
  qtyValue: { fontSize: 22, fontWeight: '700', minWidth: 30, textAlign: 'center' },
  addBtn: { backgroundColor: '#C9961A', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, opacity: 1 as any },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: '#0D0D0D', fontWeight: '700', fontSize: 18 },
  errorText: { color: '#B42318', fontWeight: '600', marginBottom: 12 },
  addedText: { color: '#155724', fontWeight: '700', fontSize: 16, textAlign: 'center', marginTop: 8 },
  priceText: { fontSize: 28, fontWeight: '900', color: '#C9961A' },
  prepTime: { fontSize: 13, color: '#7A6A58', marginBottom: 20 },
});

export default function ProductDetailScreen({ route, navigation, locale, token }: { route: any; navigation: any; locale: 'ar' | 'en'; token: string | null }) {
  const { id } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedGrind, setSelectedGrind] = useState<string>('');
  const [isGround, setIsGround] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const getName = (p: any) => p.translations?.find((t: any) => t.locale === locale)?.name || p.sku;
  const getDesc = (p: any) => p.translations?.find((t: any) => t.locale === locale)?.description || '';
  const isCoffeeBean = product?.type === 'COFFEE_BEAN';

  useEffect(() => {
    apiFetch<any>(`/products/${id}?locale=${locale}`)
      .then(item => {
        setProduct(item);
        if (item.variants?.length > 0) setSelectedVariant(item.variants[0].id);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, locale]);

  const variant = product?.variants?.find((v: any) => v.id === selectedVariant) || product?.variants?.[0];
  const price = variant?.prices?.[0];

  const primaryImage = product?.images?.find((i: any) => i.isPrimary)?.url || product?.images?.[0]?.url || product?.imageUrl;

  const handleAdd = async () => {
    if (!product || !token && !getGuestSessionSync()) return;
    if (isCoffeeBean && isGround && !selectedGrind) return;

    setAdding(true);
    setError(null);
    try {
      const selectedOptions: any = {};
      if (isCoffeeBean) {
        selectedOptions.grindType = isGround ? 'ground' : 'whole_bean';
        if (isGround && selectedGrind) selectedOptions.grindOptionId = selectedGrind;
      }

      if (token) {
        await apiFetch('/cart/items', {
          method: 'POST',
          token,
          body: JSON.stringify({ productId: product.id, variantId: selectedVariant || undefined, quantity, selectedOptions }),
        });
      } else {
        const sessionId = getGuestSessionSync();
        await apiFetch(`/guest-cart/items?sessionId=${sessionId}`, {
          method: 'POST',
          body: JSON.stringify({ productId: product.id, variantId: selectedVariant || undefined, quantity, selectedOptions }),
        });
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#C9961A" style={{ marginTop: 80 }} />;
  if (error || !product) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{error || 'Product not found'}</Text></View>;

  return (
    <ScrollView style={styles.container}>
      {primaryImage ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: resolveMediaUrl(primaryImage) || '' }} style={styles.image} />
        </View>
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>BR</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.badgeRow}>
          {product.isBestSeller && <View style={styles.badge}><Text style={styles.badgeText}>{locale === 'ar' ? 'الأكثر طلباً' : 'Best Seller'}</Text></View>}
          {product.isMaestroPick && <View style={[styles.badge, { backgroundColor: '#4B2E1E' }]}><Text style={[styles.badgeText, { color: '#C9961A' }]}>Maestro</Text></View>}
        </View>

        <Text style={styles.name}>{getName(product)}</Text>
        {getDesc(product) ? <Text style={styles.description}>{getDesc(product)}</Text> : null}

        {product.variants?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{locale === 'ar' ? 'الوزن' : 'Weight'}</Text>
            {product.variants.map((v: any) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.variantCard, selectedVariant === v.id && styles.variantCardSelected]}
                onPress={() => setSelectedVariant(v.id)}
              >
                <Text style={styles.variantName}>{v.name}</Text>
                <Text style={styles.variantPrice}>{v.prices?.[0]?.amount?.toLocaleString()} SYP</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {isCoffeeBean && (
          <View style={styles.grindSection}>
            <Text style={styles.sectionTitle}>{locale === 'ar' ? 'الشكل' : 'Form'}</Text>
            <View style={styles.optionGrid}>
              <TouchableOpacity
                style={[styles.optionBtn, !isGround && styles.optionBtnSelected]}
                onPress={() => { setIsGround(false); setSelectedGrind(''); }}
              >
                <Text style={{ fontSize: 24 }}>🫘</Text>
                <Text style={styles.optionText}>{locale === 'ar' ? 'حب كامل' : 'Whole Bean'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionBtn, isGround && styles.optionBtnSelected]}
                onPress={() => setIsGround(true)}
              >
                <Text style={{ fontSize: 24 }}>⚙️</Text>
                <Text style={styles.optionText}>{locale === 'ar' ? 'مطحون' : 'Ground'}</Text>
              </TouchableOpacity>
            </View>
            {isGround && product.grindOptions?.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{locale === 'ar' ? 'طريقة الطحن' : 'Grind Method'}</Text>
                <View style={styles.optionGrid}>
                  {product.grindOptions.filter((g: any) => g.isActive).map((g: any) => (
                    <TouchableOpacity
                      key={g.grindOptionId}
                      style={[styles.optionBtn, selectedGrind === g.grindOptionId && styles.optionBtnSelected]}
                      onPress={() => setSelectedGrind(g.grindOptionId)}
                    >
                      <Text style={styles.optionText}>{locale === 'ar' ? g.grindOption.nameAr : g.grindOption.nameEn}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        <Text style={styles.prepTime}>
          {locale === 'ar' ? 'وقت التجهيز' : 'Prep Time'}: {product.basePreparationTimeMinutes} {locale === 'ar' ? 'دقيقة' : 'min'}
        </Text>

        <View style={styles.quantityRow}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>{locale === 'ar' ? 'الكمية' : 'Quantity'}</Text>
          <View style={styles.quantityControl}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {price && <Text style={styles.priceText}>{price.amount?.toLocaleString()} {price.currencyCode}</Text>}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.addBtn, (isCoffeeBean && isGround && !selectedGrind) && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={adding || (isCoffeeBean && isGround && !selectedGrind)}
        >
          <Text style={styles.addBtnText}>
            {added ? (locale === 'ar' ? 'تمت الإضافة ✓' : 'Added ✓') : (locale === 'ar' ? 'أضف للسلة' : 'Add to Cart')}
          </Text>
        </TouchableOpacity>
        {added && <Text style={styles.addedText}>{locale === 'ar' ? 'تمت الإضافة إلى السلة' : 'Added to cart'}</Text>}
      </View>
    </ScrollView>
  );
}
