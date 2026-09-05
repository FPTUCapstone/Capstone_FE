import type { Metadata } from 'next';

import { OperatorRegistrationForm } from '@/features/operator/application/OperatorRegistrationForm';

export const metadata: Metadata = { title: 'Tour Operator Registration' };

export default function PartnerRegisterPage() {
  return <OperatorRegistrationForm />;
}
