'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { OperatorTourNav } from '@/features/operator/tours/components/OperatorTourNav';
import { OperatorCouponListView } from '@/features/operator/coupons/components/OperatorCouponListView';
import { isCouponDemoAllowedInCurrentEnv } from '@/features/operator/coupons/data/operatorCouponDemoFixtures';
import { getOperatorCoupons } from '@/features/operator/coupons/services/operatorCouponService';
import type { CouponDto } from '@/features/operator/coupons/types/couponLifecycle';
import { couponEn } from '@/features/operator/coupons/resources/en';

function OperatorCouponsContent() {
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

  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'restoring') return;
    let isMounted = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        if (isDemo && actorUserId === undefined) {
          if (isMounted) setCoupons([]);
          return;
        }
        const res = await getOperatorCoupons({
          allowDemo: isDemo,
          currentUserId: actorUserId,
        });
        if (isMounted) {
          setCoupons(res.data ?? []);
          if (res.status !== 'SUCCESS') {
            setLoadError(res.message || couponEn.errors.systemError);
          }
        }
      } catch {
        if (isMounted) {
          setCoupons([]);
          setLoadError(couponEn.errors.systemError);
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
                <p className="mt-2 text-xs font-bold">{couponEn.page.loadingList}</p>
              </div>
            ) : loadError ? (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-900">
                <p className="font-bold">{couponEn.errors.systemError}</p>
                <p className="mt-1 text-red-800">{loadError}</p>
              </div>
            ) : (
              <OperatorCouponListView coupons={coupons} isDemo={isDemo} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function OperatorCouponsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] p-8 text-center text-xs text-slate-500">
          {couponEn.page.loadingDefault}
        </div>
      }
    >
      <OperatorCouponsContent />
    </Suspense>
  );
}
