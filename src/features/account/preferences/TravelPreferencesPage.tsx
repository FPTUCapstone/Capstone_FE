'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { AccountWorkspaceNav } from '@/features/account/common/AccountWorkspaceNav';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';

import { preferenceMessages } from './resources/messages';
import { TravelPreferencesForm } from './TravelPreferencesForm';
import { getTravelPreferenceOptions, getTravelPreferences } from './travelPreferencesApi';
import type { TravelPreferenceOptions, TravelPreferences } from './travelPreferencesTypes';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; options: TravelPreferenceOptions; preferences: TravelPreferences }
  | { status: 'failure' }
  | { status: 'sessionExpired' }
  | { status: 'forbidden' };

const SIGN_IN_RETURN = `${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.account.preferences)}`;

export function TravelPreferencesPage() {
  const router = useRouter();
  const { status, context } = useWebSession();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);
  const isTraveler = status === 'authenticated' && context?.role === 'Traveler';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(SIGN_IN_RETURN);
    } else if (status === 'authenticated' && context?.role === 'TourOperator') {
      router.replace(ROUTES.partner.dashboard);
    } else if (status === 'authenticated' && context?.role === 'Administrator') {
      router.replace(ROUTES.admin.dashboard);
    } else if (status === 'authenticated' && context?.role === 'Staff') {
      router.replace(ROUTES.admin.staffDashboard);
    }
  }, [status, context, router]);

  useEffect(() => {
    if (!isTraveler) return undefined;
    let active = true;

    Promise.all([getTravelPreferenceOptions(), getTravelPreferences()])
      .then(([options, preferences]) => {
        if (!active) return;
        if (options.ok && preferences.ok) {
          setState({ status: 'ready', options: options.data, preferences: preferences.data });
          return;
        }
        const failed = [options, preferences].find((result) => !result.ok);
        const kind = failed && !failed.ok ? failed.kind : 'failure';
        setState({
          status: kind === 'sessionExpired' ? 'sessionExpired' : kind === 'forbidden' ? 'forbidden' : 'failure',
        });
      })
      .catch(() => {
        if (active) setState({ status: 'failure' });
      });

    return () => {
      active = false;
    };
  }, [isTraveler, reloadToken]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setReloadToken((value) => value + 1);
  }, []);

  if (status === 'restoring' || (isTraveler && state.status === 'loading')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F6F7]" role="status">
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

  if (!isTraveler || !context) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F3F6F7] text-[#00152A]" lang="vi">

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
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

        <AccountWorkspaceNav activeTab="preferences" />

        <section className="rounded-2xl border border-[#D8E1E4] bg-white p-6 shadow-xs sm:p-8">
          <header className="mb-6 border-b border-[#D8E1E4] pb-4">
            <h1 className="text-xl font-black tracking-tight text-[#00152A] sm:text-2xl">Sở thích du lịch</h1>
            <p className="mt-1 text-xs text-[#59616B] sm:text-sm">
              Tùy chỉnh các tiêu chí ưu tiên để TripMate cá nhân hóa gợi ý và điền sẵn khi lập lịch trình.
            </p>
          </header>

          {state.status === 'ready' ? (
            <TravelPreferencesForm
              options={state.options}
              initialPreferences={state.preferences}
              onAccessProblem={(kind) => setState({ status: kind })}
            />
          ) : null}

          {state.status === 'failure' ? (
            <div className="space-y-3">
              <FeedbackAlert tone="error">{preferenceMessages.locked.MSG127}</FeedbackAlert>
              <button
                type="button"
                onClick={retry}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-[#D8E1E4] bg-white px-4 py-2.5 text-xs font-semibold text-[#00152A] hover:bg-[#F3F6F7]"
              >
                Thử lại
              </button>
            </div>
          ) : null}

          {state.status === 'sessionExpired' ? (
            <div className="space-y-3">
              <FeedbackAlert tone="warning">{preferenceMessages.locked.MSG125}</FeedbackAlert>
              <Link
                href={SIGN_IN_RETURN}
                className="inline-flex min-h-[44px] items-center rounded-xl bg-[#006B5F] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#00574D]"
              >
                Đăng nhập lại
              </Link>
            </div>
          ) : null}

          {state.status === 'forbidden' ? (
            <FeedbackAlert tone="error">{preferenceMessages.locked.MSG126}</FeedbackAlert>
          ) : null}
        </section>
      </main>
    </div>
  );
}
