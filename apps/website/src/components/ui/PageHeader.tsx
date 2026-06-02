'use client';
import { ReactNode } from 'react';

type PageHeaderAlign = 'start' | 'center';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  align?: PageHeaderAlign;
}

export function PageHeader({ eyebrow, title, description, actions, align = 'start' }: PageHeaderProps) {
  return (
    <div className={`section-heading page-header--${align}`}>
      <div>
        {eyebrow && <div className="section-eyebrow">{eyebrow}</div>}
        <h1 className="section-title">{title}</h1>
        {description && <p className="section-copy">{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}
