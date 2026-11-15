import type { Metadata } from 'next';

import { BookingRouteGuard } from '@/features/operator/bookings/guards/BookingRouteGuard';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { OperatorRefundListScreen } from '@/features/refunds/operator/OperatorRefundListScreen';

export const metadata: Metadata = {
  title: 'Refund Requests | TripMate',
  description: 'Refund requests of your cancelled bookings awaiting confirmation or return.',
};

export default function OperatorRefundListPage() {
  return (
    <BookingRouteGuard>
      <PartnerWorkspaceLayout activeTab="bookings">
        <PageContentContainer>
          <OperatorRefundListScreen />
        </PageContentContainer>
      </PartnerWorkspaceLayout>
    </BookingRouteGuard>
  );
}
