import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { FailedPayoutSettlementScreen } from '@/features/admin/payout-settlements/FailedPayoutSettlementScreen';
import { parseBatchId } from '@/features/admin/payout-settlements/payoutSettlementsProxy';
import { AdminAccessDeniedView } from '@/features/admin/staff/components/AdminAccessDeniedView';
import { ROUTES } from '@/lib/routes';
import { verifyAdminSessionFromCookies } from '@/lib/server/adminSession';

export const metadata: Metadata = {
  title: 'Failed Payout Settlement | TripMate Admin Console',
  description: 'Review the gateway failure history for a failed payout settlement batch.',
};

export default async function FailedPayoutSettlementPage({ params }: { params: Promise<{ batchId: string }> }) {
  let session: ReturnType<typeof verifyAdminSessionFromCookies> = null;
  try {
    session = verifyAdminSessionFromCookies(await cookies());
  } catch {
    session = null;
  }

  const { batchId } = await params;

  if (!session) {
    return redirect(`${ROUTES.admin.login}?returnUrl=${encodeURIComponent(ROUTES.admin.payoutSettlementDetail(batchId))}`);
  }

  // UC-73: Administrator only — Staff can see the row in the list (UC-72) but not this detail.
  if (session.role !== 'Administrator') {
    return <AdminAccessDeniedView />;
  }

  const batchIdNumber = parseBatchId(batchId);
  if (batchIdNumber === null) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center text-[#486581]">
        <h1 className="text-xl font-bold text-[#8c1030]">Invalid payout settlement ID</h1>
        <p className="mt-2 text-sm">A valid payout batch ID is required.</p>
      </main>
    );
  }

  return <FailedPayoutSettlementScreen batchId={batchIdNumber} />;
}
