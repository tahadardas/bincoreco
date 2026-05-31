'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      if (data.data.user.role === 'customer') {
        throw new Error('هذا الحساب لا يملك صلاحية دخول لوحة التحكم');
      }
      localStorage.setItem('admin_token', data.data.accessToken);
      localStorage.setItem('admin_user', JSON.stringify(data.data.user));
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
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
            required
          />
          <input
            placeholder="كلمة المرور"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input"
            required
          />
          {error && <div style={{ color: 'var(--br-danger)', fontSize: 14 }}>{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}
