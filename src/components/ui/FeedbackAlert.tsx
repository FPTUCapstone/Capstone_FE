import type { ReactNode } from 'react';

type FeedbackAlertProps = {
  children: ReactNode;
  title?: string;
  tone?: 'info' | 'success' | 'warning' | 'error';
};

const tones = {
  info: 'border-[#C6DAFB] bg-[#EAF1FE] text-[#12379B]',
  success: 'border-[#B9E7D4] bg-[#E6F7F0] text-[#085B3E]',
  warning: 'border-[#F6DCAE] bg-[#FEF3E2] text-[#7C4A03]',
  error: 'border-[#F7C9D3] bg-[#FDECEF] text-[#8C1030]',
};

const icons = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

export function FeedbackAlert({ children, title, tone = 'info' }: FeedbackAlertProps) {
  return (
    <div className={`flex gap-2.5 rounded-xl border px-3.5 py-2.5 text-[11.5px] leading-relaxed ${tones[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span className="material-symbols-outlined mt-0.5 text-lg" aria-hidden="true">
        {icons[tone]}
      </span>
      <div>
        {title ? <p className="font-bold">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
