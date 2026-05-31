'use client';
import { ReactNode, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table';

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  style?: React.CSSProperties;
  minWidth?: number;
  image?: boolean;
  sortable?: boolean;
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
  compact?: boolean;
  hideColumnsOnMobile?: string[];
  minTableWidth?: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function ImageCell({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div style={{ width: 52, height: 52, borderRadius: 8, background: 'var(--br-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--br-muted)', flexShrink: 0 }}>
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }
  return <img src={src} alt={alt} style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
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

function SkeletonRows({ cols, count = 5 }: { cols: number; count?: number }) {
  const widths = ['55%', '70%', '45%', '60%', '50%', '65%', '40%'];
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="dt-skeleton-row" style={{ height: 53 }}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j}><div style={{ height: 14, width: widths[j % widths.length], background: 'var(--br-cream)', borderRadius: 4 }} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function AdminDataTable<T>({
  columns, data, loading, error, onRetry, emptyMessage = 'لا توجد بيانات', rowKey,
  page, totalPages, onPageChange, onRowClick, actions, imageUrl,
  compact, hideColumnsOnMobile = [], minTableWidth,
}: AdminDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  type Accessor = T[keyof T] | string | number;

  const tableColumns = useMemo<ColumnDef<T, Accessor>[]>(() => {
    return columns.map(col => {
      const sortAccessor = (row: T): string | number => {
        const v = col.render(row);
        if (typeof v === 'string') return v;
        if (typeof v === 'number') return v;
        return '';
      };
      return {
        id: col.key,
        header: col.label,
        accessorFn: sortAccessor,
        enableSorting: col.sortable ?? true,
        cell: ({ row }) => {
          const item = row.original;
          if (col.image && imageUrl) {
            return <ImageCell src={imageUrl(item)} alt={String(col.render(item) ?? '')} />;
          }
          return col.render(item);
        },
        meta: { style: col.style, minWidth: col.minWidth } as Record<string, unknown>,
      };
    });
  }, [columns, imageUrl]);

  const tableInstance = useReactTable<T>({
    data,
    columns: tableColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
  });

  /* --- Loading --- */
  if (loading) {
    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <style>{pulseStyles}</style>
        <div className="dt-scroll">
          <table className="table dt-sticky">
            <thead>
              <tr>{columns.map(col => <th key={col.key} style={{ ...col.style, minWidth: col.minWidth }}>{col.label}</th>)}</tr>
            </thead>
            <tbody><SkeletonRows cols={columns.length} count={5} /></tbody>
          </table>
        </div>
      </div>
    );
  }

  /* --- Error --- */
  if (error) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--br-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ color: 'var(--br-danger)', marginBottom: 12, fontSize: 14 }}>{error}</p>
        {onRetry && <button className="btn btn-primary btn-sm" onClick={onRetry}>إعادة المحاولة</button>}
      </div>
    );
  }

  /* --- Empty --- */
  if (data.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--br-muted)' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <p style={{ fontSize: 14 }}>{emptyMessage}</p>
      </div>
    );
  }

  const hasActions = !!actions;
  const mobileColumns = columns.filter(col => !hideColumnsOnMobile.includes(col.key));
  const tableStyle: React.CSSProperties = minTableWidth ? { minWidth: minTableWidth } : {};
  const cellStyle: React.CSSProperties = compact ? { padding: '8px 10px', fontSize: 13 } : {};

  const headerGroup = tableInstance.getHeaderGroups()[0];

  return (
    <>
      <style>{pulseStyles}</style>
      <div className="card" style={{ padding: 0 }}>
        {/* Desktop table */}
        <div className="dt-scroll dt-desktop">
          <table className="table dt-sticky" style={tableStyle}>
            <thead>
              <tr>
                {headerGroup.headers.map(header => {
                  const meta = header.column.columnDef.meta as any;
                  return (
                    <th
                      key={header.id}
                      style={{
                        cursor: header.column.getCanSort() ? 'pointer' : undefined,
                        userSelect: 'none',
                        ...meta?.style,
                        minWidth: meta?.minWidth,
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? ''}
                    </th>
                  );
                })}
                {hasActions && <th style={{ textAlign: 'left', width: 1 }} />}
              </tr>
            </thead>
            <tbody>
              {tableInstance.getRowModel().rows.map(row => (
                <tr
                  key={rowKey(row.original)}
                  onClick={() => onRowClick?.(row.original)}
                  style={{ cursor: onRowClick ? 'pointer' : undefined }}
                >
                  {row.getVisibleCells().map(cell => {
                    return (
                      <td key={cell.id} style={cellStyle}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                  {hasActions && (
                    <td style={{ textAlign: 'left', whiteSpace: 'nowrap', ...cellStyle }} onClick={e => e.stopPropagation()}>
                      {actions!(row.original)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="dt-mobile" style={{ flexDirection: 'column', gap: compact ? 8 : 12, padding: compact ? 12 : 16 }}>
          {data.map(item => (
            <div key={rowKey(item)} className="card" style={{ padding: compact ? 12 : 16, cursor: onRowClick ? 'pointer' : undefined }} onClick={() => onRowClick?.(item)}>
              {mobileColumns.map(col => (
                <div key={col.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: compact ? 13 : 14, gap: 8 }}>
                  <span style={{ color: 'var(--br-muted)', fontWeight: 600, fontSize: compact ? 12 : 13, whiteSpace: 'nowrap' }}>{col.label}</span>
                  <span style={{ textAlign: 'left' }}>
                    {col.image && imageUrl ? <ImageCell src={imageUrl(item)} alt={String(col.render(item) ?? '')} /> : col.render(item)}
                  </span>
                </div>
              ))}
              {hasActions && <div style={{ marginTop: 8, textAlign: 'left' }} onClick={e => e.stopPropagation()}>{actions!(item)}</div>}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages !== undefined && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderTop: '1px solid #eee' }}>
            <button className="btn btn-primary btn-sm" disabled={page === 1 || page === undefined} onClick={() => onPageChange?.((page ?? 1) - 1)} style={{ opacity: page === 1 || page === undefined ? 0.4 : 1 }}>
              السابق
            </button>
            <span style={{ fontSize: 14, color: 'var(--br-muted)' }}>{page ?? 1} / {totalPages}</span>
            <button className="btn btn-primary btn-sm" disabled={page === totalPages} onClick={() => onPageChange?.((page ?? 1) + 1)} style={{ opacity: page === totalPages ? 0.4 : 1 }}>
              التالي
            </button>
          </div>
        )}
      </div>
    </>
  );
}
