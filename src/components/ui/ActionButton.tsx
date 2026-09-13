import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'coral' | 'outline';
};

const variants = {
  primary: 'bg-[#1D4ED8] text-white hover:bg-[#2563EB] shadow-xs active:scale-[0.99]',
  secondary: 'bg-[#0F1B2D] text-white hover:bg-[#33425A]',
  coral: 'bg-[#FF6A3D] text-white hover:bg-[#E8582C]',
  outline: 'border border-[#E1E8F3] bg-[#F4F7FC] text-[#33425A] hover:bg-[#E8EEF8] hover:border-[#6B7C97]',
};

export function ActionButton({ children, className = '', disabled, loading, variant = 'primary', ...props }: ActionButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold tracking-[0.3px] transition focus-visible:outline-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}
