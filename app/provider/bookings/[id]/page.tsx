import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { BookingDecisionOutcomeView } from '@/features/hotel-service-provider/components/w104/BookingDecisionOutcomeView';

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Chi tiết yêu cầu đặt phòng | TripMate Partner',
  description: 'Xem thông tin đặt phòng, kiểm tra tình trạng phòng và thực hiện các thao tác vận hành.',
};

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[#5B6E69]">
          <span className="material-symbols-outlined text-[28px] animate-spin text-[#174B4A] mb-2 block mx-auto">
            progress_activity
          </span>
          Đang tải thông tin chi tiết đặt phòng...
        </div>
      }
    >
      <BookingDecisionOutcomeView id={id} />
    </Suspense>
  );
}
