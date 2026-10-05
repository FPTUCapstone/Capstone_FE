'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { OperatorTourNav } from '@/features/operator/tours/components/OperatorTourNav';
import { CreateTourPackageView } from '@/features/operator/tours/components/CreateTourPackageView';
import { isTourDemoAllowedInCurrentEnv } from '@/features/operator/tours/data/operatorTourDemoFixtures';

function CreateTourContent() {
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('demo') === '1';
  const isDemo = isDemoParam && isTourDemoAllowedInCurrentEnv();

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row">
          <OperatorTourNav activeTab="tours" isDemo={isDemo} />
          <main className="flex-1 min-w-0">
            <CreateTourPackageView isDemo={isDemo} />
          </main>
        </div>
      </div>
    </div>
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
