'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';

import { getItineraryById, ItineraryHttpError } from '../services/schedulingApi';
import { formatVietnamTime, ItineraryDetailDto } from '../types/schedulingTypes';
import { ItineraryRouteMapPreview } from './ItineraryRouteMapPreview';
import { ItinerarySummaryCards } from './ItinerarySummaryCards';
import { ItineraryTimeline } from './ItineraryTimeline';

interface ViewSuggestedItineraryPageProps {
  itineraryId: string;
}

function getErrorPresentation(status?: number): { heading: string; icon: string } {
  switch (status) {
    case 401:
      return { heading: 'Phiên đăng nhập đã hết hạn', icon: 'login' };
    case 403:
      return { heading: 'Bạn không có quyền xem lịch trình này', icon: 'lock' };
    case 404:
      return { heading: 'Không tìm thấy lịch trình', icon: 'search_off' };
    default:
      return { heading: 'Không thể tải chi tiết lịch trình', icon: 'event_busy' };
  }
}

export function ViewSuggestedItineraryPage({ itineraryId }: ViewSuggestedItineraryPageProps) {
  const router = useRouter();
  const { status, context } = useWebSession();
  const userId = context?.userId;
  const role = context?.role;
  const [itinerary, setItinerary] = useState<ItineraryDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(
        `${ROUTES.signIn}?returnUrl=${encodeURIComponent(`/itinerary/${itineraryId}`)}`,
      );
    } else if (status === 'authenticated' && role === 'TourOperator') {
      router.replace(ROUTES.partner.dashboard);
    } else if (status === 'authenticated' && role === 'Administrator') {
      router.replace(ROUTES.admin.dashboard);
    }
  }, [status, role, router, itineraryId]);

  useEffect(() => {
    if (status !== 'authenticated' || userId === undefined || role !== 'Traveler') {
      return;
    }

    let isMounted = true;
    async function loadItinerary() {
      setLoading(true);
      setError(null);
      setItinerary(null);

      try {
        const data = await getItineraryById(itineraryId);
        if (isMounted) {
          setItinerary(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const httpStatus = err instanceof ItineraryHttpError ? err.status : undefined;
          const msg =
            err instanceof Error
              ? err.message
              : 'Không thể tải chi tiết lịch trình. Vui lòng thử lại sau.';
          setError({ status: httpStatus, message: msg });
          setLoading(false);
        }
      }
    }

    void loadItinerary();

    return () => {
      isMounted = false;
    };
  }, [itineraryId, status, userId, role]);

  const errorPresentation = getErrorPresentation(error?.status);
  const signInHref = `${ROUTES.signIn}?returnUrl=${encodeURIComponent(ROUTES.itinerary(itineraryId))}`;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-slate-500">Đang tải kế hoạch du lịch…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || userId === undefined || role !== 'Traveler') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicNavigation />

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
            <Link href={ROUTES.plan} className="hover:text-[#007d6e] transition">
              Lập lịch trình thông minh
            </Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="font-semibold text-slate-800">
              Lịch trình #{itineraryId}
            </span>
          </nav>

          {/* Truthful Error Display */}
          {error && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <span className="material-symbols-outlined text-3xl">{errorPresentation.icon}</span>
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                {errorPresentation.heading}
              </h2>
              <div className="mx-auto mt-2 max-w-lg space-y-2">
                <p className="text-xs text-slate-600 sm:text-sm">{error.message}</p>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {error.status === 401 ? (
                  <Link
                    href={signInHref}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#007d6e] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
                  >
                    <span className="material-symbols-outlined text-sm">login</span>
                    <span>Đăng nhập lại</span>
                  </Link>
                ) : (
                  <Link
                    href={ROUTES.plan}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#007d6e] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    <span>Tạo lịch trình mới</span>
                  </Link>
                )}
                <Link
                  href={ROUTES.home}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-sm">home</span>
                  <span>Về trang chủ</span>
                </Link>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && !error && (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#007d6e] border-t-transparent" />
              <p className="text-xs font-semibold text-slate-600 sm:text-sm">
                Đang tải kế hoạch lịch trình gợi ý…
              </p>
            </div>
          )}

          {/* Main Itinerary Content */}
          {!loading && itinerary && (
            <div className="space-y-8">
              {/* Visible DEMO_ONLY Fixture Warning Banner */}
              {itinerary.status === 'DEMO_FIXTURE' && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-medium text-amber-900 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <span className="material-symbols-outlined text-sm">science</span>
                    <span>Bản mẫu thử nghiệm (DEMO_ONLY Fixture)</span>
                  </div>
                  <p className="mt-1">
                    Lịch trình này là bản mẫu phục vụ kiểm thử giao diện trong môi trường phát triển.
                  </p>
                </div>
              )}

              {/* Header Title & Actions */}
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-3 py-0.5 text-xs font-bold text-[#007d6e]">
                      <span className="material-symbols-outlined text-xs">verified</span>
                      Tối ưu bởi Thuật toán CSP
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      Mã: #{itinerary.itineraryId}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      v{itinerary.version}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {itinerary.status}
                    </span>
                    {!itinerary.canManage && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        Chỉ xem
                      </span>
                    )}
                  </div>
                  <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                    {itinerary.title || 'Lịch trình khám phá'}
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Kế hoạch khám phá tự động cân đối giữa các điểm tham quan, ẩm thực và thời gian di chuyển.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined text-sm">print</span>
                    <span>In lịch trình</span>
                  </button>

                  <Link
                    href={ROUTES.plan}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#007d6e] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
                  >
                    <span className="material-symbols-outlined text-sm">tune</span>
                    <span>Tùy chỉnh lại</span>
                  </Link>
                </div>
              </div>

              {/* Summary Stats Cards */}
              <ItinerarySummaryCards itinerary={itinerary} />

              {/* 2-Column Main Content Layout */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Left Column: Timeline of Stops */}
                <div className="lg:col-span-8">
                  <ItineraryTimeline items={itinerary.items} />
                </div>

                {/* Right Column: Route Map Preview & Information */}
                <aside className="space-y-6 lg:col-span-4">
                  <ItineraryRouteMapPreview itinerary={itinerary} />

                  {/* Travel Tips Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-900 sm:text-sm">
                      <span className="material-symbols-outlined text-sm text-[#007d6e]">
                        info
                      </span>
                      Lưu ý khi thực hiện chuyến đi
                    </h4>
                    <ul className="mt-3 space-y-2 text-xs text-slate-600">
                      {(() => {
                        const firstPlannedArrival = itinerary.items[0]?.plannedArrival;
                        const firstArrivalTime = firstPlannedArrival
                          ? formatVietnamTime(firstPlannedArrival)
                          : null;
                        const hasValidDepartureTime = Boolean(
                          firstArrivalTime && firstArrivalTime !== '--:--',
                        );

                        if (!hasValidDepartureTime) return null;

                        return (
                          <li className="flex items-start gap-1.5">
                            <span className="text-[#007d6e] font-bold">•</span>
                            <span>
                              Nên xuất phát đúng giờ dự kiến ({firstArrivalTime}) để đảm bảo khớp giờ
                              mở cửa.
                            </span>
                          </li>
                        );
                      })()}
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#007d6e] font-bold">•</span>
                        <span>Chuẩn bị nước uống, kem chống nắng và điện thoại đầy pin để chụp ảnh.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#007d6e] font-bold">•</span>
                        <span>Bạn có thể xem chi tiết từng điểm tham quan bằng cách nhấp vào tên địa điểm.</span>
                      </li>
                    </ul>
                  </div>
                </aside>
              </div>
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
