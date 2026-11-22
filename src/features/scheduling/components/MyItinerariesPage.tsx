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
import {
  joinTravelGroup,
  TravelGroupHttpError,
} from '@/features/traveler/groups/services/travelGroupApi';

const PAGE_SIZE = 20;

/**
 * "Lịch trình của tôi" — D3 My Trip Library.
 * Displays personal travel itineraries with statuses, version, stops and responsive card grid.
 * Allows travelers to join travel groups via invitation code (UC-19).
 */
export function MyItinerariesPage() {
  const router = useRouter();
  const { status, context } = useWebSession();
  const [trips, setTrips] = useState<ItinerarySummaryDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadedPages, setLoadedPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Join Travel Group state
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

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

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inviteCode.trim();
    if (!trimmed) {
      setJoinError('Trường này là bắt buộc.');
      return;
    }
    if (trimmed.length !== 8 || !/^[A-Za-z0-9]{8}$/.test(trimmed)) {
      setJoinError('Mã lời mời không hợp lệ, đã hết hạn hoặc không còn khả dụng. Vui lòng kiểm tra lại.');
      return;
    }

    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await joinTravelGroup(trimmed, { accessToken });
      setJoinSuccess(`Bạn đã tham gia "${res.groupName}"!`);
      // Refresh itineraries to immediately surface the newly joined group trip
      requestPage(1);
    } catch (err) {
      if (err instanceof TravelGroupHttpError) {
        setJoinError(err.message);
      } else {
        setJoinError('TripMate tạm thời không thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#103B39] border-t-transparent"
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
            <Link href={ROUTES.home} className="hover:text-[#103B39] transition">
              Trang chủ
            </Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-semibold text-slate-800">Lịch trình của tôi</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-[#103B39]">
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
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                href={ROUTES.messages}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-900 shadow-xs transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-800/20"
              >
                <span className="material-symbols-outlined text-sm">forum</span>
                <span>Tin nhắn nhóm</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setInviteCode('');
                  setJoinError(null);
                  setJoinSuccess(null);
                  setIsJoinModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-teal-800/20 bg-teal-50 px-4 py-2.5 text-xs font-bold text-[#103B39] shadow-xs transition hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-[#103B39]/20"
              >
                <span className="material-symbols-outlined text-sm">group_add</span>
                <span>Tham gia nhóm</span>
              </button>
              <Link
                href={ROUTES.plan}
                className="inline-flex items-center gap-2 rounded-xl bg-[#103B39] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#174B4A] focus:outline-none focus:ring-2 focus:ring-[#103B39]/20"
              >
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                <span>Lập lịch trình mới</span>
              </Link>
            </div>
          </div>

          {/* Join Travel Group Modal */}
          {isJoinModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
              role="dialog"
              aria-modal="true"
              aria-labelledby="join-group-modal-title"
            >
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#103B39]">
                      <span className="material-symbols-outlined text-xl">group_add</span>
                    </div>
                    <div>
                      <h3 id="join-group-modal-title" className="text-base font-bold text-slate-900">
                        Tham gia nhóm du lịch
                      </h3>
                      <p className="text-xs text-slate-500">Đồng hành trong lịch trình cùng bạn bè</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsJoinModalOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    aria-label="Đóng"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                {joinSuccess ? (
                  <div className="my-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                    <span className="material-symbols-outlined text-3xl text-emerald-600 mb-1">check_circle</span>
                    <p className="text-sm font-bold text-emerald-900">{joinSuccess}</p>
                    <p className="mt-1 text-xs text-emerald-700">Lịch trình đã được thêm vào thư viện của bạn.</p>
                    <button
                      type="button"
                      onClick={() => setIsJoinModalOpen(false)}
                      className="mt-4 w-full rounded-xl bg-[#103B39] py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#174B4A]"
                    >
                      Hoàn tất
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleJoinSubmit} className="mt-5 space-y-4">
                    <div>
                      <label htmlFor="invite-code-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                        Mã lời mời (8 ký tự) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="invite-code-input"
                        type="text"
                        value={inviteCode}
                        maxLength={8}
                        onChange={(e) => {
                          setInviteCode(e.target.value.toUpperCase());
                          setJoinError(null);
                        }}
                        placeholder="VD: A7K4P2QX"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-center font-mono text-base font-bold uppercase tracking-widest text-slate-900 placeholder:font-sans placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 focus:border-[#103B39] focus:outline-none focus:ring-2 focus:ring-[#103B39]/20"
                        autoFocus
                      />
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        Nhập mã gồm 8 ký tự do trưởng nhóm hoặc thành viên cung cấp.
                      </p>
                    </div>

                    {joinError && (
                      <div
                        role="alert"
                        className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
                      >
                        <span className="material-symbols-outlined text-sm text-rose-600 shrink-0">error</span>
                        <span>{joinError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsJoinModalOpen(false)}
                        disabled={isJoining}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isJoining}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#103B39] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#174B4A] transition disabled:opacity-60"
                      >
                        {isJoining && (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        <span>{isJoining ? 'Đang tham gia…' : 'Tham gia nhóm'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

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
              <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#103B39] border-t-transparent" />
              <p className="text-xs font-semibold text-slate-500">Đang tải…</p>
            </div>
          )}

          {/* Empty State */}
          {trips.length === 0 && !isLoading && !error && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#103B39]">
                <span className="material-symbols-outlined text-3xl">map</span>
              </div>
              <h2 className="mt-4 text-base font-bold text-slate-900">
                Chưa có lịch trình
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500 sm:text-sm">
                Bạn chưa có chuyến đi nào. Lập lịch trình hoặc tham gia nhóm du lịch để bắt đầu.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setInviteCode('');
                    setJoinError(null);
                    setJoinSuccess(null);
                    setIsJoinModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-800/20 bg-teal-50 px-4 py-2.5 text-xs font-bold text-[#103B39] shadow-xs transition hover:bg-teal-100"
                >
                  <span className="material-symbols-outlined text-sm">group_add</span>
                  <span>Tham gia nhóm</span>
                </button>
                <Link
                  href={ROUTES.plan}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#103B39] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#174B4A]"
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
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-[#103B39] hover:text-[#103B39] disabled:opacity-60"
              >
                {isLoading && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#103B39] border-t-transparent" />
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
      className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-[#103B39]/50 hover:shadow-md"
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
          {!trip.canManage && (
            <Tag>
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">groups</span>
                Được chia sẻ
              </span>
            </Tag>
          )}
        </div>

        {/* Title */}
        <h2 className="text-sm font-bold text-slate-900 group-hover:text-[#103B39] transition-colors sm:text-base line-clamp-2">
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
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-[#103B39]">
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
        tone === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-50 text-[#103B39]'
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
