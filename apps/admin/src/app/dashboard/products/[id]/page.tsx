'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/api';

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'HOT_DRINK', sku: '', categoryId: '',
    isActive: true, isBestSeller: false, isMaestroPick: false, isFeatured: false,
    imageUrl: '', basePreparationTimeMinutes: 15, sortOrder: 0,
    translations: [{ locale: 'ar', name: '', shortDescription: '', description: '' },
                   { locale: 'en', name: '', shortDescription: '', description: '' }],
    variants: [{ name: 'Regular', sizeValue: null as number | null, sizeUnit: '',
                prices: [{ currencyCode: 'SYP', amount: 0 }] }],
  });
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    adminFetch<any>('/categories').then(setCategories).catch(console.error);
    if (!isNew) {
      adminFetch<any>(`/products/${params.id}`).then(p => {
        setForm({
          type: p.type, sku: p.sku, categoryId: p.categoryId,
          isActive: p.isActive, isBestSeller: p.isBestSeller,
          isMaestroPick: p.isMaestroPick, isFeatured: p.isFeatured,
          imageUrl: p.imageUrl || '', basePreparationTimeMinutes: p.basePreparationTimeMinutes,
          sortOrder: p.sortOrder,
          translations: p.translations?.length ? p.translations : form.translations,
          variants: p.variants?.length ? p.variants.map((v: any) => ({
            name: v.name, sizeValue: v.sizeValue, sizeUnit: v.sizeUnit || '',
            prices: v.prices?.map((pr: any) => ({ currencyCode: pr.currencyCode, amount: pr.amount })) ||
                    [{ currencyCode: 'SYP', amount: 0 }],
          })) : form.variants,
        });
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [params.id]);

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        categoryId: form.categoryId || categories[0]?.id,
      };
      if (isNew) {
        await adminFetch('/admin/products', { method: 'POST', body: JSON.stringify(body) });
      } else {
        await adminFetch(`/admin/products/${params.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      }
      router.push('/dashboard/products');
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 40 }}>جاري التحميل...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
        {isNew ? 'إضافة منتج جديد' : 'تعديل المنتج'}
      </h1>
      <div className="card" style={{ maxWidth: 800 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 14 }}>SKU</label>
            <input className="input" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
          </div>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 14 }}>النوع</label>
            <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="HOT_DRINK">مشروب ساخن</option>
              <option value="COLD_DRINK">مشروب بارد</option>
              <option value="COFFEE_BEAN">بن</option>
              <option value="GROUND_COFFEE">بن مطحون</option>
              <option value="PACKAGE">باقة</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 14 }}>التصنيف</label>
            <select className="input" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}>
              <option value="">اختر تصنيفاً</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.translations?.find((t: any) => t.locale === 'ar')?.name || c.slug}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 14 }}>وقت التجهيز (دقيقة)</label>
            <input className="input" type="number" value={form.basePreparationTimeMinutes}
              onChange={e => setForm({...form, basePreparationTimeMinutes: parseInt(e.target.value) || 15})} />
          </div>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 14 }}>ترتيب</label>
            <input className="input" type="number" value={form.sortOrder}
              onChange={e => setForm({...form, sortOrder: parseInt(e.target.value) || 0})} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, margin: '16px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={form.isBestSeller}
              onChange={e => setForm({...form, isBestSeller: e.target.checked})} />
            الأكثر مبيعاً
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={form.isMaestroPick}
              onChange={e => setForm({...form, isMaestroPick: e.target.checked})} />
            اختيار المايسترو
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={form.isFeatured}
              onChange={e => setForm({...form, isFeatured: e.target.checked})} />
            مميز
          </label>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 600, margin: '24px 0 12px' }}>الترجمات</h3>
        {form.translations.map((t, i) => (
          <div key={t.locale} style={{ marginBottom: 16, padding: 16, background: 'var(--br-cream)', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--br-gold)' }}>
              {t.locale === 'ar' ? 'العربية' : 'English'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>الاسم</label>
                <input className="input" value={t.name}
                  onChange={e => {
                    const ts = [...form.translations];
                    ts[i] = {...ts[i], name: e.target.value};
                    setForm({...form, translations: ts});
                  }} />
              </div>
              <div>
                <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>وصف قصير</label>
                <input className="input" value={t.shortDescription}
                  onChange={e => {
                    const ts = [...form.translations];
                    ts[i] = {...ts[i], shortDescription: e.target.value};
                    setForm({...form, translations: ts});
                  }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>الوصف</label>
                <textarea className="input" rows={3} value={t.description}
                  onChange={e => {
                    const ts = [...form.translations];
                    ts[i] = {...ts[i], description: e.target.value};
                    setForm({...form, translations: ts});
                  }} />
              </div>
            </div>
          </div>
        ))}

        <h3 style={{ fontSize: 18, fontWeight: 600, margin: '24px 0 12px' }}>الخيارات</h3>
        {form.variants.map((v, i) => (
          <div key={i} style={{ marginBottom: 12, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>الاسم</label>
                <input className="input" value={v.name}
                  onChange={e => {
                    const vs = [...form.variants];
                    vs[i] = {...vs[i], name: e.target.value};
                    setForm({...form, variants: vs});
                  }} />
              </div>
              <div>
                <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>الحجم</label>
                <input className="input" type="number" value={v.sizeValue || ''}
                  onChange={e => {
                    const vs = [...form.variants];
                    vs[i] = {...vs[i], sizeValue: e.target.value ? parseFloat(e.target.value) : null};
                    setForm({...form, variants: vs});
                  }} />
              </div>
              <div>
                <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>الوحدة</label>
                <input className="input" value={v.sizeUnit}
                  onChange={e => {
                    const vs = [...form.variants];
                    vs[i] = {...vs[i], sizeUnit: e.target.value};
                    setForm({...form, variants: vs});
                  }} />
              </div>
              {v.prices.map((p, pi) => (
                <div key={pi}>
                  <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>السعر ({p.currencyCode})</label>
                  <input className="input" type="number" value={p.amount}
                    onChange={e => {
                      const vs = [...form.variants];
                      vs[i].prices[pi] = {...vs[i].prices[pi], amount: parseFloat(e.target.value) || 0};
                      setForm({...form, variants: vs});
                    }} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ marginTop: 24 }}>
          {saving ? 'جاري الحفظ...' : (isNew ? 'إضافة' : 'حفظ التغييرات')}
        </button>
      </div>
    </div>
  );
}
