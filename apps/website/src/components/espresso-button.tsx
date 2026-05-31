'use client';
import { ButtonHTMLAttributes, ReactNode, useState, useRef } from 'react';

type EspressoButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: 'gold' | 'dark' | 'cream' | 'outline';
  size?: 'small' | 'medium' | 'large' | 'fullWidth';
  loading?: boolean;
};

export default function EspressoButton({
  children,
  tone = 'gold',
  size = 'medium',
  loading = false,
  className = '',
  disabled,
  onClick,
  ...props
}: EspressoButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const rippleId = useRef(0);
  const [pressed, setPressed] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++rippleId.current;
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    onClick?.(e);
  };

  const classes = [
    'espresso-button',
    tone !== 'gold' ? `espresso-button--${tone}` : '',
    size !== 'medium' ? `espresso-button--${size}` : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={pressed ? { transform: 'scale(0.97)' } : undefined}
      {...props}
    >
      {!loading && <span className="espresso-button__steam" aria-hidden="true">
        <span /><span /><span />
      </span>}
      <span className="espresso-button__text">{loading ? 'جاري التحميل...' : children}</span>
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="espresso-button__ripple"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
      <span className="espresso-button__saucer" aria-hidden="true" />
    </button>
  );
}
