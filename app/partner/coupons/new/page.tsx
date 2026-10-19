'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { OperatorTourNav } from '@/features/operator/tours/components/OperatorTourNav';
import { CreateCouponView } from '@/features/operator/coupons/components/CreateCouponView';
import { isCouponDemoAllowedInCurrentEnv } from '@/features/operator/coupons/data/operatorCouponDemoFixtures';
import { getEligibleTours } from '@/features/operator/coupons/services/operatorCouponService';
import type { EligibleTourDto } from '@/features/operator/coupons/types/couponLifecycle';
import { couponEn } from '@/features/operator/coupons/resources/en';

function CreateCouponContent() {
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('demo') === '1';
  const isDemo = isDemoParam && isCouponDemoAllowedInCurrentEnv();
  const { status, context } = useWebSession();

  const isAuthorizedOperator =
    status === 'authenticated' &&
    context !== null &&
    context.role === 'TourOperator' &&
    context.status === 'Active' &&
    context.applicationStatus === 'Approved' &&
    !context.applicationUnresolved;
  const actorUserId = isAuthorizedOperator ? context.userId : undefined;

  const [eligibleTours, setEligibleTours] = useState<EligibleTourDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'restoring') return;
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        if (isDemo && actorUserId === undefined) {
          if (isMounted) setEligibleTours([]);
          return;
        }
        const res = await getEligibleTours({
          allowDemo: isDemo,
          currentUserId: actorUserId,
        });
        if (isMounted && res.data) {
          setEligibleTours(res.data);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [isDemo, status, actorUserId]);

  const isLoading = status === 'restoring' || loading;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row">
          <OperatorTourNav activeTab="coupons" isDemo={isDemo} />
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                <span className="material-symbols-outlined animate-spin text-[32px] text-[#006B5F]">
                  progress_activity
                </span>
                <p className="mt-2 text-xs font-bold">{couponEn.page.loadingForm}</p>
              </div>
            ) : (
              <CreateCouponView
                eligibleTours={eligibleTours}
                currentUserId={actorUserId}
                isDemo={isDemo}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function CreateCouponPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] p-8 text-center text-xs text-slate-500">
          {couponEn.page.loadingDefault}
        </div>
      }
    >
      <CreateCouponContent />
    </Suspense>
  );
}
