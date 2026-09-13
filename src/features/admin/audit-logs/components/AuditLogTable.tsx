'use client';

import React from 'react';
import { AuditLogSummaryDto } from '../types/auditLogAdmin';

interface AuditLogTableProps {
  items: AuditLogSummaryDto[];
  isLoading: boolean;
}

export function AuditLogTable({ items, isLoading }: AuditLogTableProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
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
        <table className="w-full text-left text-xs text-[#d1e4ff]">
          <thead className="border-b border-[#314863] bg-[#00152a]/80 text-[11px] font-bold uppercase tracking-wider text-[#9edbd2]">
            <tr>
              <th scope="col" className="px-4 py-3.5">
                Timestamp (UTC+7)
              </th>
              <th scope="col" className="px-4 py-3.5">
                Event Type
              </th>
              <th scope="col" className="px-4 py-3.5">
                Actor
              </th>
              <th scope="col" className="px-4 py-3.5">
                Role
              </th>
              <th scope="col" className="px-4 py-3.5">
                Affected Entity
              </th>
              <th scope="col" className="px-4 py-3.5">
                Entity ID
              </th>
              <th scope="col" className="px-4 py-3.5">
                IP Address
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
                  <td className="px-4 py-4"><div className="h-3 w-20 rounded bg-[#314863]/60"></div></td>
                  <td className="px-4 py-4"><div className="h-3 w-24 rounded bg-[#314863]/60"></div></td>
                  <td className="px-4 py-4"><div className="h-3 w-12 rounded bg-[#314863]/60"></div></td>
                  <td className="px-4 py-4"><div className="h-3 w-24 rounded bg-[#314863]/60"></div></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              // Empty State (MSG128)
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-slate-500">
                      find_in_page
                    </span>
                    <p className="text-sm font-semibold text-slate-300">
                      No audit log entries match the submitted criteria.
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
                    {formatDate(log.createdAtLocal || log.createdAtUtc)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded border border-[#71f8e4]/30 bg-[#71f8e4]/10 px-2 py-0.5 font-semibold text-[#71f8e4]">
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
                      <div>
                        <div className="font-semibold text-slate-200">{log.actorFullName || 'N/A'}</div>
                        {log.actorEmail && (
                          <div className="text-[11px] text-slate-400">{log.actorEmail}</div>
                        )}
                      </div>
                    )}
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
                  <td className="px-4 py-3 font-medium text-slate-200">
                    {log.affectedEntity}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {log.affectedEntityId ?? '-'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {log.ipAddress || '-'}
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
