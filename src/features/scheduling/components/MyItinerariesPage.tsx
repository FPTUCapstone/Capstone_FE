'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';

import {
  ItineraryHttpError,
  ItinerarySummaryDto,
  listMyItineraries,
} from '../services/schedulingApi';
import { formatVietnamDayLabel, formatVietnamTime, vietnamDayKey } from '../types/schedulingTypes';

const PAGE_SIZE = 20;

/**
 * "Lịch trình của tôi" — the same list as the mobile app's My trips tab (trip history stays at
 * /account/trips). Navigation itself
 * happens only on the app; here a trip in progress is shown, not driven.
 */
export function MyItinerariesPage() {
  const router = useRouter();
  const { status, context } = useWebSession();
  const [trips, setTrips] = useState<ItinerarySummaryDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadedPages, setLoadedPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.myItineraries)}`);
    } else if (status === 'authenticated' && context?.role === 'TourOperator') {
      router.replace(ROUTES.partner.dashboard);
    } else if (status === 'authenticated' && context?.role === 'Administrator') {
      router.replace(ROUTES.admin.dashboard);
    }
  }, [status, context, router]);

  const isTraveler = status === 'authenticated' && context?.role === 'Traveler';
  const accessToken = context?.accessToken;

  // Bumping `request` (even to the same page) re-runs the load effect: "Xem thêm" and "Thử lại".
  const [request, setRequest] = useState({ page: 1, attempt: 0 });

  useEffect(() => {
    if (!isTraveler) return;

    let active = true;
    const { page } = request;
    async function loadPage() {
      try {
        const result = await listMyItineraries(page, PAGE_SIZE, { accessToken });
        if (!active) return;
        setTrips((previous) => {
          if (page === 1) return result.items;
          const known = new Set(previous.map((trip) => trip.itineraryId));
          return [...previous, ...result.items.filter((trip) => !known.has(trip.itineraryId))];
        });
        setTotalCount(result.totalCount);
        setLoadedPages(page);
      } catch (failure) {
        if (!active) return;
        setError(
          failure instanceof ItineraryHttpError
            ? failure.message
            : 'Không thể tải danh sách chuyến đi. Vui lòng thử lại sau.',
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadPage();
    return () => {
      active = false;
    };
  }, [isTraveler, accessToken, request]);

  const requestPage = (page: number) => {
    setIsLoading(true);
    setError(null);
    setRequest((previous) => ({ page, attempt: previous.attempt + 1 }));
  };

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <p className="text-xs font-semibold text-slate-500">Đang tải chuyến đi của bạn…</p>
      </div>
    );
  }

  if (!isTraveler) return null;

  const hasMore = trips.length < totalCount;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Lịch trình của tôi
              </h1>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                Các lịch trình bạn đã lập hoặc được chia sẻ qua nhóm du lịch. Điều hướng chuyến đi
                thực hiện trên ứng dụng TripMate.
              </p>
            </div>
            <Link
              href={ROUTES.plan}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#007d6e] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Lập lịch trình mới
            </Link>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => requestPage(Math.max(loadedPages, 1))}
                className="rounded-lg border border-rose-300 bg-white px-3 py-1 text-xs font-bold"
              >
                Thử lại
              </button>
            </div>
          )}

          {trips.length === 0 && isLoading && (
            <p className="py-12 text-center text-sm text-slate-500">Đang tải…</p>
          )}

          {trips.length === 0 && !isLoading && !error && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-600">
                Bạn chưa có chuyến đi nào. Lập lịch trình để bắt đầu chuyến đầu tiên.
              </p>
            </div>
          )}

          <ul className="space-y-3">
            {trips.map((trip) => (
              <li key={trip.itineraryId}>
                <TripCard trip={trip} />
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => requestPage(loadedPages + 1)}
                disabled={isLoading}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {isLoading ? 'Đang tải…' : 'Xem thêm chuyến đi'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function TripCard({ trip }: { trip: ItinerarySummaryDto }) {
  const title = trip.title?.trim() || 'Lịch trình chưa đặt tên';
  return (
    <Link
      href={ROUTES.itinerary(trip.itineraryId)}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-[#007d6e]/40 hover:shadow-xs"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900 sm:text-base">{title}</h2>
        <span className="material-symbols-outlined text-slate-400">chevron_right</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Tag>{trip.status}</Tag>
        {trip.openNavigationSessionId !== null && (
          <Tag tone="success">Đang diễn ra trên app</Tag>
        )}
        {!trip.canManage && <Tag>Được chia sẻ</Tag>}
      </div>
      <p className="mt-2 text-xs text-slate-600">
        {[formatSchedule(trip.validFrom, trip.validTo), `${trip.stopCount} điểm dừng`]
          .filter(Boolean)
          .join(' · ')}
      </p>
    </Link>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: 'success' }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        tone === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-50 text-[#007d6e]'
      }`}
    >
      {children}
    </span>
  );
}

/** "Thứ Năm, 15/10 · 18:42–22:27", or both dates when the trip runs past midnight. */
export function formatSchedule(from: string | null, to: string | null): string | null {
  if (!from) return null;
  const start = `${formatVietnamDayLabel(from)} · ${formatVietnamTime(from)}`;
  if (!to) return start;
  return vietnamDayKey(from) === vietnamDayKey(to)
    ? `${start}–${formatVietnamTime(to)}`
    : `${start} – ${formatVietnamDayLabel(to)} · ${formatVietnamTime(to)}`;
}
