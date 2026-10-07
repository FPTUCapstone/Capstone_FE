import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BookingRouteGuard } from '@/features/operator/bookings/guards/BookingRouteGuard';
import { bookingEn } from '@/features/operator/bookings/resources/en';

export const metadata: Metadata = {
  title: `${bookingEn.metadata.title} | TripMate`,
  description: bookingEn.metadata.description,
};

export default function PartnerBookingsLayout({ children }: { children: ReactNode }) {
  return <BookingRouteGuard>{children}</BookingRouteGuard>;
}
