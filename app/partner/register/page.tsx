import type { Metadata } from 'next';

import { OperatorRegistrationForm } from '@/features/operator/application/OperatorRegistrationForm';
import { PartnerRouteGuard } from '@/features/auth/routing/PartnerRouteGuard';

export const metadata: Metadata = { title: 'Tour Operator Registration' };

export default function PartnerRegisterPage() {
  return (
    <PartnerRouteGuard route="register">
      <OperatorRegistrationForm />
    </PartnerRouteGuard>
  );
}
