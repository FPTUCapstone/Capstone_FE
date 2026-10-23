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
} from '../utils/itineraryPresentation';
import { formatPriceLabel } from '@/lib/priceLabel';
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
}: ItineraryTimelineProps) {
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
    <div className="relative space-y-6">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
          Lộ trình tham quan chi tiết ({items.length} điểm dừng)
        </h2>
        <span className="text-xs text-slate-500">
          Sắp xếp tối ưu bởi thuật toán CSP
        </span>
      </div>

      {hasMotorbikeLeg && (
        <p className="text-xs text-slate-500">{MOTORBIKE_ESTIMATE_NOTE}</p>
      )}

      <div className="space-y-6">
        {items.map((item, index) => {
          const isRest = (item.kind ?? (item as unknown as { itemKind?: string }).itemKind) === 'Rest';
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
                <div id={`day-section-${vietnamDayKey(item.plannedArrival)}`} className="scroll-mt-28 mb-3">
                  <p className="text-sm font-bold capitalize text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-[#007d6e]">event</span>
                    <span>{formatVietnamDayLabel(item.plannedArrival)}</span>
                  </p>
                </div>
              )}
              {/* Incoming leg from the previous stop (Review 2, D5) */}
              {index > 0 &&
                item.travelDurationFromPreviousMinutes !== null &&
                item.travelDurationFromPreviousMinutes !== undefined && (
                  <ItineraryLegRow
                    toName={stopDisplayName(item)}
                    minutes={item.travelDurationFromPreviousMinutes}
                    meters={item.travelDistanceFromPreviousMeters}
                    mode={legMode(item)}
                    disabled={busy}
                    showWalkHint={isBetweenVisits}
                    onChangeMode={
                      editable && onChangeLegMode && isBetweenVisits && previousVisitPoiId !== null
                        ? (mode) => onChangeLegMode(previousVisitPoiId, mode)
                        : undefined
                    }
                  />
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
                  highlightedItemId === item.itemId ? 'ring-2 ring-[#007d6e]/50 ' : ''
                }${
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
                      {(() => {
                        const isDiningRest =
                          isRest &&
                          (item.costKind === 'AverageSpend' ||
                            (Boolean(item.category) &&
                              /ẩm thực|quán|nhà hàng|food|restaurant|cafe|coffee|ăn uống/i.test(item.category!)));
                        const badgeLabel = isRest
                          ? isDiningRest
                            ? 'Nghỉ ngơi / Ẩm thực'
                            : 'Điểm dừng chân tránh nắng'
                          : 'Điểm tham quan';
                        const badgeIcon = isRest ? (isDiningRest ? 'restaurant' : 'beach_access') : 'tour';
                        return (
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              isRest
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-teal-100 text-[#007d6e]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">
                              {badgeIcon}
                            </span>
                            {badgeLabel}
                          </span>
                        );
                      })()}


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
                      {shift !== undefined && (
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-900">
                          {arrivalShiftLabel(shift)}
                        </span>
                      )}
                      <ItineraryStopMenu
                        stopName={stopDisplayName(item)}
                        actions={stopActions(item)}
                      />
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
                      {item.isDurationCompressed && (
                        <span
                          className="ml-1 inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"
                          title="Đã tối ưu thời gian để vừa lịch trình"
                        >
                          <span className="material-symbols-outlined text-xs">auto_fix_high</span>
                          Tối ưu lịch trình
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-slate-400">
                        payments
                      </span>
                      <strong>{formatPriceLabel(item.estimatedCost, item.costKind)}</strong>
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

              {lunchAfterIndex === index && onAddFood && (
                <div className="ml-10 mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3 text-sm text-amber-900 sm:ml-12">
                  <span className="font-bold">🍜 Bữa trưa?</span>
                  <button
                    type="button"
                    onClick={() => onAddFood(item)}
                    disabled={busy}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
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
          className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-[#007d6e] hover:text-[#007d6e] disabled:opacity-60"
        >
          ＋ Thêm quán ăn
        </button>
      )}
    </div>
  );
}
