import type { Metadata } from 'next';

import { BookingRouteGuard } from '@/features/operator/bookings/guards/BookingRouteGuard';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { ConfirmBookingRefundScreen } from '@/features/refunds/operator/ConfirmBookingRefundScreen';

export const metadata: Metadata = {
  title: 'Confirm Booking Refund | TripMate',
  description: 'Confirm a refund request and report the bank transfer of your return share.',
};

export default async function ConfirmBookingRefundPage({ params }: { params: Promise<{ refundId: string }> }) {
  const { refundId } = await params;
  const refundIdNumber = Number(refundId);

  if (!Number.isSafeInteger(refundIdNumber) || refundIdNumber <= 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center text-[#486581]">
        <h1 className="text-xl font-bold text-[#8c1030]">Invalid refund ID</h1>
        <p className="mt-2 text-sm">A valid refund ID is required.</p>
      </main>
    );
  }

  return (
    <BookingRouteGuard>
      <PartnerWorkspaceLayout activeTab="bookings">
        <PageContentContainer>
          <ConfirmBookingRefundScreen refundId={refundIdNumber} />
        </PageContentContainer>
      </PartnerWorkspaceLayout>
    </BookingRouteGuard>
  );
}
