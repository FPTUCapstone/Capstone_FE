import type { ReactNode } from 'react';

type StatusBadgeProps = {
  children: ReactNode;
  tone?: 'teal' | 'coral' | 'neutral' | 'warning' | 'danger';
};

const tones = {
  teal: 'bg-[#6df5e1]/30 text-[#006b5f]',
  coral: 'bg-[#ffdad4] text-[#872015]',
  neutral: 'bg-[#e0e3e6] text-[#43474d]',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-[#ffdad6] text-[#93000a]',
};

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}
