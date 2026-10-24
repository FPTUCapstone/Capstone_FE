import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { isValidPayoutId } from '@/features/admin/payout-review/payoutReview';
import { PayoutReviewScreen } from '@/features/admin/payout-review/PayoutReviewScreen';
import { resolveWebSession } from '@/lib/server/webSession';
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

  const session = await resolveWebSession();

  if (!session) {
    redirect(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.admin.payoutDetails(payoutId))}`);
    return null;
  }

  if (session.role !== 'Staff') {
    return <AdminAccessDeniedView requiredRole="Staff" />;
  }

  return <PayoutReviewScreen payoutId={payoutId} />;
}
