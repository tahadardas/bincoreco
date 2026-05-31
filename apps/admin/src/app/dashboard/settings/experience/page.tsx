'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';

interface ExperienceSettings {
  motion_enabled?: string;
  motion_intensity?: string;
  banner_autoplay?: string;
  button_steam_enabled?: string;
  background_pattern_enabled?: string;
  admin_pattern_intensity?: string;
}

const defaults: ExperienceSettings = {
  motion_enabled: 'true',
  motion_intensity: '1',
  banner_autoplay: 'true',
  button_steam_enabled: 'true',
  background_pattern_enabled: 'true',
  admin_pattern_intensity: '0.025',
};

const fields = [
  { key: 'motion_enabled', label: 'الحركات والانيميشن', type: 'boolean' },
  { key: 'motion_intensity', label: 'شدة الحركة', type: 'range', min: 0.5, max: 2, step: 0.1 },
  { key: 'banner_autoplay', label: 'تشغيل البنرات تلقائياً', type: 'boolean' },
  { key: 'button_steam_enabled', label: 'بخار الأزرار', type: 'boolean' },
  { key: 'background_pattern_enabled', label: 'الخلفية المزخرفة', type: 'boolean' },
  { key: 'admin_pattern_intensity', label: 'كثافة النقش في لوحة التحكم', type: 'range', min: 0, max: 0.1, step: 0.005 },
];

export default function ExperienceSettingsPage() {
  const [settings, setSettings] = useState<ExperienceSettings>(defaults);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    adminFetch<Record<string, string>>('/admin/settings')
      .then(data => {
        setSettings(prev => {
          const merged = { ...prev };
          for (const [key, value] of Object.entries(data)) {
            if (key in merged) (merged as any)[key] = value;
          }
          return merged;
        });
      })
      .catch(() => {});
  }, []);

  const update = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  const saveAll = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await adminFetch(`/admin/settings/${key}`, {
          method: 'PUT',
          body: JSON.stringify({ value }),
        });
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
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>إعدادات التجربة</h1>
        <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>التحكم بتجربة المستخدم والحركات في الموقع.</p>
      </div>

      {error && <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16 }}>{error}</div>}
      {success && <div className="card" style={{ color: 'var(--br-success)', marginBottom: 16 }}>تم حفظ الإعدادات ✓</div>}

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          {fields.map(field => (
            <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, background: 'var(--br-cream)', borderRadius: 8 }}>
              <div style={{ minWidth: 200, fontWeight: 700, fontSize: 14 }}>{field.label}</div>
              {field.type === 'boolean' ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={settings[field.key as keyof ExperienceSettings] === 'true'}
                    onChange={e => update(field.key, e.target.checked ? 'true' : 'false')}
                  />
                  {settings[field.key as keyof ExperienceSettings] === 'true' ? 'مفعل' : 'معطل'}
                </label>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={Number(settings[field.key as keyof ExperienceSettings]) || 1}
                    onChange={e => update(field.key, e.target.value)}
                    style={{ width: 160 }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--br-gold-dark)', minWidth: 40 }}>
                    {settings[field.key as keyof ExperienceSettings]}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <button onClick={saveAll} disabled={saving} className="btn btn-primary">
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  );
}
