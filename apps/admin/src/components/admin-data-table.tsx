'use client';
import { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  style?: React.CSSProperties;
}

type AdminDataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  rowKey: (item: T) => string;
};

export default function AdminDataTable<T>({
  columns, data, loading, error, onRetry, emptyMessage = 'لا توجد بيانات', rowKey,
}: AdminDataTableProps<T>) {
  if (loading) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--br-muted)' }}>
        جاري التحميل...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--br-danger)', marginBottom: 12 }}>{error}</p>
        {onRetry && (
          <button className="btn btn-primary" onClick={onRetry}>إعادة المحاولة</button>
        )}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--br-muted)' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={col.style}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={rowKey(item)}>
              {columns.map(col => (
                <td key={col.key} style={col.style}>{col.render(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
