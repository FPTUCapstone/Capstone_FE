'use client';

import Link from 'next/link';

import { BrandLogo } from '@/components/brand/BrandLogo';
import LogoutButton from '@/components/LogoutButton';
import { signInDestination } from '@/features/auth/routing/signInDestination';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';

export function PublicNavigation() {
  // An empty in-memory context is NOT considered Guest until the
  // cookie-backed session restore has completed.
  //
  // This prevents the navbar from briefly showing an unauthenticated
  // state after F5/direct navigation while an existing session is
  // being restored.
  const { status, context } = useWebSession();

  const displayName = context
    ? context.fullName.trim() || context.email
    : '';

  // Authoritative navigation decision:
  //
  // - Guest:
  //   may enter the Partner registration flow.
  //
  // - TourOperator:
  //   routed according to the existing UC-04 destination projection.
  //
  // - Traveler / Administrator:
  //   Partner entry is hidden.
  //
  // While session restore is running the Partner entry is also hidden,
  // preventing an authenticated user from temporarily being rendered
  // as Guest.
  const showPartner =
    status === 'unauthenticated' ||
    context?.role === 'TourOperator';

  const partnerHref =
    context?.role === 'TourOperator'
      ? signInDestination(context) ?? ROUTES.partner.application
      : ROUTES.partner.register;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-xs backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link
          href={ROUTES.home}
          aria-label="TripMate Landing Page"
        >
          <BrandLogo />
        </Link>

        <nav
          className="order-3 flex w-full items-center gap-1 overflow-x-auto sm:order-2 sm:w-auto"
          aria-label="Public navigation"
        >
          <Link
            href={ROUTES.pois}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#007d6e]"
          >
            Khám phá
          </Link>

          <a
            href="#destinations"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#007d6e]"
          >
            Điểm đến
          </a>

          <a
            href="#csp-simulator"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#007d6e]"
          >
            Lịch trình Tối ưu
          </a>

          <a
            href="#weather-rerouting"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#007d6e]"
          >
            Cứu nguy Thời tiết
          </a>

          <a
            href="#tours"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#007d6e]"
          >
            Tour Bản địa
          </a>

          {showPartner ? (
            <Link
              href={partnerHref}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#007d6e]"
            >
              Dành cho Đối tác
            </Link>
          ) : null}
        </nav>

        {status === 'authenticated' ? (
          <div className="order-2 flex items-center justify-end gap-2 sm:order-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-[#007d6e]">
              <span className="material-symbols-outlined text-sm">
                account_circle
              </span>

              <span className="max-w-[120px] truncate sm:max-w-[160px]">
                {displayName}
              </span>
            </div>

            <LogoutButton />
          </div>
        ) : status === 'restoring' ? (
          <div
            role="status"
            aria-label="Restoring session"
            className="order-2 h-10 w-24 animate-pulse rounded-xl bg-gray-200 sm:order-3"
          >
            <span className="sr-only">
              Restoring session…
            </span>
          </div>
        ) : (
          <div className="order-2 flex items-center gap-2 sm:order-3">
            <Link
              href={ROUTES.register}
              className="hidden min-h-9 items-center rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            >
              Đăng ký
            </Link>

            <Link
              href={ROUTES.signIn}
              className="inline-flex min-h-9 items-center rounded-xl bg-[#007d6e] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
            >
              Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
