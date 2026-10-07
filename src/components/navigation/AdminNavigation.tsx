import Link from 'next/link';

import { BrandLogo } from '@/components/brand/BrandLogo';
import AdminLogoutButton from '@/features/admin/auth/AdminLogoutButton';
import { adminStaffEn } from '@/features/admin/staff/resources/en';
import type { AdministrationRole } from '@/features/auth/session/authSession';
import { ROUTES } from '@/lib/routes';

interface AdminNavigationProps {
  role?: AdministrationRole;
}

export function AdminNavigation({ role = 'Administrator' }: AdminNavigationProps) {
  const isStaffUser = role === 'Staff';
  const homeHref = isStaffUser ? ROUTES.admin.staffDashboard : ROUTES.admin.dashboard;

  return (
    <header className="sticky top-0 z-50 border-b border-[#314863] bg-[#00152a]/95 px-4 py-3 text-white shadow-md backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={homeHref} aria-label={adminStaffEn.navigation.brandAriaLabel}>
            <BrandLogo context="admin" inverse />
          </Link>
          <span className="rounded-full border border-[#314863] bg-[#102a43] px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-[#71f8e4]">
            {isStaffUser ? adminStaffEn.navigation.roleBadgeStaff : adminStaffEn.navigation.roleBadgeAdmin}
          </span>
        </div>

        <nav
          className="flex flex-wrap items-center gap-1 rounded-xl border border-[#314863] bg-[#102a43] p-1"
          aria-label={adminStaffEn.navigation.navAriaLabel}
        >
          {!isStaffUser ? (
            <Link
              href={ROUTES.admin.dashboard}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white"
            >
              {adminStaffEn.navigation.adminDashboard}
            </Link>
          ) : null}
          <Link
            href={ROUTES.admin.staffDashboard}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white"
          >
            {adminStaffEn.navigation.staffDashboard}
          </Link>
          <Link
            href={ROUTES.admin.tourReviews}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white"
          >
            {adminStaffEn.navigation.tourReviews}
          </Link>
          <Link
            href={ROUTES.admin.createPoi}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white"
          >
            {adminStaffEn.navigation.createPoi}
          </Link>
          {!isStaffUser ? (
            <>
              <Link
                href={ROUTES.admin.algorithmParameters}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white"
              >
                {adminStaffEn.navigation.algorithmSettings}
              </Link>
              <Link
                href={ROUTES.admin.auditLogs}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white"
              >
                {adminStaffEn.navigation.auditLogs}
              </Link>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.admin.accountSecurity}
            className="flex items-center gap-1.5 rounded-lg border border-[#314863] bg-[#102a43] px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white transition"
            title={adminStaffEn.navigation.securityTitle}
          >
            <span className="material-symbols-outlined text-[16px]">lock_reset</span>
            <span>{adminStaffEn.navigation.securityLabel}</span>
          </Link>
          <AdminLogoutButton />
        </div>
      </div>
    </header>
  );
}
