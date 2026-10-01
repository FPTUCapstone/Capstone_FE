'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { formatVietnamTime, ItineraryDetailItemDto } from '../types/schedulingTypes';

interface ItineraryTimelineProps {
  items: ItineraryDetailItemDto[];
}

export function ItineraryTimeline({ items }: ItineraryTimelineProps) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl text-slate-300">
          event_busy
        </span>
        <p className="mt-2 text-sm font-medium">Chưa có điểm dừng nào trong lịch trình này.</p>
      </div>
    );
  }

  const formatTime = (isoString?: string): string => formatVietnamTime(isoString);

  return (
    <div className="relative space-y-6">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
          Lộ trình tham quan chi tiết ({items.length} điểm dừng)
        </h2>
        <span className="text-xs text-slate-500">
          Sắp xếp tối ưu bởi thuật toán CSP
        </span>
      </div>

      <div className="space-y-6">
        {items.map((item, index) => {
          const isRest = (item.kind ?? (item as unknown as { itemKind?: string }).itemKind) === 'Rest';
          const isLast = index === items.length - 1;
          const arrivalTime = formatTime(item.plannedArrival);
          const departureTime = formatTime(item.plannedDeparture);

          return (
            <div key={item.itemId || item.sequenceNo || index} className="relative">
              {/* Incoming travel transition from previous stop (Part 9) */}
              {index > 0 &&
                item.travelDurationFromPreviousMinutes !== null &&
                item.travelDurationFromPreviousMinutes !== undefined && (
                  <div className="mb-4 ml-10 flex items-center gap-2 text-xs text-slate-500 sm:ml-12">
                    <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11.5px] font-medium shadow-2xs">
                      <span className="material-symbols-outlined text-sm text-[#007d6e]">
                        directions
                      </span>
                      <span>
                        Di chuyển khoảng{' '}
                        <strong>{item.travelDurationFromPreviousMinutes} phút</strong> từ điểm trước
                      </span>
                    </div>
                  </div>
                )}

              {/* Connecting line to next item */}
              {!isLast && (
                <div
                  className="absolute left-5 top-12 -bottom-6 w-0.5 bg-slate-200 sm:left-6"
                  aria-hidden="true"
                />
              )}

              {/* Stop Card */}
              <div
                className={`relative flex items-start gap-3.5 rounded-2xl border p-4 shadow-2xs transition sm:gap-4 sm:p-5 ${
                  item.isUnavailable
                    ? 'border-rose-200 bg-rose-50/30'
                    : isRest
                    ? 'border-amber-200/80 bg-amber-50/40 hover:border-amber-300'
                    : 'border-slate-200 bg-white hover:border-teal-300'
                }`}
              >
                {/* Sequence circle badge */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black shadow-xs sm:h-12 sm:w-12 sm:text-base ${
                    item.isUnavailable
                      ? 'bg-rose-500 text-white'
                      : isRest
                      ? 'bg-amber-500 text-white'
                      : 'bg-[#007d6e] text-white'
                  }`}
                >
                  {item.sequenceNo}
                </div>

                {/* Content body */}
                <div className="min-w-0 flex-1">
                  {/* Top row: Badges and Times */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          isRest
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-teal-100 text-[#007d6e]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {isRest ? 'restaurant' : 'tour'}
                        </span>
                        {isRest ? 'Nghỉ ngơi / Ẩm thực' : 'Điểm tham quan'}
                      </span>

                      {item.category && (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {item.category}
                        </span>
                      )}

                      {item.isMandatory && (
                        <span className="inline-flex items-center rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                          Bắt buộc
                        </span>
                      )}

                      {item.isUnavailable && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                          <span className="material-symbols-outlined text-xs">block</span>
                          Tạm ngưng hoạt động
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <span className="material-symbols-outlined text-sm text-slate-400">
                        schedule
                      </span>
                      <span>
                        {arrivalTime} - {departureTime}
                      </span>
                    </div>
                  </div>

                  {/* Stop title */}
                  <h3 className="mt-2 text-base font-bold text-slate-900 sm:text-lg">
                    {item.poiName || 'Điểm dừng chân theo lộ trình'}
                  </h3>

                  {/* Recommendation reason */}
                  {item.recommendationReason && (
                    <p className="mt-1 flex items-start gap-1 text-xs text-slate-600 sm:text-sm">
                      <span className="material-symbols-outlined text-sm text-teal-600 shrink-0 mt-0.5">
                        tips_and_updates
                      </span>
                      <span>{item.recommendationReason}</span>
                    </p>
                  )}

                  {/* Metadata chips */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-slate-400">
                        timelapse
                      </span>
                      <span>Thời gian dừng: <strong>{item.stayDurationMinutes} phút</strong></span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-slate-400">
                        payments
                      </span>
                      <span>
                        Chi phí:{' '}
                        <strong>
                          {item.estimatedCost && item.estimatedCost > 0
                            ? `${item.estimatedCost.toLocaleString('vi-VN')} VNĐ`
                            : 'Miễn phí'}
                        </strong>
                      </span>
                    </div>

                    {/* Link to POI details (UC-12) if poiId exists */}
                    {item.poiId ? (
                      <Link
                        href={ROUTES.poi(item.poiId)}
                        className="ml-auto inline-flex items-center gap-1 font-bold text-[#007d6e] hover:underline"
                      >
                        <span>Chi tiết địa điểm</span>
                        <span className="material-symbols-outlined text-sm">
                          arrow_outward
                        </span>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
