'use client';
import { ButtonHTMLAttributes, ReactNode } from 'react';

type EspressoButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: 'gold' | 'dark';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
};

export default function EspressoButton({
  children,
  tone = 'gold',
  size = 'medium',
  loading = false,
  className = '',
  disabled,
  ...props
}: EspressoButtonProps) {
  const classes = [
    'espresso-button',
    tone === 'dark' ? 'espresso-button--dark' : '',
    size === 'small' ? 'espresso-button--small' : '',
    size === 'large' ? 'espresso-button--large' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      <span className="espresso-button__text">{loading ? '...' : children}</span>
      <span className="espresso-button__saucer" aria-hidden="true" />
    </button>
  );
}
