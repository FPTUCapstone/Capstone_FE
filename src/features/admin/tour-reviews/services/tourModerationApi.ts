import type { ReviewCriterionKey, TourQueueQuery } from '../types';

/** One pending-queue row as served by the Backend (UC-60 Screen 13). */
export interface QueueTour {
  readonly id: string;
  readonly tourName: string;
  readonly operatorName: string;
  readonly location: string;
  readonly category: string | null;
  readonly submittedAtUtc: string;
  readonly departureAtUtc: string | null;
  readonly priceVnd: number;
  readonly durationDays: number;
  readonly capacity: number | null;
  readonly imageCount: number;
}

export interface PendingTourPage {
  readonly items: readonly QueueTour[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

export interface CancellationRule {
  readonly daysBeforeDeparture: number;
  readonly feePercent: number;
}

export interface TourSchedule {
  readonly startAtUtc: string;
  readonly endAtUtc: string;
  readonly meetingPoint: string | null;
  readonly capacity: number;
  readonly adultPrice: number | null;
  readonly childPrice: number | null;
  readonly infantPrice: number | null;
}

export interface ItineraryStop {
  readonly dayNo: number;
  readonly sequenceNo: number;
  readonly poiName: string;
  /** HH:mm, or null when the operator gave no planned time. */
  readonly plannedTime: string | null;
  readonly stayMinutes: number;
  readonly notes: string | null;
}

export interface TourImage {
  readonly url: string;
  readonly altText: string;
  readonly caption: string | null;
  readonly isPrimary: boolean;
}

/** Everything Staff need to fill the five-item checklist (UC-60 Screen 14). */
export interface TourReviewDetail extends QueueTour {
  readonly overview: string | null;
  readonly highlights: string | null;
  readonly includedServices: readonly string[];
  readonly excludedServices: readonly string[];
  readonly travellerRequirements: string | null;
  readonly cancellationRules: readonly CancellationRule[];
  readonly schedules: readonly TourSchedule[];
  readonly itinerary: readonly ItineraryStop[];
  readonly images: readonly TourImage[];
}

export type ReviewChecklist = Readonly<Record<ReviewCriterionKey, boolean>>;

/** One pending write request (approve or reject); resolves when the backend has recorded the decision. */
export type DecisionSender = () => Promise<void>;

/** status 0 = network failure or an unreadable/invalid response. */
export class ModerationApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly title?: string,
    public readonly errorCode?: string,
  ) {
    super(title ?? 'The tour moderation request failed.');
    this.name = 'ModerationApiError';
  }
}

const POSITIVE_INTEGER = /^[1-9]\d*$/;
const SAFE_ERROR_CODE = /^[a-z0-9._-]{1,100}$/i;

function invalid(): never {
  throw new ModerationApiError(0, 'The tour moderation service returned an unexpected response.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : invalid();
}

function textOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? value : invalid();
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : invalid();
}

function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return num(value);
}

function list(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : invalid();
}

function record(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : invalid();
}

function parseQueueTour(raw: unknown): QueueTour {
  const row = record(raw);
  const id = num(row.tourId);
  if (!Number.isSafeInteger(id) || id <= 0) invalid();
  return {
    id: String(id),
    tourName: text(row.tourName),
    operatorName: text(row.operatorName),
    location: text(row.location),
    category: textOrNull(row.category),
    submittedAtUtc: text(row.submittedAtUtc),
    departureAtUtc: textOrNull(row.nextDepartureAtUtc),
    priceVnd: num(row.priceVnd),
    durationDays: num(row.durationDays),
    capacity: numOrNull(row.nextDepartureCapacity),
    imageCount: num(row.imageCount),
  };
}

export function parsePendingTourPage(payload: unknown): PendingTourPage {
  const body = record(payload);
  return {
    items: list(body.items).map(parseQueueTour),
    totalCount: num(body.totalCount),
    page: num(body.pageNumber),
    pageSize: num(body.pageSize),
    totalPages: num(body.totalPages),
  };
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function parseTourReview(payload: unknown): TourReviewDetail {
  const body = record(payload);
  return {
    ...parseQueueTour(body),
    overview: textOrNull(body.overview),
    highlights: textOrNull(body.highlights),
    includedServices: list(body.includedServices).map(text),
    excludedServices: list(body.excludedServices).map(text),
    travellerRequirements: textOrNull(body.travellerRequirements),
    cancellationRules: list(body.cancellationPolicy).map((item) => {
      const rule = record(item);
      return { daysBeforeDeparture: num(rule.daysBeforeDeparture), feePercent: num(rule.feePercent) };
    }),
    schedules: list(body.schedules).map((item) => {
      const schedule = record(item);
      return {
        startAtUtc: text(schedule.startAtUtc),
        endAtUtc: text(schedule.endAtUtc),
        meetingPoint: textOrNull(schedule.meetingPoint),
        capacity: num(schedule.capacity),
        adultPrice: numOrNull(schedule.adultPrice),
        childPrice: numOrNull(schedule.childPrice),
        infantPrice: numOrNull(schedule.infantPrice),
      };
    }),
    itinerary: list(body.itinerary).map((item) => {
      const stop = record(item);
      const planned = textOrNull(stop.plannedTime);
      return {
        dayNo: num(stop.dayNo),
        sequenceNo: num(stop.sequenceNo),
        poiName: text(stop.poiName),
        plannedTime: planned === null ? null : planned.slice(0, 5),
        stayMinutes: num(stop.stayMinutes),
        notes: textOrNull(stop.notes),
      };
    }),
    // Only https images are ever handed to the browser; anything else is dropped, not rendered.
    images: list(body.images)
      .map((item) => {
        const image = record(item);
        return {
          url: text(image.url),
          altText: text(image.altText),
          caption: textOrNull(image.caption),
          isPrimary: image.isPrimary === true,
        };
      })
      .filter((image) => isHttpsUrl(image.url)),
  };
}

async function requestJson(url: string, init: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: 'same-origin',
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ModerationApiError(0);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const problem = isRecord(body) ? body : {};
    const title = typeof problem.title === 'string' && problem.title.length <= 500 ? problem.title : undefined;
    const errorCode =
      typeof problem.errorCode === 'string' && SAFE_ERROR_CODE.test(problem.errorCode) ? problem.errorCode : undefined;
    throw new ModerationApiError(response.status, title, errorCode);
  }
  return body;
}

function requireTourId(id: string): string {
  if (!POSITIVE_INTEGER.test(id)) throw new ModerationApiError(400, 'A valid tour ID is required.');
  return id;
}

export async function fetchPendingTourPage(query: TourQueueQuery, signal?: AbortSignal): Promise<PendingTourPage> {
  const params = new URLSearchParams();
  if (query.page > 1) params.set('pageNumber', String(query.page));
  const keyword = query.keyword.trim();
  if (keyword) params.set('keyword', keyword);
  const qs = params.toString();
  return parsePendingTourPage(await requestJson(`/api/admin/tours/pending${qs ? `?${qs}` : ''}`, { method: 'GET', signal }));
}

export async function fetchTourReview(id: string, signal?: AbortSignal): Promise<TourReviewDetail> {
  return parseTourReview(await requestJson(`/api/admin/tours/${requireTourId(id)}/review`, { method: 'GET', signal }));
}

export async function submitApproval(
  id: string,
  checklist: ReviewChecklist,
  note: string,
  signal?: AbortSignal,
): Promise<void> {
  const trimmed = note.trim();
  await requestJson(`/api/admin/tours/${requireTourId(id)}/approve`, {
    method: 'POST',
    body: JSON.stringify(trimmed ? { checklist, note: trimmed } : { checklist }),
    signal,
  });
}

export async function submitRejection(id: string, reason: string, signal?: AbortSignal): Promise<void> {
  await requestJson(`/api/admin/tours/${requireTourId(id)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason.trim() }),
    signal,
  });
}
