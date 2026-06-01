'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/api';

interface Currency {
  code: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  symbol: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm = { code: '', name: '', nameAr: '', nameEn: '', symbol: '', isDefault: false, isActive: true, sortOrder: 0 };

export default function CurrenciesPage() {
  const [items, setItems] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editCode, setEditCode] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await adminFetch<Currency[]>('/admin/currencies'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل العملات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(c => !term || c.code.toLowerCase().includes(term) || c.name.toLowerCase().includes(term));
  }, [items, search]);

  const resetForm = () => { setEditCode(null); setForm(emptyForm); setError(null); };

  const save = async () => {
    setError(null);
    if (!form.code.trim() || !form.symbol.trim()) {
      setError('رمز العملة والعلامة مطلوبان');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, code: form.code.toUpperCase().trim() };
      if (editCode) {
        const { code, ...rest } = payload;
        await adminFetch(`/admin/currencies/${editCode}`, { method: 'PATCH', body: JSON.stringify(rest) });
      } else {
        await adminFetch('/admin/currencies', { method: 'POST', body: JSON.stringify(payload) });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ العملة');
    } finally {
      setSaving(false);
    }
  };

  const edit = (currency: Currency) => {
    setEditCode(currency.code);
    setForm({ ...currency, nameAr: currency.nameAr || '', nameEn: currency.nameEn || '' });
    setError(null);
  };

  const toggleActive = async (currency: Currency) => {
    try {
      await adminFetch(`/admin/currencies/${currency.code}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currency.isActive }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث الحالة');
    }
  };

  const setDefault = async (currency: Currency) => {
    try {
      await adminFetch(`/admin/currencies/${currency.code}`, {
        method: 'PATCH',
        body: JSON.stringify({ isDefault: true }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تعيين العملة الافتراضية');
    }
  };

  const remove = async (currency: Currency) => {
    if (!window.confirm(`حذف العملة ${currency.code}؟ لا يمكن حذف العملة الافتراضية.`)) return;
    try {
      await adminFetch(`/admin/currencies/${currency.code}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حذف العملة');
    }
  };

  return (
    <div dir="rtl">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>العملات</h1>
        <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>إدارة العملات المستخدمة في النظام. العملة الافتراضية مطلوبة لكل منتج.</p>
      </div>

      {error && <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16, padding: 16 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{editCode ? 'تعديل عملة' : 'إضافة عملة'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <input className="input" placeholder="الرمز (مثل SYP)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} disabled={!!editCode} style={{ textTransform: 'uppercase' }} />
          <input className="input" placeholder="الاسم (مثل Syrian Pound)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="الاسم عربي" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} />
          <input className="input" placeholder="الاسم إنجليزي" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} />
          <input className="input" placeholder="العلامة (مثل ل.س)" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} />
          <input className="input" type="number" placeholder="الترتيب" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
            نشط
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} />
            افتراضي
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? 'جاري الحفظ...' : editCode ? 'حفظ' : 'إضافة'}</button>
          {editCode && <button onClick={resetForm} className="btn" style={{ background: 'var(--br-cream)' }}>إلغاء</button>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <input className="input" placeholder="بحث برمز أو اسم العملة" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading && <div style={{ padding: 40 }}>جاري التحميل...</div>}

      {!loading && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>الرمز</th>
                <th>الاسم</th>
                <th>العلامة</th>
                <th>افتراضي</th>
                <th>الحالة</th>
                <th>الترتيب</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(currency => (
                <tr key={currency.code}>
                  <td style={{ fontWeight: 700 }}>{currency.code}</td>
                  <td>{currency.nameAr || currency.name}</td>
                  <td>{currency.symbol}</td>
                  <td>{currency.isDefault ? <span className="badge badge-success">نعم</span> : '-'}</td>
                  <td><span className={`badge ${currency.isActive ? 'badge-success' : 'badge-muted'}`}>{currency.isActive ? 'نشط' : 'مخفي'}</span></td>
                  <td>{currency.sortOrder}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => edit(currency)} className="btn btn-sm btn-primary">تعديل</button>
                      <button onClick={() => toggleActive(currency)} className="btn btn-sm" style={{ background: 'var(--br-cream)' }}>{currency.isActive ? 'تعطيل' : 'تفعيل'}</button>
                      {!currency.isDefault && <button onClick={() => setDefault(currency)} className="btn btn-sm" style={{ background: 'var(--br-gold)', color: '#000' }}>تعيين كافتراضي</button>}
                      {!currency.isDefault && <button onClick={() => remove(currency)} className="btn btn-sm btn-danger">حذف</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--br-muted)' }}>لا توجد عملات</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
