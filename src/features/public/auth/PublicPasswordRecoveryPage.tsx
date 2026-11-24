import Image from 'next/image';
import Link from 'next/link';

import { PasswordRecoveryFlow } from '@/components/auth/PasswordRecoveryFlow';
import BrandLogo from '@/components/BrandLogo';
import { ROUTES } from '@/lib/routes';

export function PublicPasswordRecoveryPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* Authentic Coastal Heritage Editorial Panel */}
      <aside className="relative hidden lg:flex overflow-hidden bg-[#0C2423] text-white">
        <Image
          src="/images/landing/hero-danang-sontra.jpg"
          alt="Son Tra Peninsula coastline in Da Nang"
          fill
          priority
          sizes="52vw"
          className="object-cover object-center"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C2423]/92 via-[#103B39]/45 to-[#0C2423]/35"
          aria-hidden="true"
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-14">
          <Link
            href={ROUTES.home}
            className="inline-flex w-fit items-center gap-2.5 text-white transition-opacity hover:opacity-90"
          >
            <BrandLogo size={26} inverse />
            <span className="text-xl font-extrabold tracking-tight">TripMate</span>
          </Link>

          <div className="max-w-md space-y-3">
            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-white xl:text-[42px]">
              Get back to your trip.
            </h1>
            <p className="text-[15px] leading-relaxed text-white/80">
              Confirm the 6-digit code sent to your email and set a new password to continue planning across Central Vietnam.
            </p>
            <p className="pt-2 text-xs font-medium tracking-wide text-white/60">
              Son Tra Peninsula, Da Nang
            </p>
          </div>
        </div>
      </aside>

      {/* Recovery Form Canvas */}
      <main className="relative flex flex-col items-center justify-center bg-brand-surface px-5 py-10 sm:px-10 lg:px-14">
        <div
          aria-label="TripMate brand"
          className="absolute top-6 left-6 flex items-center gap-2 lg:hidden"
        >
          <BrandLogo size={22} className="text-brand-teal" />
          <span className="text-lg font-extrabold tracking-tight text-brand-navy">TripMate</span>
        </div>

        <div className="w-full max-w-[440px] pt-12 lg:pt-0">
          <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-soft sm:p-8">
            <PasswordRecoveryFlow />
          </div>

          <p className="mt-5 text-center text-xs text-brand-textSecondary">
            © 2026 TripMate
          </p>
        </div>
      </main>
    </div>
  );
}
