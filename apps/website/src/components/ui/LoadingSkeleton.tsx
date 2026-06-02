import { CSSProperties, ReactNode } from 'react';

export function SkeletonLine({ width = '100%', height = 16, style }: { width?: string | number; height?: number; style?: CSSProperties }) {
  return <div className="skeleton skeleton--line" style={{ width, height, ...style }} />;
}

export function SkeletonCard({ lines = 3, variant }: { lines?: number; variant?: 'product' | 'stat' }) {
  return (
    <div className={`card skeleton-card ${variant ? `skeleton-card--${variant}` : ''}`}>
      {variant === 'product' && <div className="skeleton skeleton--media" />}
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6, columns = 3, variant }: { count?: number; columns?: number; variant?: 'product' | 'stat' }) {
  return (
    <div className="skeleton-grid" style={{ '--skeleton-columns': columns } as CSSProperties}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      <div className="grid-stats" style={{ marginBottom: 32 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} variant="stat" lines={2} />
        ))}
      </div>
      <SkeletonCard lines={4} />
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="page-shell">
      <div className="skeleton skeleton--hero" />
      <div className="container" style={{ marginTop: 32 }}>
        <SkeletonGrid count={3} columns={3} variant="product" />
      </div>
    </div>
  );
}
