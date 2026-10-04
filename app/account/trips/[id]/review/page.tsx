import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TripReviewPage } from '@/features/reviews/components/TripReviewPage';

export const metadata: Metadata = {
  title: 'Đánh giá chuyến đi | TripMate',
  description: 'Đánh giá và phản hồi chất lượng chuyến đi trên TripMate.',
};

interface AccountTripReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountTripReviewPageRoute({
  params,
}: AccountTripReviewPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F3F6F7]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#006B5F] border-t-transparent" />
        </div>
      }
    >
      <TripReviewPage tripId={id} />
    </Suspense>
  );
}
