'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: '', isActive: true, sortOrder: 0,
    translations: [{ locale: 'ar', name: '', description: '' },
                   { locale: 'en', name: '', description: '' }],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try { setCategories(await adminFetch<any[]>('/categories')); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editId) {
        await adminFetch(`/admin/categories/${editId}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await adminFetch('/admin/categories', { method: 'POST', body: JSON.stringify(form) });
      }
      setEditId(null);
      setForm({ slug: '', isActive: true, sortOrder: 0, translations: [{ locale: 'ar', name: '', description: '' }, { locale: 'en', name: '', description: '' }] });
      load();
    } catch (err: any) { alert(err.message); }
  };

  const edit = (cat: any) => {
    setEditId(cat.id);
    setForm({
      slug: cat.slug, isActive: cat.isActive, sortOrder: cat.sortOrder,
      translations: [
        { locale: 'ar', name: cat.translations?.find((t: any) => t.locale === 'ar')?.name || '', description: cat.translations?.find((t: any) => t.locale === 'ar')?.description || '' },
        { locale: 'en', name: cat.translations?.find((t: any) => t.locale === 'en')?.name || '', description: cat.translations?.find((t: any) => t.locale === 'en')?.description || '' },
      ],
    });
  };

  const remove = async (id: string) => {
    if (!confirm('تأكيد الحذف؟')) return;
    await adminFetch(`/admin/categories/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>التصنيفات</h1>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{editId ? 'تعديل تصنيف' : 'إضافة تصنيف'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <input className="input" placeholder="Slug" value={form.slug}
            onChange={e => setForm({...form, slug: e.target.value})} />
          <input className="input" type="number" placeholder="الترتيب" value={form.sortOrder}
            onChange={e => setForm({...form, sortOrder: parseInt(e.target.value) || 0})} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>العربية</label>
            <input className="input" placeholder="الاسم" value={form.translations[0].name}
              onChange={e => {
                const ts = [...form.translations];
                ts[0] = {...ts[0], name: e.target.value};
                setForm({...form, translations: ts});
              }} style={{ marginBottom: 8 }} />
            <input className="input" placeholder="الوصف" value={form.translations[0].description}
              onChange={e => {
                const ts = [...form.translations];
                ts[0] = {...ts[0], description: e.target.value};
                setForm({...form, translations: ts});
              }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>English</label>
            <input className="input" placeholder="Name" value={form.translations[1].name}
              onChange={e => {
                const ts = [...form.translations];
                ts[1] = {...ts[1], name: e.target.value};
                setForm({...form, translations: ts});
              }} style={{ marginBottom: 8 }} />
            <input className="input" placeholder="Description" value={form.translations[1].description}
              onChange={e => {
                const ts = [...form.translations];
                ts[1] = {...ts[1], description: e.target.value};
                setForm({...form, translations: ts});
              }} />
          </div>
        </div>
        <button onClick={save} className="btn btn-primary">{editId ? 'حفظ' : 'إضافة'}</button>
        {editId && <button onClick={() => setEditId(null)} className="btn btn-sm" style={{ marginRight: 8, background: '#eee' }}>إلغاء</button>}
      </div>

      {loading ? <div>جاري التحميل...</div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr><th>Slug</th><th>العربية</th><th>English</th><th>الترتيب</th><th>الحالة</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {categories.map((c: any) => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{c.slug}</td>
                  <td>{c.translations?.find((t: any) => t.locale === 'ar')?.name}</td>
                  <td>{c.translations?.find((t: any) => t.locale === 'en')?.name}</td>
                  <td>{c.sortOrder}</td>
                  <td><span className={`badge ${c.isActive ? 'badge-success' : 'badge-muted'}`}>{c.isActive ? 'نشط' : 'مخفي'}</span></td>
                  <td>
                    <button onClick={() => edit(c)} className="btn btn-sm btn-primary">تعديل</button>
                    <button onClick={() => remove(c.id)} className="btn btn-sm btn-danger" style={{ marginRight: 8 }}>حذف</button>
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
