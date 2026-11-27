import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ExplorePoisPage } from '@/features/public/pois/components/ExplorePoisPage';
import { PoiListSkeleton } from '@/features/public/pois/components/PoiStates';
import { PageTransition } from '@/components/navigation/PageTransition';

export const metadata: Metadata = {
  title: 'Khám phá địa điểm',
  description: 'Khám phá các điểm tham quan đang hoạt động cùng TripMate.',
};

export default function PoisPage() {
  return (
    <PageTransition>
      <Suspense
        fallback={
          <main className="mx-auto min-h-screen max-w-[1440px] bg-[#F7F5EF] px-4 py-5 sm:px-6 sm:py-6 lg:px-8" lang="vi">
            <h1 className="mb-4 text-xl font-black tracking-tight text-[#1C2928] sm:text-2xl">Khám phá địa điểm</h1>
            <PoiListSkeleton />
          </main>
        }
      >
        <ExplorePoisPage />
      </Suspense>
    </PageTransition>
  );
}
