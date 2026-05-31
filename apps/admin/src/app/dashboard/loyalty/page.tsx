'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/api';

interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  reason?: string | null;
  createdBy?: string | null;
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
      phone?: string | null;
    };
  };
  transactions?: LoyaltyTransaction[];
  qrToken?: string | null;
}

type Tab = 'accounts' | 'redeem-points' | 'redeem-stamps' | 'adjust' | 'history';

const tabs: { key: Tab; label: string }[] = [
  { key: 'accounts', label: 'حسابات الولاء' },
  { key: 'redeem-points', label: 'صرف الكوينز' },
  { key: 'redeem-stamps', label: 'صرف الطوابع' },
  { key: 'adjust', label: 'تعديل إداري' },
  { key: 'history', label: 'السجل' },
];

type AdjustmentMode = 'points' | 'stamps';

interface AdjustmentState {
  account: LoyaltyAccount;
  mode: AdjustmentMode;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
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
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('accounts');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<LoyaltyAccount[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<LoyaltyAccount | null>(null);
  const [qrToken, setQrToken] = useState('');
  const [qrResult, setQrResult] = useState<LoyaltyAccount | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const [adjustment, setAdjustment] = useState<AdjustmentState | null>(null);
  const [adjustForm, setAdjustForm] = useState({ amount: 0, reason: '' });
  const [saving, setSaving] = useState(false);

  const [redeemForm, setRedeemForm] = useState({ points: 0, reason: '', orderId: '' });
  const [stampForm, setStampForm] = useState({ stamps: 10, rewardName: 'مشروب مجاني', orderId: '' });
  const [confirmModal, setConfirmModal] = useState<{ type: 'points' | 'stamps'; title: string; body: string } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return accounts.filter(account => {
      const user = account.customer?.user;
      return !term
        || user?.fullName.toLowerCase().includes(term)
        || user?.email?.toLowerCase().includes(term)
        || user?.phone?.includes(term);
    });
  }, [accounts, search]);

  const totals = useMemo(() => {
    return accounts.reduce(
      (s, a) => ({ balance: s.balance + a.balance, stamps: s.stamps + a.stampCount, lifetimeEarned: s.lifetimeEarned + a.lifetimeEarned }),
      { balance: 0, stamps: 0, lifetimeEarned: 0 },
    );
  }, [accounts]);

  const allTransactions = useMemo(() => {
    const txs: (LoyaltyTransaction & { accountName?: string })[] = [];
    for (const a of accounts) {
      for (const t of a.transactions || []) {
        txs.push({ ...t, accountName: a.customer?.user?.fullName || '-' });
      }
    }
    return txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100);
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

  useEffect(() => { load(); }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      setSearchResults(await adminFetch<LoyaltyAccount[]>(`/admin/loyalty/search?query=${encodeURIComponent(q)}`));
    } catch { setSearchResults([]); } finally { setSearching(false); }
  }, []);

  const doQrLookup = useCallback(async () => {
    if (!qrToken.trim()) { setQrResult(null); return; }
    setQrLoading(true);
    setError(null);
    try {
      const result = await adminFetch<LoyaltyAccount | null>('/admin/loyalty/scan-qr', {
        method: 'POST',
        body: JSON.stringify({ token: qrToken.trim() }),
      });
      setQrResult(result);
      if (!result) setError('لم يتم العثور على حساب بهذا الرمز');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل البحث بالرمز');
    } finally {
      setQrLoading(false);
    }
  }, [qrToken]);

  const startAdjustment = (account: LoyaltyAccount, mode: AdjustmentMode) => {
    setAdjustment({ account, mode });
    setAdjustForm({ amount: 0, reason: '' });
    setError(null);
  };

  const submitAdjustment = async () => {
    if (!adjustment) return;
    setError(null);
    if (!adjustForm.amount) { setError('أدخل قيمة التعديل'); return; }
    if (adjustForm.reason.trim().length < 3) { setError('أدخل سبباً واضحاً'); return; }
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
      showToast('تم التعديل بنجاح');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تنفيذ التعديل');
    } finally { setSaving(false); }
  };

  const confirmRedeemPoints = () => {
    if (!selectedAccount) { setError('اختر عميلاً أولاً'); return; }
    if (redeemForm.points < 1) { setError('أدخل عدد الكوينز'); return; }
    if (redeemForm.reason.trim().length < 3) { setError('أدخل سبباً واضحاً'); return; }
    setConfirmModal({
      type: 'points',
      title: 'تأكيد صرف كوينز',
      body: `هل تريد صرف ${redeemForm.points} B.R Coins من حساب ${selectedAccount.customer?.user?.fullName}؟`,
    });
  };

  const confirmRedeemStamps = () => {
    if (!selectedAccount) { setError('اختر عميلاً أولاً'); return; }
    if (stampForm.stamps < 1) { setError('أدخل عدد الطوابع'); return; }
    setConfirmModal({
      type: 'stamps',
      title: 'تأكيد صرف طوابع',
      body: `هل تريد صرف ${stampForm.stamps} طابع (${stampForm.rewardName}) من حساب ${selectedAccount.customer?.user?.fullName}؟`,
    });
  };

  const executeRedeem = async () => {
    if (!selectedAccount || !confirmModal) return;
    setSaving(true);
    setError(null);
    setConfirmModal(null);
    try {
      if (confirmModal.type === 'points') {
        await adminFetch(`/admin/loyalty/${selectedAccount.id}/redeem-points`, {
          method: 'POST',
          body: JSON.stringify({ points: redeemForm.points, reason: redeemForm.reason.trim(), orderId: redeemForm.orderId || undefined }),
        });
        showToast(`تم صرف ${redeemForm.points} B.R Coins بنجاح`);
        setRedeemForm({ points: 0, reason: '', orderId: '' });
      } else {
        await adminFetch(`/admin/loyalty/${selectedAccount.id}/redeem-stamps`, {
          method: 'POST',
          body: JSON.stringify({ stamps: stampForm.stamps, rewardName: stampForm.rewardName.trim(), orderId: stampForm.orderId || undefined }),
        });
        showToast(`تم صرف ${stampForm.stamps} طوابع بنجاح`);
        setStampForm({ stamps: 10, rewardName: 'مشروب مجاني', orderId: '' });
      }
      setSelectedAccount(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشلت عملية الصرف');
    } finally { setSaving(false); }
  };

  const userRole = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('admin_user') || '{}') as any)?.role || '' : '';
  const isStaff = userRole === 'staff';

  return (
    <div dir="rtl">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>إدارة الولاء</h1>
        <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>B.R Coins والطوابع - صرف، تعديل، وسجل الحركات.</p>
      </div>

      {toast && <div className="card" style={{ color: 'var(--br-success)', marginBottom: 16, padding: 16, fontWeight: 700 }}>{toast}</div>}
      {error && <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16, padding: 16 }}>{error}</div>}

      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div className="card" style={{ padding: 28, maxWidth: 460, width: '90%' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{confirmModal.title}</h3>
            <p style={{ marginBottom: 20 }}>{confirmModal.body}</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={executeRedeem} disabled={saving} className="btn btn-primary">
                {saving ? 'جاري التنفيذ...' : 'تأكيد الصرف'}
              </button>
              <button onClick={() => setConfirmModal(null)} className="btn" style={{ background: 'var(--br-cream)' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', borderBottom: '1px solid var(--br-line)', paddingBottom: 8 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 18px', borderRadius: 6, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              background: tab === t.key ? 'var(--br-gold)' : 'transparent',
              color: tab === t.key ? 'var(--br-black)' : 'var(--br-muted)',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Accounts */}
      {tab === 'accounts' && (
        <>
          <div className="grid-stats" style={{ marginBottom: 20 }}>
            <div className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--br-gold)' }}>{accounts.length}</div>
              <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>حسابات ولاء</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--br-gold)' }}>{totals.balance}</div>
              <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>B.R Coins</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--br-coffee)' }}>{totals.stamps}</div>
              <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>طوابع</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{totals.lifetimeEarned}</div>
              <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 8 }}>إجمالي مكتسب</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20, padding: 16 }}>
            <input className="input" placeholder="بحث باسم العميل، البريد، أو الهاتف" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {loading && <div style={{ padding: 40, textAlign: 'center' }}>جاري التحميل...</div>}

          {!loading && (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>العميل</th>
                    <th>البريد / الهاتف</th>
                    <th>B.R Coins</th>
                    <th>الطوابع</th>
                    <th>المكتسب</th>
                    <th>آخر الحركات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map(account => (
                    <tr key={account.id}>
                      <td style={{ fontWeight: 700 }}>{account.customer?.user?.fullName || '-'}</td>
                      <td style={{ fontSize: 13 }}>
                        {account.customer?.user?.email || '-'}
                        {account.customer?.user?.phone && <span style={{ color: 'var(--br-muted)' }}> / {account.customer.user.phone}</span>}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--br-gold)' }}>{account.balance}</td>
                      <td style={{ fontWeight: 700 }}>{account.stampCount}</td>
                      <td style={{ fontSize: 12 }}>{account.lifetimeEarned} / {account.lifetimeRedeemed}</td>
                      <td>
                        <div style={{ display: 'grid', gap: 2, fontSize: 12 }}>
                          {(account.transactions || []).slice(0, 3).map(tx => (
                            <div key={tx.id}>
                              <strong>{transactionLabel(tx.type)}</strong> ({tx.points > 0 ? '+' : ''}{tx.points})
                              <span style={{ color: 'var(--br-muted)' }}> · {formatDateTime(tx.createdAt)}</span>
                            </div>
                          ))}
                          {(!account.transactions || account.transactions.length === 0) && <span style={{ color: 'var(--br-muted)' }}>-</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAccounts.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--br-muted)', padding: 32 }}>لا توجد نتائج</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Tab: Redeem Points */}
      {tab === 'redeem-points' && (
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--br-gold)' }}>صرف B.R Coins</h2>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>بحث عن عميل</div>
            <input className="input" placeholder="الاسم، الهاتف، البريد..." value={search} onChange={e => { setSearch(e.target.value); doSearch(e.target.value); }} style={{ marginBottom: 8 }} />
            {searching && <div style={{ color: 'var(--br-muted)', fontSize: 13 }}>جاري البحث...</div>}
            {searchResults.length > 0 && (
              <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                {searchResults.map(a => (
                  <div
                    key={a.id}
                    onClick={() => { setSelectedAccount(a); setSearchResults([]); setSearch(''); }}
                    style={{
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer', border: selectedAccount?.id === a.id ? '2px solid var(--br-gold)' : '1px solid var(--br-line)',
                      background: selectedAccount?.id === a.id ? 'rgba(201,150,26,0.1)' : 'var(--br-white)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{a.customer?.user?.fullName}</div>
                      <div style={{ fontSize: 12, color: 'var(--br-muted)' }}>{a.customer?.user?.phone || a.customer?.user?.email || '-'}</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, color: 'var(--br-gold)' }}>{a.balance} Coins</div>
                      <div style={{ fontSize: 12, color: 'var(--br-muted)' }}>{a.stampCount} طوابع</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>أو أدخل رمز QR</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" placeholder="رمز QR العام" value={qrToken} onChange={e => setQrToken(e.target.value)} />
              <button onClick={doQrLookup} disabled={qrLoading} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                {qrLoading ? '...' : 'بحث'}
              </button>
            </div>
            {qrResult && (
              <div style={{ marginTop: 8, padding: 12, borderRadius: 8, border: '2px solid var(--br-gold)', background: 'rgba(201,150,26,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{qrResult.customer?.user?.fullName}</div>
                    <div style={{ fontSize: 13, color: 'var(--br-muted)' }}>{qrResult.customer?.user?.phone}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <button onClick={() => { setSelectedAccount(qrResult); setQrResult(null); setQrToken(''); }} className="btn btn-sm btn-primary">
                      اختيار
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {selectedAccount && (
            <div style={{ marginBottom: 16, padding: 16, borderRadius: 8, background: 'var(--br-cream)' }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{selectedAccount.customer?.user?.fullName}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                <div>B.R Coins: <strong style={{ color: 'var(--br-gold)' }}>{selectedAccount.balance}</strong></div>
                <div>طوابع: <strong>{selectedAccount.stampCount}</strong></div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>عدد الكوينز للصرف</div>
              <input className="input" type="number" min="1" max={selectedAccount?.balance || 0} placeholder="0" value={redeemForm.points || ''} onChange={e => setRedeemForm({ ...redeemForm, points: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>السبب</div>
              <input className="input" placeholder="مثال: خصم على الطلب" value={redeemForm.reason} onChange={e => setRedeemForm({ ...redeemForm, reason: e.target.value })} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>رقم الطلب (اختياري)</div>
              <input className="input" placeholder="اختياري" value={redeemForm.orderId} onChange={e => setRedeemForm({ ...redeemForm, orderId: e.target.value })} />
            </div>
            <div>
              <button onClick={confirmRedeemPoints} disabled={!selectedAccount || saving} className="btn btn-primary" style={{ background: 'var(--br-gold)', color: '#000', fontWeight: 900 }}>
                {!selectedAccount ? 'اختر عميلاً أولاً' : 'صرف الكوينز'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Redeem Stamps */}
      {tab === 'redeem-stamps' && (
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--br-coffee)' }}>صرف الطوابع</h2>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>بحث عن عميل</div>
            <input className="input" placeholder="الاسم، الهاتف، البريد..." value={search} onChange={e => { setSearch(e.target.value); doSearch(e.target.value); }} style={{ marginBottom: 8 }} />
            {searchResults.length > 0 && (
              <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                {searchResults.map(a => (
                  <div
                    key={a.id}
                    onClick={() => { setSelectedAccount(a); setSearchResults([]); setSearch(''); }}
                    style={{
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer', border: selectedAccount?.id === a.id ? '2px solid var(--br-gold)' : '1px solid var(--br-line)',
                      background: selectedAccount?.id === a.id ? 'rgba(201,150,26,0.1)' : 'var(--br-white)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{a.customer?.user?.fullName}</div>
                      <div style={{ fontSize: 12, color: 'var(--br-muted)' }}>{a.customer?.user?.phone || a.customer?.user?.email || '-'}</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, color: 'var(--br-coffee)' }}>{a.stampCount} طوابع</div>
                      <div style={{ fontSize: 12, color: 'var(--br-muted)' }}>{a.balance} Coins</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedAccount && (
            <div style={{ marginBottom: 16, padding: 16, borderRadius: 8, background: 'var(--br-cream)' }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{selectedAccount.customer?.user?.fullName}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                <div>طوابع: <strong style={{ color: 'var(--br-coffee)' }}>{selectedAccount.stampCount}</strong></div>
                <div>B.R Coins: <strong style={{ color: 'var(--br-gold)' }}>{selectedAccount.balance}</strong></div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>عدد الطوابع للصرف</div>
              <input className="input" type="number" min="1" max={selectedAccount?.stampCount || 0} placeholder="10" value={stampForm.stamps || ''} onChange={e => setStampForm({ ...stampForm, stamps: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>اسم المكافأة</div>
              <input className="input" placeholder="مشروب مجاني" value={stampForm.rewardName} onChange={e => setStampForm({ ...stampForm, rewardName: e.target.value })} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>رقم الطلب (اختياري)</div>
              <input className="input" placeholder="اختياري" value={stampForm.orderId} onChange={e => setStampForm({ ...stampForm, orderId: e.target.value })} />
            </div>
            <div>
              <button onClick={confirmRedeemStamps} disabled={!selectedAccount || saving} className="btn btn-primary" style={{ background: 'var(--br-coffee)', color: '#fff', fontWeight: 900 }}>
                {!selectedAccount ? 'اختر عميلاً أولاً' : 'صرف الطوابع'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Admin Adjustment */}
      {tab === 'adjust' && (
        <div>
          {isStaff && (
            <div className="card" style={{ marginBottom: 16, padding: 16, background: 'rgba(180, 35, 24, 0.08)', border: '1px solid rgba(180, 35, 24, 0.2)' }}>
              <strong>انتباه:</strong> صلاحياتك كـ staff لا تسمح بالتعديل الإداري. يمكنك فقط صرف الكوينز والطوابع من التبويبات المخصصة.
            </div>
          )}

          {!isStaff && (
            <>
              {adjustment && (
                <div className="card" style={{ marginBottom: 24, padding: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                    تعديل {adjustment.mode === 'points' ? 'B.R Coins' : 'الطوابع'}
                  </h2>
                  <p style={{ color: 'var(--br-muted)', fontSize: 14, marginBottom: 16 }}>
                    العميل: {adjustment.account.customer?.user?.fullName || 'عميل'}
                    <span style={{ marginRight: 16 }}>الرصيد الحالي: {adjustment.mode === 'points' ? adjustment.account.balance : adjustment.account.stampCount}</span>
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <input className="input" type="number" placeholder="+/-" style={{ width: 160 }} value={adjustForm.amount || ''} onChange={e => setAdjustForm({ ...adjustForm, amount: Number(e.target.value) || 0 })} />
                    <input className="input" placeholder="سبب التعديل" style={{ minWidth: 240 }} value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })} />
                    <button onClick={submitAdjustment} disabled={saving} className="btn btn-primary">{saving ? '...' : 'تأكيد'}</button>
                    <button onClick={() => setAdjustment(null)} className="btn" style={{ background: 'var(--br-cream)' }}>إلغاء</button>
                  </div>
                </div>
              )}

              <div className="card" style={{ marginBottom: 20, padding: 16 }}>
                <input className="input" placeholder="بحث باسم العميل أو البريد" value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>العميل</th>
                      <th>B.R Coins</th>
                      <th>الطوابع</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map(account => (
                      <tr key={account.id}>
                        <td style={{ fontWeight: 700 }}>{account.customer?.user?.fullName || '-'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--br-gold)' }}>{account.balance}</td>
                        <td style={{ fontWeight: 700 }}>{account.stampCount}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => startAdjustment(account, 'points')} className="btn btn-sm btn-primary">تعديل النقاط</button>
                            <button onClick={() => startAdjustment(account, 'stamps')} className="btn btn-sm" style={{ background: 'var(--br-cream)' }}>تعديل الطوابع</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAccounts.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--br-muted)', padding: 32 }}>لا توجد نتائج</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Transaction History */}
      {tab === 'history' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>العميل</th>
                <th>النوع</th>
                <th>النقاط</th>
                <th>السبب</th>
                <th>بواسطة</th>
              </tr>
            </thead>
            <tbody>
              {allTransactions.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDateTime(tx.createdAt)}</td>
                  <td style={{ fontWeight: 600 }}>{tx.accountName}</td>
                  <td>
                    <span className={`badge ${tx.type === 'REDEEM' || tx.type === 'STAMP_REDEEM' ? 'badge-gold' : tx.type === 'ADMIN_ADJUST' || tx.type === 'ADMIN_STAMP' ? 'badge-muted' : 'badge-success'}`}>
                      {transactionLabel(tx.type)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: tx.points < 0 ? 'var(--br-danger)' : 'var(--br-success)' }}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </td>
                  <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.reason || '-'}</td>
                  <td style={{ fontSize: 12 }}>{tx.createdBy || 'النظام'}</td>
                </tr>
              ))}
              {allTransactions.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--br-muted)', padding: 32 }}>لا توجد حركات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
