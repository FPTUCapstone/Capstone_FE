import React from 'react';
import Link from 'next/link';
import { mockUserAccountsList } from '../data/mockUserAccounts';
import { adminUserAccountsEn } from '../resources/en';

interface UserAccountDetailViewProps {
  userId: number;
}

export function UserAccountDetailView({ userId }: UserAccountDetailViewProps) {
  const copy = adminUserAccountsEn.detail;

  const user = mockUserAccountsList.find((u) => u.id === userId) ?? {
    id: userId,
    name: `User #${userId}`,
    email: `user.${userId}@tripmate.vn`,
    phone: '0900 000 000',
    role: 'Traveler' as const,
    createdAt: '01/01/2026',
    status: 'Active' as const,
  };

  const isOperator = user.role === 'Tour Operator';
  const isLocked = user.status === 'Locked';

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 text-[#191c1e] sm:px-6 md:px-8 md:py-8">
      <div className="mx-auto flex max-w-5xl flex-col space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#64748b] uppercase">
            <Link href="/admin/users" className="hover:text-[#006b5f] transition-colors">
              {copy.breadcrumbs.console}
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link href="/admin/users" className="hover:text-[#006b5f] transition-colors">
              {copy.breadcrumbs.userAccounts}
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-normal text-[#191c1e]">{copy.breadcrumbs.detail}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#006b5f] uppercase">
                {copy.eyebrow}
              </span>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#00152a] md:text-3xl">
                {user.name}
              </h1>
            </div>

            <span className="inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#004b87] border border-[#cfe2f3]">
              {copy.pendingBadge}
            </span>
          </div>
        </div>

        {/* User Profile Summary Card */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center justify-between border-b border-[#e2e8f0] pb-6">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-16 w-16 rounded-full object-cover shadow-2xs"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eceef1] text-lg font-bold text-[#00152a]">
                    {user.name
                      .split(' ')
                      .map((w) => w[0])
                      .slice(-2)
                      .join('')}
                  </div>
                )}
                {!isLocked && (
                  <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-[#006b5f] ring-2 ring-white" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#00152a]">{user.name}</h2>
                  {user.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#9cefdf]/40 px-2 py-0.5 text-xs font-semibold text-[#0b6f63]">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      {copy.verifiedBadge}
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-[#64748b]">ID: #USR-{user.id}</p>
                {user.organization && (
                  <p className="mt-1 text-xs font-medium text-[#43474d]">{user.organization}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isOperator ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#102a43] px-3 py-1.5 text-xs font-semibold text-white">
                  <span className="material-symbols-outlined text-[14px]">apartment</span>
                  Tour Operator
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9cefdf]/50 px-3 py-1.5 text-xs font-semibold text-[#0b6f63]">
                  <span className="material-symbols-outlined text-[14px]">hiking</span>
                  Traveler
                </span>
              )}

              {isLocked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffdad6] px-3 py-1.5 text-xs font-semibold text-[#93000a]">
                  <span className="h-2 w-2 rounded-full bg-[#ba1a1a]" />
                  Locked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9cefdf]/40 px-3 py-1.5 text-xs font-semibold text-[#0b6f63]">
                  <span className="h-2 w-2 rounded-full bg-[#006b5f]" />
                  Active
                </span>
              )}
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="pt-6">
            <h3 className="text-sm font-bold text-[#00152a] mb-4">
              {copy.contactInfoTitle}
            </h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-[#f2f4f7] p-4">
                <dt className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  {copy.emailLabel}
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#191c1e]">{user.email}</dd>
              </div>
              <div className="rounded-xl bg-[#f2f4f7] p-4">
                <dt className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  {copy.phoneLabel}
                </dt>
                <dd className="mt-1 font-mono text-sm font-medium text-[#191c1e]">{user.phone}</dd>
              </div>
              <div className="rounded-xl bg-[#f2f4f7] p-4">
                <dt className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  {copy.joinedDateLabel}
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#191c1e]">{user.createdAt}</dd>
              </div>
            </dl>
          </div>

          {/* Integration Notice & Navigation */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#e2e8f0] pt-6">
            <p className="text-xs text-[#64748b] max-w-md">
              {copy.pendingDescription}
            </p>

            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center rounded-xl bg-[#006b5f] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#005048]"
            >
              {copy.backToDirectoryLabel}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
