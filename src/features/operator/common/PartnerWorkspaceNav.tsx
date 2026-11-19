'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import LogoutButton from '@/components/LogoutButton';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/i18n';
import { ROUTES } from '@/lib/routes';
import { getWeatherSafetyReviewBadgeCount } from '@/features/operator/weather-safety/weatherSafetyApi';
import { operatorCommonEn } from './resources/en';

export type PartnerWorkspaceTabKey = 'dashboard' | 'profile' | 'tours' | 'coupons' | 'bookings' | 'complaints' | 'revenue' | 'payouts' | 'weatherSafety';

interface PartnerWorkspaceNavProps {
  activeTab: PartnerWorkspaceTabKey;
  className?: string;
  operatorName?: string;
  weatherAlertBadgeCount?: number;
}

interface NavItem {
  key: string;
  label: string;
  icon: string;
  href?: string;
  disabled?: boolean;
}

export function PartnerWorkspaceNav({
  activeTab,
  className = '',
  operatorName,
  weatherAlertBadgeCount,
}: PartnerWorkspaceNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [serverBadgeCount, setServerBadgeCount] = useState<number>(0);
  const badgeCount = weatherAlertBadgeCount ?? serverBadgeCount;
  const { locale } = useI18n();
  const isVi = locale === 'vi';

  const workspaceNavItems: NavItem[] = [
    {
      key: 'dashboard',
      label: isVi ? 'Bảng điều khiển' : operatorCommonEn.navigation.dashboard,
      icon: 'dashboard',
      href: ROUTES.partner.dashboard,
    },
    {
      key: 'weatherSafety',
      label: isVi ? 'Cảnh báo an toàn' : 'Safety Alerts',
      icon: 'warning',
      href: ROUTES.partner.weatherSafetyReviews,
    },
    {
      key: 'tours',
      label: isVi ? 'Gói tour' : operatorCommonEn.navigation.tours,
      icon: 'tour',
      href: '/partner/tours',
    },
    {
      key: 'coupons',
      label: isVi ? 'Mã giảm giá' : operatorCommonEn.navigation.coupons,
      icon: 'confirmation_number',
      href: '/partner/coupons',
    },
    {
      key: 'bookings',
      label: isVi ? 'Đơn đặt chỗ' : operatorCommonEn.navigation.bookings,
      icon: 'receipt_long',
      href: ROUTES.partner.bookings,
    },
    {
      key: 'complaints',
      label: isVi ? 'Khiếu nại sau tour' : 'Post-Trip Complaints',
      icon: 'report',
      href: ROUTES.partner.postTripComplaints,
    },
    {
      key: 'revenue',
      label: isVi ? 'Doanh thu' : operatorCommonEn.navigation.revenue,
      icon: 'monitoring',
      href: ROUTES.partner.revenue,
    },
    {
      key: 'payouts',
      label: isVi ? 'Thanh toán' : operatorCommonEn.navigation.payouts,
      icon: 'payments',
      href: ROUTES.partner.payouts,
    },
  ];

  const accountNavItems: NavItem[] = [
    {
      key: 'profile',
      label: isVi ? 'Hồ sơ doanh nghiệp' : operatorCommonEn.navigation.profile,
      icon: 'domain',
      href: ROUTES.partner.profile,
    },
    {
      key: 'settings',
      label: isVi ? 'Cài đặt tài khoản' : operatorCommonEn.navigation.settings,
      icon: 'settings',
      disabled: true,
    },
  ];

  useEffect(() => {
    if (weatherAlertBadgeCount !== undefined) {
      return;
    }
    let isMounted = true;
    getWeatherSafetyReviewBadgeCount()
      .then((count) => {
        if (isMounted) setServerBadgeCount(count);
      })
      .catch(() => {
        // silent fallback
      });
    return () => {
      isMounted = false;
    };
  }, [weatherAlertBadgeCount]);

  return (
    <>
      {/* Top Mobile/Tablet Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-2xs lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-[#174B4A]"
            aria-label={mobileOpen ? 'Đóng menu quản lý' : 'Mở menu quản lý'}
            aria-expanded={mobileOpen}
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
          <Link href={ROUTES.partner.dashboard} aria-label="TripMate Partner Dashboard">
            <BrandLogo context="partner" size={20} />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="compact" />
          {operatorName ? (
            <span className="hidden max-w-[140px] truncate text-xs font-bold text-slate-700 sm:inline">
              {operatorName}
            </span>
          ) : null}
          <LogoutButton />
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation (Desktop Fixed / Mobile Drawer) */}
      <aside
        className={`fixed bottom-0 top-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-[#103B39] text-white transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? 'left-0 translate-x-0' : '-translate-x-full'
        } ${className}`}
        aria-label="Điều hướng không gian làm việc đối tác"
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-5">
          <Link href={ROUTES.partner.dashboard} aria-label="TripMate Partner">
            <BrandLogo context="partner" inverse size={22} />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Đóng menu"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 text-xs font-semibold">
          {/* Main workspace section */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isVi ? 'Quản lý vận hành' : operatorCommonEn.navigation.operationsSection}
            </div>
            <ul className="space-y-1" role="list">
              {workspaceNavItems.map((item) => {
                const isActive = item.key === activeTab;
                if (item.disabled || !item.href) {
                  return (
                    <li key={item.key}>
                      <span
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-500 opacity-60 cursor-not-allowed select-none"
                        title="Tính năng đang được phát triển"
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className="material-symbols-outlined text-[18px]"
                            aria-hidden="true"
                          >
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                          Sắp có
                        </span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition ${
                        isActive
                          ? 'bg-[#174B4A] font-bold text-white shadow-2xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </span>
                      {item.key === 'weatherSafety' && badgeCount > 0 && (
                        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Account section */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isVi ? 'Tài khoản đối tác' : operatorCommonEn.navigation.accountSection}
            </div>
            <ul className="space-y-1" role="list">
              {accountNavItems.map((item) => {
                const isActive = item.key === activeTab;
                if (item.disabled || !item.href) {
                  return (
                    <li key={item.key}>
                      <span
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-500 opacity-60 cursor-not-allowed select-none"
                        title="Tính năng đang được phát triển"
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className="material-symbols-outlined text-[18px]"
                            aria-hidden="true"
                          >
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                          Sắp có
                        </span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition ${
                        isActive
                          ? 'bg-[#174B4A] font-bold text-white shadow-2xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Footer profile indicator */}
        <div className="border-t border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400">Ngôn ngữ / Lang</span>
            <LanguageSwitcher variant="compact" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#174B4A] text-xs font-black text-white">
                {operatorName ? operatorName.slice(0, 2).toUpperCase() : 'TO'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">
                  {operatorName || (isVi ? 'Đối tác lữ hành' : 'Tour Operator')}
                </p>
                <p className="truncate text-[10px] text-slate-400">Tour Operator</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
