/**
 * Operator Tour Lifecycle route paths.
 * Isolated to prevent collision with unmerged PR #48.
 */
export const OPERATOR_TOUR_ROUTES = {
  list: '/partner/tours',
  create: '/partner/tours/new',
  edit: (id: string | number) => `/partner/tours/${encodeURIComponent(id)}/edit`,
  submit: (id: string | number) => `/partner/tours/${encodeURIComponent(id)}/submit`,
} as const;
