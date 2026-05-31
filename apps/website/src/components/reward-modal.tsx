'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { api } from '@/lib/api';
import EspressoButton from './espresso-button';

interface RewardModalProps {
  locale: Locale;
  order: {
    id: string;
    orderNumber: string;
    pendingCoins: number;
    pendingStamps: number;
    rewardClaimToken?: string;
  };
  onClose: () => void;
}

export default function RewardModal({ locale, order, onClose }: RewardModalProps) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const { user, login } = useAuth();
  const isGuest = !user;
  const [showRegistration, setShowRegistration] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimDone, setClaimDone] = useState(false);
  const animateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animateRef.current) return;
    const el = animateRef.current;
    el.style.transition = 'none';
    el.style.transform = 'scale(0.3)';
    el.style.opacity = '0';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        el.style.transform = 'scale(1)';
        el.style.opacity = '1';
      });
    });
  }, []);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError('');
    if (!order.rewardClaimToken) return;
    setClaiming(true);
    try {
      await api.post('/orders/claim-reward', {
        rewardClaimToken: order.rewardClaimToken,
        email: email || undefined,
        phone: phone || undefined,
        password,
        fullName,
      });
      if (email || phone) {
        await login(email || phone, password);
      }
      setClaimDone(true);
    } catch (err: any) {
      setClaimError(err.message || 'Error claiming rewards');
    } finally {
      setClaiming(false);
    }
  };

  if (isGuest && !showRegistration && !claimDone) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(11,10,8,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        padding: 18,
      }} onClick={onClose}>
        <div className="card" style={{
          background: 'var(--br-porcelain)', padding: 30,
          width: '100%', maxWidth: 420, position: 'relative', textAlign: 'center',
        }} onClick={e => e.stopPropagation()}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, insetInlineEnd: 12, background: 'none', fontSize: 24, color: 'var(--br-muted)',
          }}>&times;</button>

          <div ref={animateRef} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>☕</div>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>{dict.reward.guestTitle}</h2>
            <p style={{ fontSize: 14, color: 'var(--br-muted)', marginTop: 4 }}>{dict.reward.guestSubtitle}</p>
          </div>

          {order.pendingCoins > 0 && (
            <div className="card" style={{
              background: 'linear-gradient(135deg, var(--br-gold), #c9a84c)', color: '#fff',
              padding: '14px 18px', marginBottom: 10, fontWeight: 700,
            }}>
              {dict.reward.guestPendingCoins}: <span style={{fontSize:22}}>{order.pendingCoins}</span>
            </div>
          )}
          {order.pendingStamps > 0 && (
            <div className="card" style={{
              background: 'linear-gradient(135deg, var(--br-coffee), #6b3a1f)', color: '#fff',
              padding: '14px 18px', marginBottom: 18, fontWeight: 700,
            }}>
              {order.pendingStamps === 1 ? dict.reward.guestPendingStamp : dict.reward.guestPendingStamps}: <span style={{fontSize:22}}>{order.pendingStamps}</span>
            </div>
          )}

          <p style={{ fontSize: 13, color: 'var(--br-muted)', marginBottom: 18 }}>
            {dict.reward.byClaiming}
          </p>

          <EspressoButton onClick={() => setShowRegistration(true)} style={{ width: '100%' }}>
            {dict.reward.claimReward}
          </EspressoButton>

          <div style={{ marginTop: 12 }}>
            <button onClick={onClose} style={{ background: 'none', color: 'var(--br-muted)', fontSize: 14, textDecoration: 'underline' }}>
              {dict.reward.viewOrders}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isGuest && showRegistration && !claimDone) {
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
            position: 'absolute', top: 12, insetInlineEnd: 12, background: 'none', fontSize: 24, color: 'var(--br-muted)',
          }}>&times;</button>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>
            {dict.reward.claimReward}
          </h2>
          <form onSubmit={handleClaim} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              placeholder={dict.auth.fullName}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="input"
            />
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
            {claimError && <div style={{ color: 'var(--br-danger)', fontSize: 14 }}>{claimError}</div>}
            <EspressoButton type="submit" loading={claiming} style={{ width: '100%' }}>
              {dict.reward.claimReward}
            </EspressoButton>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(11,10,8,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      padding: 18,
    }} onClick={onClose}>
      <div className="card" style={{
        background: 'var(--br-porcelain)', padding: 30,
        width: '100%', maxWidth: 420, position: 'relative', textAlign: 'center',
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, insetInlineEnd: 12, background: 'none', fontSize: 24, color: 'var(--br-muted)',
        }}>&times;</button>

        <div ref={animateRef} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            {claimDone ? '🎉' : '☕'}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>
            {claimDone ? dict.reward.title : dict.loyalty.title}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--br-muted)', marginTop: 4 }}>
            {claimDone ? dict.reward.subtitle : dict.reward.guestSubtitle}
          </p>
        </div>

        {(order.pendingCoins > 0 || order.pendingStamps > 0) && (
          <div style={{ fontSize: 14, color: 'var(--br-coffee)', fontWeight: 700, marginBottom: 10 }}>
            {dict.reward.youEarned}
          </div>
        )}

        {order.pendingCoins > 0 && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, var(--br-gold), #c9a84c)', color: '#fff',
            padding: '14px 18px', marginBottom: 10, fontWeight: 700,
          }}>
            {order.pendingCoins} {dict.reward.coins}
          </div>
        )}
        {order.pendingStamps > 0 && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, var(--br-coffee), #6b3a1f)', color: '#fff',
            padding: '14px 18px', marginBottom: 10, fontWeight: 700,
          }}>
            {order.pendingStamps} {order.pendingStamps === 1 ? dict.reward.stamp : dict.reward.stamps}
          </div>
        )}

        <div style={{ fontSize: 12, color: 'var(--br-muted)', marginTop: 12, marginBottom: 18 }}>
          {dict.reward.whenPickedUp}
        </div>

        <EspressoButton onClick={() => { onClose(); router.push(`/${locale}/orders`); }} style={{ width: '100%' }}>
          {dict.reward.viewOrders}
        </EspressoButton>
      </div>
    </div>
  );
}
