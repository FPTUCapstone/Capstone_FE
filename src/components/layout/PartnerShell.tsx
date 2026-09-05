import Link from 'next/link';
import type { ReactNode } from 'react';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { ROUTES } from '@/lib/routes';

type PartnerShellProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function PartnerShell({ children, description, title }: PartnerShellProps) {
  return (
    <main className="min-h-screen bg-[#f3f6f8] text-[#191c1e]">
      <header className="border-b border-[#d8dadd] bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link href={ROUTES.home} aria-label="TripMate home">
            <BrandLogo context="partner" />
          </Link>
          <nav className="flex items-center gap-2 text-sm font-semibold" aria-label="Partner public navigation">
            <Link href={ROUTES.partner.application} className="rounded-lg px-3 py-2 text-[#006b5f] hover:bg-[#e8f7f4]">
              Application Status
            </Link>
            <Link href={ROUTES.signIn} className="rounded-lg px-3 py-2 text-[#00152a] hover:bg-[#eceef1]">
              Sign In
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-9 sm:px-8 sm:py-12">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#006b5f]">Partner Portal</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#00152a] sm:text-4xl">{title}</h1>
          <p className="mt-3 text-base leading-relaxed text-[#59616b]">{description}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
