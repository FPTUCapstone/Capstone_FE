import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { ServiceBookingRequestsView } from '@/features/hotel-service-provider/components/w103/ServiceBookingRequestsView';

export const metadata: Metadata = {
  title: 'Yêu cầu đặt dịch vụ | TripMate Partner',
  description: 'Tiếp nhận, kiểm tra tình trạng phòng và xử lý các yêu cầu đặt phòng từ du khách.',
};

export default function ProviderBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[#5B6E69]">
          <span className="material-symbols-outlined text-[28px] animate-spin text-[#174B4A] mb-2 block mx-auto">
            progress_activity
          </span>
          Đang tải yêu cầu đặt phòng...
        </div>
      }
    >
      <ServiceBookingRequestsView />
    </Suspense>
  );
}
