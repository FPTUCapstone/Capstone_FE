'use client';

import { useSearchParams } from 'next/navigation';
import {
  OperatorTourNav,
  type OperatorNavKey,
} from '@/features/operator/tours/components/OperatorTourNav';
import { isFinanceDemoAllowedInCurrentEnv } from '../../data/operatorRevenueDemoFixtures';

export function FinanceNavigationSlot({
  activeTab,
}: {
  activeTab: Extract<OperatorNavKey, 'revenue' | 'payouts'>;
}) {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1' && isFinanceDemoAllowedInCurrentEnv();

  return <OperatorTourNav activeTab={activeTab} isDemo={isDemo} />;
}
