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
 * "Lịch trình của tôi" — D3 My Trip Library.
 * Displays personal travel itineraries with statuses, version, stops and responsive card grid.
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
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-slate-500">Đang tải chuyến đi của bạn…</p>
        </div>
      </div>
    );
  }

  if (!isTraveler) return null;

  const hasMore = trips.length < totalCount;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-2 text-xs text-slate-500"
          >
            <Link href={ROUTES.home} className="hover:text-[#007d6e] transition">
              Trang chủ
            </Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-semibold text-slate-800">Lịch trình của tôi</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-[#007d6e]">
                <span className="material-symbols-outlined text-sm">folder_shared</span>
                Thư viện lịch trình cá nhân
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Lịch trình của tôi
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-slate-600 sm:text-sm">
                Các lịch trình bạn đã lập hoặc được chia sẻ qua nhóm du lịch. Điều hướng chuyến đi
                thực hiện trên ứng dụng TripMate.
              </p>
            </div>
            <Link
              href={ROUTES.plan}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#007d6e] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Lập lịch trình mới
            </Link>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-rose-600">error</span>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => requestPage(Math.max(loadedPages, 1))}
                className="rounded-xl border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-800 shadow-2xs transition hover:bg-rose-50"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Loading Skeleton / Spinner */}
          {trips.length === 0 && isLoading && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
              <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent" />
              <p className="text-xs font-semibold text-slate-500">Đang tải…</p>
            </div>
          )}

          {/* Empty State */}
          {trips.length === 0 && !isLoading && !error && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#007d6e]">
                <span className="material-symbols-outlined text-3xl">map</span>
              </div>
              <h2 className="mt-4 text-base font-bold text-slate-900">
                Chưa có lịch trình
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500 sm:text-sm">
                Bạn chưa có chuyến đi nào. Lập lịch trình để bắt đầu chuyến đầu tiên.
              </p>
              <div className="mt-6">
                <Link
                  href={ROUTES.plan}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#007d6e] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
                >
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  <span>Bắt đầu tạo lịch trình</span>
                </Link>
              </div>
            </div>
          )}

          {/* Trip Cards Grid */}
          {trips.length > 0 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <TripCard key={trip.itineraryId} trip={trip} />
              ))}
            </div>
          )}

          {/* Pagination / Load More */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => requestPage(loadedPages + 1)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-[#007d6e] hover:text-[#007d6e] disabled:opacity-60"
              >
                {isLoading && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#007d6e] border-t-transparent" />
                )}
                <span>{isLoading ? 'Đang tải…' : 'Xem thêm chuyến đi'}</span>
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          <p>© 2026 TripMate AI Travel Planner. Nền tảng du lịch thông minh Việt Nam.</p>
        </div>
      </footer>
    </div>
  );
}

function TripCard({ trip }: { trip: ItinerarySummaryDto }) {
  const title = trip.title?.trim() || 'Lịch trình chưa đặt tên';
  const schedule = formatSchedule(trip.validFrom, trip.validTo);

  return (
    <Link
      href={ROUTES.itinerary(trip.itineraryId)}
      className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-[#007d6e]/50 hover:shadow-md"
    >
      <div>
        {/* Badges row */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <Tag>{trip.status}</Tag>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            v{trip.version ?? 1}
          </span>
          {trip.openNavigationSessionId !== null && (
            <Tag tone="success">Đang diễn ra trên app</Tag>
          )}
          {!trip.canManage && <Tag>Được chia sẻ</Tag>}
        </div>

        {/* Title */}
        <h2 className="text-sm font-bold text-slate-900 group-hover:text-[#007d6e] transition-colors sm:text-base line-clamp-2">
          {title}
        </h2>

        {/* Schedule & Stops */}
        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
          {schedule && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
              <span className="truncate">{schedule}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="material-symbols-outlined text-sm text-slate-400">pin_drop</span>
            <span>{trip.stopCount} điểm dừng</span>
          </div>
        </div>
      </div>

      {/* Card Footer CTA */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-[#007d6e]">
        <span>Xem lịch trình chi tiết</span>
        <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
          arrow_forward
        </span>
      </div>
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
