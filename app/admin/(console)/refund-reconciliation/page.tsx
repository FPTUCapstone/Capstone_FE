import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { RefundReturnReconciliationScreen } from '@/features/refunds/staff/RefundReturnReconciliationScreen';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Refund Return Reconciliation | TripMate Admin Console',
  description: "Confirm receipt of a Tour Operator's reported refund return.",
};

export default async function RefundReturnReconciliationPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.refundReconciliation)}`);
  }

  // UC-42 step 7: Staff and Administrator both act on this screen.
  if (session.role !== 'Staff' && session.role !== 'Administrator') {
    return <AdminAccessDeniedView requiredRoles={['Staff', 'Administrator']} />;
  }

  return <RefundReturnReconciliationScreen />;
}
