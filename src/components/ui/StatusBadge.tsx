import type { ReactNode } from 'react';

type StatusBadgeProps = {
  children: ReactNode;
  tone?: 'teal' | 'coral' | 'neutral' | 'warning' | 'danger';
};

const tones = {
  teal: 'bg-[#6df5e1]/30 text-[#174B4A]',
  coral: 'bg-[#ffdad4] text-[#872015]',
  neutral: 'bg-[#DCE2DD] text-[#5B6E69]',
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
