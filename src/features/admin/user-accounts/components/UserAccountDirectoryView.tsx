'use client';

import React, { useMemo, useState } from 'react';
import type { UserAccountItem, UserAccountRole, UserAccountStatus } from '../types/userAccount';
import { mockUserAccountKpiStats, mockUserAccountsList } from '../data/mockUserAccounts';
import { adminUserAccountsEn } from '../resources/en';
import { UserAccountKpiBento } from './UserAccountKpiBento';
import { UserAccountFilterBar } from './UserAccountFilterBar';
import { UserAccountTable } from './UserAccountTable';
import { UserAccountSafetyTimeline } from './UserAccountSafetyTimeline';

interface UserAccountDirectoryViewProps {
  initialAccounts?: UserAccountItem[];
  onLockAccount?: (account: UserAccountItem) => void;
  onUnlockAccount?: (account: UserAccountItem) => void;
}

export function UserAccountDirectoryView({
  initialAccounts = mockUserAccountsList,
  onLockAccount,
  onUnlockAccount,
}: UserAccountDirectoryViewProps) {
  const copy = adminUserAccountsEn.directory;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'All' | UserAccountRole>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | UserAccountStatus>('All');

  const filteredAccounts = useMemo(() => {
    return initialAccounts.filter((account) => {
      // Role filter
      if (selectedRole !== 'All' && account.role !== selectedRole) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'All' && account.status !== selectedStatus) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = account.name.toLowerCase().includes(query);
        const matchesOrg = account.organization?.toLowerCase().includes(query) ?? false;
        const matchesEmail = account.email.toLowerCase().includes(query);
        const matchesPhone = account.phone.includes(query);

        if (!matchesName && !matchesOrg && !matchesEmail && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [initialAccounts, selectedRole, selectedStatus, searchQuery]);

  const travelerCount = useMemo(
    () => initialAccounts.filter((a) => a.role === 'Traveler').length,
    [initialAccounts],
  );
  const operatorCount = useMemo(
    () => initialAccounts.filter((a) => a.role === 'Tour Operator').length,
    [initialAccounts],
  );

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 text-[#191c1e] sm:px-6 md:px-8 md:py-8">
      <div className="mx-auto flex max-w-7xl flex-col space-y-6">
        {/* Route Ribbon Breadcrumbs & Header Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#64748b] uppercase">
              <span className="hover:text-[#006b5f] transition-colors">
                {copy.breadcrumbs.console}
              </span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-bold text-[#006b5f]">{copy.breadcrumbs.userAccounts}</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-normal text-[#191c1e]">{copy.breadcrumbs.moderation}</span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#00152a] md:text-3xl">
                {copy.title}
              </h1>
              <span className="hidden sm:inline-flex rounded-full bg-[#eef6ff] px-2.5 py-0.5 text-xs font-bold text-[#004b87] border border-[#cfe2f3]">
                {copy.previewBadge}
              </span>
            </div>

            <p className="text-sm text-[#43474d] max-w-3xl">
              {copy.description}
            </p>
          </div>

          {/* Right Header Tools */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-[#191c1e] shadow-2xs border border-[#e2e8f0] transition-colors hover:bg-[#eceef1]"
            >
              <span className="material-symbols-outlined text-[18px] text-[#64748b]">
                file_download
              </span>
              <span>{copy.exportCsvLabel}</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-[#006b5f] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#005048]"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>{copy.addAdminLabel}</span>
            </button>
          </div>
        </div>

        {/* Bento KPI Stats Grid */}
        <UserAccountKpiBento stats={mockUserAccountKpiStats} />

        {/* Filter Ribbon & Search Controls */}
        <UserAccountFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          totalCount={initialAccounts.length}
          travelerCount={travelerCount}
          operatorCount={operatorCount}
        />

        {/* Moderation Data Table */}
        <UserAccountTable
          accounts={filteredAccounts}
          onLockAccount={onLockAccount}
          onUnlockAccount={onUnlockAccount}
        />

        {/* Operational Safety Log & Policy Advisory */}
        <UserAccountSafetyTimeline />
      </div>
    </main>
  );
}
