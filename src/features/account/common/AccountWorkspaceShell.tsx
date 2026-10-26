'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { useWebSession } from '@/features/auth/session/useWebSession';
import {
  getTravelerProfile,
  TRAVELER_PROFILE_UPDATED_EVENT,
  type TravelerProfileDto,
} from '@/features/account/profile/travelerProfileApi';
import { useSafePathname } from '@/lib/routes/useSafePathname';
import { ROUTES } from '@/lib/routes';

import { AccountWorkspaceContext } from './AccountWorkspaceContext';
import {
  AccountWorkspaceNav,
  type AccountTabKey,
} from './AccountWorkspaceNav';
import { accountCommonEn } from './resources/en';

interface AccountWorkspaceShellProps {
  children: ReactNode;
}

const TAB_METADATA: Record<
  AccountTabKey,
  { viTitle: string; viSubtitle: string; enTitle: string; icon: string }
> = {
  profile: {
    viTitle: 'Hồ sơ cá nhân',
    viSubtitle: 'Quản lý thông tin định danh và thông tin liên lạc của bạn trên TripMate.',
    enTitle: accountCommonEn.navigation.tabs.profile,
    icon: 'account_circle',
  },
  preferences: {
    viTitle: 'Sở thích du lịch',
    viSubtitle: 'Tùy chỉnh phong cách du lịch, ẩm thực và phương tiện yêu thích để AI Atlas gợi ý tối ưu.',
    enTitle: accountCommonEn.navigation.tabs.preferences,
    icon: 'tune',
  },
  security: {
    viTitle: 'Bảo mật & Mật khẩu',
    viSubtitle: 'Cập nhật mật khẩu định kỳ và bảo vệ tài khoản của bạn trên nền tảng TripMate.',
    enTitle: accountCommonEn.navigation.tabs.security,
    icon: 'lock',
  },
  trips: {
    viTitle: 'Lịch sử chuyến đi',
    viSubtitle: 'Tra cứu các chuyến đi đã hoàn thành, hành trình sắp tới và đánh giá dịch vụ.',
    enTitle: accountCommonEn.navigation.tabs.trips,
    icon: 'route',
  },
};

function resolveAccountTab(pathname: string | null): AccountTabKey {
  if (!pathname) return 'profile';
  if (pathname.startsWith(ROUTES.account.preferences)) return 'preferences';
  if (pathname.startsWith(ROUTES.account.security)) return 'security';
  if (pathname.startsWith(ROUTES.account.trips)) return 'trips';
  return 'profile';
}

function isReviewRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.includes('/review') || pathname.includes('/reviews/');
}

export function AccountWorkspaceShell({ children }: AccountWorkspaceShellProps) {
  const router = useRouter();
  const pathname = useSafePathname();
  const { status, context } = useWebSession();

  const [travelerProfile, setTravelerProfile] = useState<TravelerProfileDto | null>(null);
  const profileRevision = useRef(0);

  const activeTab = resolveAccountTab(pathname);
  const isReview = isReviewRoute(pathname);

  // Authenticated redirect guards
  useEffect(() => {
    if (status === 'unauthenticated') {
      const returnUrl = encodeURIComponent(pathname || ROUTES.account.profile);
      router.replace(`${ROUTES.signIn}?returnUrl=${returnUrl}`);
    } else if (status === 'authenticated' && context?.role === 'TourOperator') {
      router.replace(ROUTES.partner.dashboard);
    } else if (status === 'authenticated' && context?.role === 'Administrator') {
      router.replace(ROUTES.admin.dashboard);
    } else if (status === 'authenticated' && context?.role === 'Staff') {
      router.replace(ROUTES.admin.staffDashboard);
    }
  }, [status, context, router, pathname]);

  // Profile retrieval & live event listener
  useEffect(() => {
    if (status !== 'authenticated' || context?.role !== 'Traveler') return;
    const userId = context.userId;
    let active = true;
    const requestRevision = profileRevision.current;

    void getTravelerProfile()
      .then((profile) => {
        if (active && profileRevision.current === requestRevision && profile.userId === userId) {
          setTravelerProfile(profile);
        }
      })
      .catch(() => {});

    function onProfileUpdated(event: Event) {
      const profile = (event as CustomEvent<TravelerProfileDto>).detail;
      if (profile?.userId === userId) {
        profileRevision.current++;
        setTravelerProfile(profile);
      }
    }

    window.addEventListener(TRAVELER_PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () => {
      active = false;
      window.removeEventListener(TRAVELER_PROFILE_UPDATED_EVENT, onProfileUpdated);
    };
  }, [status, context?.role, context?.userId]);

  // Dedicated review route passthrough
  if (isReview) {
    return (
      <div className="min-h-screen bg-[#F3F6F7] text-[#00152A]" lang="vi">
        {children}
      </div>
    );
  }

  // Session restoring loading skeleton
  if (status === 'restoring') {
    return (
      <div
        className="min-h-screen bg-[#F3F6F7] px-4 py-8 sm:px-6 lg:px-8"
        role="status"
        aria-label="Đang tải không gian tài khoản"
      >
        <div className="mx-auto max-w-7xl">
          {/* Top Breadcrumb Skeleton */}
          <div className="mb-6 h-4 w-48 animate-pulse rounded bg-slate-200" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Rail Skeleton */}
            <div className="space-y-4 lg:col-span-4 xl:col-span-3">
              <div className="h-60 animate-pulse rounded-2xl border border-slate-200 bg-white p-6" />
              <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white p-4" />
            </div>
            {/* Right Content Skeleton */}
            <div className="space-y-4 lg:col-span-8 xl:col-span-9">
              <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white p-6" />
              <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white p-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated or role is not Traveler, return null while redirect effect runs
  if (status !== 'authenticated' || !context || context.role !== 'Traveler') {
    return null;
  }

  const currentProfile = travelerProfile?.userId === context.userId ? travelerProfile : null;
  const displayName = currentProfile?.fullName?.trim() || context.fullName?.trim() || 'Du khách';
  const displayEmail = context.email;
  const avatarUrl = currentProfile?.avatarUrl;

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'TM';

  const currentTabMeta = TAB_METADATA[activeTab];

  return (
    <AccountWorkspaceContext.Provider value={{ isInsideShell: true, activeTab }}>
      <div className="min-h-screen bg-[#F3F6F7] text-[#00152A]" lang="vi">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Top Workspace Breadcrumb & Header */}
          <header className="mb-6">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs font-semibold text-[#59616B]"
            >
              <Link href={ROUTES.home} className="hover:text-[#006B5F] hover:underline">
                Trang chủ
              </Link>
              <span aria-hidden="true">/</span>
              <Link href={ROUTES.account.profile} className="hover:text-[#006B5F] hover:underline">
                Tài khoản cá nhân
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-[#00152A]">{currentTabMeta.viTitle}</span>
            </nav>
          </header>

          {/* Mobile Traveler Compact Header & Horizontal Capsule Navigation (< lg) */}
          <div className="mb-6 space-y-3 lg:hidden">
            {/* Mobile Identity Bar */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-xs"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#006B5F] to-[#004D40] text-sm font-bold text-white shadow-xs">
                    {initials}
                  </div>
                )}
                <span
                  className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"
                  title="Đang hoạt động"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-bold text-[#00152A]">{displayName}</h2>
                  <span className="rounded-full bg-[#E8F7F4] px-2 py-0.5 text-[10px] font-bold text-[#006B5F]">
                    Du khách
                  </span>
                </div>
                <p className="truncate text-xs text-slate-500">{displayEmail}</p>
              </div>
            </div>

            {/* Mobile Horizontal Pill Navigation */}
            <AccountWorkspaceNav
              activeTab={activeTab}
              variant="horizontal"
              className="border-b-0 pb-1"
            />
          </div>

          {/* Master-Detail 2-Column Grid (Desktop & Tablet) */}
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            {/* Left Column: Persistent Master Side-Rail (lg:col-span-4 xl:col-span-3) */}
            <aside
              className="hidden space-y-5 lg:sticky lg:top-24 lg:col-span-4 lg:block xl:col-span-3"
              aria-label="Bảng điều hướng tài khoản du khách"
            >
              {/* Traveler Identity Profile Card */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition hover:shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-20 w-20 rounded-full border-2 border-slate-100 object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#006B5F] to-[#004D40] text-xl font-bold tracking-wider text-white shadow-sm">
                        {initials}
                      </div>
                    )}
                    <Link
                      href={ROUTES.account.profile}
                      className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#006B5F] text-white shadow-xs transition hover:bg-[#005249]"
                      title="Chỉnh sửa ảnh đại diện"
                      aria-label="Chỉnh sửa ảnh đại diện trong Hồ sơ"
                    >
                      <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                    </Link>
                  </div>

                  <h2 className="text-base font-bold text-[#00152A] line-clamp-1">{displayName}</h2>
                  <p className="mt-0.5 text-xs text-slate-500 truncate max-w-full">{displayEmail}</p>

                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F7F4] px-2.5 py-0.5 text-xs font-semibold text-[#006B5F]">
                      <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
                        verified
                      </span>
                      Du khách TripMate
                    </span>
                  </div>

                  <div className="mt-4 w-full border-t border-slate-100 pt-3 text-left">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Trạng thái tài khoản</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Đang hoạt động
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vertical Side-Rail Navigation Card */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-xs">
                <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Không gian làm việc
                </p>
                <AccountWorkspaceNav activeTab={activeTab} variant="sidebar" />
              </div>

              {/* TripMate Smart AI Atlas Assistant Pro-Tip Card */}
              <div className="rounded-2xl border border-[#C6ECE3] bg-gradient-to-br from-[#F0FDF9] to-[#E8F7F4] p-4 text-xs shadow-xs">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-[#006B5F]" aria-hidden="true">
                    auto_awesome
                  </span>
                  <div>
                    <h3 className="font-bold text-[#00152A]">TripMate AI Atlas</h3>
                    <p className="mt-1 leading-relaxed text-[#33425A]">
                      Cập nhật đầy đủ sở thích và lịch sử du lịch giúp TripMate gợi ý tour và lịch trình phù hợp nhất cho chuyến đi của bạn.
                    </p>
                    <Link
                      href={ROUTES.account.preferences}
                      className="mt-2.5 inline-flex items-center gap-1 font-bold text-[#006B5F] hover:underline"
                    >
                      <span>Cập nhật sở thích ngay</span>
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Column: Dynamic Detail Content Panel (lg:col-span-8 xl:col-span-9) */}
            <main
              id="account-workspace-content"
              className="min-w-0 lg:col-span-8 xl:col-span-9"
              tabIndex={-1}
            >
              <div className="w-full transition-opacity duration-200">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </AccountWorkspaceContext.Provider>
  );
}
