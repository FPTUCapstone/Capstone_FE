import { Suspense } from 'react';
import { ServiceBookingRequestsView } from '@/features/hotel-service-provider/components/w103/ServiceBookingRequestsView';

export const metadata = { title: 'Service Booking Requests | TripMate' };
export default function ProviderBookingsPage() {
  return <Suspense fallback={<p role="status">Loading booking requests…</p>}><ServiceBookingRequestsView /></Suspense>;
}
