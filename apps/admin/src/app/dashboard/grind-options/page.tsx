'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/api';

export default function GrindOptionsPage() {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '', nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '',
    isActive: true, sortOrder: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try { setOptions(await adminFetch<any[]>('/grind-options')); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editId) {
        await adminFetch(`/admin/grind-options/${editId}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await adminFetch('/admin/grind-options', { method: 'POST', body: JSON.stringify(form) });
      }
      setEditId(null);
      setForm({ code: '', nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '', isActive: true, sortOrder: 0 });
      load();
    } catch (err: any) { alert(err.message); }
  };

  const edit = (opt: any) => {
    setEditId(opt.id);
    setForm({
      code: opt.code, nameAr: opt.nameAr, nameEn: opt.nameEn,
      descriptionAr: opt.descriptionAr || '', descriptionEn: opt.descriptionEn || '',
      isActive: opt.isActive, sortOrder: opt.sortOrder,
    });
  };

  const remove = async (id: string) => {
    if (!confirm('تأكيد الحذف؟')) return;
    await adminFetch(`/admin/grind-options/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>خيارات الطحن</h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{editId ? 'تعديل' : 'إضافة'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <input className="input" placeholder="Code" value={form.code}
            onChange={e => setForm({...form, code: e.target.value})} />
          <input className="input" placeholder="الاسم بالعربية" value={form.nameAr}
            onChange={e => setForm({...form, nameAr: e.target.value})} />
          <input className="input" placeholder="Name (English)" value={form.nameEn}
            onChange={e => setForm({...form, nameEn: e.target.value})} />
          <input className="input" placeholder="الوصف بالعربية" value={form.descriptionAr}
            onChange={e => setForm({...form, descriptionAr: e.target.value})} />
          <input className="input" placeholder="Description (English)" value={form.descriptionEn}
            onChange={e => setForm({...form, descriptionEn: e.target.value})} />
          <input className="input" type="number" placeholder="الترتيب" value={form.sortOrder}
            onChange={e => setForm({...form, sortOrder: parseInt(e.target.value) || 0})} />
        </div>
        <button onClick={save} className="btn btn-primary">{editId ? 'حفظ' : 'إضافة'}</button>
        {editId && <button onClick={() => setEditId(null)} className="btn btn-sm" style={{ marginRight: 8, background: '#eee' }}>إلغاء</button>}
      </div>

      {loading ? <div>جاري التحميل...</div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr><th>Code</th><th>العربية</th><th>English</th><th>الترتيب</th><th>الحالة</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {options.map((o: any) => (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{o.code}</td>
                  <td>{o.nameAr}</td>
                  <td>{o.nameEn}</td>
                  <td>{o.sortOrder}</td>
                  <td><span className={`badge ${o.isActive ? 'badge-success' : 'badge-muted'}`}>{o.isActive ? 'نشط' : 'مخفي'}</span></td>
                  <td>
                    <button onClick={() => edit(o)} className="btn btn-sm btn-primary">تعديل</button>
                    <button onClick={() => remove(o.id)} className="btn btn-sm btn-danger" style={{ marginRight: 8 }}>حذف</button>
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
