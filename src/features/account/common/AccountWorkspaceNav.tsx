'use client';

import Link from 'next/link';

import { accountCommonEn } from './resources/en';
import { ROUTES } from '@/lib/routes';

export type AccountTabKey = 'profile' | 'preferences' | 'security' | 'trips';

interface AccountWorkspaceNavProps {
  activeTab: AccountTabKey;
  className?: string;
}

interface NavTabItem {
  key: AccountTabKey;
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

const TABS: NavTabItem[] = [
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

export function AccountWorkspaceNav({ activeTab, className = '' }: AccountWorkspaceNavProps) {
  return (
    <nav
      aria-label={accountCommonEn.navigation.workspaceNavAria}
      className={`mb-6 flex border-b border-[#D8E1E4] overflow-x-auto ${className}`}
    >
      <div className="flex gap-2 min-w-full sm:min-w-0" role="tablist">
        {TABS.map((tab) => {
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
