'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/api';
import AdminDataTable, { Column } from '@/components/admin-data-table';

interface User {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  role: 'customer' | 'staff' | 'maestro' | 'admin';
  isActive: boolean;
  createdAt: string;
  _count: { orders: number };
  customerProfile: {
    loyaltyAccount: { balance: number } | null;
  } | null;
  passwordHash?: string;
}

interface UserDetail extends User {
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    total: { amount: number; currencyCode: string };
    createdAt: string;
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    product: { translations: { locale: string; name: string }[] };
  }[];
  customerProfile: {
    loyaltyAccount: {
      id: string;
      balance: number;
      lifetimeEarned: number;
      lifetimeRedeemed: number;
      stampCount: number;
      stampTotalEarned: number;
    } | null;
  } | null;
  qrToken?: string | null;
}

type Role = User['role'];

const roleLabels: Record<Role, string> = {
  customer: 'عميل',
  staff: 'موظف',
  maestro: 'مايسترو',
  admin: 'مدير',
};

const roleColors: Record<Role, { background: string; color: string }> = {
  admin: { background: 'var(--br-gold)', color: 'var(--br-black)' },
  maestro: { background: 'var(--br-coffee)', color: 'white' },
  staff: { background: 'var(--br-muted)', color: 'white' },
  customer: { background: 'var(--br-cream)', color: 'var(--br-black)' },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium' }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function localizedName(translations: { locale: string; name: string }[]) {
  return translations.find(t => t.locale === 'ar')?.name
    || translations.find(t => t.locale === 'en')?.name
    || '-';
}

export default function MembersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'' | Role>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roleModal, setRoleModal] = useState<{ user: User } | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState<{ user: User } | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [resetPwdModal, setResetPwdModal] = useState<{ user: User } | null>(null);
  const [resetPwdMode, setResetPwdMode] = useState<'auto' | 'manual'>('auto');
  const [manualPassword, setManualPassword] = useState('');
  const [resetPwdSaving, setResetPwdSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const queryString = useMemo(() => {
    const query = new URLSearchParams({ limit: '100' });
    if (search.trim()) query.set('search', search.trim());
    if (roleFilter) query.set('role', roleFilter);
    if (statusFilter === 'active') query.set('isActive', 'true');
    if (statusFilter === 'inactive') query.set('isActive', 'false');
    if (fromDate) query.set('fromDate', new Date(`${fromDate}T00:00:00`).toISOString());
    if (toDate) query.set('toDate', new Date(`${toDate}T23:59:59.999`).toISOString());
    return query.toString();
  }, [search, roleFilter, statusFilter, fromDate, toDate]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<User[]>(`/users?${queryString}`);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل الأعضاء');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openDrawer = async (user: User) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const data = await adminFetch<UserDetail>(`/users/${user.id}`);
      setUserDetail(data);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'تعذر تحميل تفاصيل العضو');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setUserDetail(null);
    setDetailError(null);
  };

  const changeRole = async (user: User, newRole: Role) => {
    setRoleSaving(true);
    setUpdatingId(user.id);
    try {
      await adminFetch(`/users/${user.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setRoleModal(null);
      showToast(`تم تغيير صلاحية ${user.fullName} إلى ${roleLabels[newRole]}`);
      await loadUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذر تغيير الصلاحية', 'error');
    } finally {
      setRoleSaving(false);
      setUpdatingId(null);
    }
  };

  const toggleStatus = async (user: User) => {
    if (user.isActive && user.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin' && u.isActive).length;
      if (adminCount <= 1) {
        showToast('لا يمكن إلغاء تنشيط آخر مدير', 'error');
        setStatusConfirm(null);
        return;
      }
    }
    setStatusSaving(true);
    setUpdatingId(user.id);
    try {
      await adminFetch(`/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      setStatusConfirm(null);
      showToast(`${user.isActive ? 'تم إلغاء تنشيط' : 'تم تنشيط'} ${user.fullName}`);
      await loadUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذر تغيير الحالة', 'error');
    } finally {
      setStatusSaving(false);
      setUpdatingId(null);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'fullName',
      label: 'الاسم الكامل',
      render: (user) => <span style={{ fontWeight: 700 }}>{user.fullName}</span>,
    },
    {
      key: 'phone',
      label: 'الهاتف',
      render: (user) => <span dir="ltr" style={{ fontSize: 13 }}>{user.phone || '-'}</span>,
    },
    {
      key: 'email',
      label: 'البريد',
      render: (user) => <span style={{ fontSize: 13, color: 'var(--br-muted)' }}>{user.email || '-'}</span>,
    },
    {
      key: 'role',
      label: 'الصلاحية',
      render: (user) => (
        <span className="badge" style={roleColors[user.role]}>{roleLabels[user.role]}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'الحالة',
      render: (user) => (
        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-muted'}`}>
          {user.isActive ? 'نشط' : 'غير نشط'}
        </span>
      ),
    },
    {
      key: 'orderCount',
      label: 'الطلبات',
      style: { textAlign: 'center' },
      render: (user) => <span style={{ fontWeight: 600 }}>{user._count.orders}</span>,
    },
    {
      key: 'loyaltyBalance',
      label: 'B.R Coins',
      style: { textAlign: 'center' },
      render: (user) => (
        <span style={{ fontWeight: 600, color: 'var(--br-gold)' }}>
          {user.customerProfile?.loyaltyAccount?.balance ?? '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'تاريخ التسجيل',
      render: (user) => <span style={{ fontSize: 13, color: 'var(--br-muted)' }}>{formatDate(user.createdAt)}</span>,
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (user) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => openDrawer(user)}
            className="btn btn-sm btn-primary"
          >
            عرض
          </button>
          <button
            onClick={() => setRoleModal({ user })}
            className="btn btn-sm"
            style={{ background: 'var(--br-cream)' }}
          >
            صلاحية
          </button>
          <button
            onClick={() => setStatusConfirm({ user })}
            disabled={updatingId === user.id}
            className="btn btn-sm"
            style={{
              background: user.isActive ? 'var(--br-cream)' : 'var(--br-success)',
              color: user.isActive ? 'var(--br-black)' : 'white',
            }}
          >
            {updatingId === user.id ? '...' : user.isActive ? 'تعطيل' : 'تفعيل'}
          </button>
          <button
            onClick={() => { setResetPwdModal({ user }); setResetPwdMode('auto'); setManualPassword(''); setTempPassword(null); }}
            className="btn btn-sm"
            style={{ background: 'var(--br-gold)', color: 'var(--br-black)' }}
          >
            إعادة تعيين كلمة المرور
          </button>
        </div>
      ),
    },
  ];

  return (
    <div dir="rtl">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>إدارة الأعضاء</h1>
        <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>عرض وإدارة صلاحيات وحالة أعضاء Banco Ricco.</p>
      </div>

      {toast && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            background: toast.type === 'success' ? 'var(--br-success)' : 'var(--br-danger)',
            color: 'white',
            padding: '12px 20px',
            fontSize: 14,
          }}
        >
          {toast.message}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.2fr) 140px 140px 160px 160px', gap: 12 }}>
          <input
            className="input"
            placeholder="بحث بالاسم أو البريد أو الهاتف"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <select className="input" value={roleFilter} onChange={event => setRoleFilter(event.target.value as '' | Role)}>
            <option value="">كل الصلاحيات</option>
            <option value="customer">عميل</option>
            <option value="staff">موظف</option>
            <option value="maestro">مايسترو</option>
            <option value="admin">مدير</option>
          </select>
          <select className="input" value={statusFilter} onChange={event => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}>
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
          <input type="date" className="input" value={fromDate} onChange={event => setFromDate(event.target.value)} />
          <input type="date" className="input" value={toDate} onChange={event => setToDate(event.target.value)} />
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        onRetry={loadUsers}
        emptyMessage="لا توجد أعضاء ضمن الفلاتر الحالية"
        rowKey={user => user.id}
      />

      {drawerOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
            direction: 'rtl',
          }}
          onClick={closeDrawer}
        >
          <div
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: 520,
              background: 'var(--br-white)', overflowY: 'auto', padding: 24,
              boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            }}
            onClick={event => event.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>تفاصيل العضو</h2>
              <button onClick={closeDrawer} className="btn btn-sm" style={{ background: 'var(--br-cream)' }}>إغلاق</button>
            </div>

            {detailLoading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--br-muted)' }}>جاري التحميل...</div>}
            {detailError && <div className="card" style={{ color: 'var(--br-danger)' }}>{detailError}</div>}

            {!detailLoading && !detailError && userDetail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="card" style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--br-gold)' }}>معلومات المستخدم</h3>
                  <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
                    <div><strong>الاسم:</strong> {userDetail.fullName}</div>
                    <div><strong>الهاتف:</strong> {userDetail.phone || '-'}</div>
                    <div><strong>البريد:</strong> {userDetail.email || '-'}</div>
                    <div>
                      <strong>الصلاحية:</strong>{' '}
                      <span className="badge" style={roleColors[userDetail.role]}>{roleLabels[userDetail.role]}</span>
                    </div>
                    <div>
                      <strong>الحالة:</strong>{' '}
                      <span className={`badge ${userDetail.isActive ? 'badge-success' : 'badge-muted'}`}>
                        {userDetail.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                    <div><strong>تاريخ التسجيل:</strong> {formatDateTime(userDetail.createdAt)}</div>
                  </div>
                </div>

                <div className="card" style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--br-gold)' }}>الولاء</h3>
                  {userDetail.customerProfile?.loyaltyAccount ? (
                    <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
                      <div><strong>B.R Coins:</strong> <span style={{ color: 'var(--br-gold)', fontWeight: 700 }}>{userDetail.customerProfile.loyaltyAccount.balance}</span></div>
                      <div><strong>طوابع:</strong> {userDetail.customerProfile.loyaltyAccount.stampCount}</div>
                      <div><strong>إجمالي المكتسب:</strong> {userDetail.customerProfile.loyaltyAccount.lifetimeEarned}</div>
                      <div><strong>إجمالي المستبدل:</strong> {userDetail.customerProfile.loyaltyAccount.lifetimeRedeemed}</div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--br-muted)', fontSize: 14 }}>لا يوجد حساب ولاء</span>
                  )}
                </div>

                {userDetail.qrToken && (
                  <div className="card" style={{ padding: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--br-gold)' }}>رمز QR</h3>
                    <div style={{ fontSize: 13, fontFamily: 'monospace', background: 'var(--br-cream)', padding: 12, borderRadius: 8, wordBreak: 'break-all' }}>
                      {userDetail.qrToken}
                    </div>
                  </div>
                )}

                {userDetail.orders.length > 0 && (
                  <div className="card" style={{ padding: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--br-gold)' }}>الطلبات</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {userDetail.orders.slice(0, 10).map(order => (
                        <div key={order.id} style={{ background: 'var(--br-cream)', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                          <div style={{ fontWeight: 700 }}>#{order.orderNumber}</div>
                          <div style={{ color: 'var(--br-muted)' }}>{formatDateTime(order.createdAt)}</div>
                        </div>
                      ))}
                      {userDetail.orders.length > 10 && (
                        <div style={{ color: 'var(--br-muted)', fontSize: 13 }}>و {userDetail.orders.length - 10} طلبات أخرى...</div>
                      )}
                    </div>
                  </div>
                )}

                {userDetail.reviews.length > 0 && (
                  <div className="card" style={{ padding: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--br-gold)' }}>التقييمات</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {userDetail.reviews.slice(0, 10).map(review => (
                        <div key={review.id} style={{ background: 'var(--br-cream)', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>
                            {localizedName(review.product.translations)}
                          </div>
                          <div style={{ color: 'var(--br-gold)' }}>
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </div>
                          {review.comment && <div style={{ color: 'var(--br-muted)', marginTop: 4 }}>{review.comment}</div>}
                          <div style={{ color: 'var(--br-muted)', fontSize: 12, marginTop: 4 }}>{formatDateTime(review.createdAt)}</div>
                        </div>
                      ))}
                      {userDetail.reviews.length > 10 && (
                        <div style={{ color: 'var(--br-muted)', fontSize: 13 }}>و {userDetail.reviews.length - 10} تقييمات أخرى...</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {roleModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1001,
            display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl',
          }}
          onClick={() => setRoleModal(null)}
        >
          <div
            className="card"
            style={{ width: 360, padding: 24 }}
            onClick={event => event.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>تغيير صلاحية {roleModal.user.fullName}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {(['customer', 'staff', 'maestro', 'admin'] as Role[]).map(roleOption => (
                <button
                  key={roleOption}
                  onClick={() => changeRole(roleModal.user, roleOption)}
                  disabled={roleSaving || roleModal.user.role === roleOption}
                  className="btn btn-sm"
                  style={{
                    background: roleModal.user.role === roleOption ? roleColors[roleOption].background : 'var(--br-cream)',
                    color: roleModal.user.role === roleOption ? roleColors[roleOption].color : 'var(--br-black)',
                    fontWeight: roleModal.user.role === roleOption ? 700 : 400,
                    textAlign: 'right',
                    justifyContent: 'flex-start',
                  }}
                >
                  {roleLabels[roleOption]}
                  {roleModal.user.role === roleOption && <span style={{ marginRight: 'auto', fontSize: 12 }}>الحالية</span>}
                </button>
              ))}
            </div>
            <button
              onClick={() => setRoleModal(null)}
              className="btn"
              style={{ background: 'var(--br-cream)', width: '100%' }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {statusConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1001,
            display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl',
          }}
          onClick={() => setStatusConfirm(null)}
        >
          <div
            className="card"
            style={{ width: 360, padding: 24 }}
            onClick={event => event.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {statusConfirm.user.isActive ? 'تعطيل العضو' : 'تفعيل العضو'}
            </h3>
            <p style={{ color: 'var(--br-muted)', fontSize: 14, marginBottom: 20 }}>
              {statusConfirm.user.isActive
                ? `هل أنت متأكد من تعطيل ${statusConfirm.user.fullName}؟`
                : `هل أنت متأكد من تفعيل ${statusConfirm.user.fullName}؟`
              }
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => toggleStatus(statusConfirm.user)}
                disabled={statusSaving}
                className="btn btn-sm btn-primary"
              >
                {statusSaving ? 'جاري التحديث...' : 'تأكيد'}
              </button>
              <button
                onClick={() => setStatusConfirm(null)}
                className="btn btn-sm"
                style={{ background: 'var(--br-cream)' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {resetPwdModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1001,
            display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl',
          }}
          onClick={() => { if (!tempPassword) setResetPwdModal(null); }}
        >
          <div
            className="card"
            style={{ width: 420, padding: 24 }}
            onClick={event => event.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              إعادة تعيين كلمة مرور {resetPwdModal.user.fullName}
            </h3>
            <p style={{ color: 'var(--br-muted)', fontSize: 14, marginBottom: 16 }}>
              {tempPassword
                ? 'كلمة المرور المؤقتة أدناه. لن تظهر مرة أخرى.'
                : 'اختر طريقة إعادة تعيين كلمة المرور.'}
            </p>

            {tempPassword ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  background: 'var(--br-gold)', color: 'var(--br-black)',
                  padding: 16, borderRadius: 8, textAlign: 'center',
                  fontSize: 22, fontWeight: 900, fontFamily: 'monospace',
                  letterSpacing: 2, marginBottom: 12,
                  direction: 'ltr',
                }}>
                  {tempPassword}
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  style={{ width: '100%', marginBottom: 8 }}
                  onClick={() => { navigator.clipboard.writeText(tempPassword); showToast('تم النسخ ✅'); }}
                >
                  نسخ كلمة المرور
                </button>
                <div style={{ color: 'var(--br-danger)', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
                  ⚠️ لن تظهر هذه الكلمة مرة أخرى.
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button
                    onClick={() => setResetPwdMode('auto')}
                    className="btn btn-sm"
                    style={{
                      flex: 1,
                      background: resetPwdMode === 'auto' ? 'var(--br-gold)' : 'var(--br-cream)',
                      color: resetPwdMode === 'auto' ? 'var(--br-black)' : 'var(--br-coffee)',
                    }}
                  >
                    توليد كلمة تلقائياً
                  </button>
                  <button
                    onClick={() => setResetPwdMode('manual')}
                    className="btn btn-sm"
                    style={{
                      flex: 1,
                      background: resetPwdMode === 'manual' ? 'var(--br-gold)' : 'var(--br-cream)',
                      color: resetPwdMode === 'manual' ? 'var(--br-black)' : 'var(--br-coffee)',
                    }}
                  >
                    تعيين كلمة يدوياً
                  </button>
                </div>

                {resetPwdMode === 'manual' && (
                  <input
                    className="input"
                    type="password"
                    placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)"
                    style={{ width: '100%', marginBottom: 16 }}
                    value={manualPassword}
                    onChange={event => setManualPassword(event.target.value)}
                  />
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={async () => {
                      setResetPwdSaving(true);
                      try {
                        const body: any = { forceChangeOnNextLogin: true };
                        if (resetPwdMode === 'manual') body.newPassword = manualPassword;
                        const result = await adminFetch<any>(`/users/${resetPwdModal.user.id}/reset-password`, {
                          method: 'POST',
                          body: JSON.stringify(body),
                        });
                        if (result.temporaryPassword) {
                          setTempPassword(result.temporaryPassword);
                        } else {
                          showToast('تم إعادة تعيين كلمة المرور بنجاح ✅');
                          setResetPwdModal(null);
                        }
                      } catch (err) {
                        showToast(err instanceof Error ? err.message : 'فشل إعادة التعيين', 'error');
                      } finally {
                        setResetPwdSaving(false);
                      }
                    }}
                    disabled={resetPwdSaving || (resetPwdMode === 'manual' && manualPassword.length < 8)}
                    className="btn btn-sm btn-primary"
                  >
                    {resetPwdSaving ? 'جاري...' : 'تأكيد إعادة التعيين'}
                  </button>
                  <button
                    onClick={() => setResetPwdModal(null)}
                    className="btn btn-sm"
                    style={{ background: 'var(--br-cream)' }}
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
