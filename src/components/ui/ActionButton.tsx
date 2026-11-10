import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'coral' | 'outline' | 'teal' | 'admin' | 'forest';
};

const variants = {
  primary: 'bg-[#174B4A] text-white hover:bg-[#103B39] shadow-xs active:scale-[0.99]',
  secondary: 'bg-[#1C2928] text-white hover:bg-[#5B6E69]',
  coral: 'bg-[#995436] text-white hover:bg-[#803F25] active:bg-[#68331E] active:scale-[0.99] shadow-xs focus-visible:outline-[#995436]',
  teal: 'bg-brand-teal text-white hover:bg-brand-brightTeal active:scale-[0.98] shadow-btn',
  outline: 'border border-[#DCE2DD] bg-[#F7F5EF] text-[#5B6E69] hover:bg-[#EDEAE1] hover:border-[#5B6E69]',
  admin: 'bg-[#174B4A] text-white hover:bg-[#103B39] active:bg-[#15342B] active:scale-[0.99] shadow-xs focus-visible:outline-[#174B4A]',
  forest: 'bg-[#174B4A] text-white hover:bg-[#103B39] active:bg-[#15342B] active:scale-[0.99] shadow-xs focus-visible:outline-[#174B4A]',
};

export function ActionButton({ children, className = '', disabled, loading, variant = 'primary', ...props }: ActionButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold tracking-[0.3px] transition focus-visible:outline-[#174B4A] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}
