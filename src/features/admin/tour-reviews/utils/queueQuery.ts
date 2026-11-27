import { ROUTES } from '@/lib/routes';

import type { TourQueueQuery } from '../types';

const MAX_KEYWORD_LENGTH = 100;

interface ReadableSearchParams {
  get(name: string): string | null;
}

/** Reads the applied queue state from the URL so it survives a round trip to the detail screen (CR-01). */
export function parseTourQueueQuery(searchParams: ReadableSearchParams): TourQueueQuery {
  const rawPage = Number(searchParams.get('page'));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const keyword = (searchParams.get('q') ?? '').trim().slice(0, MAX_KEYWORD_LENGTH);
  return { page, keyword };
}

function toQueryString(query: TourQueueQuery, demo: boolean): string {
  const params = new URLSearchParams();
  if (demo) params.set('demo', '1');
  if (query.page > 1) params.set('page', String(query.page));
  if (query.keyword) params.set('q', query.keyword);
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function buildTourQueueHref(query: TourQueueQuery, demo: boolean): string {
  return `${ROUTES.admin.tourReviews}${toQueryString(query, demo)}`;
}

export function buildTourDetailHref(id: string, query: TourQueueQuery, demo: boolean): string {
  return `${ROUTES.admin.tourReview(encodeURIComponent(id))}${toQueryString(query, demo)}`;
}

/**
 * TM-82 §5.6: a `DraftVersion` queue row links to the same detail route, with `kind=draft-change`
 * added so the detail screen knows to load the pending-change/diff view instead of the existing
 * first-time-submission one. A `NewSubmission` row never carries this param, so its href and
 * behavior stay provably unchanged.
 */
export function buildDraftVersionDetailHref(pendingChangeId: number, query: TourQueueQuery, demo: boolean): string {
  const base = buildTourDetailHref(String(pendingChangeId), query, demo);
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}kind=draft-change`;
}
