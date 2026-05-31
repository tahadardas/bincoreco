'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/api';
import { formatMoney, MoneyAmount } from '@/lib/money';

interface Category {
  id: string;
  slug: string;
  translations: { locale: string; name: string }[];
}

interface Product {
  id: string;
  sku: string;
  type: ProductType;
  isActive: boolean;
  isBestSeller: boolean;
  isMaestroPick: boolean;
  isFeatured: boolean;
  sortOrder: number;
  translations: { locale: string; name: string }[];
  category?: Category;
  variants: {
    name: string;
    prices: { currencyCode: string; amount: MoneyAmount }[];
  }[];
}

type ProductType = 'HOT_DRINK' | 'COLD_DRINK' | 'COFFEE_BEAN' | 'GROUND_COFFEE' | 'PACKAGE' | 'SUBSCRIPTION' | 'GIFT_CARD';
type BooleanFilter = 'all' | 'true' | 'false';

const productTypeLabels: Record<ProductType, string> = {
  HOT_DRINK: 'مشروب ساخن',
  COLD_DRINK: 'مشروب بارد',
  COFFEE_BEAN: 'بن حب',
  GROUND_COFFEE: 'بن مطحون',
  PACKAGE: 'باقة',
  SUBSCRIPTION: 'اشتراك',
  GIFT_CARD: 'بطاقة هدية',
};

const productTypes: ProductType[] = ['HOT_DRINK', 'COLD_DRINK', 'COFFEE_BEAN', 'GROUND_COFFEE', 'PACKAGE', 'SUBSCRIPTION', 'GIFT_CARD'];

function localizedName(translations: { locale: string; name: string }[], fallback: string) {
  return translations.find(translation => translation.locale === 'ar')?.name
    || translations.find(translation => translation.locale === 'en')?.name
    || fallback;
}

function firstPrice(product: Product) {
  const price = product.variants[0]?.prices[0];
  return price ? formatMoney(price.amount, price.currencyCode) : 'بدون سعر';
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState('');
  const [activeFilter, setActiveFilter] = useState<BooleanFilter>('all');
  const [bestSellerFilter, setBestSellerFilter] = useState<BooleanFilter>('all');
  const [maestroFilter, setMaestroFilter] = useState<BooleanFilter>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const query = new URLSearchParams({ limit: '200', locale: 'ar' });
    if (search.trim()) query.set('search', search.trim());
    if (categoryId) query.set('categoryId', categoryId);
    if (type) query.set('type', type);
    if (activeFilter !== 'all') query.set('isActive', activeFilter);
    if (bestSellerFilter !== 'all') query.set('isBestSeller', bestSellerFilter);
    if (maestroFilter !== 'all') query.set('isMaestroPick', maestroFilter);
    return query.toString();
  }, [activeFilter, bestSellerFilter, categoryId, maestroFilter, search, type]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<Product[]>(`/admin/products?${queryString}`);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    adminFetch<Category[]>('/categories?locale=ar')
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const patchProduct = async (product: Product, data: Partial<Pick<Product, 'isActive' | 'isBestSeller' | 'isMaestroPick'>>) => {
    setUpdatingId(product.id);
    try {
      await adminFetch(`/admin/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await loadProducts();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'تعذر تحديث المنتج');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>المنتجات</h1>
          <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>إدارة الكتالوج والأسعار والحالة من لوحة المايسترو.</p>
        </div>
        <Link href="/dashboard/products/new" className="btn btn-primary">إضافة منتج</Link>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.4fr) repeat(5, minmax(140px, 1fr))', gap: 12 }}>
          <input
            className="input"
            placeholder="بحث باسم المنتج"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <select className="input" value={categoryId} onChange={event => setCategoryId(event.target.value)}>
            <option value="">كل التصنيفات</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {localizedName(category.translations, category.slug)}
              </option>
            ))}
          </select>
          <select className="input" value={type} onChange={event => setType(event.target.value)}>
            <option value="">كل الأنواع</option>
            {productTypes.map(productType => (
              <option key={productType} value={productType}>{productTypeLabels[productType]}</option>
            ))}
          </select>
          <select className="input" value={activeFilter} onChange={event => setActiveFilter(event.target.value as BooleanFilter)}>
            <option value="all">كل الحالات</option>
            <option value="true">نشط فقط</option>
            <option value="false">مخفي فقط</option>
          </select>
          <select className="input" value={bestSellerFilter} onChange={event => setBestSellerFilter(event.target.value as BooleanFilter)}>
            <option value="all">الأكثر مبيعاً: الكل</option>
            <option value="true">نعم</option>
            <option value="false">لا</option>
          </select>
          <select className="input" value={maestroFilter} onChange={event => setMaestroFilter(event.target.value as BooleanFilter)}>
            <option value="all">اختيار المايسترو: الكل</option>
            <option value="true">نعم</option>
            <option value="false">لا</option>
          </select>
        </div>
      </div>

      {loading && <div style={{ padding: 40 }}>جاري تحميل المنتجات...</div>}
      {error && !loading && <div className="card" style={{ color: 'var(--br-danger)' }}>{error}</div>}

      {!loading && !error && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>الاسم</th>
                <th>التصنيف</th>
                <th>النوع</th>
                <th>السعر</th>
                <th>الحالة</th>
                <th>وسوم</th>
                <th>الترتيب</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{product.sku}</td>
                  <td style={{ fontWeight: 700 }}>{localizedName(product.translations, product.sku)}</td>
                  <td>{product.category ? localizedName(product.category.translations, product.category.slug) : '-'}</td>
                  <td><span className="badge badge-gold">{productTypeLabels[product.type] || product.type}</span></td>
                  <td style={{ fontWeight: 700 }}>{firstPrice(product)}</td>
                  <td>
                    <span className={`badge ${product.isActive ? 'badge-success' : 'badge-muted'}`}>
                      {product.isActive ? 'نشط' : 'مخفي'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {product.isBestSeller && <span className="badge badge-gold">الأكثر طلباً</span>}
                      {product.isMaestroPick && <span className="badge" style={{ background: 'var(--br-coffee)', color: 'white' }}>اختيار المايسترو</span>}
                      {product.isFeatured && <span className="badge badge-muted">مميز</span>}
                      {!product.isBestSeller && !product.isMaestroPick && !product.isFeatured && <span style={{ color: 'var(--br-muted)' }}>-</span>}
                    </div>
                  </td>
                  <td>{product.sortOrder}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Link href={`/dashboard/products/${product.id}`} className="btn btn-sm btn-primary">تعديل</Link>
                      <button
                        onClick={() => patchProduct(product, { isActive: !product.isActive })}
                        disabled={updatingId === product.id}
                        className="btn btn-sm"
                        style={{ background: 'var(--br-cream)' }}
                      >
                        {product.isActive ? 'إخفاء' : 'إظهار'}
                      </button>
                      <button
                        onClick={() => patchProduct(product, { isBestSeller: !product.isBestSeller })}
                        disabled={updatingId === product.id}
                        className="btn btn-sm"
                        style={{ background: product.isBestSeller ? 'var(--br-gold)' : 'var(--br-cream)' }}
                      >
                        الأكثر طلباً
                      </button>
                      <button
                        onClick={() => patchProduct(product, { isMaestroPick: !product.isMaestroPick })}
                        disabled={updatingId === product.id}
                        className="btn btn-sm"
                        style={{ background: product.isMaestroPick ? 'var(--br-coffee)' : 'var(--br-cream)', color: product.isMaestroPick ? 'white' : 'var(--br-black)' }}
                      >
                        المايسترو
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--br-muted)', padding: 32 }}>
                    لا توجد منتجات ضمن الفلاتر الحالية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
