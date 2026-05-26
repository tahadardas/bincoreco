'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';

export default function AdminLoyaltyPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustForm, setAdjustForm] = useState({ points: 0, stamps: 0, reason: '' });

  const load = async () => {
    setLoading(true);
    try { setAccounts(await adminFetch<any[]>('/admin/loyalty')); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const adjustPoints = async (id: string) => {
    try {
      await adminFetch(`/admin/loyalty/${id}/adjust-points`, {
        method: 'POST',
        body: JSON.stringify({ points: adjustForm.points, reason: adjustForm.reason }),
      });
      setAdjustId(null);
      setAdjustForm({ points: 0, stamps: 0, reason: '' });
      load();
    } catch (err: any) { alert(err.message); }
  };

  const adjustStamps = async (id: string) => {
    try {
      await adminFetch(`/admin/loyalty/${id}/adjust-stamps`, {
        method: 'POST',
        body: JSON.stringify({ stamps: adjustForm.stamps, reason: adjustForm.reason }),
      });
      setAdjustId(null);
      setAdjustForm({ points: 0, stamps: 0, reason: '' });
      load();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>إدارة الولاء</h1>

      {adjustId && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>تعديل حساب ولاء</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <input className="input" type="number" placeholder="نقاط (+/-)" value={adjustForm.points || ''}
              onChange={e => setAdjustForm({...adjustForm, points: parseInt(e.target.value) || 0})} />
            <input className="input" type="number" placeholder="طوابع (+/-)" value={adjustForm.stamps || ''}
              onChange={e => setAdjustForm({...adjustForm, stamps: parseInt(e.target.value) || 0})} />
            <input className="input" placeholder="السبب" style={{ minWidth: 200 }} value={adjustForm.reason}
              onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})} />
          </div>
          <button onClick={() => adjustPoints(adjustId)} className="btn btn-sm btn-primary">تعديل النقاط</button>
          <button onClick={() => adjustStamps(adjustId)} className="btn btn-sm btn-primary" style={{ marginRight: 8 }}>تعديل الطوابع</button>
          <button onClick={() => setAdjustId(null)} className="btn btn-sm" style={{ marginRight: 8, background: '#eee' }}>إلغاء</button>
        </div>
      )}

      {loading ? <div>جاري التحميل...</div> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>العميل</th>
                <th>البريد</th>
                <th>النقاط</th>
                <th>الطوابع</th>
                <th>إجمالي المكتسب</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a: any) => (
                <tr key={a.id}>
                  <td>{a.customer?.user?.fullName || '-'}</td>
                  <td style={{ fontSize: 13 }}>{a.customer?.user?.email || '-'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--br-gold)' }}>{a.balance}</td>
                  <td style={{ fontWeight: 600 }}>{a.stampCount}</td>
                  <td>{a.lifetimeEarned} points / {a.stampTotalEarned} stamps</td>
                  <td>
                    <button onClick={() => { setAdjustId(a.id); setAdjustForm({ points: 0, stamps: 0, reason: '' }); }} className="btn btn-sm btn-primary">
                      تعديل
                    </button>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--br-muted)' }}>لا توجد حسابات ولاء بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
