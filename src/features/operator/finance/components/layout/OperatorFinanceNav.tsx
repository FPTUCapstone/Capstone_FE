'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ROUTES } from '@/lib/routes';
import { webLogout } from '@/lib/authApi';
import { AuthStorage } from '@/features/auth/session/authSession';
import { OPERATOR_FINANCE_ROUTES, withFinanceDemoMode } from '../../routes';
import { financeEn } from '../../resources/en';

export type FinanceNavTab =
  | 'dashboard'
  | 'tours'
  | 'coupons'
  | 'bookings'
  | 'revenue'
  | 'payouts';

interface OperatorFinanceNavProps {
  activeTab: FinanceNavTab;
  operatorName?: string;
  isDemo?: boolean;
}

export function OperatorFinanceNav({
  activeTab,
  operatorName = 'Tour Operator Partner',
  isDemo = false,
}: OperatorFinanceNavProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await webLogout();
      AuthStorage.clear();
      router.replace(ROUTES.signIn);
      router.refresh();
    } catch {
      // Best-effort logout: clear storage and redirect
      AuthStorage.clear();
      router.replace(ROUTES.signIn);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems: Array<{
    key: FinanceNavTab;
    label: string;
    icon: string;
    href: string;
  }> = [
    {
      key: 'dashboard',
      label: financeEn.nav.dashboard,
      icon: 'dashboard',
      href: withFinanceDemoMode(ROUTES.partner.dashboard, isDemo),
    },
    {
      key: 'tours',
      label: financeEn.nav.tours,
      icon: 'tour',
      href: withFinanceDemoMode('/partner/tours', isDemo),
    },
    {
      key: 'coupons',
      label: financeEn.nav.coupons,
      icon: 'confirmation_number',
      href: withFinanceDemoMode('/partner/coupons', isDemo),
    },
    {
      key: 'bookings',
      label: financeEn.nav.bookings,
      icon: 'receipt_long',
      href: withFinanceDemoMode('/partner/bookings', isDemo),
    },
    {
      key: 'revenue',
      label: financeEn.nav.revenue,
      icon: 'monitoring',
      href: withFinanceDemoMode(OPERATOR_FINANCE_ROUTES.revenue, isDemo),
    },
    {
      key: 'payouts',
      label: financeEn.nav.payouts,
      icon: 'payments',
      href: withFinanceDemoMode(OPERATOR_FINANCE_ROUTES.payouts, isDemo),
    },
  ];

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        {/* Brand & Workspace Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <Link
            href={withFinanceDemoMode(ROUTES.partner.dashboard, isDemo)}
            className="flex items-center gap-2 group"
          >
            <BrandLogo />
            <span className="rounded-full bg-[#006B5F]/10 px-2 py-0.5 text-[10px] font-bold text-[#006B5F]">
              {financeEn.nav.roleBadge}
            </span>
          </Link>
          {isDemo && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-amber-800">
              {financeEn.nav.demoBadge}
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
            <p className="text-[11px] text-slate-500">{financeEn.nav.verifiedPartner}</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav aria-label="Finance Workspace Navigation" className="mt-5 space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#006B5F] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#00152A]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="material-symbols-outlined text-[18px] shrink-0">
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px] shrink-0">
              logout
            </span>
            <span>{isLoggingOut ? 'Signing out…' : financeEn.nav.signOut}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
