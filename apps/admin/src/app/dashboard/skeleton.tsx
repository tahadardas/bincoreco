export function DashboardSkeleton() {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div className="skeleton" style={{ width: '40%', height: 24, marginBottom: 12 }} />
          <div className="skeleton" style={{ width: '60%', height: 16 }} />
        </div>
      </div>
      <div className="grid-stats" style={{ marginBottom: 32 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div className="skeleton" style={{ width: '60%', height: 34, margin: '0 auto 12px' }} />
            <div className="skeleton" style={{ width: '40%', height: 14, margin: '0 auto' }} />
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div className="skeleton" style={{ width: '30%', height: 20, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '100%', height: 40, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '100%', height: 40, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '100%', height: 40, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '100%', height: 40 }} />
      </div>
    </div>
  );
}
