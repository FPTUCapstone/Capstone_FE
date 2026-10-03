/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import Link from 'next/link';

import type { TourDetailDto, TourScheduleDto } from '../types/tour';
import { formatDateDisplay, formatVndPrice } from '../utils/tourQuery';

interface TourDetailViewProps {
  tour: TourDetailDto;
  onBackToResults?: () => void;
  isAuthenticated?: boolean;
}

export function TourDetailView({ tour, onBackToResults, isAuthenticated }: TourDetailViewProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(() => {
    const available = tour.schedules.find(
      (s) => s.status.toLowerCase() !== 'soldout' && s.remainingSlots > 0,
    );
    return available ? available.scheduleId : tour.schedules[0]?.scheduleId ?? '';
  });

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const selectedSchedule: TourScheduleDto | undefined = tour.schedules.find(
    (s) => s.scheduleId === selectedScheduleId,
  );

  const hasAvailableSchedules = tour.schedules.some(
    (s) => s.status.toLowerCase() !== 'soldout' && s.remainingSlots > 0,
  );

  const isCurrentScheduleAvailable =
    selectedSchedule &&
    selectedSchedule.status.toLowerCase() !== 'soldout' &&
    selectedSchedule.remainingSlots > 0;

  return (
    <article aria-labelledby="tour-detail-title" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Back action */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/tours" className="hover:text-teal-700 transition">
            Khám phá tour
          </Link>
          <span>/</span>
          {tour.destinations.length > 0 && (
            <>
              <span>{tour.destinations[0]}</span>
              <span>/</span>
            </>
          )}
          <span className="font-semibold text-slate-800 line-clamp-1 max-w-[200px] sm:max-w-xs">
            {tour.title}
          </span>
        </nav>

        {onBackToResults ? (
          <button
            type="button"
            onClick={onBackToResults}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-[#007d6e]"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Quay lại kết quả tìm kiếm</span>
          </button>
        ) : (
          <Link
            href="/tours"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-[#007d6e]"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Quay lại kết quả tìm kiếm</span>
          </Link>
        )}
      </div>

      {/* Demo Mode Notice */}
      {tour.isDemo && (
        <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-semibold text-amber-900 shadow-xs">
          <span className="material-symbols-outlined text-lg text-amber-600">info</span>
          <span>
            CHẾ ĐỘ MÔ PHỎNG (DEMO ONLY) — Đang hiển thị giao diện mẫu cho UC-26 (View Tour Detail) khi đang chờ kết nối Backend chính thức (PENDING_BE_INTEGRATION).
          </span>
        </div>
      )}

      {/* Main Header Information Area */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {tour.destinations.map((dest) => (
            <span
              key={dest}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-[#007d6e]"
            >
              <span className="material-symbols-outlined text-xs">location_on</span>
              <span>{dest}</span>
            </span>
          ))}

          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <span className="material-symbols-outlined text-xs">schedule</span>
            <span>Thời lượng: {tour.durationDays} ngày</span>
          </span>

          {tour.aggregateRating !== null && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
              <span className="material-symbols-outlined text-xs text-amber-600">star</span>
              <span>
                {tour.aggregateRating.toFixed(1)} ({tour.reviewCount} đánh giá)
              </span>
            </span>
          )}
        </div>

        <h1
          id="tour-detail-title"
          className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#00152a] tracking-tight mb-3"
        >
          {tour.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-base text-[#007d6e]">verified</span>
            <span>Nhà tổ chức: <strong className="text-slate-900">{tour.operatorName}</strong></span>
          </span>
          {tour.operatorContact && (
            <span className="text-slate-400">| Liên hệ: {tour.operatorContact}</span>
          )}
        </div>
      </header>

      {/* Gallery Area */}
      <div className="mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-xs">
        <div className="relative aspect-16/9 md:aspect-21/9 w-full bg-slate-200">
          {tour.images.length > 0 ? (
            <img
              src={tour.images[activeImageIndex] || tour.images[0]}
              alt={`${tour.title} - Ảnh ${activeImageIndex + 1}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-6xl">landscape</span>
            </div>
          )}
        </div>

        {/* Thumbnail Selector */}
        {tour.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto bg-white p-3">
            {tour.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                aria-label={`Xem ảnh ${idx + 1}`}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  idx === activeImageIndex ? 'border-[#007d6e] ring-2 ring-teal-200' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2-Column Responsive Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): Sections */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description Section */}
          <section
            aria-labelledby="section-description"
            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs"
          >
            <h2 id="section-description" className="mb-4 text-lg sm:text-xl font-bold text-[#00152a]">
              Giới Thiệu Chuyến Đi
            </h2>
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
              {tour.description}
            </p>

            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-teal-50/60 p-4 border border-teal-100">
              <span className="material-symbols-outlined text-xl text-[#007d6e] mt-0.5">
                pin_drop
              </span>
              <div>
                <strong className="block text-xs font-bold text-slate-900">Điểm hẹn tập trung:</strong>
                <span className="text-xs text-slate-600">{tour.meetingPoint}</span>
              </div>
            </div>
          </section>

          {/* Day-by-Day Itinerary Section */}
          <section
            aria-labelledby="section-itinerary"
            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs"
          >
            <h2 id="section-itinerary" className="mb-6 text-lg sm:text-xl font-bold text-[#00152a]">
              Lịch Trình Chi Tiết
            </h2>

            {tour.itinerary.length > 0 ? (
              <div className="relative pl-6 sm:pl-8 before:absolute before:top-2 before:bottom-2 before:left-2.5 sm:before:left-3.5 before:w-0.5 before:bg-teal-200 space-y-6">
                {tour.itinerary.map((day) => (
                  <div key={day.dayNumber} className="relative">
                    {/* Step Icon */}
                    <div className="absolute -left-6 sm:-left-8 top-0 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-[#007d6e] text-white text-xs font-black shadow-xs">
                      {day.dayNumber}
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {day.title}
                        </h3>
                        {day.meals && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            <span className="material-symbols-outlined text-xs">restaurant</span>
                            <span>Bữa ăn: {day.meals}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 mb-3">{day.description}</p>

                      <ul className="space-y-1.5 border-t border-slate-200/60 pt-3">
                        {day.activities.map((act, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="material-symbols-outlined text-xs text-[#007d6e] mt-0.5">
                              arrow_right
                            </span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Lịch trình chi tiết đang được cập nhật.</p>
            )}
          </section>

          {/* Inclusions and Exclusions Section */}
          <section
            aria-labelledby="section-inclusions"
            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs"
          >
            <h2 id="section-inclusions" className="mb-6 text-lg sm:text-xl font-bold text-[#00152a]">
              Dịch Vụ Bao Gồm & Không Bao Gồm
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inclusions */}
              <div className="rounded-2xl border border-teal-100 bg-teal-50/30 p-5">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-[#007d6e] mb-3">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>Bao gồm trong tour</span>
                </h3>
                <ul className="space-y-2">
                  {tour.inclusions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="material-symbols-outlined text-xs text-teal-600 mt-0.5">
                        done
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exclusions */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-3">
                  <span className="material-symbols-outlined text-base text-slate-500">cancel</span>
                  <span>Không bao gồm</span>
                </h3>
                <ul className="space-y-2">
                  {tour.exclusions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="material-symbols-outlined text-xs text-slate-400 mt-0.5">
                        close
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Cancellation Policy Section */}
          <section
            aria-labelledby="section-policy"
            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs"
          >
            <h2 id="section-policy" className="mb-4 text-lg sm:text-xl font-bold text-[#00152a]">
              Chính Sách Hoàn Hủy Tour
            </h2>
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200">
              <span className="material-symbols-outlined text-xl text-slate-600 mt-0.5">
                policy
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {tour.cancellationPolicy}
              </p>
            </div>
          </section>

          {/* Reviews Section */}
          <section
            aria-labelledby="section-reviews"
            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="section-reviews" className="text-lg sm:text-xl font-bold text-[#00152a]">
                Đánh Giá Từ Du Khách
              </h2>
              {tour.aggregateRating !== null && (
                <span className="text-sm font-bold text-amber-700">
                  ★ {tour.aggregateRating.toFixed(1)} / 5.0
                </span>
              )}
            </div>

            {tour.reviews.length > 0 ? (
              <div className="space-y-4">
                {tour.reviews.map((rev) => (
                  <div key={rev.reviewId} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-[#007d6e]">
                          {rev.authorName.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-900">{rev.authorName}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatDateDisplay(rev.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 mb-1.5 text-amber-500 text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`material-symbols-outlined text-sm ${
                            i < Math.floor(rev.rating) ? 'text-amber-500' : 'text-slate-300'
                          }`}
                        >
                          star
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-slate-700">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center text-xs text-slate-500">
                Chưa có đánh giá nào cho tour này (MSG128). Hãy là người đầu tiên trải nghiệm!
              </div>
            )}
          </section>
        </div>

        {/* Right Column (1 span): Departure Schedule & Sticky Booking Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-3xl border border-teal-200 bg-white p-6 shadow-lg">
            <div className="mb-4">
              <span className="block text-xs font-semibold text-slate-500">Giá tour trọn gói</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#007d6e]">
                  {formatVndPrice(selectedSchedule?.price ?? tour.basePrice)}
                </span>
                <span className="text-xs text-slate-500">/ khách</span>
              </div>
            </div>

            {/* Schedule Selector */}
            <div className="mb-6">
              <label
                htmlFor="schedule-select"
                className="mb-2 block text-xs font-bold text-slate-800"
              >
                Chọn lịch khởi hành:
              </label>

              {tour.schedules.length > 0 ? (
                <div className="space-y-2">
                  {tour.schedules.map((schedule) => {
                    const isSoldOut =
                      schedule.status.toLowerCase() === 'soldout' || schedule.remainingSlots <= 0;
                    const isSelected = schedule.scheduleId === selectedScheduleId;

                    return (
                      <button
                        key={schedule.scheduleId}
                        type="button"
                        onClick={() => setSelectedScheduleId(schedule.scheduleId)}
                        disabled={isSoldOut}
                        className={`w-full flex items-center justify-between rounded-xl p-3 text-left transition border ${
                          isSelected
                            ? 'border-[#007d6e] bg-teal-50/70 ring-2 ring-teal-200'
                            : isSoldOut
                            ? 'border-slate-200 bg-slate-100 opacity-50 cursor-not-allowed'
                            : 'border-slate-200 bg-white hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                            <span className="material-symbols-outlined text-sm text-[#007d6e]">
                              event
                            </span>
                            <span>{formatDateDisplay(schedule.startDatetime)}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Về: {formatDateDisplay(schedule.endDatetime)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span
                            className={`block text-[11px] font-bold ${
                              isSoldOut ? 'text-red-600' : 'text-teal-700'
                            }`}
                          >
                            {isSoldOut ? 'Hết chỗ (MSG65)' : `Còn ${schedule.remainingSlots} chỗ`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  Hiện chưa có lịch khởi hành mới được công bố.
                </p>
              )}
            </div>

            {/* Booking CTA Button (PC-02: Enabled only when schedule available) */}
            <div className="space-y-2">
              {isCurrentScheduleAvailable ? (
                isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      alert(
                        'Tính năng Đặt tour (UC-27) thuộc lộ trình phát triển tiếp theo. Cảm ơn bạn đã lựa chọn TripMate!',
                      );
                    }}
                    className="w-full inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#007d6e] py-3 px-4 text-sm font-bold text-white shadow-md transition hover:bg-[#006b5f]"
                  >
                    <span>Đặt tour ngay (UC-27)</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                ) : (
                  <Link
                    href={`/sign-in?redirect=${encodeURIComponent(`/tours/${tour.tourId}`)}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#007d6e] py-3 px-4 text-sm font-bold text-white shadow-md transition hover:bg-[#006b5f]"
                  >
                    <span>Đăng nhập để đặt tour</span>
                    <span className="material-symbols-outlined text-base">login</span>
                  </Link>
                )
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl bg-slate-200 py-3 px-4 text-sm font-bold text-slate-500 cursor-not-allowed"
                >
                  {hasAvailableSchedules ? 'Lịch này đã hết chỗ' : 'Tạm hết chỗ (MSG65)'}
                </button>
              )}

              <p className="text-center text-[11px] text-slate-400">
                Bảo chứng bởi TripMate • Hỗ trợ hoàn hủy theo chính sách
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
