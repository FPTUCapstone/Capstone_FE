'use client';

/* eslint-disable @next/next/no-img-element -- catalogue thumbnails come from the API. */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { TripadvisorAttribution, TripadvisorReviews } from '@/features/public/pois/externalReviews';
import { formatPriceLabel } from '@/lib/priceLabel';
import { ROUTES } from '@/lib/routes';
import { safeHttpsUrl } from '@/lib/safeUrl';

import { getItinerarySuggestions } from '../services/schedulingApi';
import {
  formatVietnamTime,
  ItinerarySuggestionDto,
  ItinerarySuggestionsDto,
  SuggestionQuery,
} from '../types/schedulingTypes';
import {
  formatLegDistance,
  formatMinutes,
  PoiNameLookup,
  unfitReasonLabel,
} from '../utils/itineraryPresentation';
import { useDialogFocus } from './useDialogFocus';

interface ItinerarySuggestionsDialogProps {
  itineraryId: number;
  query: SuggestionQuery;
  title: string;
  /** Names of stops already in the itinerary (for "makes X close before arrival"). */
  nameOf: PoiNameLookup;
  onChoose: (suggestion: ItinerarySuggestionDto) => void;
  onClose: () => void;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: ItinerarySuggestionsDto };

const kmFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

/** Places that would not fit are shown greyed with the reason and cannot be chosen (D6, D11-2).
 * Places that exceed end time remain selectable with an informative warning (ADR 0001). */
function isSelectable(suggestion: ItinerarySuggestionDto): boolean {
  if (suggestion.openAtArrival === false) return false;
  if (suggestion.unfitReason === 'ClosedAtArrival') return false;
  if (suggestion.unfitReason === 'Inactive' || suggestion.unfitReason === 'NoOpeningHours') return false;
  if (suggestion.fitsItinerary === false && suggestion.unfitReason !== 'ExceedsEndTime') return false;
  return true;
}

function detourLabel(minutes: number | null): string | null {
  if (minutes === null) return null;
  if (minutes > 0) return `dài thêm ${formatMinutes(minutes)}`;
  if (minutes < 0) return `ngắn hơn ${formatMinutes(minutes)}`;
  return 'không làm dài lịch trình';
}

/** Suggestions to add a restaurant or replace a stop (Review 2, §3.5). */
export function ItinerarySuggestionsDialog({
  itineraryId,
  query,
  title,
  nameOf,
  onChoose,
  onClose,
}: ItinerarySuggestionsDialogProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [openReviewsFor, setOpenReviewsFor] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useDialogFocus(dialogRef, closeRef, onClose);

  // The request depends on these primitive values only, not on the identity of `query`.
  const { kind } = query;
  const anchorItemId = query.kind === 'Food' ? query.afterItemId : query.replaceItemId;

  useEffect(() => {
    const controller = new AbortController();
    const request: SuggestionQuery =
      kind === 'Food'
        ? { kind: 'Food', afterItemId: anchorItemId }
        : { kind: 'Replace', replaceItemId: anchorItemId };
    getItinerarySuggestions(itineraryId, request, { signal: controller.signal })
      .then((data) => setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Không tải được gợi ý địa điểm lúc này.',
        });
      });
    return () => controller.abort();
  }, [itineraryId, kind, anchorItemId, attempt]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="suggestions-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 id="suggestions-title" className="text-base font-bold text-slate-900">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {state.status === 'loading' && (
            <p className="py-6 text-center text-sm text-slate-500" aria-busy="true">
              Đang tìm địa điểm phù hợp với lịch trình…
            </p>
          )}

          {state.status === 'error' && (
            <div className="py-6 text-center text-sm text-slate-600">
              <p>{state.message}</p>
              <button
                type="button"
                onClick={() => {
                  setState({ status: 'loading' });
                  setAttempt((value) => value + 1);
                }}
                className="mt-3 rounded-xl bg-[#007d6e] px-4 py-2 text-xs font-bold text-white"
              >
                Thử lại
              </button>
            </div>
          )}

          {state.status === 'ready' && state.data.items.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-600">
              Không có điểm phù hợp trong {kmFormat.format(state.data.searchRadiusKm)} km ·{' '}
              <Link href={ROUTES.plan} className="font-bold text-[#007d6e] hover:underline">
                Mở rộng bán kính
              </Link>
            </p>
          )}

          {state.status === 'ready' && state.data.items.length > 0 && (
            <ul className="space-y-3">
              {state.data.items.map((suggestion) => {
                const selectable = isSelectable(suggestion);
                const isOvertime = suggestion.unfitReason === 'ExceedsEndTime';
                const reason = selectable
                  ? (isOvertime ? unfitReasonLabel(suggestion, nameOf) : null)
                  : suggestion.fitsItinerary === false
                    ? unfitReasonLabel(suggestion, nameOf)
                    : unfitReasonLabel({ ...suggestion, unfitReason: 'ClosedAtArrival', unfitPoiId: suggestion.poiId }, nameOf);
                const thumbnail = safeHttpsUrl(suggestion.thumbnailUrl);
                const distance = formatLegDistance(suggestion.distanceFromPreviousMeters);
                const detour = detourLabel(suggestion.detourMinutes);
                const arrival = suggestion.estimatedArrival ? formatVietnamTime(suggestion.estimatedArrival) : null;
                const facts = [
                  distance
                    ? `${distance} từ điểm trước${suggestion.distanceSource === 'StraightLine' ? ' (đường chim bay)' : ''}`
                    : null,
                  detour,
                  arrival ? `Đến lúc ${arrival}` : null,
                  suggestion.closesAt && selectable ? `Đóng cửa lúc ${suggestion.closesAt}` : null,
                ].filter((fact): fact is string => Boolean(fact));

                return (
                  <li
                    key={suggestion.poiId}
                    data-testid={`suggestion-${suggestion.poiId}`}
                    className={`rounded-xl border p-3 ${
                      selectable
                        ? isOvertime
                          ? 'border-amber-200 bg-amber-50/40'
                          : 'border-slate-200 bg-white'
                        : 'border-slate-100 bg-slate-50 opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {thumbnail && (
                        <img
                          src={thumbnail}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900">{suggestion.name}</p>
                        {suggestion.address && (
                          <p className="truncate text-xs text-slate-500">{suggestion.address}</p>
                        )}
                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {formatPriceLabel(suggestion.estimatedCost, suggestion.costKind)}
                        </p>
                        {facts.length > 0 && <p className="mt-0.5 text-xs text-slate-600">{facts.join(' · ')}</p>}
                        {suggestion.fitsItinerary === null && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            Chưa kiểm tra được độ phù hợp do dịch vụ chỉ đường đang gián đoạn.
                          </p>
                        )}
                        {reason && (
                          <p className={`mt-1 text-xs font-bold ${isOvertime ? 'text-amber-700' : 'text-rose-700'}`}>
                            {reason}
                          </p>
                        )}
                        {suggestion.tripadvisor && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                            <TripadvisorAttribution
                              size="sm"
                              rating={suggestion.tripadvisor.rating}
                              reviewCount={suggestion.tripadvisor.reviewCount}
                            />
                            {/* false = Tripadvisor has nothing recent to read; null/absent = not checked. */}
                            {suggestion.tripadvisor.hasRecentReviews !== false && (
                              <button
                                type="button"
                                aria-label={`Xem đánh giá ${suggestion.name}`}
                                aria-expanded={openReviewsFor === suggestion.poiId}
                                onClick={() =>
                                  setOpenReviewsFor((current) =>
                                    current === suggestion.poiId ? null : suggestion.poiId)
                                }
                                className="font-bold text-[#007d6e] hover:underline"
                              >
                                {openReviewsFor === suggestion.poiId ? 'Ẩn đánh giá' : 'Xem đánh giá'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label={`Chọn ${suggestion.name}`}
                        disabled={!selectable}
                        onClick={() => onChoose(suggestion)}
                        className="shrink-0 rounded-lg bg-[#007d6e] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#006b5f] disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        Chọn
                      </button>
                    </div>
                    {openReviewsFor === suggestion.poiId && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <TripadvisorReviews poiId={suggestion.poiId} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
