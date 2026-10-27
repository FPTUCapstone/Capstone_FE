import type { Metadata } from 'next';
import { Suspense } from 'react';

import { BookingTicketPage } from '@/features/bookings/components/BookingTicketPage';

export const metadata: Metadata = {
  title: 'Vé điện tử QR | TripMate',
  description: 'Xem vé điện tử và mã QR check-in của đơn đặt tour trên TripMate.',
};

interface BookingTicketRouteProps {
  /** `id` is the booking id (UC-29 W3); the segment keeps the name its sibling `pay`/`refund` routes use. */
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
      <BookingTicketPage ticketKey={{ bookingId: id }} />
    </Suspense>
  );
}
