'use client';

import {
  ItineraryDetailDto,
  ItineraryDetailItemDto,
  SchedulingResponseDto,
} from '../types/schedulingTypes';
import { formatVnd } from '@/lib/priceLabel';

import { describeProvenance, splitItineraryCosts } from '../utils/itineraryPresentation';

interface ItinerarySummaryCardsProps {
  itinerary: ItineraryDetailDto | SchedulingResponseDto;
}

export function ItinerarySummaryCards({ itinerary }: ItinerarySummaryCardsProps) {
  const scheduleSource = describeProvenance(itinerary.provenance);
  const visitCount = itinerary.items.filter(
    (i) => (('kind' in i ? i.kind : (i as { itemKind: string }).itemKind) === 'Visit'),
  ).length;
  const restCount = itinerary.items.filter(
    (i) => (('kind' in i ? i.kind : (i as { itemKind: string }).itemKind) === 'Rest'),
  ).length;

  const costs = splitItineraryCosts(
    itinerary.items.map((i) => ({
      kind: ('kind' in i ? i.kind : i.itemKind) as ItineraryDetailItemDto['kind'],
      poiId: i.poiId,
      estimatedCost: i.estimatedCost,
      costKind: i.costKind,
    })),
  );

  // The request budget is only on the detail response (§3.1); null = no budget given.
  const budgetVnd = 'budgetVnd' in itinerary ? itinerary.budgetVnd ?? null : null;

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
          <span className="material-symbols-outlined text-lg text-[#103B39]">
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

      {/* Stat 2: Expected cost per person, split by costKind (Review 2, D11-7) */}
      <div
        data-testid="cost-split"
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
      >
        <div className="flex items-center gap-2 text-slate-500">
          <span className="material-symbols-outlined text-lg text-emerald-600">
            payments
          </span>
          <span className="text-xs font-bold">Chi phí dự kiến / người</span>
        </div>
        <dl className="mt-2 space-y-0.5 text-xs text-slate-600">
          <div className="flex justify-between gap-2">
            <dt>Vé</dt>
            <dd className="font-semibold text-slate-800">{formatVnd(costs.tickets)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Ăn uống</dt>
            <dd className="font-semibold text-slate-800">{formatVnd(costs.food)}</dd>
          </div>
          <div className="flex justify-between gap-2 border-t border-slate-100 pt-0.5">
            <dt className="font-bold text-slate-900">{budgetVnd !== null ? 'Tổng / ngân sách' : 'Tổng'}</dt>
            <dd className="font-black text-slate-900">
              {formatVnd(costs.total)}
              {budgetVnd !== null && ` / ${formatVnd(budgetVnd)}`}
            </dd>
          </div>
        </dl>
        {costs.unknownCount > 0 && (
          <span className="text-[11px] text-slate-500">
            {costs.unknownCount} điểm chưa có thông tin giá
          </span>
        )}
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

      {/* Stat 4: where the schedule came from (ADR-002, G3) */}
      <div data-testid="schedule-source" className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 shadow-2xs">
        <div className="flex items-center gap-2 text-teal-800">
          <span className="material-symbols-outlined text-lg text-[#103B39]">
            auto_awesome
          </span>
          <span className="text-xs font-bold">Nguồn lịch trình</span>
        </div>
        <p className="mt-2 text-base font-black text-[#103B39] sm:text-lg">
          {scheduleSource?.label ?? 'Chưa ghi nhận'}
        </p>
        <span className="text-[11px] text-teal-700">
          {scheduleSource?.detail ?? 'Lịch tạo trước khi TripMate ghi nguồn gốc'}
        </span>
      </div>
    </div>
  );
}
