import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { PoiCatalogListView } from '@/features/admin/catalogue/components/PoiCatalogListView';
import { AdminConsoleShell } from '@/features/admin/shared/components/AdminConsoleShell';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

import '@/features/admin/shared/styles/admin-theme.css';

export const metadata: Metadata = {
  title: 'Points of Interest Catalog | TripMate Admin',
  description: 'Screen #16: Manage Points of Interest, coordinates and operating hours.',
};

export default async function AdminPoiCatalogPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.pois)}`);
  }

  return (
    <div className="admin-theme min-h-screen bg-[#F7F6F2] text-[#1C2923]">
      <AdminConsoleShell role={session.role}>
        <PoiCatalogListView />
      </AdminConsoleShell>
    </div>
  );
}
