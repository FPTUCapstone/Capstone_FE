import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'coral' | 'outline';
};

const variants = {
  primary: 'bg-[#00152a] text-white hover:bg-[#102a43]',
  secondary: 'bg-[#007d6e] text-white hover:bg-[#006b5f]',
  coral: 'bg-[#eb5b49] text-white hover:bg-[#d94b3a]',
  outline: 'border border-[#9aa1aa] bg-white text-[#00152a] hover:border-[#006b5f] hover:bg-[#e8f7f4]',
};

export function ActionButton({ children, className = '', disabled, loading, variant = 'primary', ...props }: ActionButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition focus-visible:outline-[#4fdbc8] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}
