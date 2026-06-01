'use client';
import { useRouter } from 'next/navigation';
import { Locale } from '@/lib/dictionaries';
import { formatMoney, MoneyAmount } from '@/lib/money';
import EspressoButton from './espresso-button';
import { resolveMediaUrl } from '@/lib/media';
import { useBrand } from '@/lib/brand-context';
import { useCurrency } from '@/lib/currency-context';

export interface ProductSummary {
  id: string;
  sku: string;
  type: string;
  isBestSeller: boolean;
  isMaestroPick: boolean;
  isFeatured?: boolean;
  imageUrl: string | null;
  basePreparationTimeMinutes?: number;
  translations: { locale: string; name: string; shortDescription: string | null }[];
  variants: { id: string; name: string; prices: { amount: MoneyAmount; currencyCode: string }[] }[];
  category?: { translations: { locale: string; name: string }[] };
}

type ProductCardProps = {
  product: ProductSummary;
  locale: Locale;
  labels: {
    bestSeller: string;
    maestroPick: string;
    view: string;
  };
};

function translated(product: ProductSummary, locale: Locale) {
  return product.translations.find(item => item.locale === locale) || product.translations[0];
}

function price(product: ProductSummary, currency: { code: string; symbol: string }) {
  const item = product.variants[0]?.prices.find(value => value.currencyCode === currency.code);
  return item ? formatMoney(item.amount, currency) : '';
}

function fallbackLetters(product: ProductSummary, locale: Locale) {
  const name = translated(product, locale)?.name || product.sku;
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

export default function ProductCard({ product, locale, labels }: ProductCardProps) {
  const router = useRouter();
  const t = translated(product, locale);
  const name = t?.name || product.sku;
  const description = t?.shortDescription || '';
  const brand = useBrand();
  const { selectedCurrency } = useCurrency();

  return (
    <article className="card product-card">
      <div className="product-card__media">
        {resolveMediaUrl(product.imageUrl) ? (
          <img src={resolveMediaUrl(product.imageUrl)!} alt={name} />
        ) : brand.resolvedFallbackImage ? (
          <img src={brand.resolvedFallbackImage} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="product-card__fallback"><div className="product-card__fallback-icon">{fallbackLetters(product, locale)}</div></div>
        )}
      </div>
      <div className="product-card__body">
        <div className="product-card__badges">
          {product.isBestSeller && <span className="badge badge-gold">{labels.bestSeller}</span>}
          {product.isMaestroPick && <span className="badge badge-cream">{labels.maestroPick}</span>}
        </div>
        <h3 className="product-card__title">{name}</h3>
        <p className="product-card__desc">{description}</p>
        <div className="product-card__footer">
          <span className="money">{selectedCurrency ? price(product, selectedCurrency) : ''}</span>
          <EspressoButton size="small" onClick={() => router.push(`/${locale}/products/${product.id}`)}>
            {labels.view}
          </EspressoButton>
        </div>
      </div>
    </article>
  );
}
