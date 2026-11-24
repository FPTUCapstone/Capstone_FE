'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import {
  formatVietnamDayLabel,
  formatVietnamTime,
  ItineraryDetailItemDto,
  LegTransportMode,
  TransportMode,
  vietnamDayKey,
} from '../types/schedulingTypes';
import {
  arrivalShiftLabel,
  lunchCardAfterIndex,
  MOTORBIKE_ESTIMATE_NOTE,
  stopDisplayName,
  stopExplanation,
} from '../utils/itineraryPresentation';
import { formatPriceLabel } from '@/lib/priceLabel';
import { legIdBetweenItems } from '../utils/mapGeometry';
import { ItineraryLegRow } from './ItineraryLegRow';
import { ItineraryStopMenu, StopMenuAction } from './ItineraryStopMenu';

interface ItineraryTimelineProps {
  items: ItineraryDetailItemDto[];
  /** Trip start (itinerary validFrom): stops on a later day than this carry a day label. */
  tripStart?: string | null;
  /** Trip default mode, used for legs planned before per-leg modes existed. */
  tripTransportMode?: TransportMode | null;
  /** Owner and not navigating: leg and stop edits are offered. */
  editable?: boolean;
  /** An edit is being saved: edit controls are disabled. */
  busy?: boolean;
  /** Arrival shift in minutes per POI after the last edit (Review 2, D11-3). */
  arrivalShifts?: ReadonlyMap<number, number>;
  /** Changes the mode of the leg leaving the visit with this POI. */
  onChangeLegMode?: (fromPoiId: number, mode: LegTransportMode) => void;
  /** Trip end (itinerary validTo), used to decide whether the trip covers lunch. */
  tripEnd?: string | null;
  /** "⋯" menu actions (Review 2, D4/D11-5). */
  onReplaceStop?: (item: ItineraryDetailItemDto) => void;
  onRemoveStop?: (item: ItineraryDetailItemDto) => void;
  onViewReviews?: (item: ItineraryDetailItemDto) => void;
  /** Lunch card / "＋ Thêm quán ăn": suggest restaurants after this item (D11-1). */
  onAddFood?: (afterItem: ItineraryDetailItemDto) => void;
  /** Stop highlighted from the map (and reported back on hover). */
  highlightedItemId?: number | null;
  onHighlightItem?: (itemId: number | null) => void;
  /** Legs (by `legIdBetweenItems`) the map can show: their pill becomes a button. */
  selectableLegIds?: ReadonlySet<string>;
  /** Leg currently shown on its own on the map. */
  selectedLegId?: string | null;
  onSelectLeg?: (legId: string) => void;
}

export function ItineraryTimeline({
  items,
  tripStart,
  tripTransportMode = null,
  editable = false,
  busy = false,
  arrivalShifts,
  onChangeLegMode,
  tripEnd,
  onReplaceStop,
  onRemoveStop,
  onViewReviews,
  onAddFood,
  highlightedItemId = null,
  onHighlightItem,
  selectableLegIds,
  selectedLegId = null,
  onSelectLeg,
}: ItineraryTimelineProps) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-[#DCE2DD] bg-white p-8 text-center text-[#5B6E69] shadow-2xs">
        <p className="text-sm font-medium">Chưa có điểm dừng nào trong lịch trình này.</p>
      </div>
    );
  }

  const formatTime = (isoString?: string): string => formatVietnamTime(isoString);
  // A trip may cross midnight: label each day once when the trip spans several days, counting
  // the start day too (an evening start whose stops all fall on the next morning).
  const spansDays =
    new Set([
      ...(tripStart ? [vietnamDayKey(tripStart)] : []),
      ...items.map((item) => vietnamDayKey(item.plannedArrival)),
    ]).size > 1;

  const legMode = (item: ItineraryDetailItemDto) => item.transportModeFromPrevious ?? tripTransportMode;
  const hasMotorbikeLeg = items.some(
    (item, index) =>
      index > 0 &&
      item.travelDurationFromPreviousMinutes !== null &&
      item.travelDurationFromPreviousMinutes !== undefined &&
      legMode(item) === 'Motorbike',
  );

  const visitCount = items.filter((item) => item.kind === 'Visit' && item.poiId !== null).length;
  const canAddFood = editable && onAddFood !== undefined;
  const lunchAfterIndex = canAddFood ? lunchCardAfterIndex(items, tripStart, tripEnd) : null;
  const lastItem = items[items.length - 1];

  const stopActions = (item: ItineraryDetailItemDto): StopMenuAction[] => {
    if (item.kind !== 'Visit' || item.poiId === null) return [];
    const actions: StopMenuAction[] = [];
    if (editable && onReplaceStop) {
      actions.push({ label: 'Thay địa điểm', onSelect: () => onReplaceStop(item), disabled: busy });
    }
    if (editable && onRemoveStop) {
      actions.push({
        label: 'Bỏ khỏi lịch',
        onSelect: () => onRemoveStop(item),
        // An itinerary keeps at least one visit.
        disabled: busy || visitCount <= 1,
      });
    }
    if (onViewReviews) {
      actions.push({ label: 'Xem đánh giá', onSelect: () => onViewReviews(item) });
    }
    return actions;
  };

  return (
    <div className="relative space-y-5">
      <div className="flex flex-col gap-1 border-b border-[#DCE2DD] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold text-[#1C2928] sm:text-lg">
          Lộ trình tham quan chi tiết ({items.length} điểm dừng)
        </h2>
      </div>

      {hasMotorbikeLeg && (
        <p className="text-xs text-[#5B6E69]">{MOTORBIKE_ESTIMATE_NOTE}</p>
      )}

      <div className="space-y-4">
        {items.map((item, index) => {
          const isRest = (item.kind ?? (item as unknown as { itemKind?: string }).itemKind) === 'Rest';
          const isDining = item.costKind === 'AverageSpend' ||
            Boolean(item.category && /ẩm thực|quán|nhà hàng|food|restaurant|cafe|coffee|ăn uống/i.test(item.category));
          const isRestCard = isRest || isDining;
          const isLast = index === items.length - 1;
          const arrivalTime = formatTime(item.plannedArrival);
          const departureTime = formatTime(item.plannedDeparture);
          const previous = index > 0 ? items[index - 1] : null;
          const previousIsRest = previous
            ? (previous.kind ?? (previous as unknown as { itemKind?: string }).itemKind) === 'Rest'
            : false;
          // A leg can be switched and hinted only when it connects two visit stops (rest stops are auto-generated).
          const isBetweenVisits = previous !== null && !previousIsRest && !isRest;
          const previousVisitPoiId =
            previous && previous.kind === 'Visit' && previous.poiId !== null ? previous.poiId : null;
          const shift = item.poiId !== null ? arrivalShifts?.get(item.poiId) : undefined;
          const startsNewDay =
            spansDays &&
            (index === 0 ||
              vietnamDayKey(items[index - 1].plannedArrival) !==
                vietnamDayKey(item.plannedArrival));
          const badgeLabel = isDining
            ? 'Ăn uống / Nghỉ ngơi'
            : isRest
              ? item.poiId === null
                ? 'Nghỉ tự do — chưa chọn địa điểm'
                : 'Nghỉ ngơi'
              : 'Điểm tham quan';

          return (
            <div
              key={item.itemId || item.sequenceNo || index}
              className="relative"
              data-item-id={item.itemId}
              data-highlighted={highlightedItemId === item.itemId ? 'true' : undefined}
              onMouseEnter={onHighlightItem ? () => onHighlightItem(item.itemId) : undefined}
              onMouseLeave={onHighlightItem ? () => onHighlightItem(null) : undefined}
              onFocus={onHighlightItem ? () => onHighlightItem(item.itemId) : undefined}
              onBlur={onHighlightItem ? () => onHighlightItem(null) : undefined}
            >
              {startsNewDay && (
                <div
                  id={`day-section-${vietnamDayKey(item.plannedArrival)}`}
                  className="relative z-10 mb-3 scroll-mt-28 bg-[#F7F5EF] py-1"
                >
                  <p className="text-sm font-bold capitalize text-[#174B4A]">
                    {formatVietnamDayLabel(item.plannedArrival)}
                  </p>
                </div>
              )}
              {/* Incoming leg from the previous stop (Review 2, D5) */}
              {index > 0 &&
                item.travelDurationFromPreviousMinutes !== null &&
                item.travelDurationFromPreviousMinutes !== undefined && (
                  <ItineraryLegRow
                    fromName={previous ? stopDisplayName(previous) : undefined}
                    toName={stopDisplayName(item)}
                    onSelect={
                      onSelectLeg && previous && selectableLegIds?.has(legIdBetweenItems(previous.itemId, item.itemId))
                        ? () => onSelectLeg(legIdBetweenItems(previous.itemId, item.itemId))
                        : undefined
                    }
                    selected={previous !== null && selectedLegId === legIdBetweenItems(previous.itemId, item.itemId)}
                    minutes={item.travelDurationFromPreviousMinutes}
                    meters={item.travelDistanceFromPreviousMeters}
                    mode={legMode(item)}
                    disabled={busy}
                    showWalkHint={isBetweenVisits}
                    showRail={!startsNewDay}
                    onChangeMode={
                      editable && onChangeLegMode && isBetweenVisits && previousVisitPoiId !== null
                        ? (mode) => onChangeLegMode(previousVisitPoiId, mode)
                        : undefined
                    }
                  />
                )}

              {/* Connecting vertical rail to the next item */}
              {!isLast && (
                <div
                  className={`pointer-events-none absolute left-4 -bottom-4 w-0.5 bg-[#DCE2DD] ${
                    index === 0 ? 'top-8' : startsNewDay ? 'top-12' : 'top-0'
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Stop Card */}
              <div
                className={`relative ml-11 sm:ml-12 rounded-2xl border p-4 shadow-2xs transition sm:p-5 ${
                  highlightedItemId === item.itemId ? 'ring-2 ring-[#174B4A]/45 border-[#174B4A]/50 ' : ''
                }${
                  item.isUnavailable
                    ? 'border-rose-200 bg-rose-50/40'
                    : isRestCard
                    ? 'border-[#D9A986]/60 bg-amber-50/40 hover:border-[#B96D4C]/70'
                    : 'border-[#DCE2DD] bg-white hover:border-[#174B4A]/40'
                }`}
              >
                {/* Upper rail stub into the final stop pin */}
                {isLast && index > 0 && !startsNewDay && (
                  <div
                    className="pointer-events-none absolute -left-7 sm:-left-8 -top-4 h-12 w-0.5 bg-[#DCE2DD]"
                    aria-hidden="true"
                  />
                )}

                {/* Circular numbered pin anchored to the left timeline rail */}
                <div
                  className={`absolute -left-11 sm:-left-12 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs ring-4 ring-[#F7F5EF] ${
                    item.isUnavailable
                      ? 'bg-rose-600'
                      : isRestCard
                      ? 'bg-[#B96D4C]'
                      : 'bg-[#174B4A]'
                  }`}
                >
                  {item.sequenceNo}
                </div>

                {/* Content body */}
                <div className="min-w-0">
                  {/* Top row: Time-first schedule + quiet tags + actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold tabular-nums text-[#1C2928] sm:text-sm">
                        {arrivalTime} - {departureTime}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          isRestCard
                            ? 'bg-[#B96D4C]/15 text-[#995436]'
                            : 'bg-[#E8F0EA] text-[#174B4A]'
                        }`}
                      >
                        {badgeLabel}
                      </span>

                      {item.category && (
                        <span className="inline-flex items-center rounded-full border border-[#DCE2DD]/80 bg-[#F7F5EF] px-2.5 py-0.5 text-[11px] font-medium text-[#5B6E69]">
                          {item.category}
                        </span>
                      )}

                      {item.isMandatory && (
                        <span className="inline-flex items-center rounded-full border border-rose-200/80 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800">
                          Bắt buộc
                        </span>
                      )}

                      {item.isUnavailable && (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800">
                          Tạm ngưng hoạt động
                        </span>
                      )}

                      {shift !== undefined && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                          {arrivalShiftLabel(shift)}
                        </span>
                      )}
                    </div>

                    <ItineraryStopMenu
                      stopName={stopDisplayName(item)}
                      actions={stopActions(item)}
                    />
                  </div>

                  {/* Stop title */}
                  <h3 className="mt-2 text-base font-bold text-[#1C2928] sm:text-[17px]">
                    {item.poiName || 'Điểm dừng chân theo lộ trình'}
                  </h3>

                  {/* Editorial explanation with subtle left accent bar (UC-10) */}
                  {stopExplanation(item) && (
                    <p
                      className={`mt-2 border-l-2 pl-3 text-xs leading-relaxed text-[#5B6E69] sm:text-sm ${
                        isRestCard ? 'border-[#B96D4C]/60' : 'border-[#174B4A]/50'
                      }`}
                    >
                      {stopExplanation(item)}
                    </p>
                  )}

                  {/* Bottom metadata row */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[#DCE2DD]/60 pt-2.5 text-xs text-[#5B6E69]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>
                        Thời gian dừng:{' '}
                        <strong className="font-semibold text-[#1C2928]">
                          {item.stayDurationMinutes} phút
                        </strong>
                      </span>
                      {item.isDurationCompressed && (
                        <span
                          className="inline-flex items-center rounded-full bg-[#E8F0EA] px-2 py-0.5 text-[10px] font-semibold text-[#174B4A]"
                          title="Đã tối ưu thời gian để vừa lịch trình"
                        >
                          Tối ưu lịch trình
                        </span>
                      )}
                    </div>

                    <span aria-hidden="true" className="text-[#DCE2DD]">•</span>

                    <strong className="font-semibold text-[#1C2928]">
                      {formatPriceLabel(item.estimatedCost, item.costKind)}
                    </strong>

                    {/* Link to POI details (UC-12) if poiId exists */}
                    {item.poiId ? (
                      <Link
                        href={ROUTES.poi(item.poiId)}
                        className="ml-auto inline-flex items-center gap-1 font-semibold text-[#174B4A] transition hover:text-[#103B39] hover:underline"
                      >
                        <span>Chi tiết địa điểm</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>

              {lunchAfterIndex === index && onAddFood && (
                <div className="ml-11 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[#B96D4C]/50 bg-[#FEF3E2]/60 px-4 py-3 text-sm text-[#1C2928] sm:ml-12">
                  <span className="font-semibold">🍜 Bữa trưa?</span>
                  <button
                    type="button"
                    onClick={() => onAddFood(item)}
                    disabled={busy}
                    className="rounded-lg bg-[#B96D4C] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#995436] disabled:opacity-60"
                  >
                    Chọn quán
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {canAddFood && lastItem && (
        <button
          type="button"
          onClick={() => onAddFood(lastItem)}
          disabled={busy}
          className="ml-11 w-[calc(100%-2.75rem)] rounded-xl border border-dashed border-[#DCE2DD] bg-white/70 px-4 py-3 text-sm font-semibold text-[#174B4A] transition hover:border-[#174B4A] hover:bg-white disabled:opacity-60 sm:ml-12 sm:w-[calc(100%-3rem)]"
        >
          ＋ Thêm quán ăn
        </button>
      )}
    </div>
  );
}
