'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';

interface Product {
  id: string; sku: string; type: string;
  isBestSeller: boolean; isMaestroPick: boolean;
  imageUrl: string | null; basePreparationTimeMinutes: number;
  translations: { locale: string; name: string; shortDescription: string | null }[];
  variants: { id: string; name: string; prices: { amount: number; currencyCode: string }[] }[];
  category: { translations: { locale: string; name: string }[] };
}

export default function ProductsPage() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Product[]>(`/products?locale=${locale}`)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [locale]);

  const getT = (p: Product) => p.translations.find(t => t.locale === locale);

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32 }}>{dict.nav.products}</h1>
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div> : (
        <div className="grid grid-2">
          {products.map(p => (
            <Link key={p.id} href={`/${locale}/products/${p.id}`} className="card" style={{ padding: 24, display: 'flex' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {p.isBestSeller && <span className="badge badge-gold">{dict.home.bestSellers}</span>}
                  {p.isMaestroPick && <span className="badge badge-cream">{dict.home.maestroPicks}</span>}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600 }}>{getT(p)?.name || p.sku}</h3>
                <p style={{ color: 'var(--br-muted)', fontSize: 14, margin: '8px 0' }}>{getT(p)?.shortDescription}</p>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--br-gold)' }}>
                  {p.variants[0]?.prices[0]?.amount.toLocaleString()} SYP
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
