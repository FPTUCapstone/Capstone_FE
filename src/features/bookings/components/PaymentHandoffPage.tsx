'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';
import { isBookingDemoAllowedInCurrentEnv } from '../services/bookingApi';
import { PaymentHandoffView } from './PaymentHandoffView';

interface PaymentHandoffPageProps {
  bookingId: string;
}

/** UC-28 entry point. UC-27 navigates here on "Pay now"; it never initializes payment itself. */
export function PaymentHandoffPage({ bookingId }: PaymentHandoffPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useWebSession();

  const isDemo = searchParams.get('demo') === '1' && isBookingDemoAllowedInCurrentEnv();

  useEffect(() => {
    if (status === 'restoring') return;
    if (status === 'unauthenticated' && !isDemo) {
      const returnUrl = `/bookings/${bookingId}/pay${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      router.replace(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [status, isDemo, bookingId, searchParams, router]);

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen flex-col bg-[#f8fafc]">
        <PublicNavigation />
        <main className="flex flex-1 items-center justify-center p-8">
          <div
            className="h-9 w-9 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent"
            aria-hidden="true"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <PublicNavigation />
      <main className="pb-16 pt-4">
        <PaymentHandoffView bookingId={bookingId} isDemo={isDemo} />
      </main>
    </div>
  );
}
