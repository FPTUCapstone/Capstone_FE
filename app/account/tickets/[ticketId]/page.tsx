import type { Metadata } from 'next';
import { Suspense } from 'react';

import { BookingTicketPage } from '@/features/bookings/components/BookingTicketPage';

export const metadata: Metadata = {
  title: 'Vé điện tử QR | TripMate',
  description: 'Xem vé điện tử và mã QR check-in tour du lịch trên TripMate.',
};

interface AccountTicketRouteProps {
  params: Promise<{ ticketId: string }>;
}

export default async function AccountTicketRoute({ params }: AccountTicketRouteProps) {
  const { ticketId } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent" />
        </div>
      }
    >
      <BookingTicketPage ticketKey={{ ticketId }} />
    </Suspense>
  );
}
