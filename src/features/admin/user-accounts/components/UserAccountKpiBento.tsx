import React from 'react';
import type { UserAccountKpiStats } from '../types/userAccount';
import { adminUserAccountsEn } from '../resources/en';

interface UserAccountKpiBentoProps {
  stats: UserAccountKpiStats;
}

export function UserAccountKpiBento({ stats }: UserAccountKpiBentoProps) {
  const kpiCopy = adminUserAccountsEn.directory.kpi;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Stat 1: Total Accounts */}
      <div className="relative flex items-start justify-between overflow-hidden rounded-xl bg-white p-5 shadow-xs border border-[#e2e8f0]">
        <div className="z-10 flex flex-col space-y-1">
          <span className="text-xs font-bold tracking-wider text-[#43474d] uppercase">
            {kpiCopy.totalAccountsLabel}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#00152a] leading-none">
              {stats.totalAccounts.toLocaleString()}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-[#006b5f]">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>{' '}
              {kpiCopy.growthRatePrefix}{stats.activeGrowthPercentage}%
            </span>
          </div>
          <span className="text-xs text-[#64748b]">{kpiCopy.totalAccountsSubtext}</span>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eceef1] text-[#00152a]">
          <span className="material-symbols-outlined text-[24px]">group</span>
        </div>
        <div className="pointer-events-none absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-[#00152a]/5" />
      </div>

      {/* Stat 2: Tour Operators */}
      <div className="relative flex items-start justify-between overflow-hidden rounded-xl bg-white p-5 shadow-xs border border-[#e2e8f0]">
        <div className="z-10 flex flex-col space-y-1">
          <span className="text-xs font-bold tracking-wider text-[#43474d] uppercase">
            {kpiCopy.tourOperatorsLabel}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#006b5f] leading-none">
              {stats.tourOperators}
            </span>
            <span className="text-sm text-[#64748b]">{kpiCopy.partnersUnit}</span>
          </div>
          <span className="text-xs text-[#64748b]">{stats.tourOperatorsDetail}</span>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9cefdf]/40 text-[#006b5f]">
          <span className="material-symbols-outlined text-[24px]">apartment</span>
        </div>
        <div className="pointer-events-none absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-[#006b5f]/5" />
      </div>

      {/* Stat 3: Locked Accounts */}
      <div className="relative flex items-start justify-between overflow-hidden rounded-xl bg-white p-5 shadow-xs border border-[#e2e8f0]">
        <div className="z-10 flex flex-col space-y-1">
          <span className="text-xs font-bold tracking-wider text-[#43474d] uppercase">
            {kpiCopy.lockedAccountsLabel}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#ba1a1a] leading-none">
              {stats.lockedAccounts}
            </span>
            <span className="text-sm text-[#64748b]">{kpiCopy.accountsUnit}</span>
          </div>
          <span className="text-xs font-medium text-[#ba1a1a]">
            {stats.lockedRatePercentage}% {kpiCopy.lockedAccountsSubtext}
          </span>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffdad6]/60 text-[#ba1a1a]">
          <span className="material-symbols-outlined text-[24px]">lock</span>
        </div>
        <div className="pointer-events-none absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-[#ba1a1a]/5" />
      </div>

      {/* Stat 4: Pending Verification */}
      <div className="relative flex items-start justify-between overflow-hidden rounded-xl bg-white p-5 shadow-xs border border-[#e2e8f0]">
        <div className="z-10 flex flex-col space-y-1">
          <span className="text-xs font-bold tracking-wider text-[#43474d] uppercase">
            {kpiCopy.pendingVerificationLabel}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#102a43] leading-none">
              {stats.pendingVerification}
            </span>
            <span className="text-sm text-[#64748b]">{kpiCopy.profilesUnit}</span>
          </div>
          <span className="text-xs text-[#64748b]">{stats.pendingDetail}</span>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e6e8eb] text-[#191c1e]">
          <span className="material-symbols-outlined text-[24px]">pending_actions</span>
        </div>
        <div className="pointer-events-none absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-[#102a43]/5" />
      </div>
    </div>
  );
}
