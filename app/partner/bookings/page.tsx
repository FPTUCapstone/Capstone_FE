'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { PartnerWorkspaceLayout } from '@/features/operator/common/components/PartnerWorkspaceLayout';
import { PageContentContainer } from '@/features/operator/common/components/PageContentContainer';
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
    <PartnerWorkspaceLayout activeTab="bookings" isDemo={isDemo}>
      <PageContentContainer>
        <OperatorBookingListView
          initialParams={initialParams}
          isDemo={isDemo}
          demoActorUserId={demoActorUserId}
        />
      </PageContentContainer>
    </PartnerWorkspaceLayout>
  );
}

export default function OperatorBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] p-8 text-center text-xs text-slate-500">
          Đang tải quản lý đặt tour...
        </div>
      }
    >
      <OperatorBookingsContent />
    </Suspense>
  );
}
