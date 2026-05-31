'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/media';
import MediaUpload from '@/components/media-upload';

interface BannerTranslation {
  locale: 'ar' | 'en';
  title?: string | null;
  subtitle?: string | null;
}

interface Banner {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  linkUrl?: string | null;
  ctaTextAr?: string | null;
  ctaTextEn?: string | null;
  ctaUrl?: string | null;
  animationType?: string;
  displayMode?: string;
  overlayOpacity?: number;
  textPosition?: string;
  textColor?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  sortOrder: number;
  isActive: boolean;
  translations: BannerTranslation[];
}

interface BannerForm {
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  ctaTextAr: string;
  ctaTextEn: string;
  ctaUrl: string;
  animationType: string;
  displayMode: string;
  overlayOpacity: number;
  textPosition: string;
  textColor: string;
  startsAt: string;
  endsAt: string;
  sortOrder: number;
  isActive: boolean;
  titleAr: string;
  subtitleAr: string;
  titleEn: string;
  subtitleEn: string;
}

const emptyForm: BannerForm = {
  imageUrl: '',
  mobileImageUrl: '',
  linkUrl: '',
  ctaTextAr: '',
  ctaTextEn: '',
  ctaUrl: '',
  animationType: 'fade',
  displayMode: 'fullWidthHero',
  overlayOpacity: 0.35,
  textPosition: 'center',
  textColor: 'light',
  startsAt: '',
  endsAt: '',
  sortOrder: 0,
  isActive: true,
  titleAr: '',
  subtitleAr: '',
  titleEn: '',
  subtitleEn: '',
};

const animationTypeOptions = [
  { value: 'fade', label: 'Fade' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideDown', label: 'Slide Down' },
  { value: 'zoomIn', label: 'Zoom In' },
  { value: 'parallax', label: 'Parallax' },
  { value: 'none', label: 'None' },
];

const displayModeOptions = [
  { value: 'fullWidthHero', label: 'Full Width Hero' },
  { value: 'contained', label: 'Contained' },
  { value: 'card', label: 'Card' },
  { value: 'splitImageText', label: 'Split Image/Text' },
  { value: 'backgroundWithOverlay', label: 'Background with Overlay' },
];

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
  const [toast, setToast] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
    setError(null);
    setShowPreview(false);
  };

  const save = async () => {
    setError(null);
    if (!form.imageUrl.trim()) {
      setError('ارفع صورة البنر أولاً');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        imageUrl: form.imageUrl.trim(),
        mobileImageUrl: form.mobileImageUrl.trim() || undefined,
        linkUrl: form.linkUrl.trim() || undefined,
        ctaTextAr: form.ctaTextAr.trim() || undefined,
        ctaTextEn: form.ctaTextEn.trim() || undefined,
        ctaUrl: form.ctaUrl.trim() || undefined,
        animationType: form.animationType || 'fade',
        displayMode: form.displayMode || 'fullWidthHero',
        overlayOpacity: form.overlayOpacity,
        textPosition: form.textPosition || 'center',
        textColor: form.textColor || 'light',
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
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
      mobileImageUrl: banner.mobileImageUrl || '',
      linkUrl: banner.linkUrl || '',
      ctaTextAr: banner.ctaTextAr || '',
      ctaTextEn: banner.ctaTextEn || '',
      ctaUrl: banner.ctaUrl || '',
      animationType: banner.animationType || 'fade',
      displayMode: banner.displayMode || 'fullWidthHero',
      overlayOpacity: banner.overlayOpacity ?? 0.35,
      textPosition: banner.textPosition || 'center',
      textColor: banner.textColor || 'light',
      startsAt: banner.startsAt ? banner.startsAt.slice(0, 16) : '',
      endsAt: banner.endsAt ? banner.endsAt.slice(0, 16) : '',
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      titleAr: ar?.title || '',
      subtitleAr: ar?.subtitle || '',
      titleEn: en?.title || '',
      subtitleEn: en?.subtitle || '',
    });
    setError(null);
    setShowPreview(true);
  };

  const toggleActive = async (banner: Banner) => {
    try {
      await adminFetch(`/admin/banners/${banner.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث حالة البنر');
    }
  };

  const remove = async (banner: Banner) => {
    const title = translation(banner, 'ar')?.title || banner.imageUrl;
    setToast(title);
    setTimeout(() => setToast(null), 200);
    if (!window.confirm(`تأكيد حذف البنر "${title}"؟`)) return;
    try {
      await adminFetch(`/admin/banners/${banner.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حذف البنر');
    }
  };

  const previewTitle = form.titleAr || form.titleEn;
  const previewImg = resolveMediaUrl(form.imageUrl);
  const previewMobileImg = resolveMediaUrl(form.mobileImageUrl || form.imageUrl);

  return (
    <div dir="rtl">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>البنرات</h1>
        <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>محتوى الواجهة الرئيسية والعروض البصرية المؤقتة.</p>
      </div>

      {error && <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16, padding: 16 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{editId ? 'تعديل بنر' : 'إضافة بنر'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>صورة سطح المكتب (يفضل 1920×720)</div>
            <MediaUpload folder="banners" onUploaded={url => setForm(prev => ({ ...prev, imageUrl: url }))} label={form.imageUrl ? 'تغيير الصورة' : 'تحميل صورة'} />
            {form.imageUrl && (
              <div style={{ marginTop: 8 }}>
                <img src={previewImg || ''} alt="preview" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 6 }} />
              </div>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>صورة الجوال</div>
            <MediaUpload folder="banners" onUploaded={url => setForm(prev => ({ ...prev, mobileImageUrl: url }))} label={form.mobileImageUrl ? 'تغيير الصورة' : 'تحميل صورة'} />
            {form.mobileImageUrl && (
              <div style={{ marginTop: 8 }}>
                <img src={previewMobileImg || ''} alt="mobile preview" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 6 }} />
              </div>
            )}
            <div style={{ marginTop: 4 }}>
              <input className="input" placeholder="رابط صورة الجوال (خيار متقدم)" value={form.mobileImageUrl} onChange={event => setForm({ ...form, mobileImageUrl: event.target.value })} style={{ fontSize: 12, padding: '6px 10px' }} />
            </div>
          </div>
          <input className="input" placeholder="رابط البنر" value={form.linkUrl} onChange={event => setForm({ ...form, linkUrl: event.target.value })} />
          <input className="input" placeholder="نص CTA (عربي)" value={form.ctaTextAr} onChange={event => setForm({ ...form, ctaTextAr: event.target.value })} />
          <input className="input" placeholder="CTA text (EN)" value={form.ctaTextEn} onChange={event => setForm({ ...form, ctaTextEn: event.target.value })} />
          <input className="input" placeholder="رابط CTA" value={form.ctaUrl} onChange={event => setForm({ ...form, ctaUrl: event.target.value })} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>نوع الحركة</div>
            <select className="input" value={form.animationType} onChange={event => setForm({ ...form, animationType: event.target.value })}>
              {animationTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>نمط العرض</div>
            <select className="input" value={form.displayMode} onChange={event => setForm({ ...form, displayMode: event.target.value })}>
              {displayModeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>عتامة التغطية</div>
            <input className="input" type="number" step="0.05" min="0" max="1" placeholder="0.35" value={form.overlayOpacity} onChange={event => setForm({ ...form, overlayOpacity: Number(event.target.value) || 0.35 })} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>موضع النص</div>
            <select className="input" value={form.textPosition} onChange={event => setForm({ ...form, textPosition: event.target.value })}>
              <option value="center">وسط</option>
              <option value="left">يسار</option>
              <option value="right">يمين</option>
              <option value="bottom">أسفل</option>
            </select>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>لون النص</div>
            <select className="input" value={form.textColor} onChange={event => setForm({ ...form, textColor: event.target.value })}>
              <option value="light">فاتح</option>
              <option value="dark">داكن</option>
            </select>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>الترتيب</div>
            <input className="input" type="number" placeholder="0" value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: Number(event.target.value) || 0 })} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>يبدأ من</div>
            <input className="input" type="datetime-local" value={form.startsAt} onChange={event => setForm({ ...form, startsAt: event.target.value })} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>ينتهي في</div>
            <input className="input" type="datetime-local" value={form.endsAt} onChange={event => setForm({ ...form, endsAt: event.target.value })} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14, padding: '11px 0' }}>
              <input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} />
              نشط
            </label>
          </div>
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

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? 'جاري الحفظ...' : editId ? 'حفظ' : 'إضافة'}</button>
          {editId && <button onClick={resetForm} className="btn" style={{ background: 'var(--br-cream)' }}>إلغاء</button>}
          {(form.imageUrl || previewTitle) && (
            <button onClick={() => setShowPreview(!showPreview)} className="btn" style={{ background: 'var(--br-espresso)', color: 'var(--br-gold-light)' }}>
              {showPreview ? 'إخفاء المعاينة' : 'معاينة البنر'}
            </button>
          )}
        </div>

        {showPreview && (form.imageUrl || previewTitle) && (
          <div style={{ marginTop: 20, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--br-line)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, padding: '8px 14px', background: 'var(--br-cream)', borderBottom: '1px solid var(--br-line)' }}>
              معاينة البنر
            </div>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 320,
                background: form.imageUrl ? `url(${previewImg}) center/cover no-repeat` : 'var(--br-espresso)',
                display: 'flex',
                alignItems: form.textPosition === 'bottom' ? 'flex-end' : form.textPosition === 'center' ? 'center' : form.textPosition === 'left' ? 'flex-start' : 'flex-start',
                justifyContent: 'center',
              }}
            >
              {form.imageUrl && (
                <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${form.overlayOpacity || 0.35})`, zIndex: 1 }} />
              )}
              <div style={{
                position: 'relative', zIndex: 2, padding: 32, textAlign: 'center',
                color: form.textColor === 'dark' ? '#000' : '#fff',
                direction: 'rtl',
              }}>
                {previewTitle && (
                  <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, textShadow: form.textColor === 'dark' ? 'none' : '0 2px 10px rgba(0,0,0,0.3)', color: form.textColor === 'dark' ? '#000' : 'var(--br-gold-light)' }}>
                    {previewTitle}
                  </h2>
                )}
                {form.subtitleAr && (
                  <p style={{ fontSize: 15, opacity: 0.85, maxWidth: 500, margin: '0 auto' }}>
                    {form.subtitleAr}
                  </p>
                )}
                {(form.ctaTextAr || form.ctaTextEn) && (
                  <div style={{ marginTop: 16 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '10px 24px',
                      borderRadius: 999,
                      background: 'var(--br-gold)',
                      color: '#000',
                      fontWeight: 700,
                      fontSize: 14,
                    }}>
                      {form.ctaTextAr || form.ctaTextEn}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '8px 14px', display: 'flex', gap: 12, fontSize: 12, color: 'var(--br-muted)', borderTop: '1px solid var(--br-line)' }}>
              <span>الحركة: {form.animationType}</span>
              <span>العتامة: {form.overlayOpacity}</span>
              <span>موضع النص: {form.textPosition}</span>
              <span>لون النص: {form.textColor}</span>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
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
                      <img src={resolveMediaUrl(banner.imageUrl) || ''} alt={ar?.title || en?.title || 'Banner'} style={{ width: 96, height: 48, objectFit: 'cover', borderRadius: 6, background: 'var(--br-cream)' }} />
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
