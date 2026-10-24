import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CreateRouteUnavailableView } from '@/features/admin/routes/components/CreateRouteUnavailableView';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { resolveWebSession } from '@/lib/server/webSession';

export const metadata: Metadata = {
  title: 'Create Route (Backend Integration Pending) | TripMate Administration',
  description: 'Route creation workspace pending backend contract integration.',
};

export default async function CreateRoutePage() {
  const session = await resolveWebSession();

  if (!session) {
    return redirect('/sign-in?returnUrl=%2Fadmin%2Froutes%2Fcreate');
  }

  if (session.role === 'Staff') {
    return <AdminAccessDeniedView />;
  }

  return <CreateRouteUnavailableView />;
}
