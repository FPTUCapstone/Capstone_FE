import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ExploreToursPage } from '@/features/public/tours/components/ExploreToursPage';
import { TourListSkeleton } from '@/features/public/tours/components/TourStates';

export const metadata: Metadata = {
  title: 'Khám phá tour bản địa | TripMate',
  description: 'Tìm kiếm và khám phá các gói tour trải nghiệm bản địa đã được kiểm duyệt tại TripMate.',
};

export default function ToursPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-7xl bg-[#f8fafc] px-4 py-12 sm:px-6 lg:px-8" lang="vi">
          <div className="mb-8">
            <div className="h-4 w-40 rounded-full bg-slate-200 mb-3" />
            <div className="h-10 w-96 rounded-xl bg-slate-200 mb-2" />
            <div className="h-5 w-2/3 rounded-lg bg-slate-200" />
          </div>
          <TourListSkeleton />
        </main>
      }
    >
      <ExploreToursPage />
    </Suspense>
  );
}
