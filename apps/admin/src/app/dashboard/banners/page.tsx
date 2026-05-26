'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/api';

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true,
    titleAr: '', subtitleAr: '', titleEn: '', subtitleEn: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try { setBanners(await adminFetch<any[]>('/admin/banners')); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      const payload = {
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl || undefined,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        translations: [
          { locale: 'ar', title: form.titleAr, subtitle: form.subtitleAr },
          { locale: 'en', title: form.titleEn, subtitle: form.subtitleEn },
        ],
      };
      if (editId) {
        await adminFetch(`/admin/banners/${editId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await adminFetch('/admin/banners', { method: 'POST', body: JSON.stringify(payload) });
      }
      setEditId(null);
      setForm({ imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true, titleAr: '', subtitleAr: '', titleEn: '', subtitleEn: '' });
      load();
    } catch (err: any) { alert(err.message); }
  };

  const edit = (b: any) => {
    setEditId(b.id);
    const tAr = b.translations?.find((t: any) => t.locale === 'ar');
    const tEn = b.translations?.find((t: any) => t.locale === 'en');
    setForm({
      imageUrl: b.imageUrl, linkUrl: b.linkUrl || '', sortOrder: b.sortOrder, isActive: b.isActive,
      titleAr: tAr?.title || '', subtitleAr: tAr?.subtitle || '',
      titleEn: tEn?.title || '', subtitleEn: tEn?.subtitle || '',
    });
  };

  const remove = async (id: string) => {
    if (!confirm('تأكيد الحذف؟')) return;
    await adminFetch(`/admin/banners/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>البنرات</h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{editId ? 'تعديل' : 'إضافة'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <input className="input" placeholder="Image URL" value={form.imageUrl}
            onChange={e => setForm({...form, imageUrl: e.target.value})} />
          <input className="input" placeholder="Link URL" value={form.linkUrl}
            onChange={e => setForm({...form, linkUrl: e.target.value})} />
          <input className="input" type="number" placeholder="Sort Order" value={form.sortOrder}
            onChange={e => setForm({...form, sortOrder: parseInt(e.target.value) || 0})} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.isActive}
              onChange={e => setForm({...form, isActive: e.target.checked})} />
            <span>نشط</span>
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, padding: 12, background: '#f9f5f0', borderRadius: 8 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, gridColumn: '1 / -1', marginBottom: 4 }}>العربية</h4>
          <input className="input" placeholder="العنوان" value={form.titleAr}
            onChange={e => setForm({...form, titleAr: e.target.value})} />
          <input className="input" placeholder="النص الفرعي" value={form.subtitleAr}
            onChange={e => setForm({...form, subtitleAr: e.target.value})} />
          <h4 style={{ fontSize: 14, fontWeight: 600, gridColumn: '1 / -1', marginBottom: 4 }}>English</h4>
          <input className="input" placeholder="Title" value={form.titleEn}
            onChange={e => setForm({...form, titleEn: e.target.value})} />
          <input className="input" placeholder="Subtitle" value={form.subtitleEn}
            onChange={e => setForm({...form, subtitleEn: e.target.value})} />
        </div>
        <button onClick={save} className="btn btn-primary">{editId ? 'حفظ' : 'إضافة'}</button>
        {editId && <button onClick={() => setEditId(null)} className="btn btn-sm" style={{ marginRight: 8, background: '#eee' }}>إلغاء</button>}
      </div>

      {loading ? <div>جاري التحميل...</div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr><th>الصورة</th><th>العنوان (عربي)</th><th>Title (EN)</th><th>الترتيب</th><th>الحالة</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {banners.map((b: any) => {
                const tAr = b.translations?.find((t: any) => t.locale === 'ar');
                const tEn = b.translations?.find((t: any) => t.locale === 'en');
                return (
                  <tr key={b.id}>
                    <td><img src={b.imageUrl} alt="" style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 4 }} /></td>
                    <td>{tAr?.title || '-'}</td>
                    <td>{tEn?.title || '-'}</td>
                    <td>{b.sortOrder}</td>
                    <td><span className={`badge ${b.isActive ? 'badge-success' : 'badge-muted'}`}>{b.isActive ? 'نشط' : 'مخفي'}</span></td>
                    <td>
                      <button onClick={() => edit(b)} className="btn btn-sm btn-primary">تعديل</button>
                      <button onClick={() => remove(b.id)} className="btn btn-sm btn-danger" style={{ marginRight: 8 }}>حذف</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
