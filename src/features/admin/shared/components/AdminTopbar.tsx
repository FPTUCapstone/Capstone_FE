'use client';

import Link from 'next/link';
import AdminLogoutButton from '@/features/admin/auth/AdminLogoutButton';
import type { AdministrationRole } from '@/features/auth/session/authSession';
import { ROUTES } from '@/lib/routes';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import { AdminRoleBadge } from './AdminRoleBadge';

interface AdminTopbarProps {
  role: AdministrationRole;
  onOpenMobileSidebar: () => void;
}

export function AdminTopbar({ role, onOpenMobileSidebar }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#E6E4DD] bg-[#FFFFFF]/90 px-4 sm:px-6 md:px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation drawer"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8D5CC] bg-[#F7F6F2] text-[#1C2923] hover:bg-[#E8EFE9] md:hidden transition"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        {/* Dynamic Breadcrumbs */}
        <AdminBreadcrumbs role={role} />
      </div>

      <div className="flex items-center gap-3">
        {/* Contextual Role Badge */}
        <AdminRoleBadge role={role} size="sm" />

        {/* Quick Security Settings link */}
        <Link
          href={ROUTES.admin.accountSecurity}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#D8D5CC] bg-[#FFFFFF] px-2.5 py-1.5 text-xs font-semibold text-[#1C2923] hover:bg-[#F0EFEA] hover:border-[#758B74] transition"
          title="Account Security & Password"
        >
          <span className="material-symbols-outlined text-[16px] text-[#758B74]" aria-hidden="true">
            lock_reset
          </span>
          <span className="hidden lg:inline">Security</span>
        </Link>

        {/* Logout */}
        <div className="border-l border-[#E6E4DD] pl-3">
          <AdminLogoutButton />
        </div>
      </div>
    </header>
  );
}
