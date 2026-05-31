'use client';
import { useEffect, useRef, useState, CSSProperties, ReactNode, createElement } from 'react';

type AnimationVariant = 'fadeIn' | 'fadeUp' | 'fadeDown' | 'scaleIn';

const animationStyles: Record<AnimationVariant, CSSProperties> = {
  fadeIn: { opacity: 0 },
  fadeUp: { opacity: 0, transform: 'translateY(30px)' },
  fadeDown: { opacity: 0, transform: 'translateY(-30px)' },
  scaleIn: { opacity: 0, transform: 'scale(0.9)' },
};

const animationActive: Record<AnimationVariant, CSSProperties> = {
  fadeIn: { opacity: 1 },
  fadeUp: { opacity: 1, transform: 'translateY(0)' },
  fadeDown: { opacity: 1, transform: 'translateY(0)' },
  scaleIn: { opacity: 1, transform: 'scale(1)' },
};

export function useReveal(variant: AnimationVariant = 'fadeUp', threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const style: CSSProperties = {
    transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
    ...animationStyles[variant],
    ...(visible ? animationActive[variant] : {}),
  };

  return { ref, style, visible };
}

type RevealProps = {
  children: ReactNode;
  variant?: AnimationVariant;
  threshold?: number;
  as?: 'div' | 'section' | 'article' | 'span';
  style?: CSSProperties;
  className?: string;
};

export function Reveal({ children, variant = 'fadeUp', threshold, as = 'div', style, className }: RevealProps) {
  const { ref, style: animStyle } = useReveal(variant, threshold);
  return createElement(as, { ref, style: { ...animStyle, ...style }, className }, children);
}

type StaggerProps = {
  children: ReactNode[];
  variant?: AnimationVariant;
  staggerMs?: number;
  threshold?: number;
  as?: 'div' | 'section' | 'article';
  style?: CSSProperties;
  className?: string;
};

export function Stagger({ children, variant = 'fadeUp', staggerMs = 100, threshold = 0.05, as = 'div', style, className }: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return createElement(
    as,
    { ref, style, className },
    children.map((child, i) => (
      <div
        key={i}
        style={{
          transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * staggerMs}ms`,
          ...animationStyles[variant],
          ...(visible ? animationActive[variant] : {}),
        }}
      >
        {child}
      </div>
    )),
  );
}
