import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { CreatePoiPage } from '@/features/admin/create-poi';
import { AdminConsoleShell } from '@/features/admin/shared/components/AdminConsoleShell';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { adminStaffEn } from '@/features/admin/staff/resources/en';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

import '@/features/admin/shared/styles/admin-theme.css';

export const metadata: Metadata = {
  title: 'Create Point of Interest (POI) | TripMate Admin',
  description: 'UC-52: Staff interface to create and configure Points of Interest for TripMate catalog.',
};

export default async function NewPoiPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(ROUTES.admin.login);
  }

  if (session.role !== 'Staff') {
    return (
      <div className="admin-theme min-h-screen bg-[#F7F6F2] text-[#1C2923]">
        <AdminConsoleShell role={session.role}>
          <AdminAccessDeniedView
            requiredRole="Staff"
            description={adminStaffEn.staffAccessDenied.poiDescription}
          />
        </AdminConsoleShell>
      </div>
    );
  }

  return (
    <div className="admin-theme min-h-screen bg-[#F7F6F2] text-[#1C2923]">
      <AdminConsoleShell role="Staff">
        <CreatePoiPage />
      </AdminConsoleShell>
    </div>
  );
}
