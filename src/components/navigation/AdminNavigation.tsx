import Link from 'next/link';

import { BrandLogo } from '@/components/brand/BrandLogo';
import AdminLogoutButton from '@/features/admin/auth/AdminLogoutButton';
import { ROUTES } from '@/lib/routes';

export function AdminNavigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#314863] bg-[#00152a]/95 px-4 py-3 text-white shadow-md backdrop-blur-md md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link href={ROUTES.admin.dashboard} aria-label="TripMate Admin Dashboard">
          <BrandLogo context="admin" inverse />
        </Link>

        <nav className="flex flex-wrap items-center gap-1 rounded-xl border border-[#314863] bg-[#102a43] p-1" aria-label="Admin navigation">
          <Link
            href={ROUTES.admin.dashboard}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href={ROUTES.admin.tourReviews}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white"
          >
            Tour Reviews
          </Link>
          <Link
            href={ROUTES.admin.activeTrips}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white"
          >
            Active Trips
          </Link>
          <Link
            href={ROUTES.admin.algorithmParameters}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white"
          >
            Algorithm Settings
          </Link>
          <Link
            href={ROUTES.admin.auditLogs}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white"
          >
            Audit Logs
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.admin.accountSecurity}
            className="flex items-center gap-1.5 rounded-lg border border-[#314863] bg-[#102a43] px-3 py-2 text-xs font-semibold text-[#d1e4ff] hover:bg-[#314863] hover:text-white transition"
            title="Đổi mật khẩu quản trị viên"
          >
            <span className="material-symbols-outlined text-[16px]">lock_reset</span>
            <span>Bảo mật</span>
          </Link>
          <AdminLogoutButton />
        </div>
      </div>
    </header>
  );
}
