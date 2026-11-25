import { notFound } from 'next/navigation';
import { BookingDecisionOutcomeView } from '@/features/hotel-service-provider/components/w104/BookingDecisionOutcomeView';

export const metadata = { title: 'Chi tiết yêu cầu dịch vụ | TripMate' };
export default async function ProviderBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d{0,18}$/.test(id)) notFound();
  return <BookingDecisionOutcomeView key={id} id={id} />;
}
