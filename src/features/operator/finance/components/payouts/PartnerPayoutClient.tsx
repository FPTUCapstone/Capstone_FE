'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { OperatorPayoutView } from './OperatorPayoutView';
import { isFinanceDemoAllowedInCurrentEnv } from '../../data/operatorRevenueDemoFixtures';

export function PartnerPayoutClient() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1' && isFinanceDemoAllowedInCurrentEnv();

  return (
    <PartnerWorkspaceLayout activeTab="payouts" isDemo={isDemo}>
      <PageContentContainer>
        <OperatorPayoutView />
      </PageContentContainer>
    </PartnerWorkspaceLayout>
  );
}
