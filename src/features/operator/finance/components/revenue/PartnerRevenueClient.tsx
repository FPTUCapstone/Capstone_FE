'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { OperatorRevenueView } from './OperatorRevenueView';
import { isFinanceDemoAllowedInCurrentEnv } from '../../data/operatorRevenueDemoFixtures';

export function PartnerRevenueClient() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1' && isFinanceDemoAllowedInCurrentEnv();

  return (
    <PartnerWorkspaceLayout activeTab="revenue" isDemo={isDemo}>
      <PageContentContainer>
        <OperatorRevenueView />
      </PageContentContainer>
    </PartnerWorkspaceLayout>
  );
}
