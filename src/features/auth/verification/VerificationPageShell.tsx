import type { ReactNode } from 'react';

import BrandLogo from '@/components/registration/BrandLogo';
import HeroPanel from '@/components/registration/HeroPanel';

type VerificationPageShellProps = {
  children: ReactNode;
};

export function VerificationPageShell({ children }: VerificationPageShellProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.2fr_1fr] lg:items-start">
      <HeroPanel />

      <main className="flex min-h-screen items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-brand-surface relative">
        <div className="absolute top-6 left-6 lg:hidden flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-navy to-brand-navyContainer flex items-center justify-center shadow-md text-white">
            <BrandLogo size={22} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-brand-navy">
            TripMate
          </span>
        </div>

        <div className="w-full max-w-[480px]">
          {children}

          <p className="mt-6 text-center text-[11px] text-slate-400 leading-relaxed">
            Need help? Contact TripMate Customer Support.
            <br />© 2026 TripMate — Your Journey, Powered by Technology.
          </p>
        </div>
      </main>
    </div>
  );
}
