'use client';
import { useEffect, useState } from 'react';
import { adminFetch, adminUpload } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/media';

interface BrandSettings {
  brand_logo_main?: string;
  brand_logo_dark?: string;
  brand_logo_light?: string;
  brand_mark?: string;
  brand_favicon?: string;
  brand_fallback_image?: string;
  brand_pattern?: string;
  brand_footer_logo?: string;
}

const fields = [
  { key: 'brand_logo_main', label: 'الشعار الرئيسي', desc: 'يظهر في الهيدر والعلامة التجارية' },
  { key: 'brand_logo_dark', label: 'الشعار الداكن', desc: 'للاستخدام على الخلفيات الفاتحة' },
  { key: 'brand_logo_light', label: 'الشعار الفاتح', desc: 'للاستخدام على الخلفيات الداكنة' },
  { key: 'brand_mark', label: 'العلامة المختصرة (BR Mark)', desc: 'رمز Banco Ricco المختصر' },
  { key: 'brand_favicon', label: 'أيقونة المتصفح (Favicon)', desc: 'ظهور في تبويب المتصفح' },
  { key: 'brand_fallback_image', label: 'صورة احتياطية', desc: 'تظهر عند عدم وجود صورة للمنتج' },
  { key: 'brand_pattern', label: 'النقش المزخرف (Pattern)', desc: 'خلفية عربية مزخرفة' },
  { key: 'brand_footer_logo', label: 'شعار الفوتر', desc: 'يظهر في تذييل الموقع' },
];

const previewKeys = ['brand_mark', 'brand_pattern', 'brand_favicon', 'brand_footer_logo', 'brand_fallback_image'] as const;

const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3000` : 'http://localhost:3000');

export default function BrandSettingsPage() {
  const [settings, setSettings] = useState<BrandSettings>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, string | null> | null>(null);
  const [testing, setTesting] = useState(false);

  const load = () => {
    adminFetch<BrandSettings>('/admin/settings')
      .then(data => {
        const merged: BrandSettings = {};
        for (const field of fields) {
          merged[field.key as keyof BrandSettings] = (data as any)[field.key] || '';
        }
        setSettings(merged);
      })
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (key: string, file: File) => {
    setUploading(key);
    setError(null);
    try {
      const result = await adminUpload(file, 'brand');
      setSettings(prev => ({ ...prev, [key]: result.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل رفع الملف');
    } finally {
      setUploading(null);
    }
  };

  const saveAll = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await adminFetch(`/admin/settings/${key}`, {
          method: 'PUT',
          body: JSON.stringify({ value: value || '' }),
        });
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: '' }));
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${apiUrl}/settings/public-brand`);
      const json = await res.json();
      if (json.success) {
        setTestResult(json.data);
      } else {
        setError('فشل اختبار الربط: الاستجابة لا تحتوي على success');
      }
    } catch (err) {
      setError(err instanceof Error ? `فشل الاتصال بالـ API: ${err.message}` : 'فشل اختبار الربط');
    } finally {
      setTesting(false);
    }
  };

  const getPreviewUrl = (key: string): string | null => {
    const val = settings[key as keyof BrandSettings];
    return val ? resolveMediaUrl(val) : null;
  };

  return (
    <div dir="rtl">
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>العلامة التجارية</h1>
          <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>شعارات العلامة التجارية لـ Banco Ricco.</p>
        </div>
      </div>

      {error && <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16, padding: 16 }}>{error}</div>}
      {success && (
        <div className="card" style={{ color: 'var(--br-success)', marginBottom: 16, padding: 16 }}>
          تم حفظ الإعدادات بنجاح ✓
          <div style={{ fontSize: 13, marginTop: 6, color: 'var(--br-muted)' }}>
            قد تحتاج تحديث صفحة الموقع لرؤية التغييرات. استخدم زر "اختبار الربط" للتحقق من وصول القيم.
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          {fields.map(field => {
            const value = settings[field.key as keyof BrandSettings];
            const resolvedUrl = value ? resolveMediaUrl(value) : null;
            return (
              <div key={field.key} className="admin-setting-row">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{field.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--br-muted)' }}>{field.desc}</div>
                </div>
                <div>
                  {value ? (
                    <div className="admin-actions-row">
                      <img src={resolvedUrl || ''} alt={field.label} className="admin-preview-thumb" />
                      <button className="btn btn-sm" style={{ background: '#fee', fontSize: 12 }} onClick={() => handleRemove(field.key)}>
                        إزالة
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--br-muted)', fontSize: 13, fontStyle: 'italic' }}>
                      (افتراضي)
                    </div>
                  )}
                </div>
                <div>
                  <label className="btn btn-primary btn-sm" style={{ cursor: uploading === field.key ? 'wait' : 'pointer', fontSize: 12, width: '100%', textAlign: 'center' }}>
                    {uploading === field.key ? '...جاري' : 'رفع'}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: 'none' }} disabled={uploading !== null} onChange={async e => { const f = e.target.files?.[0]; if (f) await handleUpload(field.key, f); e.target.value = ''; }} />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="admin-actions-row" style={{ marginTop: 20 }}>
          <button onClick={saveAll} disabled={saving} className="btn btn-primary">
            {saving ? 'جاري الحفظ...' : 'حفظ الكل'}
          </button>
          <button onClick={load} className="btn" style={{ background: 'var(--br-cream)' }}>
            إعادة تحميل الإعدادات
          </button>
          <button onClick={testConnection} disabled={testing} className="btn" style={{ background: 'var(--br-espresso)', color: 'var(--br-gold-light)' }}>
            {testing ? '...جاري الاختبار' : '🔗 اختبار الربط'}
          </button>
          <a
            href={`${websiteUrl}/ar`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ background: 'var(--br-espresso)', color: 'var(--br-gold-light)' }}
          >
            فتح الموقع للمعاينة
          </a>
        </div>
      </div>

      {testResult && (
        <div className="card" style={{ marginTop: 20, padding: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--br-success)' }}>
            ✅ نتائج اختبار الربط — GET /settings/public-brand
          </h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {Object.entries(testResult).map(([k, v]) => (
              <div key={k} className="admin-setting-row" style={{ gridTemplateColumns: '200px minmax(0, 1fr)' }}>
                <span style={{ fontWeight: 600, fontSize: 13, direction: 'ltr', textAlign: 'left' }}>{k}</span>
                <span style={{ fontSize: 13, color: v ? 'var(--br-success)' : 'var(--br-muted)' }}>
                  {v ? v.substring(0, 80) + (v.length > 80 ? '…' : '') : '(فارغ — سيستخدم القيمة الافتراضية)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 20, padding: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>معاينة سريعة</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {previewKeys.map(key => {
            const url = getPreviewUrl(key);
            if (key === 'brand_pattern' && url) {
              return (
                <div key={key} style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>{fields.find(f => f.key === key)?.label}</div>
                  <div style={{
                    width: '100%', height: 80, borderRadius: 8,
                    backgroundImage: `url(${url})`,
                    backgroundSize: '200px 200px',
                    backgroundRepeat: 'repeat',
                    border: '1px solid var(--br-line)',
                  }} />
                </div>
              );
            }
            if (!url) return null;
            return (
              <div key={key} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>{fields.find(f => f.key === key)?.label}</div>
                <img src={url} alt={key} style={{ width: '100%', height: 80, objectFit: 'contain', borderRadius: 8, background: '#fff', border: '1px solid var(--br-line)' }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
