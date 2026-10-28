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
    <header className="sticky top-0 z-50 border-b border-[#2A3B33] bg-[#1C2923]/95 px-4 py-3 text-[#F7F6F2] shadow-sm backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={homeHref} aria-label={adminStaffEn.navigation.brandAriaLabel}>
            <BrandLogo context="admin" inverse />
          </Link>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${
              isStaffUser
                ? 'border-[#758B74] bg-[#273830] text-[#E8EFE9]'
                : 'border-[#B87558] bg-[#3D271E] text-[#F7EBE5]'
            }`}
          >
            {isStaffUser ? adminStaffEn.navigation.roleBadgeStaff : adminStaffEn.navigation.roleBadgeAdmin}
          </span>
        </div>

        <nav
          className="flex flex-wrap items-center gap-1 rounded-xl border border-[#2A3B33] bg-[#17221D] p-1"
          aria-label={adminStaffEn.navigation.navAriaLabel}
        >
          {!isStaffUser ? (
            <Link
              href={ROUTES.admin.dashboard}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-[#A3B3AB] hover:bg-[#273830] hover:text-[#F7F6F2] transition"
            >
              {adminStaffEn.navigation.adminDashboard}
            </Link>
          ) : null}
          <Link
            href={ROUTES.admin.staffDashboard}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[#A3B3AB] hover:bg-[#273830] hover:text-[#F7F6F2] transition"
          >
            {adminStaffEn.navigation.staffDashboard}
          </Link>
          {isStaffUser ? (
            <Link
              href={ROUTES.admin.payouts}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-[#A3B3AB] hover:bg-[#273830] hover:text-[#F7F6F2] transition"
            >
              Payout Records
            </Link>
          ) : null}
          {isStaffUser ? (
            <Link
              href={ROUTES.admin.createPoi}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-[#A3B3AB] hover:bg-[#273830] hover:text-[#F7F6F2] transition"
            >
              {adminStaffEn.navigation.createPoi}
            </Link>
          ) : null}
          {!isStaffUser ? (
            <>
              <Link
                href={ROUTES.admin.tourReviews}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-[#A3B3AB] hover:bg-[#273830] hover:text-[#F7F6F2] transition"
              >
                {adminStaffEn.navigation.tourReviews}
              </Link>
              <Link
                href={ROUTES.admin.activeTrips}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-[#A3B3AB] hover:bg-[#273830] hover:text-[#F7F6F2] transition"
              >
                Active Trips
              </Link>
              <Link
                href={ROUTES.admin.reports}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-[#A3B3AB] hover:bg-[#273830] hover:text-[#F7F6F2] transition"
              >
                {adminStaffEn.navigation.statisticalReports}
              </Link>
              <Link
                href={ROUTES.admin.algorithmParameters}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-[#A3B3AB] hover:bg-[#273830] hover:text-[#F7F6F2] transition"
              >
                {adminStaffEn.navigation.algorithmSettings}
              </Link>
              <Link
                href={ROUTES.admin.auditLogs}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-[#A3B3AB] hover:bg-[#273830] hover:text-[#F7F6F2] transition"
              >
                {adminStaffEn.navigation.auditLogs}
              </Link>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.admin.accountSecurity}
            className="flex items-center gap-1.5 rounded-lg border border-[#2A3B33] bg-[#17221D] px-3 py-2 text-xs font-semibold text-[#A3B3AB] hover:bg-[#273830] hover:text-[#F7F6F2] transition"
            title={adminStaffEn.navigation.securityTitle}
          >
            <span className="material-symbols-outlined text-[16px] text-[#758B74]">lock_reset</span>
            <span>{adminStaffEn.navigation.securityLabel}</span>
          </Link>
          <AdminLogoutButton />
        </div>
      </div>
    </header>
  );
}
