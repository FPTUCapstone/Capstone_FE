import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { CreateRouteView } from '@/features/admin/routes/components/CreateRouteView';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Create Route | TripMate Administration',
  description: 'Create an Active route between two Active points of interest.',
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

  if (session.role !== 'Staff') {
    return <AdminAccessDeniedView requiredRole="Staff" description="You do not have permission to access this function." />;
  }

  return <CreateRouteView />;
}
