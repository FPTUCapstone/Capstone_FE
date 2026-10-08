import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { CreatePoiPage } from '@/features/admin/create-poi';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Create Point of Interest (POI) | TripMate Admin',
  description: 'UC-52: Admin interface to create and configure Points of Interest for TripMate catalog.',
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

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <CreatePoiPage />;
}
