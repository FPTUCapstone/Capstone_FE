'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { OperatorTourNav } from '@/features/operator/tours/components/OperatorTourNav';
import { OperatorBookingListView } from '@/features/operator/bookings/components/OperatorBookingListView';
import { isBookingDemoAllowedInCurrentEnv } from '@/features/operator/bookings/data/operatorBookingDemoFixtures';
import type { BookingFilterParams, BookingStatus } from '@/features/operator/bookings/types/bookingLifecycle';

function OperatorBookingsContent() {
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('demo') === '1';
  const isDemo = isDemoParam && isBookingDemoAllowedInCurrentEnv();
  const { status, context } = useWebSession();

  const isAuthorizedOperator =
    status === 'authenticated' &&
    context !== null &&
    context.role === 'TourOperator' &&
    context.status === 'Active' &&
    context.applicationStatus === 'Approved' &&
    !context.applicationUnresolved;
  const demoActorUserId = isAuthorizedOperator ? context.userId : undefined;

  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const initialParams: BookingFilterParams = {
    page: Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1,
    status: (searchParams.get('status') as BookingStatus) || undefined,
    tourId: searchParams.get('tourId') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    searchKeyword: searchParams.get('searchKeyword') || undefined,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row">
          <OperatorTourNav activeTab="bookings" isDemo={isDemo} />
          <main className="flex-1 min-w-0">
            <OperatorBookingListView
              initialParams={initialParams}
              isDemo={isDemo}
              demoActorUserId={demoActorUserId}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

export default function OperatorBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] p-8 text-center text-xs text-slate-500">
          Loading customer booking management...
        </div>
      }
    >
      <OperatorBookingsContent />
    </Suspense>
  );
}
