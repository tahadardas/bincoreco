'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/api';
import AdminDataTable from '@/components/admin-data-table';
import type { Column } from '@/components/admin-data-table';

type ContactMessageStatus = 'NEW' | 'READ' | 'REPLIED' | 'ARCHIVED';

interface ContactMessage {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  source: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ContactMessagesResponse {
  data: ContactMessage[];
  pagination: Pagination;
}

const statusTabs: { value: '' | ContactMessageStatus; label: string }[] = [
  { value: 'NEW', label: 'جديد' },
  { value: 'READ', label: 'مقروء' },
  { value: 'REPLIED', label: 'تم الرد' },
  { value: 'ARCHIVED', label: 'مؤرشف' },
  { value: '', label: 'الكل' },
];

const statusLabels: Record<ContactMessageStatus, string> = {
  NEW: 'جديد',
  READ: 'مقروء',
  REPLIED: 'تم الرد',
  ARCHIVED: 'مؤرشف',
};

const statusColors: Record<ContactMessageStatus, { background: string; color: string }> = {
  NEW: { background: 'var(--br-warning)', color: 'white' },
  READ: { background: 'var(--br-info, #17a2b8)', color: 'white' },
  REPLIED: { background: 'var(--br-success)', color: 'white' },
  ARCHIVED: { background: 'var(--br-muted)', color: 'white' },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function truncate(text: string | null, max: number) {
  if (!text) return '-';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'' | ContactMessageStatus>('NEW');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const queryString = useMemo(() => {
    const query = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) query.set('status', statusFilter);
    return query.toString();
  }, [page, statusFilter]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await adminFetch<ContactMessage[]>(`/admin/contact-messages?${queryString}`);
      setMessages(items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل الرسائل');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const updateStatus = async (message: ContactMessage, newStatus: ContactMessageStatus) => {
    setUpdatingId(message.id);
    try {
      await adminFetch(`/admin/contact-messages/${message.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      const msgs: Record<ContactMessageStatus, string> = {
        NEW: 'تم التحديث',
        READ: 'تم التحديث إلى مقروء',
        REPLIED: 'تم التحديث إلى تم الرد',
        ARCHIVED: 'تم الأرشفة',
      };
      showToast(msgs[newStatus]);
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث الرسالة');
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: Column<ContactMessage>[] = useMemo(() => [
    {
      key: 'fullName',
      label: 'الاسم الكامل',
      render: (msg) => <span style={{ fontWeight: 600, fontSize: 14 }}>{msg.fullName}</span>,
    },
    {
      key: 'phone',
      label: 'الهاتف',
      render: (msg) => <span style={{ fontSize: 13, direction: 'ltr', display: 'inline-block' }}>{msg.phone}</span>,
    },
    {
      key: 'email',
      label: 'البريد الإلكتروني',
      render: (msg) => <span style={{ fontSize: 13, color: 'var(--br-muted)' }}>{msg.email}</span>,
    },
    {
      key: 'subject',
      label: 'الموضوع',
      render: (msg) => <span style={{ fontWeight: 500, fontSize: 14 }}>{msg.subject}</span>,
    },
    {
      key: 'message',
      label: 'الرسالة',
      style: { maxWidth: 240 },
      render: (msg) => <span style={{ color: 'var(--br-muted)', fontSize: 13 }}>{truncate(msg.message, 100)}</span>,
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (msg) => (
        <span className="badge" style={statusColors[msg.status]}>{statusLabels[msg.status]}</span>
      ),
    },
    {
      key: 'source',
      label: 'المصدر',
      render: (msg) => <span style={{ fontSize: 13, color: 'var(--br-muted)' }}>{msg.source}</span>,
    },
    {
      key: 'createdAt',
      label: 'تاريخ الإرسال',
      render: (msg) => (
        <span style={{ fontSize: 13, color: 'var(--br-muted)', whiteSpace: 'nowrap' }}>{formatDate(msg.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (msg) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {msg.status === 'NEW' && (
            <button
              onClick={() => updateStatus(msg, 'READ')}
              disabled={updatingId === msg.id}
              className="btn btn-sm"
              style={{ background: 'var(--br-info, #17a2b8)', color: 'white' }}
            >
              {updatingId === msg.id ? '...' : 'مقروء'}
            </button>
          )}
          {msg.status !== 'REPLIED' && msg.status !== 'ARCHIVED' && (
            <button
              onClick={() => updateStatus(msg, 'REPLIED')}
              disabled={updatingId === msg.id}
              className="btn btn-sm"
              style={{ background: 'var(--br-success)', color: 'white' }}
            >
              تم الرد
            </button>
          )}
          {msg.status !== 'ARCHIVED' && (
            <button
              onClick={() => updateStatus(msg, 'ARCHIVED')}
              disabled={updatingId === msg.id}
              className="btn btn-sm"
              style={{ background: 'var(--br-cream)' }}
            >
              أرشفة
            </button>
          )}
        </div>
      ),
    },
  ], [updatingId]);

  return (
    <div dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>رسائل الاتصال</h1>
          <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>إدارة رسائل العملاء الواردة.</p>
        </div>
        <button onClick={loadMessages} className="btn" style={{ background: 'var(--br-black)', color: 'white' }}>تحديث</button>
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
      </div>

      {error && !loading && (
        <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16 }}>{error}</div>
      )}

      <AdminDataTable
        columns={columns}
        data={messages}
        loading={loading}
        error={error}
        onRetry={loadMessages}
        emptyMessage="لا توجد رسائل ضمن الفلاتر الحالية"
        rowKey={m => m.id}
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

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: 'var(--br-black)', color: 'white', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
