import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { PayoutRecordsScreen } from '@/features/admin/payout-records/PayoutRecordsScreen';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { resolveWebSession } from '@/lib/server/webSession';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Payout Records | TripMate Admin Console',
  description: 'View backend-calculated payout records for Tour Operators.',
};

export default async function PayoutsPage() {
  const session = await resolveWebSession();

  if (!session) {
    redirect(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.admin.payouts)}`);
    return null;
  }

  if (session.role !== 'Staff') {
    return <AdminAccessDeniedView requiredRole="Staff" />;
  }

  return <PayoutRecordsScreen />;
}
