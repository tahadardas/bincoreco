'use client';
import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/api';

interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  reason?: string | null;
  createdAt: string;
}

interface LoyaltyAccount {
  id: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  stampCount: number;
  stampTotalEarned: number;
  updatedAt: string;
  customer?: {
    user?: {
      id: string;
      email?: string | null;
      fullName: string;
    };
  };
  transactions?: LoyaltyTransaction[];
}

type AdjustmentMode = 'points' | 'stamps';

interface AdjustmentState {
  account: LoyaltyAccount;
  mode: AdjustmentMode;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ar-SY', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function transactionLabel(type: string) {
  const labels: Record<string, string> = {
    EARN: 'اكتساب نقاط',
    REDEEM: 'استبدال نقاط',
    STAMP: 'طابع جديد',
    STAMP_REDEEM: 'استبدال طوابع',
    ADMIN_ADJUST: 'تعديل إداري',
    ADMIN_STAMP: 'تعديل طوابع',
  };
  return labels[type] || type;
}

export default function AdminLoyaltyPage() {
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [adjustment, setAdjustment] = useState<AdjustmentState | null>(null);
  const [adjustForm, setAdjustForm] = useState({ amount: 0, reason: '' });
  const [saving, setSaving] = useState(false);

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return accounts.filter(account => {
      const user = account.customer?.user;
      return !term
        || user?.fullName.toLowerCase().includes(term)
        || user?.email?.toLowerCase().includes(term);
    });
  }, [accounts, search]);

  const totals = useMemo(() => {
    return accounts.reduce(
      (summary, account) => ({
        balance: summary.balance + account.balance,
        stamps: summary.stamps + account.stampCount,
        lifetimeEarned: summary.lifetimeEarned + account.lifetimeEarned,
      }),
      { balance: 0, stamps: 0, lifetimeEarned: 0 },
    );
  }, [accounts]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await adminFetch<LoyaltyAccount[]>('/admin/loyalty?limit=100'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل حسابات الولاء');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startAdjustment = (account: LoyaltyAccount, mode: AdjustmentMode) => {
    setAdjustment({ account, mode });
    setAdjustForm({ amount: 0, reason: '' });
    setError(null);
  };

  const submitAdjustment = async () => {
    if (!adjustment) {
      return;
    }
    setError(null);
    if (!adjustForm.amount) {
      setError('أدخل قيمة التعديل');
      return;
    }
    if (adjustForm.reason.trim().length < 3) {
      setError('أدخل سبباً واضحاً للتعديل');
      return;
    }

    setSaving(true);
    try {
      const endpoint = adjustment.mode === 'points'
        ? `/admin/loyalty/${adjustment.account.id}/adjust-points`
        : `/admin/loyalty/${adjustment.account.id}/adjust-stamps`;
      const body = adjustment.mode === 'points'
        ? { points: adjustForm.amount, reason: adjustForm.reason.trim() }
        : { stamps: adjustForm.amount, reason: adjustForm.reason.trim() };

      await adminFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
      setAdjustment(null);
      setAdjustForm({ amount: 0, reason: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تنفيذ تعديل الولاء');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>إدارة الولاء</h1>
        <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>متابعة B.R Coins والطوابع مع سجل آخر الحركات.</p>
      </div>

      {error && <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16 }}>{error}</div>}

      <div className="grid-stats">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--br-gold)' }}>{accounts.length}</div>
          <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>حسابات ولاء</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--br-gold)' }}>{totals.balance}</div>
          <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>B.R Coins حالية</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--br-coffee)' }}>{totals.stamps}</div>
          <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>طوابع حالية</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{totals.lifetimeEarned}</div>
          <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>إجمالي نقاط مكتسبة</div>
        </div>
      </div>

      {adjustment && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            تعديل {adjustment.mode === 'points' ? 'B.R Coins' : 'الطوابع'}
          </h2>
          <p style={{ color: 'var(--br-muted)', fontSize: 14, marginBottom: 16 }}>
            العميل: {adjustment.account.customer?.user?.fullName || 'عميل'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '180px minmax(240px, 1fr) auto auto', gap: 12 }}>
            <input
              className="input"
              type="number"
              placeholder="+/-"
              value={adjustForm.amount || ''}
              onChange={event => setAdjustForm({ ...adjustForm, amount: Number(event.target.value) || 0 })}
            />
            <input
              className="input"
              placeholder="سبب التعديل"
              value={adjustForm.reason}
              onChange={event => setAdjustForm({ ...adjustForm, reason: event.target.value })}
            />
            <button onClick={submitAdjustment} disabled={saving} className="btn btn-primary">
              {saving ? 'جاري الحفظ...' : 'تأكيد'}
            </button>
            <button onClick={() => setAdjustment(null)} className="btn" style={{ background: 'var(--br-cream)' }}>إلغاء</button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <input
          className="input"
          placeholder="بحث باسم العميل أو البريد"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {loading && <div style={{ padding: 40 }}>جاري تحميل حسابات الولاء...</div>}

      {!loading && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>العميل</th>
                <th>البريد</th>
                <th>B.R Coins</th>
                <th>الطوابع</th>
                <th>المكتسب/المستبدل</th>
                <th>آخر الحركات</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map(account => (
                <tr key={account.id}>
                  <td style={{ fontWeight: 700 }}>{account.customer?.user?.fullName || '-'}</td>
                  <td style={{ fontSize: 13 }}>{account.customer?.user?.email || '-'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--br-gold)' }}>{account.balance}</td>
                  <td style={{ fontWeight: 700 }}>{account.stampCount}</td>
                  <td>{account.lifetimeEarned} / {account.lifetimeRedeemed}</td>
                  <td>
                    <div style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                      {(account.transactions || []).slice(0, 3).map(transaction => (
                        <div key={transaction.id}>
                          <strong>{transactionLabel(transaction.type)}</strong>
                          {' '}({transaction.points > 0 ? '+' : ''}{transaction.points})
                          <span style={{ color: 'var(--br-muted)' }}> · {formatDateTime(transaction.createdAt)}</span>
                        </div>
                      ))}
                      {(!account.transactions || account.transactions.length === 0) && <span style={{ color: 'var(--br-muted)' }}>لا توجد حركات بعد</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => startAdjustment(account, 'points')} className="btn btn-sm btn-primary">تعديل النقاط</button>
                      <button onClick={() => startAdjustment(account, 'stamps')} className="btn btn-sm" style={{ background: 'var(--br-cream)' }}>تعديل الطوابع</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAccounts.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--br-muted)', padding: 32 }}>لا توجد حسابات ولاء ضمن الفلاتر الحالية</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
