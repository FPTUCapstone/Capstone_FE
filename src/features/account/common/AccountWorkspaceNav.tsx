'use client';

import Link from 'next/link';

import { useAccountWorkspace } from './AccountWorkspaceContext';
import { accountCommonEn } from './resources/en';
import { ROUTES } from '@/lib/routes';

export type AccountTabKey = 'profile' | 'preferences' | 'security' | 'trips';

export interface AccountWorkspaceNavProps {
  activeTab: AccountTabKey;
  className?: string;
  variant?: 'horizontal' | 'sidebar';
}

interface NavTabItem {
  key: AccountTabKey;
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

export const ACCOUNT_WORKSPACE_TABS: NavTabItem[] = [
  {
    key: 'profile',
    label: accountCommonEn.navigation.tabs.profile,
    href: ROUTES.account.profile,
    icon: 'account_circle',
  },
  {
    key: 'preferences',
    label: accountCommonEn.navigation.tabs.preferences,
    href: ROUTES.account.preferences,
    icon: 'tune',
    badge: accountCommonEn.navigation.tabs.preferencesBadge,
  },
  {
    key: 'security',
    label: accountCommonEn.navigation.tabs.security,
    href: ROUTES.account.security,
    icon: 'lock',
  },
  {
    key: 'trips',
    label: accountCommonEn.navigation.tabs.trips,
    href: ROUTES.account.trips,
    icon: 'route',
    badge: accountCommonEn.navigation.tabs.tripsBadge,
  },
];

export function AccountWorkspaceNav({
  activeTab,
  className = '',
  variant,
}: AccountWorkspaceNavProps) {
  const { isInsideShell } = useAccountWorkspace();

  // If invoked inside the Master-Detail shell without an explicit variant (i.e. from child page),
  // suppress rendering to eliminate duplicate navigation bars in the content area.
  if (isInsideShell && !variant) {
    return null;
  }

  const isSidebar = variant === 'sidebar';

  if (isSidebar) {
    return (
      <nav
        aria-label={accountCommonEn.navigation.workspaceNavAria}
        className={`w-full ${className}`}
      >
        <div
          className="flex flex-col gap-1.5"
          role="tablist"
          aria-orientation="vertical"
        >
          {ACCOUNT_WORKSPACE_TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                role="tab"
                aria-selected={isActive}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#006B5F] text-white shadow-xs'
                    : 'text-[#33425A] hover:bg-slate-100 hover:text-[#00152A]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`material-symbols-outlined text-[20px] transition-transform ${
                      isActive ? 'text-white' : 'text-[#64748B] group-hover:text-[#006B5F]'
                    }`}
                    aria-hidden="true"
                  >
                    {tab.icon}
                  </span>
                  <span className="truncate">{tab.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {tab.badge ? (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  ) : null}
                  <span
                    className={`material-symbols-outlined text-[16px] transition-transform ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
                    }`}
                    aria-hidden="true"
                  >
                    chevron_right
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Horizontal variant (default standalone mode or mobile capsule bar)
  return (
    <nav
      aria-label={accountCommonEn.navigation.workspaceNavAria}
      className={`mb-6 flex border-b border-[#D8E1E4] overflow-x-auto ${className}`}
    >
      <div className="flex gap-2 min-w-full sm:min-w-0" role="tablist">
        {ACCOUNT_WORKSPACE_TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm transition ${
                isActive
                  ? 'border-[#006B5F] font-bold text-[#006B5F]'
                  : 'border-transparent font-medium text-[#59616B] hover:border-slate-300 hover:text-[#00152A]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? 'bg-[#E6F4F1] text-[#006B5F]'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
