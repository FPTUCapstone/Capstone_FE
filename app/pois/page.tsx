import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ExplorePoisPage } from '@/features/public/pois/components/ExplorePoisPage';
import { PoiListSkeleton } from '@/features/public/pois/components/PoiStates';

export const metadata: Metadata = {
  title: 'Khám phá địa điểm',
  description: 'Khám phá các điểm tham quan đang hoạt động cùng TripMate.',
};

export default function PoisPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-4xl bg-[#f3f6f7] px-4 py-12" lang="vi">
          <h1 className="mb-8 text-3xl font-black text-[#00152a]">Khám phá địa điểm tham quan</h1>
          <PoiListSkeleton />
        </main>
      }
    >
      <ExplorePoisPage />
    </Suspense>
  );
}
