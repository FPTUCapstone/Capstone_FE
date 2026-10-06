'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useWebSession } from '@/features/auth/session/useWebSession';
import { bookingRouteDecision } from './bookingRouteDecision';

/**
 * Runtime route guard for Tour Operator Booking Management routes (/partner/bookings).
 * Enforces BR-07: Only authenticated Tour Operators with Active account status and
 * Approved application status may access the booking management workspace.
 * Fails closed and prevents unauthorized content flash during session restoration.
 */
export function BookingRouteGuard({ children }: { children: ReactNode }) {
  const { status, context } = useWebSession();
  const router = useRouter();

  const decision = status === 'restoring' ? null : bookingRouteDecision(context);
  const redirectHref = decision?.action === 'redirect' ? decision.href : null;

  useEffect(() => {
    if (redirectHref) {
      router.replace(redirectHref);
    }
  }, [redirectHref, router]);

  if (!decision || decision.action === 'redirect') {
    return (
      <div
        role="status"
        aria-label="Kiểm tra quyền truy cập"
        className="flex min-h-[50vh] items-center justify-center p-8"
      >
        <div className="h-10 w-48 animate-pulse rounded-xl bg-gray-200" />
        <span className="sr-only">Đang kiểm tra quyền truy cập…</span>
      </div>
    );
  }

  return <>{children}</>;
}
