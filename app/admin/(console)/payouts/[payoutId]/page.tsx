import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { isValidPayoutId } from '@/features/admin/payout-review/payoutReview';
import { PayoutReviewScreen } from '@/features/admin/payout-review/PayoutReviewScreen';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';
import { ROUTES } from '@/lib/routes';

interface PageProps {
  params: Promise<{ payoutId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { payoutId } = await params;
  return { title: isValidPayoutId(payoutId) ? `Payout PO-${payoutId}` : 'Payout Not Found' };
}

export default async function PayoutReviewPage({ params }: PageProps) {
  const { payoutId } = await params;
  if (!isValidPayoutId(payoutId)) notFound();

  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  if (!session) {
    redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.payoutDetails(payoutId))}`);
    return null;
  }

  if (session.role !== 'Staff') {
    return <AdminAccessDeniedView requiredRole="Staff" />;
  }

  return <PayoutReviewScreen payoutId={payoutId} />;
}
