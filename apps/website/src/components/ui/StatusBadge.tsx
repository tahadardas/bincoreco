interface StatusBadgeProps {
  status: string;
  label?: string;
}

const statusToneMap: Record<string, string> = {
  PENDING: 'badge badge--warning',
  ACCEPTED: 'badge badge--gold',
  PREPARING: 'badge badge--coffee',
  READY_FOR_PICKUP: 'badge badge--success',
  PICKED_UP: 'badge badge--muted',
  CANCELLED: 'badge badge--danger',
};

const statusIcons: Record<string, string> = {
  PENDING: '⏳',
  ACCEPTED: '✓',
  PREPARING: '☕',
  READY_FOR_PICKUP: '📦',
  PICKED_UP: '✓',
  CANCELLED: '✕',
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const className = statusToneMap[status] || 'badge badge--muted';
  const icon = statusIcons[status] || '';
  return (
    <span className={className}>
      {icon && <span className="badge__icon">{icon}</span>}
      {label || status}
    </span>
  );
}
