'use client';

import React, { useRef } from 'react';
import { GetAuditLogsParams, UserRole } from '../types/auditLogAdmin';

interface AuditLogFilterBarProps {
  filters: GetAuditLogsParams;
  onChange: (updatedFilters: Partial<GetAuditLogsParams>) => void;
  onReset: () => void;
}

export function AuditLogFilterBar({ filters, onChange, onReset }: AuditLogFilterBarProps) {
  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker();
      } else {
        inputRef.current.focus();
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to convert UTC ISO string from filter state to local YYYY-MM-DD for date input
  const getLocalDateInputVal = (isoStr?: string): string => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Convert user selected local YYYY-MM-DD to UTC ISO start-of-day (00:00:00 local time)
  const handleFromDateChange = (val: string) => {
    if (!val) {
      onChange({ fromDateUtc: undefined });
      return;
    }
    const localStartOfDay = new Date(`${val}T00:00:00`);
    onChange({ fromDateUtc: localStartOfDay.toISOString() });
  };

  // Convert user selected local YYYY-MM-DD to UTC ISO end-of-day (23:59:59.999 local time)
  const handleToDateChange = (val: string) => {
    if (!val) {
      onChange({ toDateUtc: undefined });
      return;
    }
    const localEndOfDay = new Date(`${val}T23:59:59.999`);
    onChange({ toDateUtc: localEndOfDay.toISOString() });
  };

  const fromDateValue = getLocalDateInputVal(filters.fromDateUtc);
  const toDateValue = getLocalDateInputVal(filters.toDateUtc);

  return (
    <div className="rounded-xl border border-[#314863] bg-[#102a43] p-4 text-slate-100 shadow-md">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Search Keyword */}
        <div className="xl:col-span-2">
          <label htmlFor="audit-search-keyword" className="mb-1 block text-xs font-semibold text-[#9edbd2]">
            Search Keyword
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              search
            </span>
            <input
              id="audit-search-keyword"
              type="text"
              value={filters.keyword || ''}
              onChange={(e) => onChange({ keyword: e.target.value })}
              placeholder="Search by keyword, email, or entity ID..."
              className="w-full rounded-lg border border-[#314863] bg-[#00152a] py-2 pl-9 pr-3 text-xs text-[#d1e4ff] placeholder-slate-400 focus:border-[#71f8e4] focus:outline-none"
            />
          </div>
        </div>

        {/* Action Type */}
        <div>
          <label htmlFor="audit-filter-action-type" className="mb-1 block text-xs font-semibold text-[#9edbd2]">
            Action Type
          </label>
          <select
            id="audit-filter-action-type"
            value={filters.actionType || ''}
            onChange={(e) => onChange({ actionType: e.target.value || undefined })}
            className="w-full rounded-lg border border-[#314863] bg-[#00152a] px-3 py-2 text-xs text-[#d1e4ff] focus:border-[#71f8e4] focus:outline-none"
          >
            <option value="">All Action Types</option>
            <option value="ApproveOperatorApplication">ApproveOperatorApplication</option>
            <option value="RejectOperatorApplication">RejectOperatorApplication</option>
            <option value="CreateTourPackage">CreateTourPackage</option>
            <option value="UpdateTourPackage">UpdateTourPackage</option>
            <option value="LockUser">LockUser</option>
            <option value="UnlockUser">UnlockUser</option>
          </select>
        </div>

        {/* Actor Role */}
        <div>
          <label htmlFor="audit-filter-actor-role" className="mb-1 block text-xs font-semibold text-[#9edbd2]">
            Actor Role
          </label>
          <select
            id="audit-filter-actor-role"
            value={filters.actorRole || ''}
            onChange={(e) => onChange({ actorRole: (e.target.value as UserRole) || undefined })}
            className="w-full rounded-lg border border-[#314863] bg-[#00152a] px-3 py-2 text-xs text-[#d1e4ff] focus:border-[#71f8e4] focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="Administrator">Administrator</option>
            <option value="TourOperator">TourOperator</option>
            <option value="Traveler">Traveler</option>
          </select>
        </div>

        {/* Affected Entity */}
        <div>
          <label htmlFor="audit-filter-affected-entity" className="mb-1 block text-xs font-semibold text-[#9edbd2]">
            Affected Entity
          </label>
          <select
            id="audit-filter-affected-entity"
            value={filters.affectedEntity || ''}
            onChange={(e) => onChange({ affectedEntity: e.target.value || undefined })}
            className="w-full rounded-lg border border-[#314863] bg-[#00152a] px-3 py-2 text-xs text-[#d1e4ff] focus:border-[#71f8e4] focus:outline-none"
          >
            <option value="">All Entities</option>
            <option value="OperatorProfile">OperatorProfile</option>
            <option value="TourPackage">TourPackage</option>
            <option value="User">User</option>
            <option value="TravelGroup">TravelGroup</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label htmlFor="audit-filter-from-date" className="mb-1 block text-xs font-semibold text-[#9edbd2]">
            From Date (UTC)
          </label>
          <div
            onClick={() => handleContainerClick(fromDateRef)}
            className="group relative flex cursor-pointer items-center rounded-lg border border-[#314863] bg-[#00152a] px-3 py-2 text-xs text-[#d1e4ff] transition-all hover:border-[#71f8e4]/70 hover:shadow-xs focus-within:border-[#71f8e4]"
          >
            <span className="material-symbols-outlined mr-2 text-base text-[#71f8e4] transition-colors group-hover:text-white">
              calendar_month
            </span>
            <input
              ref={fromDateRef}
              id="audit-filter-from-date"
              type="date"
              max={toDateValue || todayStr}
              value={fromDateValue}
              onChange={(e) => handleFromDateChange(e.target.value)}
              className="w-full cursor-pointer bg-transparent text-xs text-[#d1e4ff] focus:outline-none [color-scheme:dark]"
            />
            {filters.fromDateUtc && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ fromDateUtc: undefined });
                }}
                className="ml-1 rounded-full p-0.5 text-slate-400 hover:bg-[#314863] hover:text-white"
                title="Clear From Date"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="audit-filter-to-date" className="mb-1 block text-xs font-semibold text-[#9edbd2]">
            To Date (UTC)
          </label>
          <div
            onClick={() => handleContainerClick(toDateRef)}
            className="group relative flex cursor-pointer items-center rounded-lg border border-[#314863] bg-[#00152a] px-3 py-2 text-xs text-[#d1e4ff] transition-all hover:border-[#71f8e4]/70 hover:shadow-xs focus-within:border-[#71f8e4]"
          >
            <span className="material-symbols-outlined mr-2 text-base text-[#71f8e4] transition-colors group-hover:text-[#71f8e4]">
              event
            </span>
            <input
              ref={toDateRef}
              id="audit-filter-to-date"
              type="date"
              min={fromDateValue || undefined}
              max={todayStr}
              value={toDateValue}
              onChange={(e) => handleToDateChange(e.target.value)}
              className="w-full cursor-pointer bg-transparent text-xs text-[#d1e4ff] focus:outline-none [color-scheme:dark]"
            />
            {filters.toDateUtc && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ toDateUtc: undefined });
                }}
                className="ml-1 rounded-full p-0.5 text-slate-400 hover:bg-[#314863] hover:text-white"
                title="Clear To Date"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reset Button Action Bar */}
      <div className="mt-4 flex items-center justify-end border-t border-[#314863]/50 pt-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#314863] bg-[#00152a] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-[#314863] hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-sm">restart_alt</span>
          Reset Filters
        </button>
      </div>
    </div>
  );
}
