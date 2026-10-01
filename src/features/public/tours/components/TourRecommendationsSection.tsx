/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';

import type { TourRecommendationDto } from '../types/tour';
import { formatDateDisplay, formatVndPrice } from '../utils/tourQuery';

interface TourRecommendationsSectionProps {
  recommendations: TourRecommendationDto[];
  isPendingBe: boolean;
  isDemo: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function TourRecommendationsSection({
  recommendations,
  isPendingBe,
  isDemo,
  onRefresh,
  isRefreshing,
}: TourRecommendationsSectionProps) {
  return (
    <section
      aria-label="Gợi ý tour cá nhân hóa"
      className="mb-10 rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50/60 via-white to-teal-50/30 p-5 sm:p-7 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-100/70 px-3 py-1 text-[11px] font-bold text-[#007d6e] mb-2">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span>Hệ Thống Gợi Ý Thông Minh TripMate (UC-25)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#00152a] tracking-tight">
            Tour Dành Riêng Cho Bạn
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Dựa trên hồ sơ sở thích du lịch, phong cách di chuyển và độ tương thích &gt;80% (BR-58).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/account/preferences"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-sm text-teal-600">tune</span>
            <span>Sở thích du lịch</span>
          </Link>

          {isDemo && onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-teal-700 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-sm ${isRefreshing ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Làm mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Production State: PENDING_BE_INTEGRATION (Strict NO PHANTOM API) */}
      {isPendingBe && !isDemo && (
        <div className="rounded-2xl border border-teal-100 bg-white/90 p-5 sm:p-6 text-center shadow-xs">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
            <span className="material-symbols-outlined text-2xl">insights</span>
          </div>
          <h3 className="mb-1 text-sm font-bold text-slate-900">
            Tính Năng Gợi Ý AI Đang Được Kết Nối
          </h3>
          <p className="mx-auto max-w-xl text-xs text-slate-600 leading-relaxed">
            Thuật toán gợi ý tour tương thích cá nhân hóa (UC-25) hiện đang trong quá trình tích hợp máy chủ Backend
            <span className="ml-1 inline-block rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
              PENDING_BE_INTEGRATION
            </span>
            . Bạn có thể cập nhật sở thích trước tại trang cá nhân hoặc tìm kiếm toàn bộ các tour đã công bố bên dưới.
          </p>
        </div>
      )}

      {/* Explicit DEMO_ONLY fixture display */}
      {isDemo && recommendations.length > 0 && (
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
            <span className="material-symbols-outlined text-sm">science</span>
            <span>CHẾ ĐỘ MÔ PHỎNG (DEMO ONLY) — Minh họa thuật toán đối sánh độ tương thích &gt;80%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.tour.tourId}
                className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:shadow-md"
              >
                <div className="relative aspect-16/10 sm:w-48 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {rec.tour.thumbnailUrl ? (
                    <img
                      src={rec.tour.thumbnailUrl}
                      alt={rec.tour.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-teal-50 text-teal-600">
                      <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 rounded-md bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    Match {rec.matchingScore}% (MSG68)
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h4 className="line-clamp-2 text-sm font-bold text-slate-900 mb-1">
                      <Link
                        href={`/tours/${rec.tour.tourId}?demo=1`}
                        className="hover:text-teal-700 transition"
                      >
                        {rec.tour.title}
                      </Link>
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-2">
                      {rec.tour.operatorName} • {rec.tour.durationDays} ngày • Khởi hành:{' '}
                      {formatDateDisplay(rec.tour.departureAtUtc)}
                    </p>
                    <ul className="mb-2 space-y-1">
                      {rec.matchingReasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-1 text-[11px] text-teal-800">
                          <span className="material-symbols-outlined text-xs text-teal-600 mt-0.5">
                            verified
                          </span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-sm font-black text-teal-700">
                      {formatVndPrice(rec.tour.basePrice)}
                    </span>
                    <Link
                      href={`/tours/${rec.tour.tourId}?demo=1`}
                      className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-600 hover:text-white transition"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
