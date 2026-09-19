'use client';

import React from 'react';
import { AuditLogSummaryDto } from '../types/auditLogAdmin';
import { AuditLogResultBadge } from './AuditLogResultBadge';

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
        return 'bg-purple-900/40 text-purple-300 border-purple-700/50';
      case 'TourOperator':
        return 'bg-blue-900/40 text-blue-300 border-blue-700/50';
      case 'Traveler':
        return 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#314863] bg-[#102a43] shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left text-xs text-[#d1e4ff]">
          <thead className="border-b border-[#314863] bg-[#00152a]/80 text-[11px] font-bold uppercase tracking-wider text-[#9edbd2]">
            <tr>
              <th scope="col" className="w-[170px] px-4 py-3.5">
                Timestamp (UTC+7)
              </th>
              <th scope="col" className="w-[150px] px-4 py-3.5">
                Event Type
              </th>
              <th scope="col" className="w-[200px] px-4 py-3.5">
                Actor
              </th>
              <th scope="col" className="w-[150px] px-4 py-3.5">
                Result
              </th>
              <th scope="col" className="w-[120px] px-4 py-3.5">
                Role
              </th>
              <th scope="col" className="w-[140px] px-4 py-3.5">
                Affected Entity
              </th>
              <th scope="col" className="w-[90px] px-4 py-3.5">
                Entity ID
              </th>
              <th scope="col" className="w-[120px] px-4 py-3.5">
                IP Address
              </th>
              <th scope="col" className="w-[90px] px-4 py-3.5 text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#314863]/50">
            {isLoading ? (
              // Skeleton Loading State
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-3 w-28 rounded bg-[#314863]/60"></div></td>
                  <td className="px-4 py-4"><div className="h-3 w-36 rounded bg-[#314863]/60"></div></td>
                  <td className="px-4 py-4"><div className="h-3 w-32 rounded bg-[#314863]/60"></div></td>
                  <td className="px-4 py-4"><div className="h-3 w-24 rounded bg-[#314863]/60"></div></td>
                  <td className="px-4 py-4"><div className="h-3 w-20 rounded bg-[#314863]/60"></div></td>
                  <td className="px-4 py-4"><div className="h-3 w-24 rounded bg-[#314863]/60"></div></td>
                  <td className="px-4 py-4"><div className="h-3 w-12 rounded bg-[#314863]/60"></div></td>
                  <td className="px-4 py-4"><div className="h-3 w-24 rounded bg-[#314863]/60"></div></td>
                  <td className="px-4 py-4 text-center"><div className="mx-auto h-6 w-6 rounded bg-[#314863]/60"></div></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              // Empty State (MSG128)
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-slate-500">
                      find_in_page
                    </span>
                    <p className="text-sm font-semibold text-slate-300">
                      No records found matching your criteria.
                    </p>
                    <p className="text-xs text-slate-400">
                      Try adjusting your search query, action type filter, or date range.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              items.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-[#00152a]/40">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-300">
                    {formatTimestamp(log.createdAtLocal, log.createdAtUtc)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block truncate max-w-full rounded border border-[#71f8e4]/30 bg-[#71f8e4]/10 px-2 py-0.5 font-semibold text-[#71f8e4]">
                      {log.actionType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {log.actorUserId === null ? (
                      <span className="inline-flex items-center gap-1 rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                        <span className="material-symbols-outlined text-xs">settings</span>
                        System
                      </span>
                    ) : (
                      <div className="truncate">
                        <div className="truncate font-semibold text-slate-200">{log.actorFullName || 'N/A'}</div>
                        {log.actorEmail && (
                          <div className="truncate text-[11px] text-slate-400">{log.actorEmail}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <AuditLogResultBadge result={log.result} />
                  </td>
                  <td className="px-4 py-3">
                    {log.actorRole ? (
                      <span className={`inline-block rounded border px-2 py-0.5 text-[11px] font-medium ${getRoleBadgeClass(log.actorRole)}`}>
                        {log.actorRole}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-200 truncate">
                    {log.affectedEntity}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 truncate">
                    {log.affectedEntityId ?? '-'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 truncate">
                    {log.ipAddress || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onViewDetail?.(log)}
                      className="inline-flex items-center justify-center rounded-lg border border-[#314863] bg-[#00152a]/60 p-1.5 text-[#71f8e4] transition-all hover:border-[#71f8e4] hover:bg-[#71f8e4]/20 hover:text-white hover:shadow-md"
                      title="View Details (UC-69)"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
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
