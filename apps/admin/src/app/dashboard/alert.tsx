import { ReactNode } from 'react';

type AlertTone = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  tone: AlertTone;
  title?: string;
  children: ReactNode;
}

export function Alert({ tone, children }: AlertProps) {
  const colorMap: Record<AlertTone, { bg: string; color: string; border: string }> = {
    error: { bg: '#fef2f2', color: '#b42318', border: '#fecaca' },
    success: { bg: '#f0fdf4', color: '#2e7d32', border: '#bbf7d0' },
    warning: { bg: '#fffbeb', color: '#b26a00', border: '#fde68a' },
    info: { bg: '#faf6ef', color: '#4b2e1e', border: '#e8d5b5' },
  };
  const c = colorMap[tone];
  return (
    <div className="card" style={{ background: c.bg, color: c.color, borderColor: c.border, padding: 16, fontWeight: 600, fontSize: 14 }}>
      {children}
    </div>
  );
}
