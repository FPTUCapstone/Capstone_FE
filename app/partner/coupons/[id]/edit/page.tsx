'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { OperatorTourNav } from '@/features/operator/tours/components/OperatorTourNav';
import { UpdateCouponView } from '@/features/operator/coupons/components/UpdateCouponView';
import { couponEn } from '@/features/operator/coupons/resources/en';
import { OPERATOR_COUPON_ROUTES } from '@/features/operator/coupons/routes';
import {
  getEligibleTours,
  getOperatorCouponById,
} from '@/features/operator/coupons/services/operatorCouponService';
import {
  OPERATOR_COUPON_MESSAGES,
  type CouponDto,
  type EligibleTourDto,
} from '@/features/operator/coupons/types/couponLifecycle';

function EditCouponContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const { status, context } = useWebSession();

  const isAuthorizedOperator =
    status === 'authenticated' &&
      context !== null &&
      context.role === 'TourOperator' &&
      context.status === 'Active' &&
      context.applicationStatus === 'Approved' &&
      !context.applicationUnresolved;
  const actorUserId = isAuthorizedOperator ? context.userId : undefined;

  const [coupon, setCoupon] = useState<CouponDto | null>(null);
  const [eligibleTours, setEligibleTours] = useState<EligibleTourDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'restoring') return;
    let isMounted = true;
    async function load() {
      setLoading(true);
      setErrorMessage(null);
      setErrorStatus(null);
      try {
        if (!isAuthorizedOperator || actorUserId === undefined) {
          if (isMounted) {
            setCoupon(null);
            setErrorStatus('UNAUTHORIZED');
            setErrorMessage(OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER);
          }
          return;
        }
        const [couponRes, toursRes] = await Promise.all([
          getOperatorCouponById(id, { currentUserId: actorUserId }),
          getEligibleTours({ currentUserId: actorUserId }),
        ]);

        if (isMounted) {
          if (couponRes.status === 'SUCCESS' && couponRes.data && toursRes.status === 'SUCCESS' && toursRes.data) {
            setCoupon(couponRes.data);
            setEligibleTours(toursRes.data);
            setErrorStatus(null);
          } else {
            setCoupon(null);
            const failed = couponRes.status !== 'SUCCESS' ? couponRes : toursRes;
            setErrorStatus(failed.status);
            setErrorMessage(failed.message || couponEn.errors.systemError);
          }
        }
      } catch {
        if (isMounted) {
          setCoupon(null);
          setErrorStatus('SYSTEM_ERROR');
          setErrorMessage(OPERATOR_COUPON_MESSAGES.SYSTEM_ERROR);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [id, status, actorUserId, isAuthorizedOperator]);

  const isLoading = status === 'restoring' || loading;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row">
          <OperatorTourNav activeTab="coupons" />
          <main className="flex-1 min-w-0">
            {!isAuthorizedOperator && status !== 'restoring' ? (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-900">
                <h2 className="text-lg font-bold">{couponEn.page.unauthorizedTitle}</h2>
                <p className="mt-2 text-sm">{OPERATOR_COUPON_MESSAGES.UNAUTHORIZED_OWNER}</p>
              </div>
            ) : isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                <span className="material-symbols-outlined animate-spin text-[32px] text-[#006B5F]">
                  progress_activity
                </span>
                <p className="mt-2 text-xs font-bold">{couponEn.page.loadingDetails}</p>
              </div>
            ) : coupon ? (
              <UpdateCouponView
                key={coupon.id}
                initialCoupon={coupon}
                eligibleTours={eligibleTours}
                currentUserId={actorUserId}
              />
            ) : (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-900">
                <h2 className="text-lg font-bold">
                  {errorStatus === 'UNAUTHORIZED' ? couponEn.page.unauthorizedTitle
                    : errorStatus === 'SYSTEM_ERROR' ? couponEn.page.unableToLoadTitle
                      : couponEn.page.notFoundTitle}
                </h2>
                <p className="mt-2 text-sm text-red-800">
                  {errorMessage || couponEn.errors.notFound}
                </p>
                <div className="mt-6">
                  <Link
                    href={OPERATOR_COUPON_ROUTES.list}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    {couponEn.page.backToList}
                  </Link>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function EditCouponPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] p-8 text-center text-xs text-slate-500">
          {couponEn.page.loadingDefault}
        </div>
      }
    >
      <EditCouponContent />
    </Suspense>
  );
}
