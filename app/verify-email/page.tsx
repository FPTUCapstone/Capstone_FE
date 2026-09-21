import type { Metadata } from 'next';
import HeroPanel from '@/components/registration/HeroPanel';
import BrandLogo from '@/components/registration/BrandLogo';
import { VerifyEmailHandler } from '@/features/traveler/registration/VerifyEmailHandler';

export const metadata: Metadata = { title: 'Verify Email - TripMate' };

type PageProps = {
  searchParams: Promise<{
    mode?: string;
    oobCode?: string;
    apiKey?: string;
  }>;
};

export default async function VerifyEmailRoute({ searchParams }: PageProps) {
  const { mode, oobCode } = await searchParams;

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.2fr_1fr] lg:items-start">
      {/* LEFT: HERO PANEL */}
      <HeroPanel />

      {/* RIGHT: VERIFY HANDLER */}
      <main className="flex min-h-screen items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-brand-surface relative">
        {/* Mobile brand header (hidden on desktop) */}
        <div className="absolute top-6 left-6 lg:hidden flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-navy to-brand-navyContainer flex items-center justify-center shadow-md text-white">
            <BrandLogo size={22} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-brand-navy">
            TripMate
          </span>
        </div>

        <div className="w-full max-w-[480px]">
          <VerifyEmailHandler mode={mode} oobCode={oobCode} />

          <p className="mt-6 text-center text-[11px] text-slate-400 leading-relaxed">
            Need help? Contact TripMate Customer Support.
            <br />© 2026 TripMate — Your Journey, Powered by Technology.
          </p>
        </div>
      </main>
    </div>
  );
}
