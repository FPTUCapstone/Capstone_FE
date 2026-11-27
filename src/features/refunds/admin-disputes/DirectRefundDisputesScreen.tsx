'use client';

import { DirectRefundCaseListScreen } from '@/features/refunds/components/DirectRefundCaseListScreen';

export function DirectRefundDisputesScreen() {
  return <DirectRefundCaseListScreen scope="admin" />;
}
