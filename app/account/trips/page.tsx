import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TripHistoryPage } from '@/features/trips/components/TripHistoryPage';
import { tripReviewEn } from '@/features/trips/resources/en';

export const metadata: Metadata = {
  title: tripReviewEn.metadata.tripHistoryTitle,
  description: tripReviewEn.metadata.tripHistoryDescription,
};

export default function AccountTripsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#174B4A] border-t-transparent" />
        </div>
      }
    >
      <TripHistoryPage />
    </Suspense>
  );
}
