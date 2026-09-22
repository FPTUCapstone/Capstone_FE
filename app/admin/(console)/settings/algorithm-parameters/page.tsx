import type { Metadata } from 'next';

import { AlgorithmConfigForm } from '@/features/admin/algorithm-config/AlgorithmConfigForm';

export const metadata: Metadata = { title: 'Algorithm Parameters' };

export default function AlgorithmParametersPage() {
  return <AlgorithmConfigForm />;
}
