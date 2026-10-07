'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import LogoutButton from '@/components/LogoutButton';
import { ROUTES } from '@/lib/routes';
import { operatorCommonEn } from '../../common/resources/en';
import { OPERATOR_TOUR_ROUTES, withTourDemoMode } from '../routes';

export type OperatorNavKey =
  | 'dashboard'
  | 'tours'
  | 'coupons'
  | 'bookings'
  | 'revenue'
  | 'payouts'
  | 'profile'
  | 'settings';

interface OperatorTourNavProps {
  activeTab: OperatorNavKey;
  operatorName?: string;
  isDemo?: boolean;
}

export function OperatorTourNav({
  activeTab,
  operatorName = operatorCommonEn.navigation.defaultOperatorTitle,
  isDemo = false,
}: OperatorTourNavProps) {
  const navItems = [
    {
      key: 'dashboard',
      label: operatorCommonEn.navigation.dashboard,
      icon: 'dashboard',
      href: ROUTES.partner.dashboard,
    },
    {
      key: 'tours',
      label: operatorCommonEn.navigation.tours,
      icon: 'tour',
      href: withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo),
    },
    {
      key: 'coupons',
      label: operatorCommonEn.navigation.coupons,
      icon: 'confirmation_number',
      href: '/partner/coupons',
      disabled: true,
    },
    {
      key: 'bookings',
      label: operatorCommonEn.navigation.bookings,
      icon: 'receipt_long',
      href: withTourDemoMode(ROUTES.partner.bookings, isDemo),
    },
    {
      key: 'revenue',
      label: operatorCommonEn.navigation.revenue,
      icon: 'monitoring',
      href: '/partner/revenue',
      disabled: true,
    },
    {
      key: 'payouts',
      label: operatorCommonEn.navigation.payouts,
      icon: 'payments',
      href: '/partner/payouts',
      disabled: true,
    },
  ];

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        {/* Brand & Workspace Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <Link href={ROUTES.partner.dashboard} className="flex items-center gap-2 group">
            <BrandLogo />
            <span className="rounded-full bg-[#006B5F]/10 px-2 py-0.5 text-[10px] font-bold text-[#006B5F]">
              Operator
            </span>
          </Link>
          {isDemo && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-amber-800">
              {operatorCommonEn.navigation.demoBadge}
            </span>
          )}
        </div>

        {/* Operator Profile Preview Card */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#006B5F] font-bold text-white shadow-xs">
            {operatorName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[#00152A]">{operatorName}</p>
            <p className="text-[11px] text-slate-500">
              {operatorCommonEn.navigation.verifiedPartnerBadge}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav aria-label={operatorCommonEn.navigation.workspaceNavAria} className="mt-5 space-y-1">
          <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            {operatorCommonEn.navigation.servicesSection}
          </p>
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            if (item.disabled) {
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 cursor-not-allowed opacity-60"
                  title={operatorCommonEn.navigation.featureInDevelopment}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {operatorCommonEn.navigation.comingSoon}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                  isActive
                    ? 'bg-[#006B5F] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#006B5F]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-slate-100">
            <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {operatorCommonEn.navigation.accountSection}
            </p>
            <Link
              href="/partner/profile"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                activeTab === 'profile'
                  ? 'bg-[#006B5F] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-[#006B5F]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                corporate_fare
              </span>
              <span>{operatorCommonEn.navigation.profile}</span>
            </Link>
          </div>
        </nav>

        {/* Logout action */}
        <div className="mt-6 border-t border-slate-100 pt-4 flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
