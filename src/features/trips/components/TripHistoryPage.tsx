'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { AccountWorkspaceNav } from '@/features/account/common/AccountWorkspaceNav';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';
import { tripReviewEn } from '../resources/en';
import { TripHistoryView } from './TripHistoryView';

export function TripHistoryPage() {
  const router = useRouter();
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
      <div className="flex min-h-screen items-center justify-center bg-[#F3F6F7]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#006B5F] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-[#59616B]">
            {tripReviewEn.tripHistory.loadingAccount}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !context || context.role !== 'Traveler') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F3F6F7] text-[#00152A]" lang="en">
      <PublicNavigation />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label={tripReviewEn.accessibility.breadcrumbAria}
          className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#59616B]"
        >
          <Link href={ROUTES.home} className="hover:text-[#006B5F] hover:underline">
            {tripReviewEn.tripHistory.breadcrumbHome}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={ROUTES.account.profile} className="hover:text-[#006B5F] hover:underline">
            {tripReviewEn.tripHistory.breadcrumbAccount}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#00152A]">
            {tripReviewEn.tripHistory.breadcrumbTrips}
          </span>
        </nav>

        {/* Account Workspace Navigation Tabs */}
        <AccountWorkspaceNav activeTab="trips" />

        {/* Header Title Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#E6F4F1] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#006B5F]">
              {tripReviewEn.tripHistory.badgeCode}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {tripReviewEn.tripHistory.badgeLabel}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-[#00152A] sm:text-3xl">
            {tripReviewEn.tripHistory.pageTitle}
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {tripReviewEn.tripHistory.pageSubtitle}
          </p>
        </div>

        {/* Trip History Content View */}
        <TripHistoryView />
      </main>
    </div>
  );
}
