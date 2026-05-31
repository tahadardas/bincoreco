'use client';
import { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  style?: React.CSSProperties;
  minWidth?: number;
  image?: boolean;
}

export interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  rowKey: (item: T) => string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => ReactNode;
  imageUrl?: (item: T) => string | null | undefined;
}

function ImageCell({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div
        style={{
          width: 52, height: 52, borderRadius: 8,
          background: 'var(--br-cream)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: 'var(--br-muted)', flexShrink: 0,
        }}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

function SkeletonRows({ cols, count = 5 }: { cols: number; count?: number }) {
  const widths = ['55%', '70%', '45%', '60%', '50%', '65%', '40%'];
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="dt-skeleton-row" style={{ height: 53 }}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j}>
              <div
                style={{
                  height: 14, width: widths[j % widths.length],
                  background: 'var(--br-cream)', borderRadius: 4,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

const pulseStyles = `
@keyframes dt-pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
.dt-skeleton-row { animation:dt-pulse 1.5s ease-in-out infinite }
@media (prefers-reduced-motion:reduce){ .dt-skeleton-row{animation:none;opacity:.5} }
.dt-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch }
.dt-scroll::-webkit-scrollbar { height:6px }
.dt-scroll::-webkit-scrollbar-thumb { background:#ccc; border-radius:3px }
.dt-sticky th { position:sticky; top:0; background:var(--br-white); z-index:2 }
.dt-sticky th::after { content:''; position:absolute; bottom:0; left:0; right:0; height:1px; background:#eee }
@media (max-width:767px) { .dt-desktop{display:none!important} .dt-mobile{display:flex!important} }
@media (min-width:768px) { .dt-mobile{display:none!important} }
`;

export default function AdminDataTable<T>({
  columns, data, loading, error, onRetry, emptyMessage = 'لا توجد بيانات', rowKey,
  page, totalPages, onPageChange, onRowClick, actions, imageUrl,
}: AdminDataTableProps<T>) {
  if (loading) {
    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <style>{pulseStyles}</style>
        <div className="dt-scroll">
          <table className="table dt-sticky">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key} style={{ ...col.style, minWidth: col.minWidth }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SkeletonRows cols={columns.length} count={5} />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--br-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ color: 'var(--br-danger)', marginBottom: 12, fontSize: 14 }}>{error}</p>
        {onRetry && (
          <button className="btn btn-primary btn-sm" onClick={onRetry}>إعادة المحاولة</button>
        )}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--br-muted)' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <p style={{ fontSize: 14 }}>{emptyMessage}</p>
      </div>
    );
  }

  const hasActions = !!actions;

  const renderCell = (item: T, col: Column<T>) => {
    if (col.image && imageUrl) {
      return <ImageCell src={imageUrl(item)} alt={String(col.render(item) ?? '')} />;
    }
    return col.render(item);
  };

  const visibleColumns = columns;

  return (
    <>
      <style>{pulseStyles}</style>
      <div className="card" style={{ padding: 0 }}>
        <div className="dt-scroll dt-desktop">
          <table className="table dt-sticky">
            <thead>
              <tr>
                {visibleColumns.map(col => (
                  <th key={col.key} style={{ ...col.style, minWidth: col.minWidth }}>{col.label}</th>
                ))}
                {hasActions && <th style={{ textAlign: 'left', width: 1 }} />}
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr
                  key={rowKey(item)}
                  onClick={() => onRowClick?.(item)}
                  style={{ cursor: onRowClick ? 'pointer' : undefined }}
                >
                  {visibleColumns.map(col => (
                    <td key={col.key} style={{ ...col.style, minWidth: col.minWidth }}>
                      {renderCell(item, col)}
                    </td>
                  ))}
                  {hasActions && (
                    <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      {actions!(item)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dt-mobile" style={{ flexDirection: 'column', gap: 12, padding: 16 }}>
          {data.map(item => (
            <div
              key={rowKey(item)}
              className="card"
              style={{ padding: 16, cursor: onRowClick ? 'pointer' : undefined }}
              onClick={() => onRowClick?.(item)}
            >
              {visibleColumns.map(col => (
                <div
                  key={col.key}
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14, gap: 8,
                  }}
                >
                  <span style={{ color: 'var(--br-muted)', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
                    {col.label}
                  </span>
                  <span style={{ textAlign: 'left' }}>{renderCell(item, col)}</span>
                </div>
              ))}
              {hasActions && (
                <div style={{ marginTop: 8, textAlign: 'left' }} onClick={e => e.stopPropagation()}>
                  {actions!(item)}
                </div>
              )}
            </div>
          ))}
        </div>

        {totalPages !== undefined && totalPages > 1 && (
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 16px', borderTop: '1px solid #eee',
            }}
          >
            <button
              className="btn btn-primary btn-sm"
              disabled={page === 1 || page === undefined}
              onClick={() => onPageChange?.((page ?? 1) - 1)}
              style={{ opacity: page === 1 || page === undefined ? 0.4 : 1 }}
            >
              السابق
            </button>
            <span style={{ fontSize: 14, color: 'var(--br-muted)' }}>
              {page ?? 1} / {totalPages}
            </span>
            <button
              className="btn btn-primary btn-sm"
              disabled={page === totalPages}
              onClick={() => onPageChange?.((page ?? 1) + 1)}
              style={{ opacity: page === totalPages ? 0.4 : 1 }}
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </>
  );
}
