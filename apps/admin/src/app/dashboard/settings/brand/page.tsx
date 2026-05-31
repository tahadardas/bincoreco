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

export default function BrandSettingsPage() {
  const [settings, setSettings] = useState<BrandSettings>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    adminFetch<BrandSettings>('/admin/settings')
      .then(setSettings)
      .catch(() => {});
  }, []);

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
        if (value) {
          await adminFetch(`/admin/settings/${key}`, {
            method: 'PUT',
            body: JSON.stringify({ value }),
          });
        }
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>العلامة التجارية</h1>
        <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>شعارات العلامة التجارية لـ Banco Ricco.</p>
      </div>

      {error && <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16 }}>{error}</div>}
      {success && <div className="card" style={{ color: 'var(--br-success)', marginBottom: 16 }}>تم حفظ الإعدادات بنجاح ✓</div>}

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          {fields.map(field => (
            <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '200px minmax(160px, 1fr) 140px', gap: 12, alignItems: 'center', padding: 12, background: 'var(--br-cream)', borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{field.label}</div>
                <div style={{ fontSize: 12, color: 'var(--br-muted)' }}>{field.desc}</div>
              </div>
              <div>
                {settings[field.key as keyof BrandSettings] ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={resolveMediaUrl(settings[field.key as keyof BrandSettings]!) || ''}
                      alt={field.label}
                      style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 4, background: '#fff' }}
                    />
                    <button
                      className="btn btn-sm"
                      style={{ background: '#fee' }}
                      onClick={() => setSettings(prev => ({ ...prev, [field.key]: '' }))}
                    >إزالة</button>
                  </div>
                ) : (
                  <div style={{ color: 'var(--br-muted)', fontSize: 13 }}>لم يتم الرفع بعد</div>
                )}
              </div>
              <div>
                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', fontSize: 12, textAlign: 'center' }}>
                  {uploading === field.key ? 'جاري الرفع...' : 'رفع'}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: 'none' }} onChange={async e => { const f = e.target.files?.[0]; if (f) await handleUpload(field.key, f); e.target.value = ''; }} />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <button onClick={saveAll} disabled={saving} className="btn btn-primary">
            {saving ? 'جاري الحفظ...' : 'حفظ الكل'}
          </button>
        </div>
      </div>
    </div>
  );
}
