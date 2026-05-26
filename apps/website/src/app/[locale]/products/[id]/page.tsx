'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { useAuth } from '@/lib/auth-context';

interface Product {
  id: string; sku: string; type: string;
  isBestSeller: boolean; isMaestroPick: boolean;
  imageUrl: string | null; basePreparationTimeMinutes: number;
  translations: { locale: string; name: string; shortDescription: string | null; description: string | null }[];
  variants: { id: string; name: string; sizeValue: number | null; sizeUnit: string | null; prices: { amount: number; currencyCode: string }[] }[];
  coffeeProfile: { originCountry: string | null; roastLevel: string | null; flavorNotes: string[]; maestroNote: string | null } | null;
}

interface GrindOption {
  id: string; code: string; nameAr: string; nameEn: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const { user, token } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [grindOptions, setGrindOptions] = useState<GrindOption[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedGrind, setSelectedGrind] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isGround, setIsGround] = useState(false);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);

  const isCoffeeBean = product?.type === 'COFFEE_BEAN';

  useEffect(() => {
    const id = params.id as string;
    Promise.all([
      api.get<Product>(`/products/${id}?locale=${locale}`),
      api.get<GrindOption[]>('/grind-options'),
    ]).then(([prod, grinds]) => {
      setProduct(prod);
      setGrindOptions(grinds);
      if (prod.variants.length > 0) setSelectedVariant(prod.variants[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, [params.id, locale]);

  const getT = (p: Product) => p.translations.find(t => t.locale === locale);

  const handleAddToCart = async () => {
    if (!token) return;
    const selectedOptions: any = {};
    if (isCoffeeBean) {
      selectedOptions.grindType = isGround ? 'ground' : 'whole_bean';
      if (isGround && selectedGrind) {
        selectedOptions.grindOptionId = selectedGrind;
      }
    }
    await api.post('/cart/items', {
      productId: product!.id,
      variantId: selectedVariant || undefined,
      quantity,
      selectedOptions,
    }, token);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}>Loading...</div>;
  if (!product) return <div style={{ textAlign: 'center', padding: 80 }}>Product not found</div>;

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
        <div>
          <div style={{
            background: 'var(--br-white)', borderRadius: 16, padding: 48,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 300, border: '1px solid #eee',
          }}>
            <span style={{ fontSize: 80 }}>&#9749;</span>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {product.isBestSeller && <span className="badge badge-gold">{dict.home.bestSellers}</span>}
            {product.isMaestroPick && <span className="badge badge-cream">{dict.home.maestroPicks}</span>}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            {getT(product)?.name || product.sku}
          </h1>
          {getT(product)?.description && (
            <p style={{ color: 'var(--br-muted)', marginBottom: 24, lineHeight: 1.8 }}>
              {getT(product)?.description}
            </p>
          )}

          {product.coffeeProfile && (
            <div style={{ background: 'var(--br-cream)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              {product.coffeeProfile.originCountry && (
                <div style={{ marginBottom: 8 }}><strong>{locale === 'ar' ? 'بلد المنشأ' : 'Origin'}:</strong> {product.coffeeProfile.originCountry}</div>
              )}
              {product.coffeeProfile.roastLevel && (
                <div style={{ marginBottom: 8 }}><strong>{locale === 'ar' ? 'التحميص' : 'Roast'}:</strong> {product.coffeeProfile.roastLevel}</div>
              )}
              {product.coffeeProfile.flavorNotes.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <strong>{locale === 'ar' ? 'نكهات' : 'Flavor Notes'}:</strong>{' '}
                  {product.coffeeProfile.flavorNotes.join(', ')}
                </div>
              )}
              {product.coffeeProfile.maestroNote && (
                <div style={{ fontStyle: 'italic', color: 'var(--br-coffee)', marginTop: 8 }}>
                  &ldquo;{product.coffeeProfile.maestroNote}&rdquo;
                </div>
              )}
            </div>
          )}

          {product.variants.length > 1 && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
                {locale === 'ar' ? 'اختر الحجم' : 'Select Size'}
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    style={{
                      padding: '10px 20px', borderRadius: 8, border: `2px solid ${selectedVariant === v.id ? 'var(--br-gold)' : '#ddd'}`,
                      background: selectedVariant === v.id ? 'var(--br-gold)' : 'var(--br-white)',
                      color: selectedVariant === v.id ? 'var(--br-black)' : 'inherit',
                      fontWeight: selectedVariant === v.id ? 600 : 400,
                    }}
                  >
                    {v.name} {v.sizeValue}{v.sizeUnit}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isCoffeeBean && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
                {locale === 'ar' ? 'نوع الطحن' : 'Grind Type'}
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  onClick={() => { setIsGround(false); setSelectedGrind(''); }}
                  style={{
                    padding: '10px 20px', borderRadius: 8, border: `2px solid ${!isGround ? 'var(--br-gold)' : '#ddd'}`,
                    background: !isGround ? 'var(--br-gold)' : 'var(--br-white)',
                    fontWeight: !isGround ? 600 : 400,
                  }}
                >{dict.product.wholeBean}</button>
                <button
                  onClick={() => setIsGround(true)}
                  style={{
                    padding: '10px 20px', borderRadius: 8, border: `2px solid ${isGround ? 'var(--br-gold)' : '#ddd'}`,
                    background: isGround ? 'var(--br-gold)' : 'var(--br-white)',
                    fontWeight: isGround ? 600 : 400,
                  }}
                >{dict.product.ground}</button>
              </div>
              {isGround && (
                <div>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    {dict.product.selectGrind}
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {grindOptions.filter(g => g.code !== 'WHOLE_BEAN').map(g => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGrind(g.id)}
                        style={{
                          padding: '8px 16px', borderRadius: 8, border: `1px solid ${selectedGrind === g.id ? 'var(--br-gold)' : '#ddd'}`,
                          background: selectedGrind === g.id ? 'var(--br-gold)' : 'var(--br-white)',
                          fontWeight: selectedGrind === g.id ? 600 : 400,
                          fontSize: 13,
                        }}
                      >{locale === 'ar' ? g.nameAr : g.nameEn}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--br-gold)', marginBottom: 20 }}>
            {product.variants.find(v => v.id === selectedVariant)?.prices[0]?.amount.toLocaleString()} SYP
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'var(--br-white)', fontSize: 18 }}>-</button>
              <span style={{ fontSize: 18, fontWeight: 600, minWidth: 32, textAlign: 'center' }}>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'var(--br-white)', fontSize: 18 }}>+</button>
            </div>
            <span style={{ color: 'var(--br-muted)', fontSize: 14 }}>
              {dict.product.preparationTime}: ~{product.basePreparationTimeMinutes} {dict.product.minutes}
            </span>
          </div>

          {user ? (
            <button onClick={handleAddToCart} className="btn btn-primary" style={{ padding: '14px 40px', fontSize: 18 }}>
              {added ? '✓ ' : ''}{dict.product.addToCart}
            </button>
          ) : (
            <button onClick={() => router.push(`/${locale}/?login=1`)} className="btn btn-outline" style={{ padding: '14px 40px', fontSize: 18 }}>
              {dict.nav.login} {dict.product.addToCart}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
