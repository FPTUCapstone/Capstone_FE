import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CreatePoiPage } from '@/features/admin/create-poi';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { adminStaffEn } from '@/features/admin/staff/resources/en';
import { ROUTES } from '@/lib/routes';
import { resolveWebSession } from '@/lib/server/webSession';

export const metadata: Metadata = {
  title: 'Create Point of Interest (POI) | TripMate Admin',
  description: 'UC-52: Staff interface to create and configure Points of Interest for TripMate catalog.',
};

export default async function NewPoiPage() {
  const session = await resolveWebSession();

  if (!session) {
    return redirect(ROUTES.signIn);
  }

  if (session.role !== 'Staff') {
    return (
      <AdminAccessDeniedView
        requiredRole="Staff"
        description={adminStaffEn.staffAccessDenied.poiDescription}
      />
    );
  }

  return <CreatePoiPage />;
}
