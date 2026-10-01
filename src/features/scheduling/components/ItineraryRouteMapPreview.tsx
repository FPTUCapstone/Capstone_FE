'use client';

import { ItineraryDetailDto, SchedulingResponseDto } from '../types/schedulingTypes';

interface ItineraryRouteMapPreviewProps {
  itinerary: ItineraryDetailDto | SchedulingResponseDto;
}

export function ItineraryRouteMapPreview({ itinerary }: ItineraryRouteMapPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Stop Order Preview */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-[#007d6e]">
                route
              </span>
              <h3 className="text-sm font-bold text-slate-900">Sơ đồ thứ tự điểm dừng</h3>
            </div>
            <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-[#007d6e]">
              {itinerary.items.length} điểm dừng
            </span>
          </div>
        </div>

        {/* Sequential Visual Diagram */}
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2 py-2">
            {itinerary.items.map((item, idx) => {
              const isLast = idx === itinerary.items.length - 1;
              const isRest =
                ('kind' in item ? item.kind : (item as { itemKind: string }).itemKind) === 'Rest';
              const fullStopName = item.poiName ?? `Điểm dừng ${item.sequenceNo}`;

              return (
                <div key={('itemId' in item && item.itemId) || item.sequenceNo || idx} className="flex items-center gap-2">
                  <div
                    className="flex flex-col items-center"
                    title={fullStopName}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-xs ${
                        isRest
                          ? 'border-2 border-white bg-amber-500 text-white'
                          : 'border-2 border-white bg-[#007d6e] text-white'
                      }`}
                    >
                      {item.sequenceNo}
                    </div>
                    <span
                      className="mt-1 max-w-[80px] truncate text-center text-[10px] font-medium text-slate-700"
                    >
                      {fullStopName}
                    </span>
                  </div>

                  {!isLast && (
                    <span
                      className="material-symbols-outlined text-slate-300 text-base"
                      aria-hidden="true"
                    >
                      arrow_forward
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stop Sequence Note */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="material-symbols-outlined text-sm text-slate-400">
                info
              </span>
              <span>Thứ tự điểm dừng</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Sơ đồ thể hiện trình tự các điểm dừng trong lịch trình.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile App Sync / Live Navigation Note (UC-13 Mobile Feature) */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <span className="material-symbols-outlined text-xl">smartphone</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-sky-950 sm:text-sm">
              Điều hướng trực tiếp trên ứng dụng di động
            </h4>
            <p className="mt-1 text-xs text-sky-800">
              Tính năng dẫn đường GPS thời gian thực (UC-13) và Cảnh báo thay đổi lộ trình (UC-14)
              được tối ưu hóa độc quyền trên ứng dụng <strong>TripMate Flutter Mobile</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
