import type { Metadata } from 'next';

import { PartnerRouteGuard } from '@/features/operator/access/PartnerRouteGuard';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { CreateCouponForm } from '@/features/operator/coupons/components/CreateCouponForm';

export const metadata: Metadata = { title: 'Create coupon' };

export default function CreateCouponPage() {
  return (
    <PartnerRouteGuard route="couponCreate">
      <PartnerWorkspaceLayout activeTab="coupons">
        <PageContentContainer>
          <CreateCouponForm />
        </PageContentContainer>
      </PartnerWorkspaceLayout>
    </PartnerRouteGuard>
  );
}
