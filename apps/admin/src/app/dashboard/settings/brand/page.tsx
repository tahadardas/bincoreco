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

  return (
    <div dir="rtl">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>العلامة التجارية</h1>
        <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>شعارات العلامة التجارية لـ Banco Ricco.</p>
      </div>

      {error && <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16, padding: 16 }}>{error}</div>}
      {success && (
        <div className="card" style={{ color: 'var(--br-success)', marginBottom: 16, padding: 16 }}>
          تم حفظ الإعدادات بنجاح ✓
          <div style={{ fontSize: 13, marginTop: 6, color: 'var(--br-muted)' }}>
            قد تحتاج تحديث صفحة الموقع لرؤية التغييرات.
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          {fields.map(field => {
            const value = settings[field.key as keyof BrandSettings];
            const resolvedUrl = value ? resolveMediaUrl(value) : null;
            return (
              <div key={field.key} style={{
                display: 'grid',
                gridTemplateColumns: '200px 1fr 100px',
                gap: 12,
                alignItems: 'center',
                padding: 12,
                background: 'var(--br-cream)',
                borderRadius: 8,
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{field.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--br-muted)' }}>{field.desc}</div>
                </div>
                <div>
                  {value ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img
                        src={resolvedUrl || ''}
                        alt={field.label}
                        style={{
                          width: 64,
                          height: 64,
                          objectFit: 'contain',
                          borderRadius: 6,
                          background: '#fff',
                          border: '1px solid var(--br-line)',
                        }}
                      />
                      <button
                        className="btn btn-sm"
                        style={{ background: '#fee', fontSize: 12 }}
                        onClick={() => handleRemove(field.key)}
                      >
                        إزالة
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--br-muted)', fontSize: 13, fontStyle: 'italic' }}>
                      (افتراضي)
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <label className="btn btn-primary btn-sm" style={{ cursor: uploading === field.key ? 'wait' : 'pointer', fontSize: 12, width: '100%' }}>
                    {uploading === field.key ? '...جاري' : 'رفع'}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: 'none' }} disabled={uploading !== null} onChange={async e => { const f = e.target.files?.[0]; if (f) await handleUpload(field.key, f); e.target.value = ''; }} />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={saveAll} disabled={saving} className="btn btn-primary">
            {saving ? 'جاري الحفظ...' : 'حفظ الكل'}
          </button>
          <button onClick={load} className="btn" style={{ background: 'var(--br-cream)' }}>
            إعادة تحميل الإعدادات
          </button>
          <a
            href="http://localhost:3000/ar"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ background: 'var(--br-espresso)', color: 'var(--br-gold-light)' }}
          >
            فتح الموقع للمعاينة
          </a>
        </div>
      </div>
    </div>
  );
}
