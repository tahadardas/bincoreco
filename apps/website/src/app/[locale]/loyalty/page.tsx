'use client';
import { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { useAuth } from '@/lib/auth-context';
import EspressoButton from '@/components/espresso-button';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonCard } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';

interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  reason?: string | null;
  createdAt: string;
}

interface LoyaltyData {
  id: string;
  balance: number;
  stampCount: number;
  stampTotalEarned: number;
  stampTarget: number;
  transactions: LoyaltyTransaction[];
}

interface QRCard {
  publicToken: string;
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY' : 'en-US', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export default function LoyaltyPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const { user, token } = useAuth();
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [qr, setQr] = useState<QRCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const load = async (authToken: string) => {
    const [loyalty, qrCard] = await Promise.all([
      api.get<LoyaltyData>('/loyalty/my', authToken),
      api.get<QRCard>('/loyalty/qr', authToken),
    ]);
    setData(loyalty);
    setQr(qrCard);
  };

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/?login=1`);
      return;
    }
    load(token)
      .catch(err => setError(locale === 'ar' ? 'تعذر تحميل بيانات الولاء' : 'Unable to load loyalty'))
      .finally(() => setLoading(false));
  }, [token, locale, router]);

  const handleRedeemStamp = async () => {
    if (!token) return;
    try {
      await api.post('/loyalty/redeem-stamp', {}, token);
      setMsg(dict.loyalty.success);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 3000);
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.loyalty.needMoreStamps);
    }
  };

  const handleRedeemPoints = async () => {
    if (!token || !redeemPoints || redeemPoints < 1) return;
    try {
      await api.post('/loyalty/redeem-points', { points: redeemPoints }, token);
      setMsg(dict.loyalty.success);
      setRedeemPoints(0);
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === 'ar' ? 'تعذر استبدال النقاط' : 'Unable to redeem points'));
    }
  };

  const handleRegenerateQR = async () => {
    if (!token) return;
    try {
      const q = await api.post<QRCard>('/loyalty/qr/regenerate', {}, token);
      setQr(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === 'ar' ? 'تعذر تجديد رمز QR' : 'Unable to regenerate QR'));
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      EARN: dict.loyalty.earned,
      REDEEM: dict.loyalty.redeemed,
      STAMP: dict.loyalty.stamp,
      STAMP_REDEEM: dict.loyalty.stampRedeemed,
      ADMIN_ADJUST: dict.loyalty.points,
      ADMIN_STAMP: dict.loyalty.stamps,
    };
    return map[type] || type;
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="page-shell">
        <div className="container">
          <PageHeader eyebrow="Banco Ricco" title={dict.loyalty.title} />
          <div style={{ display: 'grid', gap: 20 }}>
            <SkeletonCard lines={4} />
            <SkeletonCard lines={4} />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-shell">
        <div className="container">
          <PageHeader eyebrow="Banco Ricco" title={dict.loyalty.title} />
          {error ? <Alert tone="error">{error}</Alert> : (
            <EmptyState title={locale === 'ar' ? 'غير متاح' : 'Not available'} icon="⚠️" />
          )}
        </div>
      </div>
    );
  }

  const progress = Math.min((data.stampCount / data.stampTarget) * 100, 100);

  const sectionCard: CSSProperties = {
    padding: 28, borderRadius: 16,
    background: 'linear-gradient(135deg, var(--br-porcelain), #f7f3ed)',
    border: '1px solid var(--br-line)',
  };

  const headingRow: CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
  };

  return (
    <div className="page-shell">
      <div className="container">
        <PageHeader eyebrow="Banco Ricco" title={dict.loyalty.title} description={dict.loyalty.subtitle} />

        {msg && <Alert tone="success">{msg}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }} className="loyalty-grid">
          <div className="card" style={{
            ...sectionCard, textAlign: 'center',
            background: 'linear-gradient(180deg, #faf6ef, #ede4d3)',
          }}>
            <div style={headingRow}>
              <span style={{ fontSize: 28 }}>🪙</span>
              <div>
                <div className="section-eyebrow">{dict.loyalty.yourStamps}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--br-gold-dark)' }}>
                  {data.stampCount}
                  <span style={{ fontSize: 18, color: 'var(--br-muted)', fontWeight: 400 }}>
                    {' '}/ {data.stampTarget}
                  </span>
                </div>
              </div>
            </div>

            <div className="meter" style={{ '--value': `${progress}%` } as CSSProperties}>
              <span />
            </div>

            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              {Array.from({ length: data.stampTarget }, (_, i) => (
                <div key={i} className={i < data.stampCount ? 'stamp-pop' : ''} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  animationDelay: `${i * 0.06}s`,
                  background: i < data.stampCount
                    ? 'linear-gradient(135deg, var(--br-gold), #c9a84c)'
                    : 'var(--br-line)',
                  color: i < data.stampCount ? '#fff' : 'var(--br-muted)',
                  display: 'grid', placeItems: 'center',
                  fontSize: 14, fontWeight: 700,
                  boxShadow: i < data.stampCount ? '0 2px 8px rgba(196, 161, 72, 0.4)' : 'none',
                }}>
                  {i < data.stampCount ? '☕' : i + 1}
                </div>
              ))}
            </div>

            {data.stampCount >= data.stampTarget && (
              <div style={{ marginTop: 18 }}>
                <EspressoButton onClick={handleRedeemStamp}>
                  {dict.loyalty.redeemStamp}
                </EspressoButton>
              </div>
            )}
          </div>

          <div className="card" style={{
            ...sectionCard, textAlign: 'center',
            background: 'linear-gradient(135deg, #2c1810, #3d2317)',
            color: '#fff',
          }}>
            <div style={headingRow}>
              <span style={{ fontSize: 28 }}>🪙</span>
              <div>
                <div className="section-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {dict.loyalty.yourPoints}
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--br-gold)' }}>
                  {data.balance}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center',
            }}>
              <input
                type="number"
                className="input"
                style={{ maxWidth: 130, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                value={redeemPoints || ''}
                onChange={event => setRedeemPoints(parseInt(event.target.value) || 0)}
                placeholder={dict.loyalty.enterPoints}
              />
              <button
                onClick={handleRedeemPoints}
                className="btn btn-outline"
                style={{ color: 'var(--br-gold)', borderColor: 'var(--br-gold)' }}
                disabled={!redeemPoints || redeemPoints > data.balance}
              >
                {dict.loyalty.redeemPoints}
              </button>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>
              1 {dict.reward.coins} = 1000 {locale === 'ar' ? 'ل.س' : 'SYP'}
            </div>
          </div>
        </div>

        <div className="card" style={{ ...sectionCard, marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>
            <span style={{ marginInlineEnd: 8 }}>📱</span>
            {dict.loyalty.qrCard}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{
              width: 180, minHeight: 180,
              background: 'var(--br-white)',
              border: '2px solid var(--br-gold)',
              borderRadius: 12,
              display: 'grid', placeItems: 'center',
              padding: 16, textAlign: 'center',
              fontSize: 14, fontFamily: 'monospace',
              color: 'var(--br-coffee)', wordBreak: 'break-word',
            }}>
              {qr?.publicToken || '---'}
            </div>
            <div style={{ maxWidth: 460 }}>
              <p style={{ color: 'var(--br-muted)', marginBottom: 14 }}>{dict.loyalty.qrHint}</p>
              <button onClick={handleRegenerateQR} className="btn btn-outline">{dict.loyalty.regenerate}</button>
            </div>
          </div>
        </div>

        <div className="card" style={{ ...sectionCard, overflowX: 'auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>
            <span style={{ marginInlineEnd: 8 }}>📋</span>
            {dict.loyalty.history}
          </h2>
          {data.transactions.length === 0 ? (
            <EmptyState title={dict.loyalty.noHistory} icon="📭" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th>{locale === 'ar' ? 'النوع' : 'Type'}</th>
                  <th>{locale === 'ar' ? 'النقاط' : 'Points'}</th>
                  <th>{locale === 'ar' ? 'السبب' : 'Reason'}</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td style={{ fontSize: 13 }}>{formatDate(transaction.createdAt, locale)}</td>
                    <td>
                      <span className={`badge ${transaction.points > 0 ? 'badge-success' : 'badge-muted'}`}>
                        {getTypeLabel(transaction.type)}
                      </span>
                    </td>
                    <td style={{
                      fontWeight: 900,
                      color: transaction.points > 0 ? 'var(--br-gold-dark)' : 'var(--br-coffee)',
                    }}>
                      {transaction.points > 0 ? `+${transaction.points}` : transaction.points}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--br-muted)' }}>{transaction.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {celebrate && (
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, overflow: 'hidden' }}>
            {Array.from({ length: 24 }, (_, i) => (
              <div
                key={i}
                className="stamp-confetti"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${40 + Math.random() * 30}%`,
                  background: ['var(--br-gold)', 'var(--br-gold-light)', 'var(--br-coffee)', 'var(--br-espresso)'][i % 4],
                  animationDelay: `${i * 0.08}s`,
                  width: `${6 + Math.random() * 8}px`,
                  height: `${6 + Math.random() * 8}px`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
