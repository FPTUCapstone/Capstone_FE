'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useWebSession } from '@/features/auth/session/useWebSession';
import { isCouponDemoAllowedInCurrentEnv } from '../data/operatorCouponDemoFixtures';
import { couponRouteDecision } from './couponRouteDecision';

/**
 * Runtime route guard for Tour Operator Coupon Management routes (/partner/coupons/*).
 * Enforces BR-07: Only authenticated Tour Operators with Active account status and
 * Approved application status may access the coupon management workspace.
 * Fails closed and prevents unauthorized content flash during session restoration.
 * UC-38 alone may expose its development-only creation fixture at /new.
 */
export function CouponRouteGuard({ children }: { children: ReactNode }) {
  const { status, context } = useWebSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCreateFixture = pathname === '/partner/coupons/new'
    && searchParams?.get('demo') === '1'
    && isCouponDemoAllowedInCurrentEnv();

  const decision = isCreateFixture
    ? { action: 'allow' as const }
    : (status === 'restoring' ? null : couponRouteDecision(context));
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
