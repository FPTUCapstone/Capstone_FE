import type { Metadata } from 'next';

import { OperatorApplicationStatusPage } from '@/features/operator/application/OperatorApplicationStatusPage';
import type { OperatorApplicationStatus } from '@/data/batchOneMock';

export const metadata: Metadata = { title: 'Operator Application Status' };

type PageProps = { searchParams: Promise<{ status?: string }> };

export default async function PartnerApplicationPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const approvedStatuses: OperatorApplicationStatus[] = ['pending', 'rejected', 'approved'];
  const selectedStatus = approvedStatuses.includes(status as OperatorApplicationStatus) ? (status as OperatorApplicationStatus) : 'pending';
  return <OperatorApplicationStatusPage status={selectedStatus} />;
}
