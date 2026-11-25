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
  /** Temporarily hides the dialog and pauses its focus trap while a follow-up confirmation dialog is open. */
  suspended?: boolean;
  onChoose: (suggestion: ItinerarySuggestionDto) => void;
  onClose: () => void;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: ItinerarySuggestionsDto };

const kmFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

/** Places that would not fit are shown greyed with the reason and cannot be chosen (D6, D11-2).
 * Places that exceed end time remain selectable only when backend reported a known positive overflow
 * so the traveler can confirm the exact extension before saving (ADR 0001). */
function isSelectable(suggestion: ItinerarySuggestionDto): boolean {
  if (suggestion.openAtArrival === false) return false;
  if (suggestion.unfitReason === 'ClosedAtArrival') return false;
  if (suggestion.unfitReason === 'Inactive' || suggestion.unfitReason === 'NoOpeningHours') return false;
  if (suggestion.unfitReason === 'ExceedsEndTime') {
    return suggestion.overflowMinutes !== null && suggestion.overflowMinutes > 0;
  }
  if (suggestion.fitsItinerary === false) return false;
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
  suspended = false,
  onChoose,
  onClose,
}: ItinerarySuggestionsDialogProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [openReviewsFor, setOpenReviewsFor] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useDialogFocus(dialogRef, closeRef, onClose, suspended);

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
    <div
      className={
        suspended
          ? 'hidden'
          : 'fixed inset-0 z-50 flex items-end justify-center bg-[#1C2928]/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4'
      }
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="suggestions-title"
        className="flex max-h-[88vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-2xl border border-[#DCE2DD] bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#EDEAE1] px-6 py-4">
          <div className="min-w-0">
            <h2 id="suggestions-title" className="text-base font-bold leading-snug text-[#1C2928]">
              {title}
            </h2>
            {state.status === 'ready' && (
              <p className="mt-0.5 text-xs text-[#5B6E69]">
                Gợi ý trong bán kính {kmFormat.format(state.data.searchRadiusKm)} km theo giờ mở cửa và lộ trình hiện tại
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-1 -mt-0.5 rounded-lg p-1.5 text-[#5B6E69] transition hover:bg-[#F7F5EF] hover:text-[#1C2928]"
          >
            <span className="sr-only">Đóng</span>
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-2">
          {state.status === 'loading' && (
            <p className="py-8 text-center text-sm text-[#5B6E69]" aria-busy="true">
              Đang tìm địa điểm phù hợp với lịch trình…
            </p>
          )}

          {state.status === 'error' && (
            <div className="py-8 text-center text-sm text-[#5B6E69]">
              <p>{state.message}</p>
              <button
                type="button"
                onClick={() => {
                  setState({ status: 'loading' });
                  setAttempt((value) => value + 1);
                }}
                className="mt-3 rounded-xl bg-[#174B4A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#103B39]"
              >
                Thử lại
              </button>
            </div>
          )}

          {state.status === 'ready' && state.data.items.length === 0 && (
            <p className="py-8 text-center text-sm text-[#5B6E69]">
              Không có điểm phù hợp trong {kmFormat.format(state.data.searchRadiusKm)} km ·{' '}
              <Link href={ROUTES.plan} className="font-semibold text-[#174B4A] hover:underline">
                Mở rộng bán kính
              </Link>
            </p>
          )}

          {state.status === 'ready' && state.data.items.length > 0 && (
            <ul className="divide-y divide-[#EDEAE1]">
              {state.data.items.map((suggestion) => {
                const selectable = isSelectable(suggestion);
                const isOvertime = suggestion.unfitReason === 'ExceedsEndTime';
                const reason = selectable
                  ? (isOvertime ? unfitReasonLabel(suggestion, nameOf) : null)
                  : suggestion.fitsItinerary === false || isOvertime
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
                    className={`py-4 ${selectable ? '' : 'opacity-55'}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        {thumbnail && (
                          <img
                            src={thumbnail}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-xl border border-[#EDEAE1] object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-[14.5px] font-semibold text-[#1C2928]">{suggestion.name}</p>
                            {selectable && !isOvertime && suggestion.fitsItinerary === true && (
                              <span className="text-xs font-medium text-[#174B4A]">Vừa lịch trình</span>
                            )}
                            {reason && (
                              <span
                                className={
                                  selectable && isOvertime
                                    ? 'rounded-md bg-[#FEF3E2] px-2 py-0.5 text-[11px] font-semibold text-[#995436]'
                                    : 'text-xs font-medium text-rose-700'
                                }
                              >
                                {reason}
                              </span>
                            )}
                          </div>
                          {suggestion.address && (
                            <p className="mt-0.5 truncate text-[12.5px] text-[#5B6E69]">{suggestion.address}</p>
                          )}
                          <p className="mt-1.5 text-xs font-semibold text-[#1C2928]">
                            {formatPriceLabel(suggestion.estimatedCost, suggestion.costKind)}
                          </p>
                          {facts.length > 0 && (
                            <p className="mt-0.5 text-xs text-[#5B6E69]">{facts.join(' · ')}</p>
                          )}
                          {suggestion.fitsItinerary === null && (
                            <p className="mt-0.5 text-xs text-[#5B6E69]">
                              Chưa kiểm tra được độ phù hợp do dịch vụ chỉ đường đang gián đoạn.
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
                                  className="font-semibold text-[#174B4A] hover:underline"
                                >
                                  {openReviewsFor === suggestion.poiId ? 'Ẩn đánh giá' : 'Xem đánh giá'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Chọn ${suggestion.name}`}
                        disabled={!selectable}
                        onClick={() => onChoose(suggestion)}
                        className="w-[74px] shrink-0 rounded-xl bg-[#174B4A] py-2 text-center text-xs font-semibold text-white transition hover:bg-[#103B39] disabled:cursor-not-allowed disabled:bg-[#E4E0D5] disabled:text-[#5B6E69]"
                      >
                        Chọn
                      </button>
                    </div>
                    {openReviewsFor === suggestion.poiId && (
                      <div className="mt-3 border-t border-[#EDEAE1] pt-3">
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
