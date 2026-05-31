'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getDictionary, Locale } from '@/lib/dictionaries';
import EspressoButton from './espresso-button';

export default function AuthModal({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const dict = getDictionary(locale);
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (!email.trim() && !phone.trim()) {
        setError(locale === 'ar' ? 'أدخل البريد الإلكتروني أو رقم الهاتف' : 'Enter email or phone');
        return;
      }
      if (isLogin) {
        await login(email || phone, password);
      } else {
        await register({ email: email || undefined, phone: phone || undefined, password, fullName });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(11,10,8,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      padding: 18,
    }} onClick={onClose}>
      <div className="card" style={{
        background: 'var(--br-porcelain)', padding: 30,
        width: '100%', maxWidth: 420, position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, insetInlineEnd: 12, background: 'none', fontSize: 24,
        }}>&times;</button>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
          {isLogin ? dict.auth.login : dict.auth.register}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!isLogin && (
            <input
              placeholder={dict.auth.fullName}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="input"
            />
          )}
          <input
            placeholder={dict.auth.email}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
          />
          <input
            placeholder={dict.auth.phone}
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="input"
          />
          <input
            placeholder={dict.auth.password}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="input"
          />
          {error && <div style={{ color: 'var(--br-danger)', fontSize: 14 }}>{error}</div>}
          <EspressoButton type="submit" style={{ width: '100%' }}>
            {isLogin ? dict.auth.loginBtn : dict.auth.registerBtn}
          </EspressoButton>
        </form>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--br-muted)' }}>
          <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', color: 'var(--br-gold)' }}>
            {isLogin ? dict.auth.noAccount : dict.auth.haveAccount}
          </button>
        </div>
      </div>
    </div>
  );
}
