import type { Metadata } from 'next';

import { ResubmitApplicationForm } from '@/features/operator/application/ResubmitApplicationForm';

export const metadata: Metadata = { title: 'Resubmit Application' };

export default function ResubmitApplicationPage() {
  return <ResubmitApplicationForm />;
}
