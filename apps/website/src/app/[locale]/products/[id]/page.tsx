'use client';
import { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { useAuth } from '@/lib/auth-context';
import { formatMoney, MoneyAmount } from '@/lib/money';
import AuthModal from '@/components/auth-modal';
import EspressoButton from '@/components/espresso-button';
import CupSizeSelector from '@/components/cup-size-selector';
import { getGuestSession } from '@/lib/guest-session';

interface Product {
  id: string;
  sku: string;
  type: string;
  isBestSeller: boolean;
  isMaestroPick: boolean;
  imageUrl: string | null;
  images?: { id: string; url: string; altAr?: string; altEn?: string; isPrimary: boolean; sortOrder: number }[];
  basePreparationTimeMinutes: number;
  translations: {
    locale: string;
    name: string;
    shortDescription: string | null;
    description: string | null;
    microStory?: string | null;
  }[];
  variants: {
    id: string;
    name: string;
    sizeValue: number | null;
    sizeUnit: string | null;
    prices: { amount: MoneyAmount; currencyCode: string }[];
  }[];
  coffeeProfile: {
    originCountry: string | null;
    roastLevel: string | null;
    acidityLevel?: number;
    bodyLevel?: number;
    sweetnessLevel?: number;
    bitternessLevel?: number;
    caffeineLevel?: number;
    flavorNotes: string[];
    maestroNote: string | null;
  } | null;
  grindOptions: {
    isActive: boolean;
    grindOptionId: string;
    grindOption: {
      id: string;
      code: string;
      nameAr: string;
      nameEn: string;
      descriptionAr?: string | null;
      descriptionEn?: string | null;
      isActive: boolean;
    };
  }[];
}

function levelPercent(value?: number) {
  return `${Math.max(0, Math.min(10, value || 0)) * 10}%`;
}

export default function ProductDetailPage() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const { user, token } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedGrind, setSelectedGrind] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isGround, setIsGround] = useState(false);
  const [added, setAdded] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const isCoffeeBean = product?.type === 'COFFEE_BEAN';
  const availableGrindOptions = product?.grindOptions
    ?.filter(link => link.isActive && link.grindOption.isActive)
    .map(link => link.grindOption) || [];
  const needsGrindSelection = Boolean(isCoffeeBean && isGround && !selectedGrind);

  useEffect(() => {
    const id = params.id as string;
    api.get<Product>(`/products/${id}?locale=${locale}`)
      .then(item => {
        setProduct(item);
        if (item.variants.length > 0) {
          setSelectedVariant(item.variants[0].id);
        }
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Product not found'))
      .finally(() => setLoading(false));
  }, [params.id, locale]);

  const translation = useMemo(() => {
    return product?.translations.find(item => item.locale === locale) || product?.translations[0];
  }, [locale, product]);

  const variant = product?.variants.find(item => item.id === selectedVariant) || product?.variants[0];
  const selectedPrice = variant?.prices.find(price => price.currencyCode === 'SYP') || variant?.prices[0];

  const handleAddToCart = async () => {
    if (!product) return;
    if (needsGrindSelection) return;

    if (!token) {
      const sessionId = getGuestSession();
      setAdding(true);
      setError(null);
      try {
        const selectedOptions: { grindType?: 'whole_bean' | 'ground'; grindOptionId?: string } = {};
        if (isCoffeeBean) {
          selectedOptions.grindType = isGround ? 'ground' : 'whole_bean';
          if (isGround && selectedGrind) {
            selectedOptions.grindOptionId = selectedGrind;
          }
        }
        await api.post(`/guest-cart/items?sessionId=${sessionId}`, {
          productId: product.id,
          variantId: selectedVariant || undefined,
          quantity,
          selectedOptions,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to add to cart');
      } finally {
        setAdding(false);
      }
      return;
    }

    setAdding(true);
    setError(null);
    try {
      const selectedOptions: { grindType?: 'whole_bean' | 'ground'; grindOptionId?: string } = {};
      if (isCoffeeBean) {
        selectedOptions.grindType = isGround ? 'ground' : 'whole_bean';
        if (isGround && selectedGrind) {
          selectedOptions.grindOptionId = selectedGrind;
        }
      }

      await api.post('/cart/items', {
        productId: product.id,
        variantId: selectedVariant || undefined,
        quantity,
        selectedOptions,
      }, token);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="page-shell" style={{ textAlign: 'center' }}>Loading...</div>;
  if (!product || !translation) return <div className="page-shell" style={{ textAlign: 'center' }}>{error || 'Product not found'}</div>;

  const meters = product.coffeeProfile ? [
    { label: dict.product.acidity, value: product.coffeeProfile.acidityLevel },
    { label: dict.product.body, value: product.coffeeProfile.bodyLevel },
    { label: dict.product.sweetness, value: product.coffeeProfile.sweetnessLevel },
    { label: dict.product.bitterness, value: product.coffeeProfile.bitternessLevel },
    { label: dict.product.caffeine, value: product.coffeeProfile.caffeineLevel },
  ] : [];

  return (
    <div className="page-shell">
      <div className="container">
        <div className="detail-grid">
          <div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {product.images && product.images.length > 0 ? (
                <div>
                  <div style={{ minHeight: 420, display: 'grid', placeItems: 'center', background: '#1b100b' }}>
                    <img
                      src={product.images.find(i => i.isPrimary)?.url || product.images[0].url}
                      alt={translation.name}
                      style={{ width: '100%', height: 420, objectFit: 'cover' }}
                    />
                  </div>
                  {product.images.length > 1 && (
                    <div style={{ display: 'flex', gap: 8, padding: 12, overflowX: 'auto' }}>
                      {product.images.map(img => (
                        <button
                          key={img.id}
                          style={{
                            width: 72, height: 72, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                            border: img.isPrimary ? '3px solid var(--br-gold)' : '2px solid transparent',
                            padding: 0, cursor: 'pointer', background: 'none',
                          }}
                        >
                          <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : product.imageUrl ? (
                <div style={{ minHeight: 420, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, rgba(27,16,11,0.94), rgba(75,46,30,0.84)), repeating-linear-gradient(45deg, rgba(201,150,26,0.13) 0 1px, transparent 1px 16px)' }}>
                  <img src={product.imageUrl} alt={translation.name} style={{ width: '100%', height: 420, objectFit: 'cover' }} />
                </div>
              ) : (
                <div className="premium-fallback" style={{ minHeight: 420 }}>
                  {locale === 'ar' ? 'Banco Ricco' : 'Banco Ricco'}
                </div>
              )}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {product.isBestSeller && <span className="badge badge-gold">{dict.home.bestSellers}</span>}
              {product.isMaestroPick && <span className="badge badge-cream">{dict.home.maestroPicks}</span>}
            </div>
            <h1 style={{ fontSize: 38, lineHeight: 1.12, fontWeight: 900, marginBottom: 10 }}>
              {translation.name}
            </h1>
            {translation.description && (
              <p style={{ color: 'var(--br-muted)', marginBottom: 18, fontSize: 17 }}>
                {translation.description}
              </p>
            )}
            {translation.microStory && (
              <div className="card" style={{ padding: 16, marginBottom: 20, background: 'rgba(201,150,26,0.1)' }}>
                <strong>{dict.home.respectBeans}</strong>
                <p style={{ color: 'var(--br-muted)', marginTop: 6 }}>{translation.microStory}</p>
              </div>
            )}

            {product.coffeeProfile && (
              <div className="card" style={{ padding: 18, marginBottom: 22 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>{dict.product.roastProfile}</h2>
                <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                  {product.coffeeProfile.originCountry && <div><strong>{dict.product.origin}:</strong> {product.coffeeProfile.originCountry}</div>}
                  {product.coffeeProfile.roastLevel && <div><strong>{dict.product.roast}:</strong> {product.coffeeProfile.roastLevel}</div>}
                  {product.coffeeProfile.flavorNotes.length > 0 && (
                    <div><strong>{dict.product.flavorNotes}:</strong> {product.coffeeProfile.flavorNotes.join(', ')}</div>
                  )}
                </div>
                <div className="roast-grid">
                  {meters.map(meter => (
                    <div key={meter.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                        <span>{meter.label}</span>
                        <span>{meter.value || 0}/10</span>
                      </div>
                      <div className="meter" style={{ '--value': levelPercent(meter.value) } as CSSProperties}><span /></div>
                    </div>
                  ))}
                </div>
                {product.coffeeProfile.maestroNote && (
                  <p style={{ color: 'var(--br-coffee)', fontWeight: 700, marginTop: 14 }}>
                    {dict.product.maestroNote}: {product.coffeeProfile.maestroNote}
                  </p>
                )}
              </div>
            )}

            {product.variants.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontWeight: 900, display: 'block', marginBottom: 10 }}>
                  {dict.product.weight}
                </label>
                <CupSizeSelector
                  options={product.variants}
                  selectedId={selectedVariant}
                  onSelect={setSelectedVariant}
                  currencyCode="SYP"
                />
              </div>
            )}

            {isCoffeeBean && (
              <div style={{ marginBottom: 22 }}>
                <label style={{ fontWeight: 900, display: 'block', marginBottom: 10 }}>{dict.product.form}</label>
                <div className="option-grid" style={{ marginBottom: 12 }}>
                  <button
                    onClick={() => { setIsGround(false); setSelectedGrind(''); }}
                    className={`choice-card ${!isGround ? 'choice-card--selected' : ''}`}
                    style={{ minHeight: 90 }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 6 }}>🫘</div>
                    <strong>{dict.product.wholeBean}</strong>
                    <span style={{ fontSize: 12 }}>{locale === 'ar' ? 'بدون طحن' : 'No grind'}</span>
                  </button>
                  <button
                    onClick={() => setIsGround(true)}
                    className={`choice-card ${isGround ? 'choice-card--selected' : ''}`}
                    style={{ minHeight: 90 }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 6 }}>⚙️</div>
                    <strong>{dict.product.ground}</strong>
                    <span style={{ fontSize: 12 }}>{dict.product.selectGrind}</span>
                  </button>
                </div>

                {isGround && (
                  <div className="option-grid">
                    {availableGrindOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedGrind(option.id)}
                        className={`choice-card ${selectedGrind === option.id ? 'choice-card--selected' : ''}`}
                        style={{ minHeight: 100 }}
                      >
                        <div style={{ fontSize: 28, marginBottom: 6 }}>
                          {option.code === 'ESPRESSO' ? '☕' :
                           option.code === 'TURKISH' || option.code === 'TURKISH_SHAMI' ? '🏺' :
                           option.code === 'FRENCH_PRESS' ? '🫖' :
                           option.code === 'POUR_OVER' || option.code === 'V60' ? '⏳' :
                           option.code === 'AEROPRESS' ? '💨' :
                           option.code === 'MOKA_POT' ? '🍵' :
                           option.code === 'AMERICAN_COFFEE' ? '🇺🇸' :
                           option.code === 'COLD_BREW' ? '🧊' :
                           option.code === 'WHOLE_BEAN' ? '🫘' : '⚙️'}
                        </div>
                        <strong>{locale === 'ar' ? option.nameAr : option.nameEn}</strong>
                        <span style={{ fontSize: 12 }}>
                          {locale === 'ar' ? option.descriptionAr : option.descriptionEn || ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {needsGrindSelection && (
                  <div style={{ color: 'var(--br-danger)', fontSize: 14, marginTop: 10, fontWeight: 800 }}>
                    {dict.product.chooseGrindFirst}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
              <div>
                <div style={{ color: 'var(--br-muted)', fontSize: 13 }}>{dict.product.price}</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--br-gold-dark)' }}>
                  {selectedPrice ? formatMoney(selectedPrice.amount, selectedPrice.currencyCode) : ''}
                </div>
              </div>
              <div className="quantity-control">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            <div style={{ color: 'var(--br-muted)', fontSize: 14, marginBottom: 20 }}>
              {dict.product.preparationTime}: {product.basePreparationTimeMinutes} {dict.product.minutes}
            </div>

            {error && <div style={{ color: 'var(--br-danger)', fontWeight: 700, marginBottom: 12 }}>{error}</div>}

            <EspressoButton
              onClick={handleAddToCart}
              disabled={needsGrindSelection}
              loading={adding}
              size="large"
            >
              {added ? (locale === 'ar' ? 'تمت الإضافة ✓' : 'Added ✓') : user ? dict.product.addToCart : (locale === 'ar' ? 'أضف للسلة' : 'Add to Cart')}
            </EspressoButton>
          </div>
        </div>
      </div>

      {showAuth && <AuthModal locale={locale} onClose={() => setShowAuth(false)} />}
    </div>
  );
}
