'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/api';

type AdminUser = {
  fullName?: string;
  role?: string;
  mustChangePassword?: boolean;
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      router.replace('/login');
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('تأكيد كلمة المرور غير مطابق');
      return;
    }

    setSaving(true);
    try {
      await adminFetch('/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const storedUser = localStorage.getItem('admin_user');
      if (storedUser) {
        const user = JSON.parse(storedUser) as AdminUser;
        localStorage.setItem('admin_user', JSON.stringify({ ...user, mustChangePassword: false }));
      }
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'تعذر تغيير كلمة المرور');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--br-black)', padding: 20 }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: 440, padding: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--br-gold)', marginBottom: 8, textAlign: 'center' }}>
          تغيير كلمة المرور
        </h1>
        <p style={{ color: 'var(--br-muted)', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
          يجب تعيين كلمة مرور جديدة قبل متابعة استخدام لوحة التحكم.
        </p>
        <div style={{ display: 'grid', gap: 14 }}>
          <input
            className="input"
            type="password"
            placeholder="كلمة المرور الحالية"
            value={currentPassword}
            onChange={event => setCurrentPassword(event.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="كلمة المرور الجديدة"
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
            required
            minLength={8}
          />
          <input
            className="input"
            type="password"
            placeholder="تأكيد كلمة المرور الجديدة"
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            required
            minLength={8}
          />
          {error && <div style={{ color: 'var(--br-danger)', fontSize: 14 }}>{error}</div>}
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%' }}>
            {saving ? 'جار الحفظ...' : 'حفظ كلمة المرور'}
          </button>
        </div>
      </form>
    </div>
  );
}
