import { ReactNode } from 'react';

type AlertTone = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  tone: AlertTone;
  title?: string;
  children: ReactNode;
}

const toneClasses: Record<AlertTone, string> = {
  error: 'alert alert--error',
  success: 'alert alert--success',
  warning: 'alert alert--warning',
  info: 'alert alert--info',
};

export function Alert({ tone, title, children }: AlertProps) {
  const isAlert = tone === 'error' || tone === 'warning';
  return (
    <div className={toneClasses[tone]} role={isAlert ? 'alert' : 'status'}>
      {title && <strong className="alert__title">{title}</strong>}
      <div className="alert__body">{children}</div>
    </div>
  );
}
