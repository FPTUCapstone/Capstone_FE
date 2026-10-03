'use client';

import Link from 'next/link';
import { useWebSession } from '../session/useWebSession';
import { partnerUnresolvedMessage, signInDestination } from './signInDestination';
import { ROUTES } from '@/lib/routes';

/**
 * S01 restore-aware projection: a cold start (F5/direct URL) renders a neutral
 * restoring state instead of falsely showing Guest/sign-in content while the
 * cookie-backed restore is in flight. Authenticated content renders only from
 * the authoritative restored context; application status is never inferred.
 */
export function PartnerContextPage({ approvedArea = false }: { approvedArea?: boolean }) {
  const { status, context } = useWebSession();
  if (status === 'restoring') {
    return <div role="status" aria-label="Restoring session" className="h-10 w-48 animate-pulse rounded-xl bg-gray-200"><span className="sr-only">Restoring session…</span></div>;
  }
  if (!context || context.status !== 'Active' || context.role !== 'TourOperator') return <main><p>Please sign in to view your Partner context.</p><Link href={ROUTES.signIn}>Sign in</Link></main>;
  const destination = signInDestination(context);
  if (!destination) return <main><p>{partnerUnresolvedMessage}</p></main>;
  if (approvedArea && context.applicationStatus === 'Approved') return <main><p>{'Khu v\u1ef1c Partner \u0111ang \u0111\u01b0\u1ee3c ph\u00e1t tri\u1ec3n.'}</p></main>;
  return <main><h1>Partner application</h1><p>{context.applicationStatus}</p><Link href={destination}>Continue</Link></main>;
}
