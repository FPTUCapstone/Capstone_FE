import { notFound } from 'next/navigation';

import { PaymentDemoView } from '@/features/payments-demo/components/PaymentDemoView';

interface PaymentDemoRouteProps {
  searchParams: Promise<{ bookingId?: string }>;
}

export default async function PaymentDemoRoute({ searchParams }: PaymentDemoRouteProps) {
  const isDemoEnabled =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true';

  if (!isDemoEnabled) {
    notFound();
  }

  const { bookingId } = await searchParams;
  return <PaymentDemoView bookingId={bookingId?.trim() || 'demo-booking-28'} />;
}
