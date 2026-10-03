import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TourDetailPage } from '@/features/public/tours/components/TourDetailPage';

export const metadata: Metadata = {
  title: 'Chi tiết tour trải nghiệm | TripMate',
  description: 'Thông tin chi tiết gói tour, lịch trình và lịch khởi hành trên TripMate.',
};

interface TourPageProps {
  params: Promise<{ id: string }>;
}

export default async function TourPage({ params }: TourPageProps) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-7xl bg-[#f8fafc] px-4 py-12 sm:px-6 lg:px-8" lang="vi">
          <div className="h-6 w-48 rounded bg-slate-200 mb-4" />
          <div className="h-10 w-2/3 rounded-lg bg-slate-200 mb-6" />
          <div className="aspect-16/9 w-full rounded-3xl bg-slate-200" />
        </main>
      }
    >
      <TourDetailPage id={id} />
    </Suspense>
  );
}
