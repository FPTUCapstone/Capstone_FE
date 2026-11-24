'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';

/** Covers old workspace routes as well as new pages; backend authorization remains authoritative. */
export function PartnerOnboardingBoundary({ children }: { children: ReactNode }) {
  const { status, context } = useWebSession();
  const pathname = usePathname();
  const router = useRouter();
  let destination: string | null = null;
  if (status !== 'restoring' && context?.role === 'TourOperator' && context.onboardingState !== undefined && context.onboardingState !== 'Active') {
    if (context.onboardingState === 'AwaitingSignature') destination = pathname === ROUTES.partner.contract ? null : ROUTES.partner.contract;
    else {
      const permitted = pathname === ROUTES.partner.application || (context.onboardingState === 'Rejected' && pathname === ROUTES.partner.resubmitApplication);
      destination = permitted ? null : ROUTES.partner.application;
    }
  }
  useEffect(() => { if (destination) router.replace(destination); }, [destination, router]);
  if (status === 'restoring' || destination) return <p role="status" className="p-6 text-sm text-brand-textSecondary">Đang kiểm tra quyền truy cập…</p>;
  return <>{children}</>;
}
