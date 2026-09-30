'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { ROUTES } from '@/lib/routes';

import { getItineraryById } from '../services/schedulingApi';
import { SchedulingResponseDto } from '../types/schedulingTypes';
import { ItineraryRouteMapPreview } from './ItineraryRouteMapPreview';
import { ItinerarySummaryCards } from './ItinerarySummaryCards';
import { ItineraryTimeline } from './ItineraryTimeline';

interface ViewSuggestedItineraryPageProps {
  itineraryId: string;
}

export function ViewSuggestedItineraryPage({ itineraryId }: ViewSuggestedItineraryPageProps) {
  const [itinerary, setItinerary] = useState<SchedulingResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getItineraryById(itineraryId)
      .then((data) => {
        if (isMounted) {
          setItinerary(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Không thể tải chi tiết lịch trình. Vui lòng thử lại sau.',
          );
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [itineraryId]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

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

          {/* Explicit Unavailable / Pending Backend Integration display (Requirement C) */}
          {error && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <span className="material-symbols-outlined text-3xl">event_busy</span>
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Không tìm thấy lịch trình hoặc dữ liệu chưa sẵn sàng
              </h2>
              <div className="mx-auto mt-2 max-w-lg space-y-2">
                <p className="text-xs text-slate-600 sm:text-sm">{error}</p>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800">
                  <span className="material-symbols-outlined text-xs">pending</span>
                  Trạng thái tích hợp: PENDING_BE_INTEGRATION
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={ROUTES.plan}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#007d6e] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  <span>Tạo lịch trình mới</span>
                </Link>
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
                    Lịch trình này là bản mẫu phục vụ kiểm thử giao diện trong môi trường phát triển. Năng lực truy xuất lịch trình từ máy chủ đang chờ tích hợp Backend (Pending Backend Integration).
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
                  </div>
                  <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                    {itinerary.title}
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Kế hoạch khám phá tự động cân đối giữa các điểm tham quan, ẩm thực và thời gian di chuyển.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copied ? 'check' : 'share'}
                    </span>
                    <span>{copied ? 'Đã sao chép link' : 'Chia sẻ'}</span>
                  </button>

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
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#007d6e] font-bold">•</span>
                        <span>Nên xuất phát đúng giờ dự kiến ({itinerary.items[0]?.plannedArrival ? new Date(itinerary.items[0].plannedArrival).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '08:00'}) để đảm bảo khớp giờ mở cửa.</span>
                      </li>
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
