import { DEMO_PENDING_TOUR_POSTS } from '../demo/demoTourModerationFixtures';
import type { PendingTourQueueResult, TourPostDetailResult, TourQueueQuery } from '../types';

/** CR-01: list screens paginate at 20 records per page by default. */
export const TOUR_QUEUE_PAGE_SIZE = 20;

interface ModerationSourceOptions {
  /** True only when the caller already passed the demo gate. */
  readonly demo: boolean;
}

/**
 * Pending tour posts (Screen #13).
 *
 * Capstone_BE exposes no tour moderation contract yet (NO_BACKEND), so production returns a
 * truthful NO_BACKEND result and never reads fixtures. Demo mode pages over local fixtures.
 */
export function getPendingTourPosts(
  query: TourQueueQuery,
  options: ModerationSourceOptions,
): PendingTourQueueResult {
  if (!options.demo) return { status: 'NO_BACKEND' };

  const keyword = query.keyword.trim().toLowerCase();
  const matches = keyword
    ? DEMO_PENDING_TOUR_POSTS.filter(
        (tour) =>
          tour.tourName.toLowerCase().includes(keyword) ||
          tour.operatorName.toLowerCase().includes(keyword),
      )
    : DEMO_PENDING_TOUR_POSTS;
  const totalCount = matches.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / TOUR_QUEUE_PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * TOUR_QUEUE_PAGE_SIZE;

  return {
    status: 'DEMO',
    items: matches.slice(start, start + TOUR_QUEUE_PAGE_SIZE),
    totalCount,
    page,
    pageSize: TOUR_QUEUE_PAGE_SIZE,
    totalPages,
  };
}

/** Tour content and pricing details (Screen #14). Production never resolves fixture records. */
export function getPendingTourPost(id: string, options: ModerationSourceOptions): TourPostDetailResult {
  if (!options.demo) return { status: 'NO_BACKEND' };

  const tour = DEMO_PENDING_TOUR_POSTS.find((candidate) => candidate.id === id);
  return tour ? { status: 'DEMO', tour } : { status: 'NOT_FOUND' };
}
