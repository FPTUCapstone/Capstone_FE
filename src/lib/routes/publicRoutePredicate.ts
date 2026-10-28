/**
 * Pure predicate to determine whether a given URL pathname belongs to an authorized
 * public traveler route that should display the persistent shared PublicNavigation header.
 *
 * Architecture: STRICT POSITIVE WHITELIST with segment-level boundary matching.
 *
 * Authorized Public Surfaces:
 * - Home: `/`
 * - Tours: `/tours`, `/tours/:id`, `/tours/:id/book`, etc.
 * - Points of Interest: `/pois`, `/pois/:id`, etc.
 * - Scheduling & Itinerary: `/plan`, `/itineraries`, `/itinerary/:id`, etc.
 * - Traveler Account: `/account`, `/account/*` (/account/profile, /account/preferences,
 *                     /account/security, /account/trips, /account/trips/:id/review,
 *                     /account/reviews/:kind/:id)
 * - Trips & Reviews direct routes: `/trips`, `/trips/*`, `/reviews`, `/reviews/*`
 * - Bookings & Checkout: `/bookings/*` (/bookings/:id/ticket, /bookings/:id/pay),
 *                        `/checkout/*` (/checkout/result, /checkout/mock)
 *
 * Excluded / Non-Public Surfaces (returns false):
 * - Standalone split-screen auth: `/sign-in`, `/register`, `/forgot-password`, `/verify-account`, `/verify-email`
 * - Administrator workspace: `/admin`, `/admin/*`
 * - Partner / Tour Operator workspace: `/partner`, `/partner/*` (e.g. `/partner/bookings`)
 * - Developer-only test routes: `/dev`, `/dev/*`
 * - Backend / BFF API routes: `/api`, `/api/*`
 * - Unknown / 404 routes: `/random-unsupported-path`, etc.
 */

const PUBLIC_WHITELIST_PATTERNS: RegExp[] = [
  /^\/$/,                                // Home
  /^\/tours(?:\/.*)?$/,                  // Explore Tours & Detail & Book
  /^\/pois(?:\/.*)?$/,                   // Explore POIs & Detail
  /^\/plan(?:\/.*)?$/,                   // Smart Scheduling Request
  /^\/itineraries(?:\/.*)?$/,            // My Itineraries List
  /^\/itinerary(?:\/.*)?$/,              // Suggested Itinerary Detail
  /^\/account(?:\/.*)?$/,                // Traveler Account & Subroutes
  /^\/trips(?:\/.*)?$/,                  // Direct Trips Routes
  /^\/reviews(?:\/.*)?$/,                // Direct Reviews Routes
  /^\/bookings(?:\/.*)?$/,               // Booking Ticket Viewer & Payment Handoff
  /^\/checkout(?:\/.*)?$/,               // Checkout Result & Mock Checkout
];

export function isPublicNavigationRoute(pathname: string | null | undefined): boolean {
  if (!pathname || typeof pathname !== 'string') return false;

  const trimmed = pathname.trim();
  if (!trimmed) return false;

  // Normalize path by stripping trailing slashes (except root '/')
  const normalized = trimmed.replace(/\/+$/, '') || '/';

  return PUBLIC_WHITELIST_PATTERNS.some((pattern) => pattern.test(normalized));
}
