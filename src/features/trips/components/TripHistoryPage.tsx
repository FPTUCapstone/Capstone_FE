'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { AccountWorkspaceNav } from '@/features/account/common/AccountWorkspaceNav';
import { useAccountWorkspace } from '@/features/account/common/AccountWorkspaceContext';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';
import { tripReviewEn } from '../resources/en';
import { TripHistoryView } from './TripHistoryView';

export function TripHistoryPage() {
  const router = useRouter();
  const { isInsideShell } = useAccountWorkspace();
  const { status, context } = useWebSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.account.trips)}`);
    } else if (status === 'authenticated' && context?.role === 'TourOperator') {
      router.replace(ROUTES.partner.dashboard);
    } else if (status === 'authenticated' && context?.role === 'Administrator') {
      router.replace(ROUTES.admin.dashboard);
    }
  }, [status, context, router]);

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#174B4A] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-[#5B6E69]">
            {tripReviewEn.tripHistory.loadingAccount}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !context || context.role !== 'Traveler') {
    return null;
  }

  const content = (
    <>
      {!isInsideShell && (
        <>
          <PublicNavigation locale="en" />
          <nav
            aria-label={tripReviewEn.accessibility.breadcrumbAria}
            className="mb-5 flex items-center gap-2 text-xs text-[#5B6E69]"
          >
            <Link href={ROUTES.home} className="hover:text-[#174B4A] hover:underline">
              {tripReviewEn.tripHistory.breadcrumbHome}
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={ROUTES.account.profile} className="hover:text-[#174B4A] hover:underline">
              {tripReviewEn.tripHistory.breadcrumbAccount}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-[#1C2928]">
              {tripReviewEn.tripHistory.breadcrumbTrips}
            </span>
          </nav>
        </>
      )}

      <AccountWorkspaceNav activeTab="trips" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#1C2928] sm:text-3xl">
          {tripReviewEn.tripHistory.pageTitle}
        </h1>
        <p className="mt-1 text-sm text-[#5B6E69]">
          {tripReviewEn.tripHistory.pageSubtitle}
        </p>
      </div>

      <TripHistoryView />
    </>
  );

  if (isInsideShell) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928]" lang="vi">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {content}
      </main>
    </div>
  );
}
