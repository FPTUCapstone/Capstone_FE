import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { isValidPayoutId } from '@/features/admin/payout-details/payoutDetails';
import { PayoutDetailsScreen } from '@/features/admin/payout-details/PayoutDetailsScreen';
import { ADMIN_ACCESS_TOKEN_COOKIE } from '@/lib/server/adminSession';
import { ROUTES } from '@/lib/routes';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: isValidPayoutId(id) ? `Payout PO-${id} | TripMate Admin Console` : 'Payout Not Found' };
}

export default async function PayoutDetailsPage({ params }: PageProps) {
  const { id } = await params;
  if (!isValidPayoutId(id)) notFound();
  // Cookie presence is a navigation hint; BE remains the authorization authority.
  if (!(await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value) {
    redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.payoutDetails(id))}`);
  }

  return <PayoutDetailsScreen payoutId={id} />;
}
