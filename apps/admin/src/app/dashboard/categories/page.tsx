'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/api';

interface CategoryTranslation {
  locale: 'ar' | 'en';
  name: string;
  description?: string | null;
}

interface Category {
  id: string;
  slug: string;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  translations: CategoryTranslation[];
  _count?: { products: number };
}

interface CategoryForm {
  slug: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  translations: CategoryTranslation[];
}

const emptyForm: CategoryForm = {
  slug: '',
  imageUrl: '',
  isActive: true,
  sortOrder: 0,
  translations: [
    { locale: 'ar', name: '', description: '' },
    { locale: 'en', name: '', description: '' },
  ],
};

function localizedName(category: Category) {
  return category.translations.find(translation => translation.locale === 'ar')?.name
    || category.translations.find(translation => translation.locale === 'en')?.name
    || category.slug;
}

function normalizeTranslations(category?: Category): CategoryTranslation[] {
  return emptyForm.translations.map(defaultTranslation => {
    const existing = category?.translations.find(translation => translation.locale === defaultTranslation.locale);
    return {
      locale: defaultTranslation.locale,
      name: existing?.name || '',
      description: existing?.description || '',
    };
  });
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories.filter(category => {
      const matchesSearch = !term
        || category.slug.toLowerCase().includes(term)
        || category.translations.some(translation => translation.name.toLowerCase().includes(term));
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && category.isActive)
        || (statusFilter === 'hidden' && !category.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await adminFetch<Category[]>('/admin/categories'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل التصنيفات');
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

  const updateTranslation = (index: number, patch: Partial<CategoryTranslation>) => {
    const translations = [...form.translations];
    translations[index] = { ...translations[index], ...patch };
    setForm({ ...form, translations });
  };

  const save = async () => {
    setError(null);
    const translations = form.translations
      .map(translation => ({
        ...translation,
        name: translation.name.trim(),
        description: translation.description?.trim() || undefined,
      }))
      .filter(translation => translation.name.length > 0);

    if (!form.slug.trim()) {
      setError('أدخل slug للتصنيف');
      return;
    }
    if (!translations.some(translation => translation.locale === 'ar')) {
      setError('أدخل اسم التصنيف بالعربية');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        slug: form.slug.trim(),
        imageUrl: form.imageUrl.trim() || undefined,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
        translations,
      };
      if (editId) {
        await adminFetch(`/admin/categories/${editId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await adminFetch('/admin/categories', { method: 'POST', body: JSON.stringify(payload) });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ التصنيف');
    } finally {
      setSaving(false);
    }
  };

  const edit = (category: Category) => {
    setEditId(category.id);
    setForm({
      slug: category.slug,
      imageUrl: category.imageUrl || '',
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      translations: normalizeTranslations(category),
    });
    setError(null);
  };

  const toggleActive = async (category: Category) => {
    try {
      await adminFetch(`/admin/categories/${category.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'تعذر تحديث حالة التصنيف');
    }
  };

  const remove = async (category: Category) => {
    if (!window.confirm(`تأكيد حذف التصنيف "${localizedName(category)}"؟`)) {
      return;
    }
    try {
      await adminFetch(`/admin/categories/${category.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'تعذر حذف التصنيف');
    }
  };

  return (
    <div dir="rtl">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>التصنيفات</h1>
        <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>تنظيم كتالوج Banco Ricco حسب أقسام واضحة للعميل والمايسترو.</p>
      </div>

      {error && <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{editId ? 'تعديل تصنيف' : 'إضافة تصنيف'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
          <input className="input" placeholder="Slug" value={form.slug} onChange={event => setForm({ ...form, slug: event.target.value })} />
          <input className="input" placeholder="رابط الصورة" value={form.imageUrl} onChange={event => setForm({ ...form, imageUrl: event.target.value })} />
          <input className="input" type="number" placeholder="الترتيب" value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: Number(event.target.value) || 0 })} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
            <input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} />
            نشط
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
          {form.translations.map((translation, index) => (
            <div key={translation.locale} style={{ background: 'var(--br-cream)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--br-gold)' }}>
                {translation.locale === 'ar' ? 'العربية' : 'English'}
              </div>
              <input
                className="input"
                placeholder={translation.locale === 'ar' ? 'الاسم' : 'Name'}
                value={translation.name}
                onChange={event => updateTranslation(index, { name: event.target.value })}
                style={{ marginBottom: 8 }}
              />
              <input
                className="input"
                placeholder={translation.locale === 'ar' ? 'الوصف' : 'Description'}
                value={translation.description || ''}
                onChange={event => updateTranslation(index, { description: event.target.value })}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? 'جاري الحفظ...' : editId ? 'حفظ' : 'إضافة'}</button>
          {editId && <button onClick={resetForm} className="btn" style={{ background: 'var(--br-cream)' }}>إلغاء</button>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 180px', gap: 12 }}>
          <input className="input" placeholder="بحث بالاسم أو slug" value={search} onChange={event => setSearch(event.target.value)} />
          <select className="input" value={statusFilter} onChange={event => setStatusFilter(event.target.value as 'all' | 'active' | 'hidden')}>
            <option value="all">كل الحالات</option>
            <option value="active">نشط فقط</option>
            <option value="hidden">مخفي فقط</option>
          </select>
        </div>
      </div>

      {loading && <div style={{ padding: 40 }}>جاري تحميل التصنيفات...</div>}

      {!loading && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Slug</th>
                <th>العربية</th>
                <th>English</th>
                <th>المنتجات</th>
                <th>الترتيب</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map(category => (
                <tr key={category.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{category.slug}</td>
                  <td style={{ fontWeight: 700 }}>{category.translations.find(translation => translation.locale === 'ar')?.name || '-'}</td>
                  <td>{category.translations.find(translation => translation.locale === 'en')?.name || '-'}</td>
                  <td>{category._count?.products ?? 0}</td>
                  <td>{category.sortOrder}</td>
                  <td><span className={`badge ${category.isActive ? 'badge-success' : 'badge-muted'}`}>{category.isActive ? 'نشط' : 'مخفي'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => edit(category)} className="btn btn-sm btn-primary">تعديل</button>
                      <button onClick={() => toggleActive(category)} className="btn btn-sm" style={{ background: 'var(--br-cream)' }}>
                        {category.isActive ? 'إخفاء' : 'إظهار'}
                      </button>
                      <button onClick={() => remove(category)} className="btn btn-sm btn-danger">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--br-muted)', padding: 32 }}>لا توجد تصنيفات ضمن الفلاتر الحالية</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
