import Link from 'next/link';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { ROUTES } from '@/lib/routes';

export function PublicNavigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#d8dadd] bg-white/95 px-4 py-3 shadow-xs backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link href={ROUTES.home} aria-label="TripMate Landing Page">
          <BrandLogo />
        </Link>
        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto sm:order-2 sm:w-auto" aria-label="Public navigation">
          <Link href="#discover" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-[#43474d] hover:bg-[#eceef1]">Explore POIs</Link>
          <Link href="#tours" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-[#43474d] hover:bg-[#eceef1]">Tours</Link>
          <Link href={ROUTES.register} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-[#43474d] hover:bg-[#eceef1]">Register</Link>
          <Link href={ROUTES.partner.register} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-[#43474d] hover:bg-[#eceef1]">Partner</Link>
        </nav>
        <Link href={ROUTES.signIn} className="order-2 inline-flex min-h-10 items-center rounded-xl bg-[#00152a] px-5 py-2 text-sm font-bold text-white hover:bg-[#102a43] sm:order-3">
          Sign In
        </Link>
      </div>
    </header>
  );
}
