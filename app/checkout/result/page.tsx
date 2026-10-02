import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CheckoutResultPage } from '@/features/bookings/components/CheckoutResultPage';

export const metadata: Metadata = {
  title: 'Kết quả thanh toán tour | TripMate',
  description: 'Trạng thái xác thực giao dịch và kết quả thanh toán điện tử trên TripMate.',
};

export default function CheckoutResultRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent" />
        </div>
      }
    >
      <CheckoutResultPage />
    </Suspense>
  );
}
