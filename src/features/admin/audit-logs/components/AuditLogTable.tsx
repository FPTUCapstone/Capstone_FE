'use client';

import React from 'react';
import { AuditLogSummaryDto } from '../types/auditLogAdmin';

interface AuditLogTableProps {
  items: AuditLogSummaryDto[];
  isLoading: boolean;
  onViewDetail?: (log: AuditLogSummaryDto) => void;
}

export function AuditLogTable({ items, isLoading, onViewDetail }: AuditLogTableProps) {
  const formatTimestamp = (localStr?: string | null, utcStr?: string | null) => {
    if (localStr) return localStr;
    if (!utcStr) return '-';
    try {
      const date = new Date(utcStr);
      if (isNaN(date.getTime())) return utcStr;
      return date.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return utcStr;
    }
  };

  const getRoleBadgeClass = (role: string | null) => {
    switch (role) {
      case 'Administrator':
        return 'bg-[#F6EDE8] text-[#995436] border-[#E8D3C8]';
      case 'Staff':
        return 'bg-[#E8F0EA] text-[#103B39] border-[#CBE0D4]';
      case 'TourOperator':
        return 'bg-[#FBF3E8] text-[#8F5419] border-[#F2D8B3]';
      case 'Traveler':
        return 'bg-[#F7F5EF] text-[#5B6E69] border-[#DCE2DD]';
      default:
        return 'bg-[#F7F5EF] text-[#5B6E69] border-[#DCE2DD]';
    }
  };

  const getResultBadgeClass = (result: AuditLogSummaryDto['result']) => {
    if (result === 'Success') {
      return 'border-[#CBE0D4] bg-[#E8F0EA] text-[#103B39]';
    }
    if (result === 'Failure') {
      return 'border-[#F7C9D3] bg-[#FDECEF] text-[#8C1030]';
    }
    return 'border-[#DCE2DD] bg-[#F7F5EF] text-[#5B6E69]';
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-xs text-[#1C2928]">
          <thead className="border-b border-[#DCE2DD] bg-[#F7F5EF] text-[10.5px] font-bold uppercase tracking-wider text-[#5B6E69]">
            <tr>
              <th scope="col" className="whitespace-nowrap pl-3.5 pr-2 py-3">
                Timestamp (UTC+7)
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-3">
                Event Type
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-3">
                Result
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-3">
                Actor
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-3">
                Role
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-3">
                Affected Entity
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-3">
                Entity ID
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-3">
                IP Address
              </th>
              <th scope="col" className="whitespace-nowrap pl-2 pr-3.5 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECEEEB]">
            {isLoading ? (
              // Skeleton Loading State
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="pl-3.5 pr-2 py-3.5"><div className="h-3 w-24 rounded bg-[#EDEAE1]"></div></td>
                  <td className="px-2 py-3.5"><div className="h-3 w-24 rounded bg-[#EDEAE1]"></div></td>
                  <td className="px-2 py-3.5"><div className="h-3 w-12 rounded bg-[#EDEAE1]"></div></td>
                  <td className="px-2 py-3.5"><div className="h-3 w-24 rounded bg-[#EDEAE1]"></div></td>
                  <td className="px-2 py-3.5"><div className="h-3 w-14 rounded bg-[#EDEAE1]"></div></td>
                  <td className="px-2 py-3.5"><div className="h-3 w-16 rounded bg-[#EDEAE1]"></div></td>
                  <td className="px-2 py-3.5"><div className="h-3 w-10 rounded bg-[#EDEAE1]"></div></td>
                  <td className="px-2 py-3.5"><div className="h-3 w-16 rounded bg-[#EDEAE1]"></div></td>
                  <td className="pl-2 pr-3.5 py-3.5"><div className="ml-auto h-7 w-16 rounded bg-[#EDEAE1]"></div></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              // Empty State (MSG128)
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-[#94A59F]">
                      find_in_page
                    </span>
                    <p className="text-sm font-bold text-[#1C2928]">
                      No records found matching your criteria.
                    </p>
                    <p className="text-xs text-[#5B6E69]">
                      Try adjusting your search query, action type filter, or date range.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              items.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-[#F7F5EF]/60">
                  <td className="whitespace-nowrap pl-3.5 pr-2 py-3 font-mono text-[11px] text-[#5B6E69]">
                    {formatTimestamp(log.createdAtLocal, log.createdAtUtc)}
                  </td>
                  <td className="max-w-[140px] px-2 py-3">
                    <span
                      title={log.actionType}
                      className="inline-block max-w-full truncate rounded-md border border-[#CBE0D4] bg-[#E8F0EA] px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-[#103B39]"
                    >
                      {log.actionType}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-3">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10.5px] font-bold ${getResultBadgeClass(log.result)}`}>
                      {log.result ?? '-'}
                    </span>
                  </td>
                  <td className="max-w-[155px] px-2 py-3">
                    {log.actorUserId === null ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#DCE2DD] bg-[#F7F5EF] px-2 py-0.5 text-[10.5px] font-semibold text-[#5B6E69]">
                        <span className="material-symbols-outlined text-xs">settings</span>
                        System
                      </span>
                    ) : (
                      <div className="min-w-0">
                        <div className="truncate font-bold text-[#1C2928]" title={log.actorFullName || 'N/A'}>{log.actorFullName || 'N/A'}</div>
                        {log.actorEmail && (
                          <div className="truncate text-[11px] text-[#5B6E69]" title={log.actorEmail}>{log.actorEmail}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3">
                    {log.actorRole ? (
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10.5px] font-bold ${getRoleBadgeClass(log.actorRole)}`}>
                        {log.actorRole}
                      </span>
                    ) : (
                      <span className="text-[#94A59F]">-</span>
                    )}
                  </td>
                  <td className="max-w-[108px] truncate px-2 py-3 font-semibold text-[#1C2928]" title={log.affectedEntity}>
                    {log.affectedEntity}
                  </td>
                  <td className="max-w-[68px] truncate px-2 py-3 font-mono text-[11px] text-[#5B6E69]" title={log.affectedEntityId != null ? String(log.affectedEntityId) : undefined}>
                    {log.affectedEntityId ?? '-'}
                  </td>
                  <td className="max-w-[118px] truncate px-2 py-3 font-mono text-[11px] text-[#5B6E69]" title={log.ipAddress || undefined}>
                    {log.ipAddress || '-'}
                  </td>
                  <td className="whitespace-nowrap pl-2 pr-3.5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onViewDetail?.(log)}
                      disabled={!onViewDetail}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#DCE2DD] bg-white px-2 py-1 text-[11px] font-bold text-[#174B4A] transition hover:border-[#174B4A]/40 hover:bg-[#E8F0EA] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[15px]">visibility</span>
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
