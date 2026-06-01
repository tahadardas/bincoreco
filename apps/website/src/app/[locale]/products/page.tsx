'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';
import ProductCard, { ProductSummary } from '@/components/product-card';

interface Category {
  id: string;
  slug: string;
  translations: { locale: string; name: string }[];
}

function localizedCategory(category: Category, locale: Locale) {
  return category.translations.find(item => item.locale === locale)?.name
    || category.translations[0]?.name
    || category.slug;
}

export default function ProductsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get('maestro') === '1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Category[]>(`/categories?locale=${locale}`).then(setCategories).catch(console.error);
  }, [locale]);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams({ locale, limit: '100' });
    if (categoryId) query.set('categoryId', categoryId);
    if (type) query.set('type', type);
    if (featuredOnly) query.set('isMaestroPick', 'true');
    api.get<ProductSummary[]>(`/products?${query.toString()}`)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categoryId, featuredOnly, locale, type]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sorted = [...products].sort((a, b) => {
      const aScore = Number(b.isBestSeller) - Number(a.isBestSeller);
      if (aScore !== 0) return aScore;
      return Number(b.isMaestroPick) - Number(a.isMaestroPick);
    });
    if (!term) return sorted;
    return sorted.filter(product =>
      product.sku.toLowerCase().includes(term)
      || product.translations.some(item => `${item.name} ${item.shortDescription || ''}`.toLowerCase().includes(term)),
    );
  }, [products, search]);

  const labels = {
    bestSeller: dict.home.bestSellers,
    maestroPick: dict.home.maestroPicks,
    view: dict.home.viewDetails,
  };

  return (
    <div className="page-shell">
      <div className="container">
        <div className="section-heading">
          <div>
            <div className="section-eyebrow">Banco Ricco</div>
            <h1 className="section-title">{dict.nav.products}</h1>
          </div>
          <p className="section-copy">{dict.home.beansCopy}</p>
        </div>

        <div className="card" style={{ padding: 18, marginBottom: 26 }}>
          <div className="filter-grid">
            <input
              className="input"
              placeholder={locale === 'ar' ? 'ابحث عن قهوتك' : 'Search coffee'}
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
            <select className="select" value={categoryId} onChange={event => setCategoryId(event.target.value)}>
              <option value="">{locale === 'ar' ? 'كل التصنيفات' : 'All categories'}</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{localizedCategory(category, locale)}</option>
              ))}
            </select>
            <select className="select" value={type} onChange={event => setType(event.target.value)}>
              <option value="">{locale === 'ar' ? 'كل الأنواع' : 'All types'}</option>
              <option value="HOT_DRINK">{locale === 'ar' ? 'مشروبات ساخنة' : 'Hot drinks'}</option>
              <option value="COLD_DRINK">{locale === 'ar' ? 'مشروبات باردة' : 'Cold drinks'}</option>
              <option value="COFFEE_BEAN">{locale === 'ar' ? 'بن' : 'Coffee beans'}</option>
              <option value="GROUND_COFFEE">{locale === 'ar' ? 'بن مطحون' : 'Ground coffee'}</option>
              <option value="PACKAGE">{locale === 'ar' ? 'باقات' : 'Packages'}</option>
              <option value="SUBSCRIPTION">{locale === 'ar' ? 'اشتراكات' : 'Subscriptions'}</option>
              <option value="GIFT_CARD">{locale === 'ar' ? 'بطاقات هدية' : 'Gift cards'}</option>
            </select>
            <button
              className={`btn ${featuredOnly ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFeaturedOnly(!featuredOnly)}
            >
              {dict.home.maestroPicks}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>Loading...</div>
        ) : (
          <div className="grid grid-3">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} locale={locale} labels={labels} />
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="card" style={{ padding: 36, textAlign: 'center', color: 'var(--br-muted)', marginTop: 20 }}>
            {locale === 'ar' ? 'لا توجد منتجات ضمن الفلاتر الحالية' : 'No products match the current filters'}
          </div>
        )}
      </div>
    </div>
  );
}
