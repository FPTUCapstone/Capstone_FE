import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { PayoutRecordsScreen } from '@/features/admin/payout-records/PayoutRecordsScreen';
import { ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/server/adminSession';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Payout Records | TripMate Admin Console',
  description: 'View backend-calculated payout records for Tour Operators.',
};

export default async function PayoutsPage() {
  // Cookie presence is a navigation hint; BE remains the authorization authority.
  if (!(await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value) {
    redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.payouts)}`);
  }

  return <PayoutRecordsScreen />;
}
