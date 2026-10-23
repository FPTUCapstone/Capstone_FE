# UC-32 Trip History — Web integration spec

## 1. Document control

| Field | Value |
| --- | --- |
| Use case | UC-32 View Trip History (Report 3 §3.7.1), Traveler, `SHARED_WEB_MOBILE` (`docs/WEB_SCOPE_MATRIX.md` row UC-32) |
| Status | **Approved 2026-10-22.** Detailed plan: `plans/UC-32-trip-history-web-plan.md` (awaiting approval). |
| Date | 2026-10-22 |
| Baseline | `develop` @ `a6ca6c2` |
| Branch | `feat/uc32-trip-history-integration` |
| Backend contract | `Capstone_BE/docs/TM-78-api-contract.md` (BE PR #105, `feature/tm-78-trip-history`) |
| Out of this task | Capstone_Mobile (done after the Web), BE changes |

## 2. Goal

Replace the `PENDING_BE_INTEGRATION` stub behind `/account/trips` with the real TM-78 API, and make the
screen show only what that contract returns. Production must fail safely when the backend is unavailable and
never show fabricated data (`docs/FRONTEND_ENGINEERING_CONVENTION.md` §API rule 10).

## 3. Current state (verified)

- `/account/trips` already renders `TripHistoryPage` → `TripHistoryView` → `TripCard`, with tabs, filters,
  summary banner, pagination and tests.
- `app/api/v1/traveler/trips/route.ts` and `[tripId]/route.ts` call `handleTravelerTripListBffRequest` /
  `handleTravelerTripDetailBffRequest`, which return `501 PENDING_BE_INTEGRATION` without calling the backend.
- The client `tripHistoryApi.ts` sends `status=`, `query=`, a bare `tripId`, and reads `data.trips`.
- Demo fixtures (`?demo=1`, `NEXT_PUBLIC_ENABLE_DEMO_FIXTURES`, never in production) feed the same shapes.
- Canonical review (TM-79) already exists at `/account/reviews/[kind]/[id]`; the old `/account/trips/[id]/review`
  page keyed by a bare `tripId` and its `POST /api/v1/reviews` stub are a separate, older stack.

## 4. Gaps between the screen and the contract

| Screen today | TM-78 contract | Resolution |
| --- | --- | --- |
| response `trips[]`, query `status` | `items[]`, query `tab` | map to the contract |
| record id `tripId` (bare) | `kind` + `id` pair | key and links use the pair |
| detail `/trips/{tripId}` | `/trips/{kind}/{id}` | new route handler; old `[tripId]` handler removed |
| free-text search box | no search parameter | **remove** (decision) |
| cover image, operator name, distance, duration, stops summary, member count, rerouted flag, payment method, participants summary | not returned | **remove from UI and types** (decision) |
| summary distance, CSP match rate, average rating | only `totalCompletedTrips`, `totalVisitedPois` | keep those two |
| `ROUTES.tour(tourId)` link, `tourId`/`scheduleId` | not returned | remove the link |
| submitted-review modal with comment | list has `review.exists/rating` only | **link to canonical review** (decision) |
| `isReviewed`, `rating`, `reviewComment` | `review` object | read `review.exists` and `review.rating` |
| refund fields on the card | list has `actions.canViewRefund` only | refund shown in the detail dialog |
| 501 pending state | real errors | remove the pending state; map errors below |
| `ticketId` | `actions.ticketId` | unchanged use: `ROUTES.bookingTicket(ticketId)` |

## 5. Scope

### In scope
1. **Server proxy** (`src/features/trips/services/`, `server-only`): `GET /api/v1/traveler/trips` and
   `GET /api/v1/traveler/trips/{kind}/{id}` forward to the backend with the Traveler access token obtained from
   the `tripmate_refresh` cookie (same mechanism as the tour-booking and canonical-review proxies). The proxy
   - allow-lists query parameters and validates `kind` and a positive int64 `id` before any upstream call;
   - parses the upstream JSON with `lossless-json` so ids stay exact strings, validates the shape, drops unknown
     fields, and answers `502 trip_history.invalid_response` for a malformed body;
   - never forwards raw upstream error bodies: only the `trip_history.*` codes in the contract plus
     `UNAUTHENTICATED`, `FORBIDDEN` and `MSG127` reach the browser;
   - sends `Cache-Control: no-store`.
2. **Types and client service**: rewrite `types/tripHistory.ts` and `services/tripHistoryApi.ts` to the contract
   (`items`, `kind`/`id`, `actions`, `review`, `summary`, detail types); keep the demo gate unchanged.
3. **List UI**: tabs (default Completed), trip-type filter, date range, pagination, summary banner, cards.
   - Date range sends `fromDate`/`toDate` as `yyyy-MM-dd`; a reversed range stays a client-side MSG29, and the
     backend `trip_history.invalid_date_range` is mapped to the same message.
   - Page size 20; the backend caps `page × pageSize` at 1000, so an `invalid_paging` answer is shown as the
     normal error state, not a crash.
   - Dates are shown as `dd/MM/yyyy` in `Asia/Ho_Chi_Minh` (CR-07) from the UTC instants.
4. **Card actions**: booking → View e-ticket (`ROUTES.bookingTicket(ticketId)`), Write / View review
   (`ROUTES.account.bookingReview('commerceBooking', id)`), View refund and View details (dialog); itinerary →
   Open itinerary (`ROUTES.itinerary(id)`) and View details (dialog). Conditions are kept separate (developer
   decision 2026-10-22): **Write review** only when `actions.canReview === true`; **View review** only when
   `review?.exists === true` (the backend returns `canReview: false` once reviewed). E-ticket needs
   `actions.canViewETicket` and a `ticketId`; View refund needs `actions.canViewRefund`.
5. **Trip detail dialog** on the existing screen (no new route): lazy `GET …/{kind}/{id}` on open, with loading,
   error + retry, focus trap and Escape, reusing the existing modal pattern. Booking: tour, schedule, participants,
   cancellation and refund (status, amount, channel). Itinerary: stops with Reached / Skipped / Pending and times,
   and the session summary. Replaces the refund-only modal.
6. **Demo fixtures** rewritten to the new shapes, still off in production and behind the env flag.
7. **Tests** (behavior-level, transport mocked): proxy, route handlers, client service, list view, card, dialog,
   and removal of obsolete stub tests. Update `docs` with a short `docs/UC32-API-INTEGRATION.md`.

### Out of scope
- Mobile (next), backend changes, service bookings, the old `/account/trips/[id]/review` page, `TripReviewPage`
  and `POST /api/v1/reviews` (left untouched and no longer linked from history), search, cover images.
- Any new route or visual screen beyond the dialog (a new screen would need an approved Web Screen Specification).

## 6. Error and state mapping

| Source | Shown as |
| --- | --- |
| `401` / `UNAUTHENTICATED` | existing sign-in redirect behavior of the page (returnUrl = trips) |
| `403` / `FORBIDDEN`, `trip_history.forbidden` | MSG126 access-denied copy |
| `trip_history.invalid_date_range` | MSG29 |
| `trip_history.invalid_tab`, `invalid_trip_type`, `invalid_paging`, `invalid_record` | generic MSG127 error + retry (a client bug, not user input) |
| `trip_history.record_not_found` (detail) | "trip no longer available" in the dialog |
| network / `5xx` / malformed body | MSG127 + retry |
| `items: []` | empty state (MSG128) with the existing plan/explore links |

## 7. Acceptance criteria

1. Opening `/account/trips` as a Traveler loads real data through the proxy; no request carries a token from the
   browser and no backend URL is exposed to it.
2. Switching tab, trip type, date range or page sends exactly those parameters; the list matches the response
   order and `totalCount` (pages = ceil(totalCount / 20)).
3. A card shows only contract fields; no search box, no placeholder or invented values.
4. Review, e-ticket, refund and itinerary actions appear exactly when the matching `actions` flag / kind allows
   it, and link with `kind` + `id` (or `ticketId`, never the booking id).
5. The detail dialog shows visited locations for a Completed itinerary and refund data for a Cancelled booking,
   and handles loading, error, retry and not-found.
6. Production never falls back to fixtures; with the backend down the page shows the error state.
7. `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` all pass.

## 8. Proposed tasks (detailed plan follows after approval)

| # | Task | Verified by |
| --- | --- | --- |
| 1 | Contract types + strict response parser (`lossless-json`, ids as strings) | unit tests: valid, malformed, extra fields, big ids |
| 2 | Server proxy for list and detail + route handlers; remove the stub handlers | proxy tests: auth, allow-list, error mapping, no-store |
| 3 | Client service `tripHistoryApi.ts` (list, detail, demo gate) | service tests |
| 4 | Fixtures to new shapes | used by tests 5-7 |
| 5 | `TripHistoryView`, filters (remove search), summary banner | view tests |
| 6 | `TripCard` actions and fields | card tests |
| 7 | `TripDetailDialog` replacing the refund modal | dialog tests |
| 8 | Docs, cleanup of obsolete tests, final run of the four checks | `npm test/lint/typecheck/build` |

## 9. Decisions on the open points (2026-10-22)

- **Baseline:** must be green on `develop` @ `a6ca6c2` before Task 1 — it is (§10).
- **Commit trailer:** the same form as the BE commit, `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`
  (the `Codex` trailer in `AGENTS.md` would misstate the author).
- **Automated tests** use mocked transport; the PR must say they do not prove live backend integration.
- **BE availability:** BE PR #105 is not merged; optional manual end-to-end needs the BE branch run locally.

## 10. Baseline on a clean checkout (`develop` @ `a6ca6c2`, 2026-10-22)

First run was red because of the local environment, not `develop`:
`node_modules` lacked `mapbox-gl`, `lenis` and `lossless-json`, and a stale generated `.next/dev/types` referenced
a route that no longer exists. Fixed by `npm ci` (lockfile unchanged) and deleting the git-ignored `.next`.

| Check | Result |
| --- | --- |
| `npm test` | pass: Node 63/63, Vitest 243 files and 2544 tests |
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `git status` | clean apart from the spec and plan files |
