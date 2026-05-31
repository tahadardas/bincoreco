'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/api';

interface BannerTranslation {
  locale: 'ar' | 'en';
  title?: string | null;
  subtitle?: string | null;
}

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  translations: BannerTranslation[];
}

interface BannerForm {
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  isActive: boolean;
  titleAr: string;
  subtitleAr: string;
  titleEn: string;
  subtitleEn: string;
}

const emptyForm: BannerForm = {
  imageUrl: '',
  linkUrl: '',
  sortOrder: 0,
  isActive: true,
  titleAr: '',
  subtitleAr: '',
  titleEn: '',
  subtitleEn: '',
};

function translation(banner: Banner, locale: 'ar' | 'en') {
  return banner.translations.find(item => item.locale === locale);
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [error, setError] = useState<string | null>(null);

  const filteredBanners = useMemo(() => {
    const term = search.trim().toLowerCase();
    return banners.filter(banner => {
      const matchesSearch = !term
        || banner.imageUrl.toLowerCase().includes(term)
        || banner.translations.some(item => `${item.title || ''} ${item.subtitle || ''}`.toLowerCase().includes(term));
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && banner.isActive)
        || (statusFilter === 'hidden' && !banner.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [banners, search, statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBanners(await adminFetch<Banner[]>('/admin/banners'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل البنرات');
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
    if (!form.imageUrl.trim()) {
      setError('أدخل رابط صورة البنر');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        imageUrl: form.imageUrl.trim(),
        linkUrl: form.linkUrl.trim() || undefined,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        translations: [
          { locale: 'ar', title: form.titleAr.trim() || undefined, subtitle: form.subtitleAr.trim() || undefined },
          { locale: 'en', title: form.titleEn.trim() || undefined, subtitle: form.subtitleEn.trim() || undefined },
        ],
      };
      if (editId) {
        await adminFetch(`/admin/banners/${editId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await adminFetch('/admin/banners', { method: 'POST', body: JSON.stringify(payload) });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ البنر');
    } finally {
      setSaving(false);
    }
  };

  const edit = (banner: Banner) => {
    const ar = translation(banner, 'ar');
    const en = translation(banner, 'en');
    setEditId(banner.id);
    setForm({
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      titleAr: ar?.title || '',
      subtitleAr: ar?.subtitle || '',
      titleEn: en?.title || '',
      subtitleEn: en?.subtitle || '',
    });
    setError(null);
  };

  const toggleActive = async (banner: Banner) => {
    try {
      await adminFetch(`/admin/banners/${banner.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'تعذر تحديث حالة البنر');
    }
  };

  const remove = async (banner: Banner) => {
    const title = translation(banner, 'ar')?.title || banner.imageUrl;
    if (!window.confirm(`تأكيد حذف البنر "${title}"؟`)) {
      return;
    }
    try {
      await adminFetch(`/admin/banners/${banner.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'تعذر حذف البنر');
    }
  };

  return (
    <div dir="rtl">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>البنرات</h1>
        <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>محتوى الواجهة الرئيسية والعروض البصرية المؤقتة.</p>
      </div>

      {error && <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{editId ? 'تعديل بنر' : 'إضافة بنر'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(200px, 1fr) 140px 120px', gap: 12, marginBottom: 16 }}>
          <input className="input" placeholder="Image URL" value={form.imageUrl} onChange={event => setForm({ ...form, imageUrl: event.target.value })} />
          <input className="input" placeholder="Link URL" value={form.linkUrl} onChange={event => setForm({ ...form, linkUrl: event.target.value })} />
          <input className="input" type="number" placeholder="الترتيب" value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: Number(event.target.value) || 0 })} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
            <input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} />
            نشط
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div style={{ background: 'var(--br-cream)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--br-gold)' }}>العربية</div>
            <input className="input" placeholder="العنوان" value={form.titleAr} onChange={event => setForm({ ...form, titleAr: event.target.value })} style={{ marginBottom: 8 }} />
            <input className="input" placeholder="النص الفرعي" value={form.subtitleAr} onChange={event => setForm({ ...form, subtitleAr: event.target.value })} />
          </div>
          <div style={{ background: 'var(--br-cream)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--br-gold)' }}>English</div>
            <input className="input" placeholder="Title" value={form.titleEn} onChange={event => setForm({ ...form, titleEn: event.target.value })} style={{ marginBottom: 8 }} />
            <input className="input" placeholder="Subtitle" value={form.subtitleEn} onChange={event => setForm({ ...form, subtitleEn: event.target.value })} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? 'جاري الحفظ...' : editId ? 'حفظ' : 'إضافة'}</button>
          {editId && <button onClick={resetForm} className="btn" style={{ background: 'var(--br-cream)' }}>إلغاء</button>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 180px', gap: 12 }}>
          <input className="input" placeholder="بحث بالعنوان أو رابط الصورة" value={search} onChange={event => setSearch(event.target.value)} />
          <select className="input" value={statusFilter} onChange={event => setStatusFilter(event.target.value as 'all' | 'active' | 'hidden')}>
            <option value="all">كل الحالات</option>
            <option value="active">نشط فقط</option>
            <option value="hidden">مخفي فقط</option>
          </select>
        </div>
      </div>

      {loading && <div style={{ padding: 40 }}>جاري تحميل البنرات...</div>}

      {!loading && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>الصورة</th>
                <th>العنوان العربي</th>
                <th>Title EN</th>
                <th>الرابط</th>
                <th>الترتيب</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanners.map(banner => {
                const ar = translation(banner, 'ar');
                const en = translation(banner, 'en');
                return (
                  <tr key={banner.id}>
                    <td>
                      <img src={banner.imageUrl} alt={ar?.title || en?.title || 'Banner'} style={{ width: 96, height: 48, objectFit: 'cover', borderRadius: 6, background: 'var(--br-cream)' }} />
                    </td>
                    <td style={{ fontWeight: 700 }}>{ar?.title || '-'}</td>
                    <td>{en?.title || '-'}</td>
                    <td style={{ fontSize: 12, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{banner.linkUrl || '-'}</td>
                    <td>{banner.sortOrder}</td>
                    <td><span className={`badge ${banner.isActive ? 'badge-success' : 'badge-muted'}`}>{banner.isActive ? 'نشط' : 'مخفي'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => edit(banner)} className="btn btn-sm btn-primary">تعديل</button>
                        <button onClick={() => toggleActive(banner)} className="btn btn-sm" style={{ background: 'var(--br-cream)' }}>
                          {banner.isActive ? 'إخفاء' : 'إظهار'}
                        </button>
                        <button onClick={() => remove(banner)} className="btn btn-sm btn-danger">حذف</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBanners.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--br-muted)', padding: 32 }}>لا توجد بنرات ضمن الفلاتر الحالية</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
