import type { Metadata } from 'next';

import { BookingRouteGuard } from '@/features/operator/bookings/guards/BookingRouteGuard';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { OperatorDirectRefundCasePage } from '@/features/refunds/operator/OperatorDirectRefundCasePage';

export const metadata: Metadata = {
  title: 'Direct Refund | TripMate',
  description: 'Upload transfer evidence and report bank transfer for a direct refund case.',
};

export default async function OperatorDirectRefundPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const id = Number(caseId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center text-[#486581]">
        <h1 className="text-xl font-bold text-[#8c1030]">Invalid case ID</h1>
        <p className="mt-2 text-sm">A valid refund case ID is required.</p>
      </main>
    );
  }

  return (
    <BookingRouteGuard>
      <PartnerWorkspaceLayout activeTab="refunds">
        <PageContentContainer>
          <OperatorDirectRefundCasePage caseId={caseId} />
        </PageContentContainer>
      </PartnerWorkspaceLayout>
    </BookingRouteGuard>
  );
}
