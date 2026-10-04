import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TripHistoryPage } from '@/features/trips/components/TripHistoryPage';

export const metadata: Metadata = {
  title: 'Chuyến đi của tôi | TripMate',
  description: 'Quản lý lịch sử các chuyến đi và tour du lịch trên TripMate.',
};

export default function AccountTripsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F3F6F7]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#006B5F] border-t-transparent" />
        </div>
      }
    >
      <TripHistoryPage />
    </Suspense>
  );
}
