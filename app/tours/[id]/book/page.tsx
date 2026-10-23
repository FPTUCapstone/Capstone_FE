import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TourBookingPage } from '@/features/bookings/components/TourBookingPage';

export const metadata: Metadata = {
  title: 'Xác nhận đặt tour | TripMate',
  description: 'Xác nhận thông tin đặt tour và thanh toán điện tử bảo đảm trên TripMate.',
};

interface TourBookingRouteProps {
  params: Promise<{ id: string }>;
}

export default async function TourBookingRoute({ params }: TourBookingRouteProps) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent" />
        </div>
      }
    >
      <TourBookingPage id={id} />
    </Suspense>
  );
}
