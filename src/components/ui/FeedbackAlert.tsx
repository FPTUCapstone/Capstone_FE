import type { ReactNode } from 'react';

type FeedbackAlertProps = {
  children: ReactNode;
  title?: string;
  tone?: 'info' | 'success' | 'warning' | 'error';
};

const tones = {
  info: 'border-[#9edbd2] bg-[#e8f7f4] text-[#005048]',
  success: 'border-[#85d5c9] bg-[#e5f5f1] text-[#005048]',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  error: 'border-[#ffb4a8] bg-[#fff0ed] text-[#93000a]',
};

const icons = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

export function FeedbackAlert({ children, title, tone = 'info' }: FeedbackAlertProps) {
  return (
    <div className={`flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>
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
