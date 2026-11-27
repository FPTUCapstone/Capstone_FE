import type { Metadata } from 'next';

import { BookingRouteGuard } from '@/features/operator/bookings/guards/BookingRouteGuard';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { DirectRefundCaseListScreen } from '@/features/refunds/components/DirectRefundCaseListScreen';

export const metadata: Metadata = {
  title: 'Hoàn tiền trực tiếp | TripMate',
  description: 'Theo dõi hồ sơ hoàn tiền trực tiếp và tranh chấp của khách hàng.',
};

export default function OperatorRefundListPage() {
  return (
    <BookingRouteGuard>
      <PartnerWorkspaceLayout activeTab="refunds">
        <PageContentContainer>
          <DirectRefundCaseListScreen scope="operator" />
        </PageContentContainer>
      </PartnerWorkspaceLayout>
    </BookingRouteGuard>
  );
}
