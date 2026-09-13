'use client';

import React from 'react';
import { GetAuditLogsParams, UserRole } from '../types/auditLogAdmin';

interface AuditLogFilterBarProps {
  filters: GetAuditLogsParams;
  onChange: (updatedFilters: Partial<GetAuditLogsParams>) => void;
  onReset: () => void;
}

export function AuditLogFilterBar({ filters, onChange, onReset }: AuditLogFilterBarProps) {
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
          <input
            id="audit-filter-from-date"
            type="date"
            value={filters.fromDateUtc ? filters.fromDateUtc.split('T')[0] : ''}
            onChange={(e) => onChange({ fromDateUtc: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })}
            className="w-full rounded-lg border border-[#314863] bg-[#00152a] px-3 py-2 text-xs text-[#d1e4ff] focus:border-[#71f8e4] focus:outline-none"
          />
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="audit-filter-to-date" className="mb-1 block text-xs font-semibold text-[#9edbd2]">
            To Date (UTC)
          </label>
          <input
            id="audit-filter-to-date"
            type="date"
            value={filters.toDateUtc ? filters.toDateUtc.split('T')[0] : ''}
            onChange={(e) => onChange({ toDateUtc: e.target.value ? `${e.target.value}T23:59:59Z` : undefined })}
            className="w-full rounded-lg border border-[#314863] bg-[#00152a] px-3 py-2 text-xs text-[#d1e4ff] focus:border-[#71f8e4] focus:outline-none"
          />
        </div>
      </div>

      {/* Reset Button Action Bar */}
      <div className="mt-4 flex items-center justify-end border-t border-[#314863]/50 pt-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#314863] bg-[#00152a] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-[#314863] hover:text-white"
        >
          <span className="material-symbols-outlined text-sm">restart_alt</span>
          Reset Filters
        </button>
      </div>
    </div>
  );
}
