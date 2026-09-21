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
  title: ReactNode;
  points?: string[];
  singlePanel?: boolean;
  heroPanels?: HeroPanel[];
};

export type HeroPanel = {
  icon: 'route' | 'thunderstorm' | 'groups' | 'verified' | 'map' | 'schedule';
  title: string;
  description: string;
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
  heroPanels,
}: AuthShellProps) {
  const returnHref = backHref ?? (admin ? ROUTES.admin.login : ROUTES.signIn);
  const returnLabel = backLabel ?? (admin ? 'Back to Admin Login' : 'Back to Sign In');

  return (
    <main className={`min-h-screen ${admin ? 'bg-[#0F1B2D]' : 'bg-brand-surface font-sans'}`}>
      <header className={`border-b px-5 py-4 sm:px-8 ${admin ? 'border-[#33425A] bg-[#0F1B2D] text-white' : 'border-brand-border bg-white text-brand-textPrimary'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href={ROUTES.home} aria-label="TripMate home">
            <BrandLogo inverse={admin} size={24} />
          </Link>
          <Link
            href={returnHref}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${admin ? 'text-[#BFD7F5] hover:bg-white/10' : 'text-brand-teal hover:bg-brand-lightTeal'}`}
          >
            {returnLabel}
          </Link>
        </div>
      </header>

      <div className={`mx-auto w-full ${singlePanel ? 'flex min-h-[calc(100vh-73px)] items-center justify-center p-4 sm:p-8' : `grid min-h-[calc(100vh-73px)] max-w-7xl ${admin ? 'place-items-center px-4 py-10' : 'lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.2fr_1fr]'}`}`}>
        {!admin && !singlePanel ? (
          <aside
            className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-12 xl:p-16 text-white"
            aria-label="TripMate travel context"
            style={{
              backgroundImage: [
                'radial-gradient(circle at 20% 20%, rgba(0, 125, 110, 0.35) 0%, transparent 45%)',
                'radial-gradient(circle at 80% 70%, rgba(255, 112, 67, 0.25) 0%, transparent 45%)',
                'linear-gradient(135deg, #00152A 0%, #102A43 60%, #006B5F 130%)',
              ].join(', '),
            }}
          >
            {/* Grid pattern overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
              aria-hidden="true"
            />

            {/* Glow orbs */}
            <div className="pointer-events-none absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-brand-teal/40 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-[360px] w-[360px] rounded-full bg-brand-coral/30 blur-3xl" aria-hidden="true" />

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col justify-between">

              <div className="space-y-10 max-w-xl">

                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold tracking-wide backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[16px] text-brand-brightTeal">auto_awesome</span>
                  {eyebrow}
                </div>

                {/* Title */}
                <h1 className="text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight">
                  {title}
                </h1>

                {/* Description */}
                <p className="text-lg text-white/75 leading-relaxed max-w-md">
                  {description}
                </p>

                {/* Floating feature cards */}
                {heroPanels && heroPanels.length > 0 && (
                  <div className="relative h-56">

                    {/* Card 1 */}
                    {heroPanels[0] && (
                      <div className="hero-float-1 absolute top-0 left-0 w-72 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-2xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-brand-teal/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[22px]">{heroPanels[0].icon}</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold">{heroPanels[0].title}</div>
                            <div className="text-xs text-white/60">{heroPanels[0].description}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card 2 */}
                    {heroPanels[1] && (
                      <div className="hero-float-2 absolute top-16 right-0 w-72 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-2xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-brand-coral/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[22px]">{heroPanels[1].icon}</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold">{heroPanels[1].title}</div>
                            <div className="text-xs text-white/60">{heroPanels[1].description}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card 3 */}
                    {heroPanels[2] && (
                      <div className="hero-float-3 absolute bottom-0 left-12 w-72 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-2xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-brand-brightTeal/40 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[22px]">{heroPanels[2].icon}</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold">{heroPanels[2].title}</div>
                            <div className="text-xs text-white/60">{heroPanels[2].description}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer stats */}
              {points && points.length > 0 && (
                <div className="grid grid-cols-3 gap-6 max-w-lg">
                  {points.map((point, idx) => (
                    <div key={point}>
                      <div className={`text-3xl font-extrabold ${idx === points.length - 1 ? 'text-brand-coral' : 'text-brand-brightTeal'}`}>
                        {point.split('|')[0]}
                      </div>
                      <div className="text-xs text-white/65 mt-1">{point.split('|')[1]}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        ) : null}

        <div className={`w-full ${singlePanel ? 'max-w-md' : `flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 ${admin ? 'max-w-lg' : ''}`}`}>
          <section className="w-full max-w-[480px]">
            <div className="bg-brand-card rounded-3xl shadow-card-lg p-8 sm:p-10 border border-slate-100">
              {admin ? (
                <div className="mb-8 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-teal">{eyebrow}</p>
                  <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-navy">{title}</h1>
                  <p className="mt-3 text-sm leading-relaxed text-brand-textSecondary">{description}</p>
                </div>
              ) : null}
              {children}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
