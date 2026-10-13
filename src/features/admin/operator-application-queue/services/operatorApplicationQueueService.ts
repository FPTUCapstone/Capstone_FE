import { DEMO_PENDING_OPERATOR_APPLICATIONS } from '../demo/demoOperatorApplicationFixtures';
import type { OperatorApplicationQueueQuery, PendingOperatorApplicationsResult } from '../types';

/** CR-01: list screens paginate at 20 records per page by default. */
export const OPERATOR_APPLICATION_PAGE_SIZE = 20;

interface QueueSourceOptions {
  /** True only when the caller already passed the demo gate. */
  readonly demo: boolean;
}

/**
 * Pending Tour Operator applications (Screen #10).
 *
 * Capstone_BE exposes no list endpoint yet (PENDING_BE_INTEGRATION), so production returns a
 * truthful NO_BACKEND result and never reads fixtures. Demo mode pages over local fixtures.
 */
export function getPendingOperatorApplications(
  query: OperatorApplicationQueueQuery,
  options: QueueSourceOptions,
): PendingOperatorApplicationsResult {
  if (!options.demo) return { status: 'NO_BACKEND' };

  const keyword = query.keyword.trim().toLowerCase();
  const matches = keyword
    ? DEMO_PENDING_OPERATOR_APPLICATIONS.filter(
        (application) =>
          application.companyName.toLowerCase().includes(keyword) ||
          application.taxCode.toLowerCase().includes(keyword) ||
          application.businessLicenseNumber.toLowerCase().includes(keyword),
      )
    : DEMO_PENDING_OPERATOR_APPLICATIONS;
  const totalCount = matches.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / OPERATOR_APPLICATION_PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * OPERATOR_APPLICATION_PAGE_SIZE;

  return {
    status: 'DEMO',
    items: matches.slice(start, start + OPERATOR_APPLICATION_PAGE_SIZE),
    totalCount,
    page,
    pageSize: OPERATOR_APPLICATION_PAGE_SIZE,
    totalPages,
  };
}
