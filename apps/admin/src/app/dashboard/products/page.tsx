'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/api';

interface Product {
  id: string; sku: string; type: string; isActive: boolean;
  isBestSeller: boolean; isMaestroPick: boolean; isFeatured: boolean;
  sortOrder: number;
  translations: { locale: string; name: string }[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await adminFetch('/products?limit=200');
      setProducts(data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (id: string, current: boolean) => {
    await adminFetch(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !current }),
    });
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>المنتجات</h1>
        <Link href="/dashboard/products/new" className="btn btn-primary">إضافة منتج</Link>
      </div>
      {loading ? <div style={{ padding: 40 }}>جاري التحميل...</div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>الاسم</th>
                <th>النوع</th>
                <th>الحالة</th>
                <th>الأكثر مبيعاً</th>
                <th>اختيار المايسترو</th>
                <th>الترتيب</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{p.sku}</td>
                  <td style={{ fontWeight: 600 }}>{p.translations.find(t => t.locale === 'ar')?.name || p.sku}</td>
                  <td><span className="badge badge-gold">{p.type}</span></td>
                  <td>
                    <span className={`badge ${p.isActive ? 'badge-success' : 'badge-muted'}`}>
                      {p.isActive ? 'نشط' : 'مخفي'}
                    </span>
                  </td>
                  <td>{p.isBestSeller ? '✓' : '-'}</td>
                  <td>{p.isMaestroPick ? '✓' : '-'}</td>
                  <td>{p.sortOrder}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/dashboard/products/${p.id}`} className="btn btn-sm btn-primary">تعديل</Link>
                      <button onClick={() => toggleActive(p.id, p.isActive)} className="btn btn-sm" style={{ background: '#eee' }}>
                        {p.isActive ? 'إخفاء' : 'إظهار'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
