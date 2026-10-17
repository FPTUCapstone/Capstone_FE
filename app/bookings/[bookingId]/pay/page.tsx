import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PaymentHandoffPage } from '@/features/bookings/components/PaymentHandoffPage';

export const metadata: Metadata = {
  title: 'Thanh toán đặt tour | TripMate',
  description: 'Hoàn tất thanh toán điện tử cho đơn đặt tour của bạn trên TripMate.',
};

interface PaymentHandoffRouteProps {
  params: Promise<{ bookingId: string }>;
}

export default async function PaymentHandoffRoute({ params }: PaymentHandoffRouteProps) {
  const { bookingId } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent" />
        </div>
      }
    >
      <PaymentHandoffPage bookingId={bookingId} />
    </Suspense>
  );
}
