'use client';

import { ItineraryDetailDto, SchedulingResponseDto } from '../types/schedulingTypes';

interface ItinerarySummaryCardsProps {
  itinerary: ItineraryDetailDto | SchedulingResponseDto;
}

export function ItinerarySummaryCards({ itinerary }: ItinerarySummaryCardsProps) {
  const visitCount = itinerary.items.filter(
    (i) => (('kind' in i ? i.kind : (i as { itemKind: string }).itemKind) === 'Visit'),
  ).length;
  const restCount = itinerary.items.filter(
    (i) => (('kind' in i ? i.kind : (i as { itemKind: string }).itemKind) === 'Rest'),
  ).length;

  const hours = Math.floor(itinerary.totalDurationMinutes / 60);
  const minutes = itinerary.totalDurationMinutes % 60;
  const durationText =
    hours > 0
      ? minutes > 0
        ? `${hours} giờ ${minutes} phút`
        : `${hours} giờ`
      : `${minutes} phút`;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {/* Stat 1: Total duration */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="material-symbols-outlined text-lg text-[#007d6e]">
            timelapse
          </span>
          <span className="text-xs font-bold">Tổng thời lượng</span>
        </div>
        <p className="mt-2 text-lg font-black text-slate-900 sm:text-xl">
          {durationText}
        </p>
        <span className="text-[11px] text-slate-500">
          {itinerary.totalDurationMinutes} phút hoạt động
        </span>
      </div>

      {/* Stat 2: Total cost */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="material-symbols-outlined text-lg text-emerald-600">
            payments
          </span>
          <span className="text-xs font-bold">Chi phí dự kiến</span>
        </div>
        <p className="mt-2 text-lg font-black text-slate-900 sm:text-xl">
          {itinerary.totalEstimatedCost.toLocaleString('vi-VN')} đ
        </p>
        <span className="text-[11px] text-slate-500">Vé tham quan & ẩm thực</span>
      </div>

      {/* Stat 3: Stops count */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="material-symbols-outlined text-lg text-teal-600">
            pin_drop
          </span>
          <span className="text-xs font-bold">Số điểm dừng</span>
        </div>
        <p className="mt-2 text-lg font-black text-slate-900 sm:text-xl">
          {itinerary.items.length} điểm
        </p>
        <span className="text-[11px] text-slate-500">
          {visitCount} tham quan • {restCount} dừng nghỉ
        </span>
      </div>

      {/* Stat 4: Optimization Engine */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 shadow-2xs">
        <div className="flex items-center gap-2 text-teal-800">
          <span className="material-symbols-outlined text-lg text-[#007d6e]">
            auto_awesome
          </span>
          <span className="text-xs font-bold">Thuật toán CSP</span>
        </div>
        <p className="mt-2 text-lg font-black text-[#007d6e] sm:text-xl">
          Tối ưu hoàn tất
        </p>
        <span className="text-[11px] text-teal-700">Đã tạo lịch trình</span>
      </div>
    </div>
  );
}
