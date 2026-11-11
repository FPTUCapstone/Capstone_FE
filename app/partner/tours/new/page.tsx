'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { CreateTourPackageView } from '@/features/operator/tours/components/CreateTourPackageView';
import { isTourDemoAllowedInCurrentEnv } from '@/features/operator/tours/data/operatorTourDemoFixtures';

function CreateTourContent() {
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('demo') === '1';
  const isDemo = isDemoParam && isTourDemoAllowedInCurrentEnv();

  return (
    <PartnerWorkspaceLayout activeTab="tours" isDemo={isDemo}>
      <PageContentContainer>
        <CreateTourPackageView isDemo={isDemo} />
      </PageContentContainer>
    </PartnerWorkspaceLayout>
  );
}

export default function CreateTourPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] p-8 text-center text-xs text-slate-500">
          Đang tải...
        </div>
      }
    >
      <CreateTourContent />
    </Suspense>
  );
}
