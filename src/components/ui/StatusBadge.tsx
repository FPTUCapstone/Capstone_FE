import type { ReactNode } from 'react';

type StatusBadgeProps = {
  children: ReactNode;
  tone?: 'teal' | 'coral' | 'neutral' | 'warning' | 'danger';
};

const tones = {
  teal: 'bg-[#E8F0EA] text-[#174B4A] border border-[#174B4A]/20',
  coral: 'bg-[#F6EDE8] text-[#995436] border border-[#995436]/20',
  neutral: 'bg-[#DCE2DD] text-[#1C2928]',
  warning: 'bg-[#FEF3E2] text-[#7C4A03] border border-[#F6DCAE]',
  danger: 'bg-[#FDECEF] text-[#8C1030] border border-[#F7C9D3]',
};

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}
