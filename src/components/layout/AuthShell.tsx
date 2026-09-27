import Link from 'next/link';
import type { ReactNode } from 'react';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { ROUTES } from '@/lib/routes';

type AuthShellProps = {
  admin?: boolean;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
  points?: string[];
  singlePanel?: boolean;
};

export function AuthShell({
  admin = false,
  backHref,
  backLabel,
  children,
  description,
  eyebrow,
  title,
  points,
  singlePanel = false,
}: AuthShellProps) {
  const brandContext = admin ? 'admin' : 'main';
  const returnHref = backHref ?? (admin ? ROUTES.admin.login : ROUTES.signIn);
  const returnLabel = backLabel ?? (admin ? 'Back to Admin Login' : 'Back to Sign In');

  return (
    <main className={`min-h-screen ${admin ? 'bg-[#0F1B2D]' : 'bg-[#F4F7FC]'}`}>
      <header className={`border-b px-5 py-4 sm:px-8 ${admin ? 'border-[#33425A] bg-[#0F1B2D] text-white' : 'border-[#E1E8F3] bg-white text-[#0F1B2D]'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href={ROUTES.home} aria-label="TripMate home">
            <BrandLogo context={brandContext} inverse={admin} />
          </Link>
          <Link
            href={returnHref}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${admin ? 'text-[#BFD7F5] hover:bg-white/10' : 'text-[#1D4ED8] hover:bg-[#EAF1FE]'}`}
          >
            {returnLabel}
          </Link>
        </div>
      </header>

      <div className={`mx-auto ${singlePanel ? 'flex min-h-[calc(100vh-73px)] items-center justify-center p-4 sm:p-8' : `grid min-h-[calc(100vh-73px)] max-w-7xl ${admin ? 'place-items-center px-4 py-10' : 'lg:grid-cols-[minmax(0,1fr)_minmax(460px,580px)]'}`}`}>
        {!admin && !singlePanel ? (
          <aside className="sr-only overflow-hidden bg-[#0F1B2D] px-12 py-16 text-white lg:not-sr-only lg:relative lg:flex lg:flex-col lg:justify-between" aria-label="TripMate travel context">
            <div className="absolute -right-24 top-20 h-80 w-80 rounded-full border border-[#2563EB]/25" />
            <div className="absolute -right-8 top-44 h-80 w-80 rounded-full border border-white/20" />
            <div className="relative max-w-xl">
              <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-[#2563EB]">{eyebrow}</p>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">{title}</h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-[#AEBED6]">{description}</p>
              {points && points.length > 0 ? (
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {points.map((point) => (
                    <div
                      key={point}
                      className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-[#EAF1FE] backdrop-blur-sm"
                    >
                      {point}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="relative rounded-2xl border border-white/15 bg-white/10 p-5 text-sm leading-relaxed text-[#AEBED6] backdrop-blur-sm">
              TripMate Web supports discovery and account preparation. Active-trip and device-dependent experiences remain in the Mobile experience.
            </div>
          </aside>
        ) : null}

        <div className={`w-full ${singlePanel ? 'max-w-md' : `px-4 py-8 sm:px-8 ${admin ? 'max-w-lg' : 'flex items-center justify-center lg:px-10'}`}`}>
          <section className="w-full rounded-2xl border border-[#E1E8F3] bg-white p-6 shadow-[0_1px_2px_rgba(15,27,45,0.06),0_8px_22px_rgba(15,27,45,0.06)] sm:p-8">
            {admin ? (
              <div className="mb-7 text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1D4ED8]">{eyebrow}</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F1B2D]">{title}</h1>
                <p className="mt-3 text-sm leading-relaxed text-[#6B7C97]">{description}</p>
              </div>
            ) : null}
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
