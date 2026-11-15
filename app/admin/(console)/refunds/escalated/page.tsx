import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { EscalatedRefundsMonitorScreen } from '@/features/refunds/admin/EscalatedRefundsMonitorScreen';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Escalated Refunds Monitor | TripMate Admin Console',
  description: 'Resolve refunds whose gateway retries are exhausted or whose amount could not be verified.',
};

export default async function EscalatedRefundsMonitorPage() {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.escalatedRefunds)}`);
  }

  // UC-67 screen 101: Administrator only.
  if (session.role !== 'Administrator') {
    return <AdminAccessDeniedView />;
  }

  return <EscalatedRefundsMonitorScreen />;
}
