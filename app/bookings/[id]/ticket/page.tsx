import type { Metadata } from 'next';
import { Suspense } from 'react';

import { BookingTicketPage } from '@/features/bookings/components/BookingTicketPage';

export const metadata: Metadata = {
  title: 'Vé điện tử QR | TripMate',
  description: 'Xem thông tin vé điện tử và mã QR check-in tour du lịch trên TripMate.',
};

interface BookingTicketRouteProps {
  params: Promise<{ id: string }>;
}

export default async function BookingTicketRoute({ params }: BookingTicketRouteProps) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent" />
        </div>
      }
    >
      <BookingTicketPage id={id} />
    </Suspense>
  );
}
