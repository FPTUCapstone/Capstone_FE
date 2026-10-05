'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import LogoutButton from '@/components/LogoutButton';
import { ROUTES } from '@/lib/routes';

export type PartnerWorkspaceTabKey = 'dashboard' | 'profile';

interface PartnerWorkspaceNavProps {
  activeTab: PartnerWorkspaceTabKey;
  className?: string;
  operatorName?: string;
}

interface NavItem {
  key: string;
  label: string;
  icon: string;
  href?: string;
  disabled?: boolean;
}

const WORKSPACE_NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Bảng điều khiển',
    icon: 'dashboard',
    href: ROUTES.partner.dashboard,
  },
  {
    key: 'tours',
    label: 'Gói tour',
    icon: 'tour',
    disabled: true,
  },
  {
    key: 'coupons',
    label: 'Mã giảm giá',
    icon: 'confirmation_number',
    disabled: true,
  },
  {
    key: 'bookings',
    label: 'Đơn đặt chỗ',
    icon: 'receipt_long',
    disabled: true,
  },
  {
    key: 'revenue',
    label: 'Doanh thu',
    icon: 'monitoring',
    disabled: true,
  },
  {
    key: 'payouts',
    label: 'Thanh toán',
    icon: 'payments',
    disabled: true,
  },
];

const ACCOUNT_NAV_ITEMS: NavItem[] = [
  {
    key: 'profile',
    label: 'Hồ sơ doanh nghiệp',
    icon: 'domain',
    href: ROUTES.partner.profile,
  },
  {
    key: 'settings',
    label: 'Cài đặt tài khoản',
    icon: 'settings',
    disabled: true,
  },
];

export function PartnerWorkspaceNav({
  activeTab,
  className = '',
  operatorName,
}: PartnerWorkspaceNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Top Mobile/Tablet Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-2xs lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-[#006B5F]"
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
        className={`fixed bottom-0 top-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-[#00152A] text-white transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:translate-x-0 ${
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
              Quản lý vận hành
            </div>
            <ul className="space-y-1" role="list">
              {WORKSPACE_NAV_ITEMS.map((item) => {
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
                          ? 'bg-[#006B5F] font-bold text-white shadow-2xs'
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

          {/* Account section */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tài khoản đối tác
            </div>
            <ul className="space-y-1" role="list">
              {ACCOUNT_NAV_ITEMS.map((item) => {
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
                          ? 'bg-[#006B5F] font-bold text-white shadow-2xs'
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
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#006B5F] text-xs font-black text-white">
                {operatorName ? operatorName.slice(0, 2).toUpperCase() : 'TO'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">
                  {operatorName || 'Đối tác lữ hành'}
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
