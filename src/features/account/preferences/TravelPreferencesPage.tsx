'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { AccountWorkspaceNav } from '@/features/account/common/AccountWorkspaceNav';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';

import { TravelPreferencesForm } from './TravelPreferencesForm';
import { getTravelPreferences } from './travelPreferencesApi';
import { DEFAULT_PREFERENCES, TravelPreferencesData } from './travelPreferencesTypes';

export function TravelPreferencesPage() {
  const router = useRouter();
  const { status, context } = useWebSession();
  const [initialData, setInitialData] = useState<TravelPreferencesData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(
        `${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.account.preferences)}`,
      );
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && context) {
      let isMounted = true;
      getTravelPreferences({
        accessToken: context.accessToken,
        userId: context.userId,
      })
        .then((prefs) => {
          if (isMounted) setInitialData(prefs);
        })
        .catch(() => {
          if (isMounted) setInitialData(DEFAULT_PREFERENCES);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [status, context]);

  if (status === 'restoring' || (status === 'authenticated' && initialData === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F6F7]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#006B5F] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-[#59616B]">Đang tải sở thích du lịch…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !context) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F3F6F7] text-[#00152A]" lang="vi">
      <PublicNavigation />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#59616B]">
          <Link href={ROUTES.home} className="hover:text-[#006B5F] hover:underline">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={ROUTES.account.profile} className="hover:text-[#006B5F] hover:underline">
            Tài khoản
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#00152A]">Sở thích du lịch</span>
        </nav>

        {/* Account Workspace Navigation Tabs */}
        <AccountWorkspaceNav activeTab="preferences" />

        {/* Travel Preferences Card */}
        <section className="rounded-2xl border border-[#D8E1E4] bg-white p-6 shadow-xs sm:p-8">
          <header className="mb-6 pb-4 border-b border-[#D8E1E4]">
            <h1 className="text-xl font-black tracking-tight text-[#00152A] sm:text-2xl">
              Sở thích du lịch (UC-09)
            </h1>
            <p className="mt-1 text-xs text-[#59616B] sm:text-sm">
              Tùy chỉnh các tiêu chí ưu tiên để TripMate cá nhân hóa gợi ý điểm đến và tối ưu lịch trình tham quan.
            </p>
          </header>

          <TravelPreferencesForm
            userId={context.userId}
            initialPreferences={initialData ?? DEFAULT_PREFERENCES}
          />
        </section>
      </main>
    </div>
  );
}
