'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useWebSession } from '@/features/auth/session/useWebSession';
import { joinTravelGroup, TravelGroupHttpError } from '@/features/traveler/groups/services/travelGroupApi';
import { ROUTES } from '@/lib/routes';

import {
  type ItineraryListSort,
  ItineraryHttpError,
  type ItinerarySummaryDto,
  listMyItineraries,
} from '../services/schedulingApi';
import { formatVietnamDayLabel, formatVietnamTime, vietnamDayKey } from '../types/schedulingTypes';
import {
  classifyTrips,
  countTripsByFilter,
  filterTrips,
  formatDateStub,
  formatRoutePreview,
  formatTimeRange,
  formatTransportLabel,
  formatTripDisplayTitle,
  formatTripDuration,
  type TripFilter,
} from '../utils/myItinerariesPresentation';

const PAGE_SIZE = 20;

const FILTER_OPTIONS: Array<{ key: TripFilter; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'confirmed', label: 'Đã chốt' },
  { key: 'draft', label: 'Bản nháp' },
  { key: 'shared', label: 'Được chia sẻ' },
];

/**
 * "Lịch trình của tôi" — Coastal Heritage Travel Library.
 * Separates live & confirmed trips from recent drafts and past trips, surfaces stop previews,
 * and lets the traveler filter, search, or sort by newest created.
 */
export function MyItinerariesPage() {
  const router = useRouter();
  const { status, context } = useWebSession();
  const [trips, setTrips] = useState<ItinerarySummaryDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadedPages, setLoadedPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TripFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  // Bumping `request` (even to the same page) re-runs the load effect for "Xem thêm", "Thử lại", and sort swaps.
  const [request, setRequest] = useState<{
    page: number;
    sort: ItineraryListSort;
    attempt: number;
  }>({ page: 1, sort: 'priority', attempt: 0 });

  useEffect(() => {
    if (!isTraveler) return;

    let active = true;
    const { page, sort } = request;
    async function loadPage() {
      try {
        const listOptions =
          sort === 'newest' ? { accessToken, sort: 'newest' as const } : { accessToken };
        const result = await listMyItineraries(page, PAGE_SIZE, listOptions);
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

  const requestPage = (page: number, nextSort: ItineraryListSort = request.sort) => {
    setIsLoading(true);
    setError(null);
    setRequest((previous) => ({ page, sort: nextSort, attempt: previous.attempt + 1 }));
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

  const handleSortChange = (nextSort: ItineraryListSort) => {
    if (nextSort === request.sort) return;
    requestPage(1, nextSort);
  };

  const filterCounts = useMemo(() => countTripsByFilter(trips, totalCount), [trips, totalCount]);
  const filteredTrips = useMemo(
    () => filterTrips(trips, filter, searchQuery),
    [trips, filter, searchQuery],
  );
  const classifiedTrips = useMemo(() => classifyTrips(trips), [trips]);

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#174B4A] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-[#5B6E69]">Đang tải chuyến đi của bạn…</p>
        </div>
      </div>
    );
  }

  if (!isTraveler) return null;

  const hasMore = trips.length < totalCount;
  const remainingCount = Math.max(0, totalCount - trips.length);
  const normalizedSearch = searchQuery.trim();
  const isSectionedView =
    request.sort === 'priority' && filter === 'all' && normalizedSearch.length === 0;
  const { live, upcoming, drafts, archive } = classifiedTrips;

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1C2928]">
      <main className="px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-3 flex items-center gap-1.5 text-xs font-medium text-[#5B6E69]"
          >
            <Link href={ROUTES.home} className="transition hover:text-[#174B4A]">
              Trang chủ
            </Link>
            <span aria-hidden="true" className="text-[#DCE2DD]">
              /
            </span>
            <span className="font-semibold text-[#1C2928]">Lịch trình của tôi</span>
          </nav>

          {/* Compact Coastal Heritage Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1C2928] sm:text-3xl">
                Lịch trình của tôi
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-[#5B6E69] sm:text-sm">
                Quản lý chuyến đi đã chốt và các bản nháp vừa tạo của bạn.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={ROUTES.messages}
                className="inline-flex items-center gap-2 rounded-xl border border-[#DCE2DD] bg-white px-4 py-2.5 text-xs font-semibold text-[#174B4A]"
              >
                Tin nhắn
              </Link>
              <button
                type="button"
                onClick={() => {
                  setInviteCode('');
                  setJoinError(null);
                  setJoinSuccess(null);
                  setIsJoinModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#DCE2DD] bg-white px-4 py-2.5 text-xs font-semibold text-[#174B4A]"
              >
                Tham gia nhóm mới
              </button>
              <Link
              href={ROUTES.plan}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#174B4A] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#103B39]"
            >
              <PlusIcon />
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

          {/* Unified Filter, Search & Sort Toolbar */}
          {trips.length > 0 && (
            <div className="mb-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div
                role="group"
                aria-label="Lọc lịch trình theo trạng thái"
                className="flex flex-wrap items-center gap-2"
              >
                {FILTER_OPTIONS.map((option) => {
                  const active = filter === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(option.key)}
                      className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                        active
                          ? 'border-[#174B4A] bg-[#174B4A] text-white shadow-2xs'
                          : 'border-[#DCE2DD] bg-white text-[#5B6E69] hover:border-[#174B4A]/40 hover:text-[#1C2928]'
                      }`}
                    >
                      {option.label} ({filterCounts[option.key]})
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:w-64 sm:flex-none">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#5B6E69]">
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-label="Tìm theo điểm đến hoặc #ID"
                    placeholder="Tìm theo điểm đến hoặc #ID..."
                    className="w-full rounded-xl border border-[#DCE2DD] bg-white py-2 pl-9 pr-8 text-xs text-[#1C2928] placeholder:text-[#5B6E69]/80 focus:border-[#174B4A] focus:outline-none"
                  />
                  {searchQuery.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Xóa từ khóa tìm kiếm"
                      className="absolute inset-y-0 right-2 flex items-center px-1 text-[#5B6E69] transition hover:text-[#1C2928]"
                    >
                      <CloseIcon />
                    </button>
                  )}
                </div>

                <select
                  aria-label="Sắp xếp lịch trình"
                  value={request.sort}
                  onChange={(event) => handleSortChange(event.target.value as ItineraryListSort)}
                  className="rounded-xl border border-[#DCE2DD] bg-white px-3 py-2 text-xs font-semibold text-[#1C2928] focus:border-[#174B4A] focus:outline-none"
                >
                  <option value="priority">Sắp xếp: Ưu tiên chuyến đi</option>
                  <option value="newest">Sắp xếp: Mới tạo nhất</option>
                </select>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <AlertIcon />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => requestPage(Math.max(loadedPages, 1), request.sort)}
                className="rounded-xl border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-800 shadow-2xs transition hover:bg-rose-50"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Initial Loading Spinner */}
          {trips.length === 0 && isLoading && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
              <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#174B4A] border-t-transparent" />
              <p className="text-xs font-semibold text-[#5B6E69]">Đang tải…</p>
            </div>
          )}

          {/* Empty Library State */}
          {trips.length === 0 && !isLoading && !error && (
            <div className="rounded-2xl border border-[#DCE2DD] bg-white p-12 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F0EA] text-[#174B4A]">
                <CompassIcon />
              </div>
              <h2 className="mt-4 text-base font-bold text-[#1C2928]">Chưa có lịch trình</h2>
              <p className="mx-auto mt-1.5 max-w-md text-xs text-[#5B6E69] sm:text-sm">
                Bạn chưa có chuyến đi nào. Lập lịch trình để bắt đầu chuyến đầu tiên.
              </p>
              <div className="mt-6">
                <Link
                  href={ROUTES.plan}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#174B4A] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#103B39]"
                >
                  <PlusIcon />
                  <span>Bắt đầu tạo lịch trình</span>
                </Link>
              </div>
            </div>
          )}

          {/* Sectioned View (Default Priority + All) */}
          {trips.length > 0 && isSectionedView && (
            <div className="space-y-8">
              {live.length > 0 && (
                <section aria-label="Chuyến đi đang diễn ra">
                  <SectionHeading
                    dotClassName="bg-emerald-600"
                    title={`Đang diễn ra trên app (${live.length})`}
                  />
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {live.map((trip) => (
                      <FeaturedTripCard key={trip.itineraryId} trip={trip} />
                    ))}
                  </div>
                </section>
              )}

              {upcoming.length > 0 && (
                <section aria-label="Chuyến sắp tới đã chốt">
                  <SectionHeading
                    dotClassName="bg-[#174B4A]"
                    title={`Chuyến sắp tới · Đã chốt (${upcoming.length})`}
                  />
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {upcoming.map((trip) => (
                      <FeaturedTripCard key={trip.itineraryId} trip={trip} />
                    ))}
                  </div>
                </section>
              )}

              {drafts.length > 0 && (
                <section aria-label="Bản nháp gần đây">
                  <SectionHeading
                    dotClassName="bg-[#B8683E]"
                    title={`Bản nháp gần đây (${drafts.length})`}
                    caption="Xếp mới tạo nhất lên đầu"
                  />
                  <div className="mt-3 space-y-2.5">
                    {drafts.map((trip, index) => (
                      <TicketTripRow key={trip.itineraryId} trip={trip} isNewest={index === 0} />
                    ))}
                  </div>
                </section>
              )}

              {archive.length > 0 && (
                <section aria-label="Lịch sử đã qua">
                  <SectionHeading
                    dotClassName="bg-[#9AA7A2]"
                    title={`Lịch sử · Đã qua (${archive.length})`}
                  />
                  <div className="mt-3 space-y-2.5">
                    {archive.map((trip) => (
                      <TicketTripRow key={trip.itineraryId} trip={trip} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Flat Filtered / Search / Newest-First View */}
          {trips.length > 0 && !isSectionedView && (
            <section aria-label="Danh sách lịch trình đã lọc">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6E69]">
                  {request.sort === 'newest' && filter === 'all' && normalizedSearch.length === 0
                    ? `Mới tạo nhất lên đầu (${filteredTrips.length})`
                    : `Kết quả phù hợp (${filteredTrips.length})`}
                </p>
                {hasMore && (filter !== 'all' || normalizedSearch.length > 0) && (
                  <p className="text-xs text-[#5B6E69]">
                    Đang lọc trong {trips.length}/{totalCount} lịch trình đã tải
                  </p>
                )}
              </div>

              {filteredTrips.length === 0 ? (
                <div className="rounded-2xl border border-[#DCE2DD] bg-white p-10 text-center shadow-2xs">
                  <h2 className="text-base font-bold text-[#1C2928]">
                    Không tìm thấy lịch trình phù hợp
                  </h2>
                  <p className="mx-auto mt-1 max-w-md text-xs text-[#5B6E69]">
                    Thử đổi bộ lọc trạng thái hoặc xóa từ khóa tìm kiếm để xem toàn bộ lịch trình.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFilter('all');
                      setSearchQuery('');
                    }}
                    className="mt-4 inline-flex items-center rounded-xl border border-[#DCE2DD] bg-[#FAF9F5] px-4 py-2 text-xs font-semibold text-[#174B4A] transition hover:border-[#174B4A] hover:bg-[#E8F0EA]"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTrips.map((trip, index) => (
                    <TicketTripRow
                      key={trip.itineraryId}
                      trip={trip}
                      isNewest={
                        request.sort === 'newest' &&
                        filter === 'all' &&
                        normalizedSearch.length === 0 &&
                        index === 0
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Pagination / Load More */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => requestPage(loadedPages + 1, request.sort)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-full border border-[#DCE2DD] bg-white px-5 py-2.5 text-xs font-semibold text-[#1C2928] shadow-2xs transition hover:border-[#174B4A] hover:text-[#174B4A] disabled:opacity-60"
              >
                {isLoading && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#174B4A] border-t-transparent" />
                )}
                <span>
                  {isLoading
                    ? 'Đang tải…'
                    : `Xem thêm chuyến đi (còn ${remainingCount})`}
                </span>
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-10 border-t border-[#DCE2DD] bg-white/80 py-8 text-center text-xs text-[#5B6E69]">
        <div className="mx-auto max-w-6xl px-4">
          <p>© 2026 TripMate AI Travel Planner. Nền tảng du lịch thông minh Việt Nam.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({
  dotClassName,
  title,
  caption,
}: {
  dotClassName: string;
  title: string;
  caption?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dotClassName}`} />
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#1C2928]">{title}</h2>
      </div>
      {caption && <span className="text-xs text-[#5B6E69]">{caption}</span>}
    </div>
  );
}

function FeaturedTripCard({ trip }: { trip: ItinerarySummaryDto }) {
  const displayTitle = formatTripDisplayTitle(trip);
  const routePreview = formatRoutePreview(trip.previewStopNames, trip.stopCount);
  const dateStub = formatDateStub(trip.validFrom);
  const timeRange = formatTimeRange(trip.validFrom, trip.validTo);
  const duration = formatTripDuration(trip.validFrom, trip.validTo);
  const transportLabel = formatTransportLabel(trip.transportMode);

  const metaParts: string[] = [];
  if (timeRange) {
    metaParts.push(duration ? `${timeRange} (${duration})` : timeRange);
  }
  metaParts.push(`${trip.stopCount} điểm dừng`);
  if (transportLabel) {
    metaParts.push(transportLabel);
  }

  return (
    <Link
      href={ROUTES.itinerary(trip.itineraryId)}
      className={`group flex flex-col justify-between rounded-2xl border border-[#DCE2DD] border-l-4 bg-white p-5 shadow-2xs transition-all hover:border-[#174B4A]/45 hover:shadow-md ${
        trip.openNavigationSessionId !== null ? 'border-l-emerald-600' : 'border-l-[#174B4A]'
      }`}
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={trip.status} />
            {trip.openNavigationSessionId !== null && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                Đang diễn ra trên app
              </span>
            )}
            {!trip.canManage && (
              <span className="rounded-full border border-[#DCE2DD] bg-[#F7F5EF] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B6E69]">
                Được chia sẻ
              </span>
            )}
            <span className="text-xs font-medium text-[#5B6E69]">#{trip.itineraryId}</span>
            <span aria-hidden="true" className="text-xs text-[#DCE2DD]">
              ·
            </span>
            <span className="text-xs font-medium text-[#5B6E69]">v{trip.version ?? 1}</span>
          </div>

          {dateStub && (
            <span className="rounded-full bg-[#F7F5EF] px-2.5 py-1 text-[11px] font-semibold text-[#5B6E69]">
              {dateStub.shortLabel}
            </span>
          )}
        </div>

        <h3 className="mt-3 text-base font-bold tracking-tight text-[#1C2928] transition-colors group-hover:text-[#174B4A] line-clamp-2">
          {displayTitle}
        </h3>

        {routePreview && (
          <p className="mt-1.5 truncate text-xs text-[#5B6E69]">{routePreview}</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#ECEFE9] pt-3 text-xs">
        <span className="text-[#5B6E69]">{metaParts.join(' · ')}</span>
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#174B4A] transition-transform group-hover:translate-x-0.5">
          <span>Mở lịch</span>
          <span className="sr-only"> — Xem lịch trình chi tiết</span>
          <ArrowRightIcon />
        </span>
      </div>
    </Link>
  );
}

function TicketTripRow({
  trip,
  isNewest = false,
}: {
  trip: ItinerarySummaryDto;
  isNewest?: boolean;
}) {
  const displayTitle = formatTripDisplayTitle(trip);
  const routePreview = formatRoutePreview(trip.previewStopNames, trip.stopCount);
  const dateStub = formatDateStub(trip.validFrom);
  const timeRange = formatTimeRange(trip.validFrom, trip.validTo);
  const duration = formatTripDuration(trip.validFrom, trip.validTo);
  const transportLabel = formatTransportLabel(trip.transportMode);
  const fallbackSchedule = formatSchedule(trip.validFrom, trip.validTo);

  const timeSummary = timeRange
    ? duration
      ? `${timeRange} · ${duration}`
      : timeRange
    : 'Chưa đặt khung giờ';
  const detailSummary = `${trip.stopCount} điểm dừng${
    transportLabel ? ` · ${transportLabel}` : ''
  }`;

  return (
    <Link
      href={ROUTES.itinerary(trip.itineraryId)}
      className="group flex flex-col gap-3 rounded-2xl border border-[#DCE2DD] bg-white px-4 py-3.5 shadow-2xs transition-all hover:border-[#174B4A]/45 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-4">
        {/* Date Stub */}
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-[#DCE2DD]/70 bg-[#F7F5EF] text-center">
          {dateStub ? (
            <>
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#5B6E69]">
                {dateStub.weekday}
              </span>
              <span className="text-lg font-extrabold leading-tight text-[#1C2928]">
                {dateStub.day}
              </span>
              <span className="text-[10px] font-medium text-[#5B6E69]">{dateStub.month}</span>
            </>
          ) : (
            <span className="text-[11px] font-semibold text-[#5B6E69]">Tự tạo</span>
          )}
        </div>

        {/* Title & Route Preview */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge status={trip.status} />
            {isNewest && (
              <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-[#174B4A]">
                Mới tạo
              </span>
            )}
            {trip.openNavigationSessionId !== null && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                Đang diễn ra trên app
              </span>
            )}
            {!trip.canManage && (
              <span className="rounded-full border border-[#DCE2DD] bg-[#F7F5EF] px-2 py-0.5 text-[11px] font-semibold text-[#5B6E69]">
                Được chia sẻ
              </span>
            )}
            <span className="text-xs font-medium text-[#5B6E69]">#{trip.itineraryId}</span>
            <span aria-hidden="true" className="text-xs text-[#DCE2DD]">
              ·
            </span>
            <span className="text-xs font-medium text-[#5B6E69]">v{trip.version ?? 1}</span>
            <h3 className="w-full truncate text-sm font-bold text-[#1C2928] transition-colors group-hover:text-[#174B4A] sm:w-auto sm:flex-1 sm:text-[15px]">
              {displayTitle}
            </h3>
          </div>

          {routePreview ? (
            <p className="mt-1 truncate text-xs text-[#5B6E69]">{routePreview}</p>
          ) : (
            fallbackSchedule && (
              <p className="mt-1 truncate text-xs text-[#5B6E69]">{fallbackSchedule}</p>
            )
          )}
        </div>
      </div>

      {/* Right Timing & CTA */}
      <div className="flex items-center justify-between gap-4 border-t border-[#ECEFE9] pt-2.5 sm:shrink-0 sm:border-t-0 sm:pt-0">
        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold text-[#1C2928]">{timeSummary}</p>
          <p className="mt-0.5 text-[11px] text-[#5B6E69]">{detailSummary}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#DCE2DD] bg-[#FAF9F5] px-3 py-1.5 text-xs font-semibold text-[#174B4A] transition group-hover:border-[#174B4A] group-hover:bg-[#174B4A] group-hover:text-white">
          <span>Xem</span>
          <span className="sr-only"> — Xem lịch trình chi tiết</span>
          <ArrowRightIcon />
        </span>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const toneClass =
    status === 'Active' || status === 'Accepted'
      ? 'bg-[#E8F0EA] text-[#174B4A]'
      : status === 'Draft'
        ? 'bg-[#FEF3E2] text-[#995436]'
        : 'bg-[#EEF1EE] text-[#5B6E69]';

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${toneClass}`}>
      {status}
    </span>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="h-3.5 w-3.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M8 3.25v9.5M3.25 8h9.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="h-3.5 w-3.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="7" r="4.75" />
      <path d="m10.5 10.5 3.25 3.25" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="h-3.5 w-3.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="h-3.5 w-3.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="h-4 w-4 shrink-0 text-rose-600"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 5.25v3.5M8 11.25h.01" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-7 w-7"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </svg>
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
