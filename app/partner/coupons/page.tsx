'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { OperatorTourNav } from '@/features/operator/tours/components/OperatorTourNav';
import { OperatorCouponListView } from '@/features/operator/coupons/components/OperatorCouponListView';
import { getOperatorCoupons } from '@/features/operator/coupons/services/operatorCouponService';
import type { CouponDto } from '@/features/operator/coupons/types/couponLifecycle';
import { couponEn } from '@/features/operator/coupons/resources/en';

function OperatorCouponsContent() {
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (status === 'restoring') return;
    let isMounted = true;
    async function load() {
      setLoading(true);
      setErrorMessage(null);
      try {
        if (!isAuthorizedOperator || actorUserId === undefined) {
          if (isMounted) {
            setCoupons([]);
            setErrorMessage(couponEn.list.authorizationRequired);
          }
          return;
        }
        const res = await getOperatorCoupons({ currentUserId: actorUserId });
        if (isMounted) {
          if (res.status === 'SUCCESS' && res.data) setCoupons(res.data);
          else {
            setCoupons([]);
            setErrorMessage(res.message || couponEn.list.loadError);
          }
        }
      } catch {
        if (isMounted) setErrorMessage(couponEn.list.loadError);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [status, actorUserId, isAuthorizedOperator, retryKey]);

  const isLoading = status === 'restoring' || loading;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row">
          <OperatorTourNav activeTab="coupons" />
          <main className="flex-1 min-w-0">
            {!isAuthorizedOperator && status !== 'restoring' ? (
              <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
                {couponEn.list.authorizationRequired}
              </div>
            ) : isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                <span className="material-symbols-outlined animate-spin text-[32px] text-[#006B5F]">
                  progress_activity
                </span>
                <p className="mt-2 text-xs font-bold">{couponEn.page.loadingList}</p>
              </div>
            ) : errorMessage ? (
              <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
                <p className="text-sm font-bold">{errorMessage}</p>
                <button type="button" onClick={() => setRetryKey((key) => key + 1)}
                  className="mt-3 rounded-xl border border-rose-300 px-4 py-2 text-xs font-bold hover:bg-rose-100">
                  {couponEn.list.retry}
                </button>
              </div>
            ) : (
              <OperatorCouponListView coupons={coupons} />
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
