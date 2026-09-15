'use client';

import Link from 'next/link';

import { AuthStorage } from '@/features/auth/session/authSession';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { signInDestination } from '@/features/auth/routing/signInDestination';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ROUTES } from '@/lib/routes';

export function PublicNavigation() {
  // S01 runtime: an empty in-memory context is NOT Guest until the cookie-backed
  // restore settles, so the navbar never flashes the unauthenticated state for a
  // user whose session is about to be restored after F5/direct navigation.
  const { status, context } = useWebSession();
  const displayName = context ? context.fullName.trim() || context.email : '';
  // Authoritative navigation decision: the Partner entry is shown only to
  // settled Guests (future UC-02 registration entry point) and TourOperators
  // (routed by the existing W06 destination projection). It stays hidden while
  // restoring so a session about to be restored is never shown as Guest.
  // Travelers and Administrators get no Partner/operator-registration entry;
  // BR6 keeps Tour Operator registration a fully independent guest-like flow.
  const showPartner = status === 'unauthenticated' || context?.role === 'TourOperator';
  const partnerHref = context?.role === 'TourOperator'
    ? signInDestination(context) ?? ROUTES.partner.application
    : ROUTES.partner.register;

  function handleSignOut() {
    // Clears the client-side session only; server-side revocation is D02.
    AuthStorage.clear();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#d8dadd] bg-white/95 px-4 py-3 shadow-xs backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link href={ROUTES.home} aria-label="TripMate Landing Page">
          <BrandLogo />
        </Link>
        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto sm:order-2 sm:w-auto" aria-label="Public navigation">
          <Link href="#discover" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-[#43474d] hover:bg-[#eceef1]">Explore POIs</Link>
          <Link href="#tours" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-[#43474d] hover:bg-[#eceef1]">Tours</Link>
          {status === 'unauthenticated' ? (
            <Link href={ROUTES.register} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-[#43474d] hover:bg-[#eceef1]">Register</Link>
          ) : null}
          {showPartner ? (
            <Link href={partnerHref} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-[#43474d] hover:bg-[#eceef1]">Partner</Link>
          ) : null}
        </nav>
        
        {status === 'authenticated' ? (
          <div className="order-2 flex items-center gap-3 sm:order-3">
            <div className="flex items-center gap-2 rounded-xl bg-[#EFF6FF] px-3.5 py-1.5 text-xs font-bold text-[#1D4ED8] border border-[#DBEAFE]">
              <span className="material-symbols-outlined text-base">account_circle</span>
              <span className="max-w-[140px] truncate sm:max-w-[180px]">{displayName}</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-10 items-center rounded-xl border border-[#d8dadd] bg-white px-3.5 py-1.5 text-xs font-bold text-[#43474d] hover:bg-[#f2f4f7] hover:text-[#00152a] transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : status === 'restoring' ? (
          <div role="status" aria-label="Restoring session" className="order-2 h-10 w-24 animate-pulse rounded-xl bg-gray-200 sm:order-3">
            <span className="sr-only">Restoring session…</span>
          </div>
        ) : (
          <Link href={ROUTES.signIn} className="order-2 inline-flex min-h-10 items-center rounded-xl bg-[#1D4ED8] px-5 py-2 text-sm font-bold text-white hover:bg-[#1E40AF] transition sm:order-3">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

