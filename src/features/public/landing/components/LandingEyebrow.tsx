'use client';

import type { ReactNode } from 'react';

interface LandingEyebrowProps {
  icon?: string;
  children: ReactNode;
  variant?: 'light' | 'dark';
  className?: string;
}

export function LandingEyebrow({
  icon = 'explore',
  children,
  variant = 'light',
  className = '',
}: LandingEyebrowProps) {
  const variantStyles =
    variant === 'dark'
      ? 'border-teal-400/30 bg-teal-500/10 text-teal-300'
      : 'border-teal-200 bg-teal-50 text-[#007d6e]';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.14em] shadow-xs backdrop-blur-xs ${variantStyles} ${className}`}
    >
      <span className="material-symbols-outlined text-sm leading-none" aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </div>
  );
}
