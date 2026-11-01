import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { PayoutSettlementQueueScreen } from '@/features/admin/payout-settlement/PayoutSettlementQueueScreen';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Payout Settlement | TripMate Admin Console',
  description: 'Authorize approved Tour Operator payouts for bank settlement.',
};

export default async function PayoutSettlementPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.payoutSettlement)}`);
    return null;
  }

  if (session.role !== 'Administrator') {
    return <AdminAccessDeniedView />;
  }

  return <PayoutSettlementQueueScreen />;
}
