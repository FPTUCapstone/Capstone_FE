'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
import { OperatorTourListView } from '@/features/operator/tours/components/OperatorTourListView';
import { isTourDemoAllowedInCurrentEnv } from '@/features/operator/tours/data/operatorTourDemoFixtures';
import { getOperatorTours } from '@/features/operator/tours/services/operatorTourService';
import type { TourPackageDto } from '@/features/operator/tours/types/tourLifecycle';

function OperatorToursContent() {
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('demo') === '1';
  const isDemo = isDemoParam && isTourDemoAllowedInCurrentEnv();

  const [tours, setTours] = useState<TourPackageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await getOperatorTours({ allowDemo: isDemo });
        if (isMounted && res.data) {
          setTours(res.data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'Không thể tải danh sách gói tour.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [isDemo]);

  return (
    <PartnerWorkspaceLayout activeTab="tours" isDemo={isDemo}>
      <PageContentContainer>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-xs">
            <span className="material-symbols-outlined animate-spin text-[32px] text-[#006B5F]">
              progress_activity
            </span>
            <p className="mt-2 text-xs font-bold">Đang tải danh sách gói tour...</p>
          </div>
        ) : loadError ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
            {loadError}
          </div>
        ) : (
          <OperatorTourListView tours={tours} isDemo={isDemo} />
        )}
      </PageContentContainer>
    </PartnerWorkspaceLayout>
  );
}

export default function OperatorToursPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] p-8 text-center text-xs text-slate-500">
          Đang tải...
        </div>
      }
    >
      <OperatorToursContent />
    </Suspense>
  );
}
