'use client';
import { CSSProperties } from 'react';

const icons: Record<string, (size: number) => JSX.Element> = {
  espresso: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 11h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6Z" stroke="currentColor" strokeWidth="1.5"/><path d="M16 11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 2v3M10 2v3M14 2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  americano: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 11h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6Z" stroke="currentColor" strokeWidth="1.5"/><path d="M16 11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.5"/><circle cx="6" cy="7" r="1" fill="currentColor"/><circle cx="10" cy="7" r="1" fill="currentColor"/></svg>
  ),
  latte: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h10v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M15 12h1.5a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5H15" stroke="currentColor" strokeWidth="1.5"/><path d="M7 8.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  icedCoffee: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 9h10v8a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V9Z" stroke="currentColor" strokeWidth="1.5"/><path d="m10 15 2-3M9 17l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 9h10l1-3H5l1 3Z" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  beans: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><ellipse cx="9" cy="12" rx="5" ry="7" stroke="currentColor" strokeWidth="1.5" transform="rotate(-20 9 12)"/><ellipse cx="16" cy="10" rx="4" ry="6" stroke="currentColor" strokeWidth="1.5" transform="rotate(15 16 10)" opacity="0.6"/></svg>
  ),
  ground: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 14h16v2a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-2Z" stroke="currentColor" strokeWidth="1.5"/><path d="M7 13v-3M12 13v-3M17 13v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  v60: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M7 8h10l-2 12H9L7 8Z" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10v6M14 10v6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/></svg>
  ),
  turkish: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 10h12l-1.5 8a3 3 0 0 1-3 2.5h-3a3 3 0 0 1-3-2.5L6 10Z" stroke="currentColor" strokeWidth="1.5"/><path d="M4 10h16" stroke="currentColor" strokeWidth="1.5"/><path d="M10 5.5a4 4 0 0 1 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="14" r="1.5" fill="currentColor" opacity="0.4"/></svg>
  ),
  mokaPot: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10 4h4l1 4H9l1-4Z" stroke="currentColor" strokeWidth="1.5"/><rect x="6" y="8" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M12 8v7" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
  frenchPress: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="7" y="4" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="6" r="1" fill="currentColor"/><path d="M7 14h10" stroke="currentColor" strokeWidth="1"/><path d="M10 20v2M14 20v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  coldBrew: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="10" r="2" fill="currentColor" opacity="0.3"/><circle cx="12" cy="16" r="1.5" fill="currentColor" opacity="0.2"/><path d="M9 21h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  rewardCoins: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="12" r="6" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/><path d="M12 8v3M12 13v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  stamp: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="-8" stroke="currentColor" strokeWidth="1.5" transform="matrix(1 0 0 -1 0 24)"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  qrCard: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M14 14h2v2M18 14h2v4M14 18h4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  maestro: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2 4 8v4c0 5 3.5 9.5 8 10.5 4.5-1 8-5.5 8-10.5V8l-8-6Z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  cart: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="21" r="1" fill="currentColor"/><circle cx="20" cy="21" r="1" fill="currentColor"/><path d="M1 1h4l3 13h11l3-8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  ),
  pickup: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8Z" stroke="currentColor" strokeWidth="1.5"/></svg>
  ),
};

type CoffeeIconName = keyof typeof icons;

const labelMap: Record<string, string> = {
  espresso: '☕',
  americano: '☕',
  latte: '☕',
  icedCoffee: '🧊',
  beans: '🫘',
  ground: '⚙️',
  v60: '⏳',
  turkish: '🏺',
  mokaPot: '🍵',
  frenchPress: '🫖',
  coldBrew: '🧊',
  rewardCoins: '🪙',
  stamp: '📬',
  qrCard: '📱',
  maestro: '🛡️',
  cart: '🛒',
  pickup: '📍',
};

type CoffeeIconProps = {
  name: CoffeeIconName | string;
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export default function CoffeeIcon({ name, size = 24, className, style }: CoffeeIconProps) {
  const icon = icons[name as CoffeeIconName];
  if (icon) {
    return (
      <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, ...style }} aria-hidden="true">
        {icon(size)}
      </span>
    );
  }
  return <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1, ...style }} aria-hidden="true">{labelMap[name] || '⚙️'}</span>;
}
