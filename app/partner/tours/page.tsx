'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { OperatorTourNav } from '@/features/operator/tours/components/OperatorTourNav';
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

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await getOperatorTours({ allowDemo: isDemo });
        if (isMounted && res.data) {
          setTours(res.data);
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
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row">
          <OperatorTourNav activeTab="tours" isDemo={isDemo} />
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                <span className="material-symbols-outlined animate-spin text-[32px] text-[#006B5F]">
                  progress_activity
                </span>
                <p className="mt-2 text-xs font-bold">Đang tải danh sách gói tour...</p>
              </div>
            ) : (
              <OperatorTourListView tours={tours} isDemo={isDemo} />
            )}
          </main>
        </div>
      </div>
    </div>
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
