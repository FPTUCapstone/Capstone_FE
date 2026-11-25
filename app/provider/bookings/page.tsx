import { Suspense } from 'react';
import { ServiceBookingRequestsView } from '@/features/hotel-service-provider/components/w103/ServiceBookingRequestsView';

export const metadata = { title: 'Yêu cầu đặt dịch vụ | TripMate' };
export default function ProviderBookingsPage() {
  return <Suspense fallback={<p role="status">Loading booking requests…</p>}><ServiceBookingRequestsView /></Suspense>;
}
