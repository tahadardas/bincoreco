'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { Locale } from '@/lib/dictionaries';

export default function AccountChangePasswordPage({ params }: { params: { locale: Locale } }) {
  const router = useRouter();
  const { user, loading, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isArabic = params.locale === 'ar';

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/${params.locale}/?login=1`);
    }
  }, [loading, params.locale, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError(isArabic ? 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' : 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(isArabic ? 'تأكيد كلمة المرور غير مطابق' : 'Password confirmation does not match.');
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      router.replace(`/${params.locale}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (isArabic ? 'تعذر تغيير كلمة المرور' : 'Could not change password.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="container section" style={{ maxWidth: 520 }}>
      <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
          {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
        </h1>
        <p style={{ color: 'var(--br-muted)', marginBottom: 22 }}>
          {isArabic
            ? 'يجب تعيين كلمة مرور جديدة قبل متابعة استخدام حسابك.'
            : 'Set a new password before continuing with your account.'}
        </p>
        <div style={{ display: 'grid', gap: 14 }}>
          <input
            className="input"
            type="password"
            placeholder={isArabic ? 'كلمة المرور الحالية' : 'Current password'}
            value={currentPassword}
            onChange={event => setCurrentPassword(event.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder={isArabic ? 'كلمة المرور الجديدة' : 'New password'}
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
            required
            minLength={8}
          />
          <input
            className="input"
            type="password"
            placeholder={isArabic ? 'تأكيد كلمة المرور الجديدة' : 'Confirm new password'}
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            required
            minLength={8}
          />
          {error && <div style={{ color: 'var(--br-danger)', fontSize: 14 }}>{error}</div>}
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%' }}>
            {saving ? (isArabic ? 'جار الحفظ...' : 'Saving...') : (isArabic ? 'حفظ كلمة المرور' : 'Save Password')}
          </button>
        </div>
      </form>
    </section>
  );
}
