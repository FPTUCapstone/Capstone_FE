'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import LogoutButton from '@/components/LogoutButton';
import { signInDestination } from '@/features/auth/routing/signInDestination';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';

interface PublicNavigationProps {
  isLanding?: boolean;
}

export function PublicNavigation({ isLanding = false }: PublicNavigationProps = {}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!isLanding) return;
    function handleScroll() {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setIsScrolled(scrollY > 24);
      if (maxScroll > 0) {
        setScrollProgress(Math.min(1, Math.max(0, scrollY / maxScroll)));
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLanding]);

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
    <header
      className={`sticky top-0 z-50 transition-all duration-300 md:px-8 px-4 py-3 ${
        isLanding && isScrolled
          ? 'border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs'
          : 'border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs'
      }`}
    >
      {/* Landing Scroll Progress Indicator */}
      {isLanding && (
        <div
          className="absolute bottom-0 left-0 h-[2.5px] bg-[#007d6e] transition-transform duration-75 origin-left"
          style={{ transform: `scaleX(${scrollProgress})`, width: '100%' }}
          aria-hidden="true"
        />
      )}

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

          <Link
            href="/#destinations"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#007d6e]"
          >
            Điểm đến
          </Link>

          <Link
            href={ROUTES.plan}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#007d6e]"
          >
            Lịch trình Tối ưu
          </Link>

          <Link
            href="/#weather-rerouting"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#007d6e]"
          >
            Cứu nguy Thời tiết
          </Link>

          <Link
            href={ROUTES.tours}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#007d6e]"
          >
            Tour Bản địa
          </Link>

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
            <Link
              href={ROUTES.account.profile}
              aria-label="Tài khoản và hồ sơ"
              className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-[#007d6e] transition hover:bg-teal-100"
            >
              <span className="material-symbols-outlined text-sm">
                account_circle
              </span>

              <span className="max-w-[120px] truncate sm:max-w-[160px]">
                {displayName}
              </span>
            </Link>

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
