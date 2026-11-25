'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ROUTES } from '@/lib/routes';

export type PartnerWorkspaceTabKey =
  | 'dashboard'
  | 'weatherSafety'
  | 'profile'
  | 'tours'
  | 'coupons'
  | 'bookings'
  | 'complaints'
  | 'revenue'
  | 'payouts';

export interface PartnerSidebarProps {
  activeTab: PartnerWorkspaceTabKey;
  isDemo?: boolean;
  operatorName?: string;
  onCloseMobile?: () => void;
  className?: string;
  weatherAlertBadgeCount?: number;
}

interface NavItem {
  key: PartnerWorkspaceTabKey | 'settings';
  label: string;
  icon: string;
  baseHref?: string;
  disabled?: boolean;
}

const WORKSPACE_NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Bảng điều khiển',
    icon: 'dashboard',
    baseHref: ROUTES.partner.dashboard,
  },
  {
    key: 'weatherSafety',
    label: 'Cảnh báo an toàn',
    icon: 'warning',
    baseHref: ROUTES.partner.weatherSafetyReviews,
  },
  {
    key: 'tours',
    label: 'Gói tour',
    icon: 'tour',
    baseHref: '/partner/tours',
  },
  {
    key: 'coupons',
    label: 'Mã giảm giá',
    icon: 'confirmation_number',
    baseHref: '/partner/coupons',
  },
  {
    key: 'bookings',
    label: 'Đơn đặt chỗ',
    icon: 'receipt_long',
    baseHref: ROUTES.partner.bookings,
  },
  {
    key: 'complaints',
    label: 'Khiếu nại sau tour',
    icon: 'report',
    baseHref: ROUTES.partner.postTripComplaints,
  },
  {
    key: 'revenue',
    label: 'Doanh thu',
    icon: 'monitoring',
    baseHref: ROUTES.partner.revenue,
  },
  {
    key: 'payouts',
    label: 'Thanh toán',
    icon: 'payments',
    baseHref: ROUTES.partner.payouts,
  },
];

const ACCOUNT_NAV_ITEMS: NavItem[] = [
  {
    key: 'profile',
    label: 'Hồ sơ doanh nghiệp',
    icon: 'domain',
    baseHref: ROUTES.partner.profile,
  },
  {
    key: 'settings',
    label: 'Cài đặt tài khoản',
    icon: 'settings',
    disabled: true,
  },
];

function buildHref(baseHref: string | undefined, isDemo: boolean): string | undefined {
  if (!baseHref) return undefined;
  if (
    !isDemo ||
    baseHref === ROUTES.partner.dashboard ||
    baseHref === ROUTES.partner.profile ||
    baseHref === ROUTES.partner.weatherSafetyReviews
  ) {
    return baseHref;
  }
  return baseHref.includes('?') ? `${baseHref}&demo=1` : `${baseHref}?demo=1`;
}

export function PartnerSidebar({
  activeTab,
  isDemo = false,
  operatorName,
  onCloseMobile,
  className = '',
  weatherAlertBadgeCount = 0,
}: PartnerSidebarProps) {
  const getInitials = (name?: string) => {
    if (!name) return 'TO';
    return name.trim().slice(0, 2).toUpperCase();
  };

  return (
    <aside
      className={`flex w-64 flex-col border-r border-white/10 bg-[#103B39] text-white shadow-xl ${className}`}
      aria-label="Thanh bên không gian làm việc đối tác"
    >
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <Link
          href={ROUTES.partner.dashboard}
          onClick={onCloseMobile}
          aria-label="TripMate Partner"
          className="flex min-w-0 items-center gap-2 group"
        >
          <BrandLogo context="partner" inverse size={20} labelClassName="text-[17px]" />
        </Link>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9EB7B0] hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Đóng menu"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav
        aria-label="Điều hướng không gian làm việc đối tác"
        className="flex-1 space-y-6 overflow-y-auto px-3 py-4 text-xs font-semibold [scrollbar-width:thin] [scrollbar-color:#2D4A47_transparent]"
      >
        {/* Main Operations Section */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#9EB7B0]">
            Quản lý vận hành
          </div>
          <ul className="space-y-1" role="list">
            {WORKSPACE_NAV_ITEMS.map((item) => {
              const isActive = item.key === activeTab;
              const href = buildHref(item.baseHref, isDemo);

              if (item.disabled || !href) {
                return (
                  <li key={item.key}>
                    <span
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[#8FA8A0] opacity-60 cursor-not-allowed select-none"
                      title="Tính năng đang được phát triển"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </span>
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-[#9EB7B0]">
                        Sắp có
                      </span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.key}>
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition ${
                      isActive
                        ? 'bg-[#174B4A] font-bold text-white shadow-2xs'
                        : 'text-[#C2D4CE] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.key === 'weatherSafety' && weatherAlertBadgeCount > 0 && (
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {weatherAlertBadgeCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Account Section */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#9EB7B0]">
            Tài khoản đối tác
          </div>
          <ul className="space-y-1" role="list">
            {ACCOUNT_NAV_ITEMS.map((item) => {
              const isActive = item.key === activeTab;
              const href = buildHref(item.baseHref, isDemo);

              if (item.disabled || !href) {
                return (
                  <li key={item.key}>
                    <span
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[#8FA8A0] opacity-60 cursor-not-allowed select-none"
                      title="Tính năng đang được phát triển"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </span>
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-[#9EB7B0]">
                        Sắp có
                      </span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.key}>
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition ${
                      isActive
                        ? 'bg-[#174B4A] font-bold text-white shadow-2xs'
                        : 'text-[#C2D4CE] hover:bg-white/10 hover:text-white'
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

      {/* Footer Profile Preview */}
      <div className="border-t border-white/10 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#174B4A] text-xs font-black text-white">
            {getInitials(operatorName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white" title={operatorName || 'Đối tác lữ hành'}>
              {operatorName || 'Đối tác lữ hành'}
            </p>
            <p className="truncate text-[10px] text-[#9EB7B0]">Tour Operator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
