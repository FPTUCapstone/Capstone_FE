import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { BookingDecisionOutcomeView } from '@/features/hotel-service-provider/components/w104/BookingDecisionOutcomeView';

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Booking Request Details & Decision | TripMate Partner',
  description: 'View reservation details, execute decision, and record stay outcome (Screen W104, UC-79, UC-80).',
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
          Loading booking details...
        </div>
      }
    >
      <BookingDecisionOutcomeView id={id} />
    </Suspense>
  );
}
