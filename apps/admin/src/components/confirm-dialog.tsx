import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  icon?: ReactNode;
}

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'primary',
  icon,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'grid', placeItems: 'center',
        background: 'rgba(0,0,0,0.55)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className="card"
        style={{
          maxWidth: 420, width: '90%', padding: 28,
          textAlign: 'center',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {icon && <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>}
        <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--br-muted)', marginBottom: 24, lineHeight: 1.6 }}>{description}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            className="btn btn-sm"
            style={{ background: 'var(--br-cream)', minWidth: 80 }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`btn btn-sm ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            style={{ minWidth: 80 }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
