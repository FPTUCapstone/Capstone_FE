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
};

export function AuthShell({ admin = false, backHref, backLabel, children, description, eyebrow, title }: AuthShellProps) {
  const brandContext = admin ? 'admin' : 'main';
  const returnHref = backHref ?? (admin ? ROUTES.admin.login : ROUTES.signIn);
  const returnLabel = backLabel ?? (admin ? 'Back to Admin Login' : 'Back to Sign In');

  return (
    <main className={`min-h-screen ${admin ? 'bg-[#eef2f6]' : 'bg-[#f6f8fa]'}`}>
      <header className={`border-b px-5 py-4 sm:px-8 ${admin ? 'border-[#314863] bg-[#00152a] text-white' : 'border-[#d8dadd] bg-white text-[#00152a]'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href={ROUTES.home} aria-label="TripMate home">
            <BrandLogo context={brandContext} inverse={admin} />
          </Link>
          <Link
            href={returnHref}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${admin ? 'text-[#71f8e4] hover:bg-white/10' : 'text-[#006b5f] hover:bg-[#e8f7f4]'}`}
          >
            {returnLabel}
          </Link>
        </div>
      </header>

      <div className={`mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl ${admin ? 'place-items-center px-4 py-10' : 'lg:grid-cols-[minmax(0,1fr)_minmax(420px,540px)]'}`}>
        {!admin ? (
          <aside className="sr-only overflow-hidden bg-[#00283a] px-12 py-16 text-white lg:not-sr-only lg:relative lg:flex lg:flex-col lg:justify-between" aria-label="TripMate travel context">
            <div className="absolute -right-24 top-20 h-80 w-80 rounded-full border border-[#4fdbc8]/35" />
            <div className="absolute -right-8 top-44 h-80 w-80 rounded-full border border-white/25" />
            <div className="relative max-w-xl">
              <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-[#71f8e4]">{eyebrow}</p>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">{title}</h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-[#d1e4ff]">{description}</p>
            </div>
            <div className="relative rounded-2xl border border-white/20 bg-white/10 p-5 text-sm leading-relaxed text-[#eff1f4] backdrop-blur-sm">
              TripMate Web supports discovery and account preparation. Active-trip and device-dependent experiences remain in the Mobile experience.
            </div>
          </aside>
        ) : null}

        <div className={`w-full px-4 py-8 sm:px-8 ${admin ? 'max-w-lg' : 'flex items-center justify-center lg:px-12'}`}>
          <section className="w-full max-w-xl rounded-3xl border border-[#d8dadd] bg-white p-6 shadow-[0_20px_55px_rgba(0,21,42,0.10)] sm:p-8">
            {admin ? (
              <div className="mb-7 text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#006b5f]">{eyebrow}</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#00152a]">{title}</h1>
                <p className="mt-3 text-sm leading-relaxed text-[#59616b]">{description}</p>
              </div>
            ) : null}
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
