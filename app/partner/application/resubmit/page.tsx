import type { Metadata } from 'next';

import { ResubmitApplicationForm } from '@/features/operator/application/ResubmitApplicationForm';
import { PartnerRouteGuard } from '@/features/auth/routing/PartnerRouteGuard';

export const metadata: Metadata = { title: 'Resubmit Application' };

export default function ResubmitApplicationPage() {
  return (
    <PartnerRouteGuard route="resubmit">
      <ResubmitApplicationForm />
    </PartnerRouteGuard>
  );
}
