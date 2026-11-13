import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { ServiceBookingRequestsView } from '@/features/hotel-service-provider/components/w103/ServiceBookingRequestsView';

export const metadata: Metadata = {
  title: 'Service Booking Requests | TripMate Partner',
  description: 'Manage and process traveler booking requests (Screen W103, UC-78).',
};

export default function ProviderBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[#5B6E69]">
          <span className="material-symbols-outlined text-[28px] animate-spin text-[#174B4A] mb-2 block mx-auto">
            progress_activity
          </span>
          Loading booking requests...
        </div>
      }
    >
      <ServiceBookingRequestsView />
    </Suspense>
  );
}
