'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { OperatorTourNav } from '@/features/operator/tours/components/OperatorTourNav';
import { OperatorBookingListView } from '@/features/operator/bookings/components/OperatorBookingListView';
import { isBookingDemoAllowedInCurrentEnv } from '@/features/operator/bookings/data/operatorBookingDemoFixtures';

function OperatorBookingsContent() {
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('demo') === '1';
  const isDemo = isDemoParam && isBookingDemoAllowedInCurrentEnv();

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row">
          <OperatorTourNav activeTab="bookings" isDemo={isDemo} />
          <main className="flex-1 min-w-0">
            <OperatorBookingListView isDemo={isDemo} />
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
          Đang tải trang quản lý đơn đặt chỗ...
        </div>
      }
    >
      <OperatorBookingsContent />
    </Suspense>
  );
}
