'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useWebSession } from '@/features/auth/session/useWebSession';
import { couponRouteDecision } from './couponRouteDecision';

/**
 * Runtime route guard for Tour Operator Coupon Management routes (/partner/coupons/*).
 * Enforces BR-07: Only authenticated Tour Operators with Active account status and
 * Approved application status may access the coupon management workspace.
 * Fails closed and prevents unauthorized content flash during session restoration.
 * Note: Demo mode does NOT bypass this authorization guard.
 */
export function CouponRouteGuard({ children }: { children: ReactNode }) {
  const { status, context } = useWebSession();
  const router = useRouter();

  const decision = status === 'restoring' ? null : couponRouteDecision(context);
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
        aria-label="Checking access"
        className="flex min-h-[50vh] items-center justify-center p-8"
      >
        <div className="h-10 w-48 animate-pulse rounded-xl bg-gray-200" />
        <span className="sr-only">Checking access…</span>
      </div>
    );
  }

  return <>{children}</>;
}
