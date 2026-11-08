import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { PayoutSettlementsScreen } from '@/features/admin/payout-settlements/PayoutSettlementsScreen';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Payout Settlements | TripMate Admin Console',
  description: 'View scheduled and completed Tour Operator payout settlements.',
};

export default async function PayoutSettlementsPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.payoutSettlements)}`);
  }

  // UC-72: Staff and Administrator both read this list. The admin session cookie only ever
  // encodes one of those two roles, so this branch is a defensive backstop, not a reachable
  // path today — kept because the spec calls for it explicitly (Task 3a).
  if (session.role !== 'Staff' && session.role !== 'Administrator') {
    return <AdminAccessDeniedView requiredRoles={['Staff', 'Administrator']} />;
  }

  return <PayoutSettlementsScreen viewerRole={session.role} />;
}
