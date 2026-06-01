'use client';
import { useEffect, useState } from 'react';
import { adminFetch, getWebsiteBaseUrl } from '@/lib/api';

interface Section {
  title: string;
  fields: { key: string; label: string; long?: boolean }[];
}

const sections: Section[] = [
  {
    title: 'الهيرو / Hero',
    fields: [
      { key: 'about_hero_title', label: 'عنوان الهيرو' },
      { key: 'about_hero_sub', label: 'نص الهيرو' },
    ],
  },
  {
    title: 'القصة / Story',
    fields: [
      { key: 'about_story_title', label: 'عنوان القصة' },
      { key: 'about_story_p1', label: 'الفقرة الأولى', long: true },
      { key: 'about_story_p2', label: 'الفقرة الثانية', long: true },
    ],
  },
  {
    title: 'الفلسفة / Philosophy',
    fields: [
      { key: 'about_philosophy_title', label: 'عنوان الفلسفة' },
      { key: 'about_philosophy_p1', label: 'النص الأول', long: true },
      { key: 'about_philosophy_p2', label: 'النص الثاني', long: true },
    ],
  },
  {
    title: 'صانع القهوة / Maestro',
    fields: [
      { key: 'about_maestro_title', label: 'اللقب' },
      { key: 'about_maestro_p1', label: 'الوصف', long: true },
    ],
  },
  {
    title: 'التجربة / Experience',
    fields: [
      { key: 'about_experience_title', label: 'عنوان القسم' },
      { key: 'about_experience_p1', label: 'العنصر 1 (☕)' },
      { key: 'about_experience_p2', label: 'العنصر 2 (🪙)' },
      { key: 'about_experience_p3', label: 'العنصر 3 (📱)' },
      { key: 'about_experience_p4', label: 'العنصر 4 (🫘)' },
    ],
  },
  {
    title: 'دعوة لاتخاذ إجراء / CTA',
    fields: [
      { key: 'about_cta_title', label: 'العنوان' },
      { key: 'about_cta_sub', label: 'النص' },
      { key: 'about_order_now', label: 'زر \"اطلب الآن\"' },
      { key: 'about_view_products', label: 'زر \"عرض المنتجات\"' },
    ],
  },
];

const locales = ['ar', 'en'] as const;
type Locale = (typeof locales)[number];
const localeLabel: Record<Locale, string> = { ar: 'عربي', en: 'English' };

const websiteUrl = getWebsiteBaseUrl();

export default function AboutPageSettings() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setLoading(true);
    adminFetch<Record<string, string>>('/admin/settings')
      .then(data => {
        const filtered: Record<string, string> = {};
        for (const s of sections) {
          for (const f of s.fields) {
            for (const loc of locales) {
              const key = `${f.key}_${loc}`;
              if (data[key]) filtered[key] = data[key];
            }
          }
        }
        setValues(filtered);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'خطأ في التحميل'))
      .finally(() => setLoading(false));
  }, []);

  const setVal = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const allKeys: string[] = [];
    for (const s of sections) {
      for (const f of s.fields) {
        for (const loc of locales) {
          allKeys.push(`${f.key}_${loc}`);
        }
      }
    }
    try {
      for (const key of allKeys) {
        const val = values[key] ?? '';
        await adminFetch(`/admin/settings/${key}`, {
          method: 'PUT',
          body: JSON.stringify({ value: val }),
        });
      }
      showToast('تم حفظ جميع الحقول ✅');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>جاري التحميل...</div>;
  if (error && Object.keys(values).length === 0) return <div className="card" style={{ color: 'var(--br-danger)', padding: 16 }}>{error}</div>;

  return (
    <div dir="rtl">
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>صفحة من نحن</h1>
          <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>تعديل نصوص صفحة \"من نحن\" في الموقع.</p>
        </div>
        <div className="admin-actions-row">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'جاري الحفظ...' : 'حفظ الكل'}
          </button>
          <a
            href={`${websiteUrl}/ar/about`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ background: 'var(--br-espresso)', color: 'var(--br-gold-light)' }}
          >
            معاينة عربي
          </a>
          <a
            href={`${websiteUrl}/en/about`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ background: 'var(--br-espresso)', color: 'var(--br-gold-light)' }}
          >
            Preview EN
          </a>
          <button onClick={() => { setLoading(true); window.location.reload(); }} className="btn" style={{ background: 'var(--br-cream)' }}>
            إعادة تحميل من الموقع
          </button>
        </div>
      </div>

      {toast && <div className="card" style={{ color: 'var(--br-success)', marginBottom: 16, padding: 16, fontWeight: 700 }}>{toast}</div>}
      {error && <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16, padding: 16 }}>{error}</div>}

      {sections.map(section => (
        <div key={section.title} className="card" style={{ marginBottom: 20, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20, color: 'var(--br-gold)' }}>{section.title}</h2>
          <div style={{ display: 'grid', gap: 24 }}>
            {section.fields.map(field => (
              <div key={field.key}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {locales.map(loc => (
                    <div key={loc}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--br-muted)' }}>
                        {field.label} — {localeLabel[loc]}
                      </label>
                      {field.long ? (
                        <textarea
                          className="input"
                          style={{ minHeight: 90, resize: 'vertical', width: '100%' }}
                          value={values[`${field.key}_${loc}`] || ''}
                          onChange={e => setVal(`${field.key}_${loc}`, e.target.value)}
                        />
                      ) : (
                        <input
                          className="input"
                          style={{ width: '100%' }}
                          value={values[`${field.key}_${loc}`] || ''}
                          onChange={e => setVal(`${field.key}_${loc}`, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
