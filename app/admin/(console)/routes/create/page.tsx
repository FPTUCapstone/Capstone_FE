import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { CreateRouteUnavailableView } from '@/features/admin/routes/components/CreateRouteUnavailableView';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Create Route (Backend Integration Pending) | TripMate Administration',
  description: 'Route creation workspace pending backend contract integration.',
};

export default async function CreateRoutePage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect('/admin/login?returnUrl=%2Fadmin%2Froutes%2Fcreate');
  }

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <CreateRouteUnavailableView />;
}
