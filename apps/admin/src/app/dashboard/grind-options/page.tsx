'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/api';

interface GrindOption {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface GrindOptionForm {
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm: GrindOptionForm = {
  code: '',
  nameAr: '',
  nameEn: '',
  descriptionAr: '',
  descriptionEn: '',
  isActive: true,
  sortOrder: 0,
};

export default function GrindOptionsPage() {
  const [options, setOptions] = useState<GrindOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<GrindOptionForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [error, setError] = useState<string | null>(null);

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return options.filter(option => {
      const matchesSearch = !term
        || option.code.toLowerCase().includes(term)
        || option.nameAr.toLowerCase().includes(term)
        || option.nameEn.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && option.isActive)
        || (statusFilter === 'hidden' && !option.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [options, search, statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOptions(await adminFetch<GrindOption[]>('/admin/grind-options'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل خيارات الطحن');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
    setError(null);
  };

  const save = async () => {
    setError(null);
    if (!form.code.trim() || !form.nameAr.trim() || !form.nameEn.trim()) {
      setError('أدخل الكود والاسمين العربي والإنكليزي');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        descriptionAr: form.descriptionAr.trim() || undefined,
        descriptionEn: form.descriptionEn.trim() || undefined,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      };
      if (editId) {
        await adminFetch(`/admin/grind-options/${editId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await adminFetch('/admin/grind-options', { method: 'POST', body: JSON.stringify(payload) });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ خيار الطحن');
    } finally {
      setSaving(false);
    }
  };

  const edit = (option: GrindOption) => {
    setEditId(option.id);
    setForm({
      code: option.code,
      nameAr: option.nameAr,
      nameEn: option.nameEn,
      descriptionAr: option.descriptionAr || '',
      descriptionEn: option.descriptionEn || '',
      isActive: option.isActive,
      sortOrder: option.sortOrder,
    });
    setError(null);
  };

  const toggleActive = async (option: GrindOption) => {
    try {
      await adminFetch(`/admin/grind-options/${option.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !option.isActive }),
      });
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'تعذر تحديث خيار الطحن');
    }
  };

  const remove = async (option: GrindOption) => {
    if (!window.confirm(`تعطيل خيار الطحن "${option.nameAr}"؟`)) {
      return;
    }
    try {
      await adminFetch(`/admin/grind-options/${option.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'تعذر تعطيل خيار الطحن');
    }
  };

  return (
    <div dir="rtl">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>خيارات الطحن</h1>
        <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>طرق طحن البن المطحون التي تظهر داخل منتجات البن فقط.</p>
      </div>

      {error && <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{editId ? 'تعديل خيار طحن' : 'إضافة خيار طحن'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
          <input className="input" placeholder="Code مثل V60" value={form.code} onChange={event => setForm({ ...form, code: event.target.value })} />
          <input className="input" placeholder="الاسم بالعربية" value={form.nameAr} onChange={event => setForm({ ...form, nameAr: event.target.value })} />
          <input className="input" placeholder="Name in English" value={form.nameEn} onChange={event => setForm({ ...form, nameEn: event.target.value })} />
          <input className="input" type="number" placeholder="الترتيب" value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: Number(event.target.value) || 0 })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
          <input className="input" placeholder="الوصف بالعربية" value={form.descriptionAr} onChange={event => setForm({ ...form, descriptionAr: event.target.value })} />
          <input className="input" placeholder="Description in English" value={form.descriptionEn} onChange={event => setForm({ ...form, descriptionEn: event.target.value })} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
          <input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} />
          نشط
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? 'جاري الحفظ...' : editId ? 'حفظ' : 'إضافة'}</button>
          {editId && <button onClick={resetForm} className="btn" style={{ background: 'var(--br-cream)' }}>إلغاء</button>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 180px', gap: 12 }}>
          <input className="input" placeholder="بحث بالكود أو الاسم" value={search} onChange={event => setSearch(event.target.value)} />
          <select className="input" value={statusFilter} onChange={event => setStatusFilter(event.target.value as 'all' | 'active' | 'hidden')}>
            <option value="all">كل الحالات</option>
            <option value="active">نشط فقط</option>
            <option value="hidden">مخفي فقط</option>
          </select>
        </div>
      </div>

      {loading && <div style={{ padding: 40 }}>جاري تحميل خيارات الطحن...</div>}

      {!loading && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>العربية</th>
                <th>English</th>
                <th>الترتيب</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredOptions.map(option => (
                <tr key={option.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{option.code}</td>
                  <td style={{ fontWeight: 700 }}>{option.nameAr}</td>
                  <td>{option.nameEn}</td>
                  <td>{option.sortOrder}</td>
                  <td><span className={`badge ${option.isActive ? 'badge-success' : 'badge-muted'}`}>{option.isActive ? 'نشط' : 'مخفي'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => edit(option)} className="btn btn-sm btn-primary">تعديل</button>
                      <button onClick={() => toggleActive(option)} className="btn btn-sm" style={{ background: 'var(--br-cream)' }}>
                        {option.isActive ? 'إخفاء' : 'إظهار'}
                      </button>
                      <button onClick={() => remove(option)} className="btn btn-sm btn-danger">تعطيل</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOptions.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--br-muted)', padding: 32 }}>لا توجد خيارات طحن ضمن الفلاتر الحالية</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
