import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MockCheckoutPage } from '@/features/bookings/components/MockCheckoutPage';

export const metadata: Metadata = {
  title: 'Thanh toán giả lập | TripMate',
  description: 'Cổng thanh toán giả lập TripMate phục vụ phát triển và kiểm thử.',
};

export default function MockCheckoutRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent" />
        </div>
      }
    >
      <MockCheckoutPage />
    </Suspense>
  );
}
