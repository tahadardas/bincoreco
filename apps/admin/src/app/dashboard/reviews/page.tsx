'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/media';
import AdminDataTable from '@/components/admin-data-table';
import type { Column } from '@/components/admin-data-table';

type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface ReviewTranslation {
  locale: string;
  name: string;
}

interface ReviewProduct {
  id: string;
  imageUrl?: string | null;
  translations: ReviewTranslation[];
}

interface ReviewUser {
  fullName: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  adminReply: string | null;
  createdAt: string;
  user?: ReviewUser | null;
  guestName?: string | null;
  product: ReviewProduct;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ReviewsResponse {
  data: Review[];
  pagination: Pagination;
}

const statusTabs: { value: '' | ReviewStatus; label: string }[] = [
  { value: 'PENDING', label: 'معلق' },
  { value: 'APPROVED', label: 'مقبول' },
  { value: 'REJECTED', label: 'مرفوض' },
  { value: '', label: 'الكل' },
];

const statusLabels: Record<ReviewStatus, string> = {
  PENDING: 'معلق',
  APPROVED: 'مقبول',
  REJECTED: 'مرفوض',
};

const statusColors: Record<ReviewStatus, { background: string; color: string }> = {
  PENDING: { background: 'var(--br-warning)', color: 'white' },
  APPROVED: { background: 'var(--br-success)', color: 'white' },
  REJECTED: { background: 'var(--br-danger)', color: 'white' },
};

const ratingOptions = [5, 4, 3, 2, 1];

function localizedName(translations: ReviewTranslation[], fallback: string) {
  return translations.find(t => t.locale === 'ar')?.name
    || translations.find(t => t.locale === 'en')?.name
    || fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function truncate(text: string | null, max: number) {
  if (!text) return '-';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'' | ReviewStatus>('PENDING');
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const queryString = useMemo(() => {
    const query = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) query.set('status', statusFilter);
    if (search.trim()) query.set('search', search.trim());
    if (productSearch.trim()) query.set('productId', productSearch.trim());
    if (ratingFilter !== '') query.set('rating', String(ratingFilter));
    if (verifiedOnly) query.set('verifiedOnly', 'true');
    if (fromDate) query.set('fromDate', new Date(`${fromDate}T00:00:00`).toISOString());
    if (toDate) query.set('toDate', new Date(`${toDate}T23:59:59.999`).toISOString());
    return query.toString();
  }, [page, statusFilter, search, productSearch, ratingFilter, verifiedOnly, fromDate, toDate]);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<ReviewsResponse>(`/admin/reviews?${queryString}`);
      setReviews(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل التقييمات');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, productSearch, ratingFilter, verifiedOnly, fromDate, toDate]);

  const approve = async (review: Review) => {
    setUpdatingId(review.id);
    try {
      await adminFetch(`/admin/reviews/${review.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      showToast('تم قبول التقييم');
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث التقييم');
    } finally {
      setUpdatingId(null);
    }
  };

  const reject = async (review: Review) => {
    setUpdatingId(review.id);
    try {
      await adminFetch(`/admin/reviews/${review.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'REJECTED' }),
      });
      showToast('تم رفض التقييم');
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث التقييم');
    } finally {
      setUpdatingId(null);
    }
  };

  const openReply = (review: Review) => {
    setReplyReviewId(review.id);
    setReplyText(review.adminReply || '');
    setReplyModalOpen(true);
  };

  const saveReply = async () => {
    if (!replyReviewId) return;
    setSavingReply(true);
    try {
      await adminFetch(`/admin/reviews/${replyReviewId}/reply`, {
        method: 'PATCH',
        body: JSON.stringify({ adminReply: replyText }),
      });
      showToast('تم حفظ الرد');
      setReplyModalOpen(false);
      setReplyReviewId(null);
      setReplyText('');
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ الرد');
    } finally {
      setSavingReply(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await adminFetch(`/admin/reviews/${deleteConfirmId}`, { method: 'DELETE' });
      showToast('تم حذف التقييم');
      setDeleteConfirmId(null);
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حذف التقييم');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Review>[] = useMemo(() => [
    {
      key: 'product',
      label: 'المنتج',
      render: (review) => {
        const imgUrl = resolveMediaUrl(review.product.imageUrl);
        const productName = localizedName(review.product.translations, 'منتج');
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {imgUrl ? (
              <img src={imgUrl} alt={productName} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, background: 'var(--br-cream)' }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 6, background: 'var(--br-cream)' }} />
            )}
            <span style={{ fontWeight: 600, fontSize: 14 }}>{productName}</span>
          </div>
        );
      },
    },
    {
      key: 'customer',
      label: 'العميل',
      render: (review) => <span>{review.user?.fullName || review.guestName || 'زائر'}</span>,
    },
    {
      key: 'rating',
      label: 'التقييم',
      render: (review) => (
        <span style={{ color: 'var(--br-gold)', fontSize: 16, letterSpacing: 2, direction: 'ltr', display: 'inline-block' }}>
          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
        </span>
      ),
    },
    {
      key: 'comment',
      label: 'التعليق',
      style: { maxWidth: 240 },
      render: (review) => <span style={{ color: 'var(--br-muted)', fontSize: 13 }}>{truncate(review.comment, 60)}</span>,
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (review) => (
        <span className="badge" style={statusColors[review.status]}>{statusLabels[review.status]}</span>
      ),
    },
    {
      key: 'verified',
      label: 'موثق',
      render: (review) => review.verifiedPurchase
        ? <span className="badge badge-success">مشتريات موثقة</span>
        : <span style={{ color: 'var(--br-muted)', fontSize: 13 }}>-</span>,
    },
    {
      key: 'createdAt',
      label: 'التاريخ',
      render: (review) => (
        <span style={{ fontSize: 13, color: 'var(--br-muted)', whiteSpace: 'nowrap' }}>{formatDate(review.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (review) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {review.status === 'PENDING' && (
            <>
              <button onClick={() => approve(review)} disabled={updatingId === review.id} className="btn btn-sm btn-primary">
                {updatingId === review.id ? '...' : 'قبول'}
              </button>
              <button onClick={() => reject(review)} disabled={updatingId === review.id} className="btn btn-sm" style={{ background: 'var(--br-danger)', color: 'white' }}>
                رفض
              </button>
            </>
          )}
          <button onClick={() => openReply(review)} className="btn btn-sm" style={{ background: 'var(--br-cream)' }}>رد</button>
          <button onClick={() => setDeleteConfirmId(review.id)} className="btn btn-sm btn-danger">حذف</button>
        </div>
      ),
    },
  ], [updatingId]);

  return (
    <div dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>التقييمات</h1>
          <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>إدارة تقييمات العملاء والرد عليها.</p>
        </div>
        <button onClick={loadReviews} className="btn" style={{ background: 'var(--br-black)', color: 'white' }}>تحديث</button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {statusTabs.map(tab => (
            <button
              key={tab.value || 'ALL'}
              onClick={() => setStatusFilter(tab.value)}
              className={`btn btn-sm ${statusFilter === tab.value ? 'btn-primary' : ''}`}
              style={statusFilter === tab.value ? undefined : { background: 'var(--br-cream)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.4fr) minmax(160px, 1fr) 120px auto 160px 160px', gap: 12, alignItems: 'end' }}>
          <input className="input" placeholder="بحث بتعليق المنتج أو اسم العميل" value={search} onChange={e => setSearch(e.target.value)} />
          <input className="input" placeholder="معرف المنتج (اختياري)" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
          <select className="input" value={ratingFilter} onChange={e => setRatingFilter(e.target.value === '' ? '' : Number(e.target.value))}>
            <option value="">كل التقييمات</option>
            {ratingOptions.map(r => (
              <option key={r} value={r}>{r} نجوم</option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} />
            مشتريات موثقة فقط
          </label>
          <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <input type="date" className="input" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
      </div>

      {error && !loading && (
        <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16 }}>{error}</div>
      )}

      <AdminDataTable
        columns={columns}
        data={reviews}
        loading={loading}
        error={error}
        onRetry={loadReviews}
        emptyMessage="لا توجد تقييمات ضمن الفلاتر الحالية"
        rowKey={r => r.id}
      />

      {pagination && pagination.totalPages > 1 && !loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
          <button
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ background: page <= 1 ? 'var(--br-cream)' : 'var(--br-black)', color: page <= 1 ? 'var(--br-muted)' : 'white' }}
          >
            السابق
          </button>
          <span style={{ fontSize: 14, color: 'var(--br-muted)' }}>الصفحة {pagination.page} من {pagination.totalPages}</span>
          <button
            className="btn btn-sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            style={{ background: page >= pagination.totalPages ? 'var(--br-cream)' : 'var(--br-black)', color: page >= pagination.totalPages ? 'var(--br-muted)' : 'white' }}
          >
            التالي
          </button>
        </div>
      )}

      {replyModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => { if (!savingReply) { setReplyModalOpen(false); setReplyReviewId(null); setReplyText(''); } }}>
          <div className="card" style={{ width: '90%', maxWidth: 480, padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>الرد على التقييم</h3>
            <textarea className="input" style={{ width: '100%', minHeight: 120, resize: 'vertical' }} placeholder="اكتب ردك هنا..." value={replyText} onChange={e => setReplyText(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={saveReply} disabled={savingReply || !replyText.trim()} className="btn btn-primary">
                {savingReply ? 'جاري الحفظ...' : 'حفظ الرد'}
              </button>
              <button onClick={() => { setReplyModalOpen(false); setReplyReviewId(null); setReplyText(''); }} className="btn" style={{ background: 'var(--br-cream)' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => { if (!deleting) setDeleteConfirmId(null); }}>
          <div className="card" style={{ width: '90%', maxWidth: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>تأكيد الحذف</h3>
            <p style={{ color: 'var(--br-muted)', marginBottom: 16 }}>هل أنت متأكد من حذف هذا التقييم؟ لا يمكن التراجع عن هذه الخطوة.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={confirmDelete} disabled={deleting} className="btn btn-sm btn-danger">
                {deleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
              <button onClick={() => setDeleteConfirmId(null)} disabled={deleting} className="btn btn-sm" style={{ background: 'var(--br-cream)' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: 'var(--br-black)', color: 'white', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
