import type { ReactNode } from 'react';

type StatusBadgeProps = {
  children: ReactNode;
  tone?: 'teal' | 'coral' | 'neutral';
};

const tones = {
  teal: 'bg-[#6df5e1]/30 text-[#006b5f]',
  coral: 'bg-[#ffdad4] text-[#872015]',
  neutral: 'bg-[#e0e3e6] text-[#43474d]',
};

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}
