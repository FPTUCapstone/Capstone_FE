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
    <div className="overflow-hidden rounded-2xl border border-[#DCE2DD] bg-[#DCE2DD]/80 shadow-2xs">
      <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1: Total duration */}
        <div className="bg-white p-4">
          <p className="text-xs font-semibold text-[#5B6E69]">Tổng thời lượng</p>
          <p className="mt-1.5 text-lg font-bold tracking-tight text-[#1C2928] sm:text-xl">
            {durationText}
          </p>
          <p className="mt-1 text-[11px] text-[#5B6E69]">
            {itinerary.totalDurationMinutes} phút hoạt động
          </p>
        </div>

        {/* Stat 2: Expected cost per person, split by costKind (Review 2, D11-7) */}
        <div data-testid="cost-split" className="bg-white p-4">
          <p className="text-xs font-semibold text-[#5B6E69]">Chi phí dự kiến / người</p>
          <p className="mt-1.5 text-lg font-bold tracking-tight text-[#1C2928] sm:text-xl">
            {formatVnd(costs.total)}
            {budgetVnd !== null && (
              <span className="text-xs font-semibold text-[#5B6E69]"> / {formatVnd(budgetVnd)}</span>
            )}
          </p>
          <dl className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#5B6E69]">
            <div className="flex items-center gap-1">
              <dt>Vé</dt>
              <dd className="font-semibold text-[#1C2928]">{formatVnd(costs.tickets)}</dd>
            </div>
            <span aria-hidden="true" className="text-[#DCE2DD]">•</span>
            <div className="flex items-center gap-1">
              <dt>Ăn uống</dt>
              <dd className="font-semibold text-[#1C2928]">{formatVnd(costs.food)}</dd>
            </div>
          </dl>
          <p className="mt-0.5 text-[11px] text-[#5B6E69]">
            <span>{budgetVnd !== null ? 'Tổng / ngân sách' : 'Tổng'}</span>
            {costs.unknownCount > 0 && (
              <span> · {costs.unknownCount} điểm chưa có thông tin giá</span>
            )}
          </p>
        </div>

        {/* Stat 3: Stops count */}
        <div className="bg-white p-4">
          <p className="text-xs font-semibold text-[#5B6E69]">Số điểm dừng</p>
          <p className="mt-1.5 text-lg font-bold tracking-tight text-[#1C2928] sm:text-xl">
            {itinerary.items.length} điểm
          </p>
          <p className="mt-1 text-[11px] text-[#5B6E69]">
            {visitCount} tham quan • {restCount} dừng nghỉ
          </p>
        </div>

        {/* Stat 4: where the schedule came from (ADR-002, G3) */}
        <div data-testid="schedule-source" className="bg-[#E8F0EA]/45 p-4">
          <p className="text-xs font-semibold text-[#174B4A]">Nguồn lịch trình</p>
          <p className="mt-1.5 text-base font-bold leading-snug text-[#174B4A] sm:text-lg">
            {scheduleSource?.label ?? 'Chưa ghi nhận'}
          </p>
          <p className="mt-1 text-[11px] text-[#5B6E69]">
            {scheduleSource?.detail ?? 'Lịch tạo trước khi TripMate ghi nguồn gốc'}
          </p>
        </div>
      </div>
    </div>
  );
}
