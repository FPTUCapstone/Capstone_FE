'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useWebSession } from '@/features/auth/session/useWebSession';
import { tourRouteDecision } from './tourRouteDecision';

/**
 * Runtime route guard for Tour Operator Tour Management routes (/partner/tours/*).
 * Enforces BR-07: Only authenticated Tour Operators with Active account status and
 * Approved application status may access the tour management workspace.
 * Fails closed and prevents unauthorized content flash during session restoration.
 */
export function TourRouteGuard({ children }: { children: ReactNode }) {
  const { status, context } = useWebSession();
  const router = useRouter();

  const decision = status === 'restoring' ? null : tourRouteDecision(context);
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
