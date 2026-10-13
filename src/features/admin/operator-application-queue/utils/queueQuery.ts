import { ROUTES } from '@/lib/routes';

import type { OperatorApplicationQueueQuery } from '../types';

const MAX_KEYWORD_LENGTH = 100;

interface ReadableSearchParams {
  get(name: string): string | null;
}

/** Reads the applied list state from the URL so it survives navigation to Screen #11 and back (CR-01). */
export function parseOperatorApplicationQueueQuery(searchParams: ReadableSearchParams): OperatorApplicationQueueQuery {
  const rawPage = Number(searchParams.get('page'));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const keyword = (searchParams.get('q') ?? '').trim().slice(0, MAX_KEYWORD_LENGTH);
  return { page, keyword };
}

export function buildOperatorApplicationQueueHref(query: OperatorApplicationQueueQuery, demo: boolean): string {
  const params = new URLSearchParams();
  if (demo) params.set('demo', '1');
  if (query.page > 1) params.set('page', String(query.page));
  if (query.keyword) params.set('q', query.keyword);
  const value = params.toString();
  return `${ROUTES.admin.operatorApplications}${value ? `?${value}` : ''}`;
}
