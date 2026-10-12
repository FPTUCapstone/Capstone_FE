import React from 'react';
import type { UserAccountRole, UserAccountStatus } from '../types/userAccount';
import { adminUserAccountsEn } from '../resources/en';

interface UserAccountFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRole: 'All' | UserAccountRole;
  onRoleChange: (role: 'All' | UserAccountRole) => void;
  selectedStatus: 'All' | UserAccountStatus;
  onStatusChange: (status: 'All' | UserAccountStatus) => void;
  fromDate?: string;
  onFromDateChange?: (date: string) => void;
  toDate?: string;
  onToDateChange?: (date: string) => void;
  totalCount: number;
  travelerCount: number;
  operatorCount: number;
}

export function UserAccountFilterBar({
  searchQuery,
  onSearchChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
  fromDate = '',
  onFromDateChange,
  toDate = '',
  onToDateChange,
  totalCount,
  travelerCount,
  operatorCount,
}: UserAccountFilterBarProps) {
  const filterCopy = adminUserAccountsEn.directory.filter;

  return (
    <div className="space-y-4 rounded-xl bg-white p-4 shadow-xs border border-[#e2e8f0]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xl">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b] text-[20px]">
            search
          </span>
          <input
            aria-label={filterCopy.searchAriaLabel}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={filterCopy.searchPlaceholder}
            className="w-full rounded-lg bg-[#f2f4f7] py-2.5 pl-11 pr-4 text-sm text-[#191c1e] placeholder:text-[#64748b] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#006b5f]/20 border border-transparent focus:border-[#006b5f]"
          />
        </div>

        {/* Segmented Role Tabs */}
        <div className="inline-flex self-start rounded-lg bg-[#eceef1] p-1 lg:self-auto">
          <button
            type="button"
            onClick={() => onRoleChange('All')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedRole === 'All'
                ? 'bg-white text-[#00152a] shadow-xs'
                : 'text-[#43474d] hover:text-[#191c1e]'
            }`}
          >
            {filterCopy.allRolesTab}{' '}
            <span className="font-normal text-[#64748b]">({totalCount})</span>
          </button>
          <button
            type="button"
            onClick={() => onRoleChange('Traveler')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedRole === 'Traveler'
                ? 'bg-white text-[#00152a] shadow-xs'
                : 'text-[#43474d] hover:text-[#191c1e]'
            }`}
          >
            {filterCopy.travelerTab}{' '}
            <span className="font-normal text-[#64748b]">({travelerCount})</span>
          </button>
          <button
            type="button"
            onClick={() => onRoleChange('Tour Operator')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedRole === 'Tour Operator'
                ? 'bg-white text-[#00152a] shadow-xs'
                : 'text-[#43474d] hover:text-[#191c1e]'
            }`}
          >
            {filterCopy.operatorTab}{' '}
            <span className="font-normal text-[#64748b]">({operatorCount})</span>
          </button>
        </div>

        {/* Dropdown Filters & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              aria-label={filterCopy.statusFilterAriaLabel}
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value as 'All' | UserAccountStatus)}
              className="appearance-none cursor-pointer rounded-lg bg-[#f2f4f7] py-2.5 pl-3.5 pr-9 text-xs font-semibold text-[#191c1e] outline-none border border-transparent focus:border-[#006b5f] focus:bg-white"
            >
              <option value="All">{filterCopy.statusAll}</option>
              <option value="Active">{filterCopy.statusActive}</option>
              <option value="Locked">{filterCopy.statusLocked}</option>
              <option value="Pending">{filterCopy.statusPending}</option>
            </select>
            <span className="pointer-events-none material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-[20px]">
              expand_more
            </span>
          </div>

          <button
            type="button"
            title={filterCopy.advancedFilterTitle}
            className="rounded-lg bg-[#f2f4f7] p-2.5 text-[#64748b] transition-colors hover:bg-[#eceef1] hover:text-[#191c1e]"
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
        </div>
      </div>

      {/* Registration Date Range Ribbon (SRS 3.9.1.1 & BR-29) */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#f2f4f7] text-xs">
        <span className="font-semibold text-[#43474d]">{filterCopy.dateRangeFromLabel}:</span>
        <input
          type="date"
          aria-label={filterCopy.dateRangeFromLabel}
          value={fromDate}
          onChange={(e) => onFromDateChange?.(e.target.value)}
          className="rounded-lg bg-[#f2f4f7] px-3 py-1.5 text-xs text-[#191c1e] outline-none border border-transparent focus:border-[#006b5f] focus:bg-white"
        />
        <span className="font-semibold text-[#43474d]">{filterCopy.dateRangeToLabel}:</span>
        <input
          type="date"
          aria-label={filterCopy.dateRangeToLabel}
          value={toDate}
          onChange={(e) => onToDateChange?.(e.target.value)}
          className="rounded-lg bg-[#f2f4f7] px-3 py-1.5 text-xs text-[#191c1e] outline-none border border-transparent focus:border-[#006b5f] focus:bg-white"
        />
        {fromDate && toDate && fromDate > toDate && (
          <span className="text-xs font-semibold text-[#ba1a1a]">
            {filterCopy.msg29InvalidDateRange}
          </span>
        )}
      </div>
    </div>
  );
}
