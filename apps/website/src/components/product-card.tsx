'use client';
import { useRouter } from 'next/navigation';
import { Locale } from '@/lib/dictionaries';
import { formatMoney, MoneyAmount } from '@/lib/money';
import EspressoButton from './espresso-button';

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

function price(product: ProductSummary) {
  const item = product.variants[0]?.prices.find(value => value.currencyCode === 'SYP') || product.variants[0]?.prices[0];
  return item ? formatMoney(item.amount, item.currencyCode) : '';
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

  return (
    <article className="card product-card">
      <div className="product-card__media">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={name} />
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
          <span className="money">{price(product)}</span>
          <EspressoButton size="small" onClick={() => router.push(`/${locale}/products/${product.id}`)}>
            {labels.view}
          </EspressoButton>
        </div>
      </div>
    </article>
  );
}
