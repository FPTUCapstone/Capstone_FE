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
