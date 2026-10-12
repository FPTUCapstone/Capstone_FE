import React from 'react';
import Link from 'next/link';
import type { UserAccountItem } from '../types/userAccount';
import { adminUserAccountsEn } from '../resources/en';

interface UserAccountTableProps {
  accounts: UserAccountItem[];
  onLockAccount?: (account: UserAccountItem) => void;
  onUnlockAccount?: (account: UserAccountItem) => void;
}

export function UserAccountTable({
  accounts,
  onLockAccount,
  onUnlockAccount,
}: UserAccountTableProps) {
  const tableCopy = adminUserAccountsEn.directory.table;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-xs border border-[#e2e8f0]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f2f4f7] text-xs font-bold uppercase tracking-wider text-[#43474d] border-b border-[#e2e8f0]">
              <th className="w-12 py-3.5 pl-5 pr-3 text-center">
                <input
                  aria-label={tableCopy.selectAllAriaLabel}
                  type="checkbox"
                  className="h-4 w-4 rounded text-[#006b5f] accent-[#006b5f] cursor-pointer"
                />
              </th>
              <th className="px-4 py-3.5 font-semibold">{tableCopy.colUser}</th>
              <th className="px-4 py-3.5 font-semibold">{tableCopy.colEmail}</th>
              <th className="px-4 py-3.5 font-semibold">{tableCopy.colPhone}</th>
              <th className="px-4 py-3.5 font-semibold">{tableCopy.colRole}</th>
              <th className="px-4 py-3.5 font-semibold">{tableCopy.colCreatedAt}</th>
              <th className="px-4 py-3.5 font-semibold">{tableCopy.colLastSignIn}</th>
              <th className="px-4 py-3.5 font-semibold">{tableCopy.colStatus}</th>
              <th className="pl-4 pr-6 py-3.5 text-right font-semibold">{tableCopy.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f4f7] text-sm">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sm text-[#64748b]">
                  {tableCopy.emptyMessage}
                </td>
              </tr>
            ) : (
              accounts.map((account) => {
                const isOperator = account.role === 'Tour Operator';
                const isLocked = account.status === 'Locked';
                const isPending = account.status === 'Pending';

                return (
                  <tr
                    key={account.id}
                    className="transition-colors hover:bg-[#f2f4f7]/60"
                  >
                    <td className="py-4 pl-5 pr-3 text-center">
                      <input
                        aria-label={`${tableCopy.selectRowAriaLabel} ${account.name}`}
                        type="checkbox"
                        className="h-4 w-4 rounded text-[#006b5f] accent-[#006b5f] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {account.avatarUrl ? (
                            <img
                              src={account.avatarUrl}
                              alt={account.name}
                              className="h-10 w-10 rounded-full object-cover shadow-2xs"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eceef1] text-xs font-bold text-[#00152a]">
                              {account.name
                                .split(' ')
                                .map((w) => w[0])
                                .slice(-2)
                                .join('')}
                            </div>
                          )}
                          {!isLocked && (
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#006b5f] ring-2 ring-white" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-sm font-semibold text-[#00152a]">
                            {account.name}
                          </span>
                          {account.organization && (
                            <div className="mt-0.5 flex items-center gap-1.5">
                              {account.verified && (
                                <span className="material-symbols-outlined text-[14px] text-[#006b5f]">
                                  verified
                                </span>
                              )}
                              <span className="truncate text-xs text-[#64748b]">
                                {account.organization}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-[#191c1e]">
                      {account.email}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-[#191c1e]">
                      {account.phone}
                    </td>
                    <td className="px-4 py-4">
                      {isOperator ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#102a43] px-2.5 py-1 text-xs font-semibold text-white">
                          <span className="material-symbols-outlined text-[14px]">apartment</span>
                          Tour Operator
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9cefdf]/50 px-2.5 py-1 text-xs font-semibold text-[#0b6f63]">
                          <span className="material-symbols-outlined text-[14px]">hiking</span>
                          Traveler
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#64748b]">
                      {account.createdAt}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#64748b]">
                      {account.lastSignIn ?? 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#ffdad6] px-2.5 py-1 text-xs font-semibold text-[#93000a]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#ba1a1a]" />
                          Locked {account.statusDetail ? `(${account.statusDetail})` : ''}
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#e0e3e6] px-2.5 py-1 text-xs font-semibold text-[#43474d]">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#9cefdf]/40 px-2.5 py-1 text-xs font-semibold text-[#0b6f63]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#006b5f]" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="pl-4 pr-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/admin/users/${account.id}`}
                          className="rounded-md bg-[#eceef1] px-3 py-1.5 text-xs font-semibold text-[#191c1e] transition-colors hover:bg-[#e0e3e6]"
                        >
                          {tableCopy.viewDetails}
                        </Link>
                        {isLocked ? (
                          onUnlockAccount && (
                            <button
                              type="button"
                              onClick={() => onUnlockAccount(account)}
                              className="rounded-md bg-[#f2f4f7] px-3 py-1.5 text-xs font-semibold text-[#006b5f] transition-colors hover:bg-[#9cefdf]/30"
                            >
                              {tableCopy.unlockAccount}
                            </button>
                          )
                        ) : (
                          onLockAccount && (
                            <button
                              type="button"
                              onClick={() => onLockAccount(account)}
                              className="rounded-md bg-[#ffdad6] px-3 py-1.5 text-xs font-semibold text-[#93000a] transition-colors hover:bg-[#ffdad6]/80"
                            >
                              {tableCopy.lockAccount}
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#e2e8f0] p-4 bg-white">
        <span className="text-xs text-[#64748b]">
          {tableCopy.showingSummary(accounts.length, accounts.length)}
        </span>
        <div className="flex items-center gap-1.5 self-center">
          <button
            disabled
            type="button"
            aria-label="Previous page"
            className="rounded-lg bg-[#f2f4f7] p-2 text-[#64748b] transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button
            type="button"
            aria-current="page"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#006b5f] text-xs font-bold text-white shadow-2xs"
          >
            1
          </button>
          <button
            disabled
            type="button"
            aria-label="Next page"
            className="rounded-lg bg-[#f2f4f7] p-2 text-[#64748b] transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
