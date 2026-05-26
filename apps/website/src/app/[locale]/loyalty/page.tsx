'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { useAuth } from '@/lib/auth-context';

interface LoyaltyData {
  id: string;
  balance: number;
  stampCount: number;
  stampTotalEarned: number;
  stampTarget: number;
  transactions: any[];
}

interface QRCard {
  publicToken: string;
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

  useEffect(() => {
    if (!token) { router.push(`/${locale}/?login=1`); return; }
    Promise.all([
      api.get<LoyaltyData>('/loyalty/my'),
      api.get<QRCard>('/loyalty/qr'),
    ]).then(([d, q]) => {
      setData(d);
      setQr(q);
    }).catch(console.error).finally(() => setLoading(false));
  }, [token, locale, router]);

  const handleRedeemStamp = async () => {
    try {
      await api.post('/loyalty/redeem-stamp', {}, token!);
      setMsg(dict.loyalty.success);
      const d = await api.get<LoyaltyData>('/loyalty/my');
      setData(d);
    } catch (err: any) { alert(err.message); }
  };

  const handleRedeemPoints = async () => {
    if (!redeemPoints || redeemPoints < 1) return;
    try {
      await api.post('/loyalty/redeem-points', { points: redeemPoints }, token!);
      setMsg(dict.loyalty.success);
      const d = await api.get<LoyaltyData>('/loyalty/my');
      setData(d);
      setRedeemPoints(0);
    } catch (err: any) { alert(err.message); }
  };

  const handleRegenerateQR = async () => {
    try {
      const q = await api.post<QRCard>('/loyalty/qr/regenerate', {}, token!);
      setQr(q);
    } catch (err: any) { alert(err.message); }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      EARN: dict.loyalty.earned,
      REDEEM: dict.loyalty.redeemed,
      STAMP: dict.loyalty.stamp,
      STAMP_REDEEM: dict.loyalty.stampRedeemed,
    };
    return map[type] || type;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}>Loading...</div>;
  if (!data) return <div style={{ textAlign: 'center', padding: 80 }}>Not available</div>;

  const progress = Math.min(data.stampCount / data.stampTarget * 100, 100);

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{dict.loyalty.title}</h1>
      <p style={{ color: 'var(--br-muted)', marginBottom: 32 }}>{dict.loyalty.subtitle}</p>

      {msg && (
        <div style={{ background: '#d4edda', color: '#155724', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--br-gold)' }}>{data.stampCount}</div>
          <div style={{ fontSize: 14, color: 'var(--br-muted)', marginBottom: 16 }}>{dict.loyalty.stamps}</div>
          <div style={{ background: '#eee', borderRadius: 8, height: 12, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${progress}%`, background: 'var(--br-gold)', height: '100%', borderRadius: 8 }} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--br-muted)' }}>{data.stampCount}/{data.stampTarget} {dict.loyalty.stampTarget}</div>
          {data.stampCount >= data.stampTarget && (
            <button onClick={handleRedeemStamp} className="btn btn-primary" style={{ marginTop: 16 }}>
              {dict.loyalty.redeemStamp}
            </button>
          )}
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--br-coffee)' }}>{data.balance}</div>
          <div style={{ fontSize: 14, color: 'var(--br-muted)', marginBottom: 16 }}>{dict.loyalty.points}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <input type="number" className="input" style={{ width: 100 }} value={redeemPoints || ''}
              onChange={e => setRedeemPoints(parseInt(e.target.value) || 0)}
              placeholder={dict.loyalty.enterPoints} />
            <button onClick={handleRedeemPoints} className="btn btn-outline" disabled={!redeemPoints || redeemPoints > data.balance}>
              {dict.loyalty.redeemPoints}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{dict.loyalty.qrCard}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{
            width: 160, height: 160, background: 'var(--br-white)', border: '2px solid #ddd',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontFamily: 'monospace', color: 'var(--br-muted)',
          }}>
            {qr?.publicToken || '---'}
          </div>
          <div>
            <p style={{ fontSize: 14, color: 'var(--br-muted)', marginBottom: 12 }}>{dict.loyalty.qrHint}</p>
            <button onClick={handleRegenerateQR} className="btn btn-sm btn-outline">{dict.loyalty.regenerate}</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{dict.loyalty.history}</h3>
        {data.transactions.length === 0 ? (
          <p style={{ color: 'var(--br-muted)' }}>{dict.loyalty.noHistory}</p>
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
              {data.transactions.map((t: any) => (
                <tr key={t.id}>
                  <td style={{ fontSize: 13 }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${t.type === 'EARN' || t.type === 'STAMP' ? 'badge-success' : 'badge-muted'}`}>
                      {getTypeLabel(t.type)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: t.points > 0 ? 'var(--br-gold)' : 'var(--br-coffee)' }}>
                    {t.points > 0 ? `+${t.points}` : t.points}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--br-muted)' }}>{t.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
