'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/forms';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type LoginForm = { email: string; password: string };

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      if (result.data.user.role === 'customer') {
        throw new Error('هذا الحساب لا يملك صلاحية دخول لوحة التحكم');
      }
      localStorage.setItem('admin_token', result.data.accessToken);
      localStorage.setItem('admin_user', JSON.stringify(result.data.user));
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'تعذر تسجيل الدخول');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--br-black)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 8, color: 'var(--br-gold)' }}>
          Banco Ricco
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--br-muted)', marginBottom: 24, fontSize: 14 }}>
          لوحة التحكم
        </p>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <input placeholder="البريد الإلكتروني" {...register('email')} className="input" />
            {errors.email && <div style={{ color: 'var(--br-danger)', fontSize: 12, marginTop: 4 }}>{errors.email.message}</div>}
          </div>
          <div>
            <input placeholder="كلمة المرور" type="password" {...register('password')} className="input" />
            {errors.password && <div style={{ color: 'var(--br-danger)', fontSize: 12, marginTop: 4 }}>{errors.password.message}</div>}
          </div>
          {error && <div style={{ color: 'var(--br-danger)', fontSize: 14 }}>{error}</div>}
          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%' }}>
            {isSubmitting ? 'جاري تسجيل الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
