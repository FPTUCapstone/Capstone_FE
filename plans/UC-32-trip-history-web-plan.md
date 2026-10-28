# UC-32 Trip History — Web integration plan

Spec: `specs/UC-32-trip-history-web-spec.md` (approved 2026-10-22).
Backend contract: `Capstone_BE/docs/TM-78-api-contract.md`.
Branch: `feat/uc32-trip-history-integration` (from `develop` @ `a6ca6c2`).
Status: **Approved 2026-10-22; implemented (Tasks 1–8), see §7.**

## 0. Ground rules

- Test first (red, then minimal code, then refactor). Code written before its test is deleted.
- One task at a time. After each: run its verification, then a two-pass self-review (spec compliance, then code
  quality). A Critical finding blocks the next task.
- Transport is mocked in automated tests; they do not prove backend integration, and the PR says so.
- No new dependency, no global state, no new route besides the two API handlers. `npm` only, lockfile unchanged.
- No commit, push or PR unless the developer asks.
- Commit trailer (decided 2026-10-22): the same form used on the BE commit,
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`, because the repo's `Codex` trailer would misstate
  who wrote the change.
- Card action rules (decided 2026-10-22), kept as separate conditions and separate tests:
  - **Write review** shows only when `actions.canReview === true`.
  - **View review** shows only when `review?.exists === true` (the backend sets `canReview` to false once reviewed).
  - Both link to `ROUTES.account.bookingReview('commerceBooking', reviewableRecord.id)`.

## 1. Clarifications to the approved spec (found while planning)

| # | Finding | Handling |
| --- | --- | --- |
| C1 | The old review stack (`TripReviewPage`, `TripReviewView`, `reviewApi`) imports `TripCardDto`, `getTripById`, `TripApiError`, `MSG127_SYSTEM_ERROR`, `PENDING_BE_INTEGRATION_ERROR_CODE` and `DEMO_TRIP_CARDS` from `features/trips`. | Leave those exports exactly as they are, marked `@deprecated` (legacy review only). The new contract goes into **new files**, so no legacy file or test changes. |
| C2 | Next.js rejects two sibling dynamic folders with different names, so `app/api/v1/traveler/trips/[tripId]` cannot coexist with `[kind]/[id]`. | The legacy `[tripId]` stub handler is removed (spec §4 already listed it). The unlinked legacy review page then gets `404 → "trip not found"` from `getTripById` instead of the pending notice; its demo mode is unaffected. Verified by `next build`'s route table in Task 2. |
| C3 | Spec §6 said a `401` follows the page's sign-in redirect. That redirect is driven by `useWebSession`, not by API errors. | A `401` from the proxy shows the MSG126 access-denied state with retry; session handling stays in `useWebSession`. |
| C4 | `Itinerary` ids and `ticketId` can exceed 2^53 in theory. | Ids are carried as strings end to end (parser uses `lossless-json`), as the canonical review code does. |

## 2. File map

New (all under `src/features/trips/` unless noted):

| File | Purpose |
| --- | --- |
| `types/tripHistoryContract.ts` | Contract types: list item (booking / itinerary), actions, review state, summary, page, detail, error code union |
| `services/tripHistoryResponse.ts` | Strict parser for list and detail bodies (`lossless-json`) |
| `services/tripHistoryProxy.ts` | `server-only` proxy for list and detail |
| `services/tripHistoryClient.ts` | Browser client: `fetchTripHistory`, `fetchTripDetail`, demo gate, error class |
| `data/tripHistoryDemoFixtures.ts` | Demo data in the contract shape (never in production) |
| `utils/formatTripDate.ts` | `dd/MM/yyyy` in `Asia/Ho_Chi_Minh` from a UTC instant |
| `components/TripDetailDialog.tsx` | Detail dialog |
| `app/api/v1/traveler/trips/[kind]/[id]/route.ts` | Detail route handler |
| `docs/UC32-API-INTEGRATION.md` | Integration notes |

Changed: `app/api/v1/traveler/trips/route.ts`, `TripHistoryView.tsx`, `TripCard.tsx`, `TripFiltersBar.tsx`,
`TripSummaryBanner.tsx`, `resources/en.ts` (add keys, drop history-only keys no longer used),
`services/tripReviewBff.ts` (remove list and detail stub handlers; keep the `POST /api/v1/reviews` stub), and their tests.
Removed: `app/api/v1/traveler/trips/[tripId]/route.ts`, `getTripHistory` and its helper from `tripHistoryApi.ts`
(the legacy `getTripById` stays), the list-only types in `types/tripHistory.ts` once unused.

## 3. Tasks

Test commands: `npx vitest run <path>` for one file, `npm exec eslint -- <path>` for lint, `npm run typecheck`.

### Task 1 — Contract types and strict response parser

- **Files:** `types/tripHistoryContract.ts`, `services/tripHistoryResponse.ts`, `services/tripHistoryResponse.test.ts`.
- **Tests first:**
  - a full list page (booking + itinerary, summary on Completed) parses; ids and `ticketId` come out as strings;
    an id above 2^53 stays exact;
  - `summary` absent on other tabs parses to `undefined`;
  - a booking without `bookingCode`, an item with an unknown `kind`, a non-array `items`, a negative `totalCount`,
    a bad date string, `actions` missing a flag, `reviewableRecord` mismatching the item id → rejected;
  - `review` is `{exists:false}` / `{exists:true, reviewId, rating}`; itinerary `review: null`, `reviewableRecord: null`;
  - unknown extra properties are dropped, not passed through;
  - detail: booking (tour, schedule, participants, cancellation, refund with nullable `channel`) and itinerary
    (stops with and without visit data, session) parse; a refund on a non-cancelled booking is still accepted as sent.
- **Code:** types; `parseTripHistoryPage(text)` and `parseTripDetail(text)` throwing a typed `InvalidTripResponseError`.
- **Verify:** `npx vitest run src/features/trips/services/tripHistoryResponse.test.ts`, eslint on both files, `npm run typecheck`.
- **DoD:** no `any`; every contract field in `TM-78-api-contract.md` is covered by a test.

### Task 2 — Server proxy, route handlers, stub removal

- **Files:** `services/tripHistoryProxy.ts` (+ test), `app/api/v1/traveler/trips/route.ts`,
  `app/api/v1/traveler/trips/[kind]/[id]/route.ts` (new), delete `[tripId]/route.ts`, trim `tripReviewBff.ts` and
  `tripReviewBff.test.ts`.
- **Tests first** (`// @vitest-environment node`, mock `next/headers` and `@/lib/server/backend`, as the canonical review proxy test does):
  - no refresh cookie → `401 UNAUTHENTICATED`, backend never called; refresh returns a non-Traveler role → `401`;
  - list forwards `Authorization: Bearer …` and only the allow-listed query keys (`tab`, `tripType`, `fromDate`,
    `toDate`, `page`, `pageSize`), drops others, caps value length, never forwards cookies or other headers;
  - detail rejects unknown `kind`, non-numeric, zero, negative and over-int64 `id` with `400 trip_history.invalid_record`
    before any upstream call; builds `/api/v1/traveler/trips/{kind}/{id}` from validated parts only;
  - upstream `200` with a valid body → `200`, `Cache-Control: no-store`; malformed body → `502 trip_history.invalid_response`;
  - upstream error: `trip_history.*` codes pass through with their status; unknown code or HTML body → `MSG127`;
    `401`→`UNAUTHENTICATED`, `403`→`FORBIDDEN`, `404 record_not_found` kept, `5xx`/network/timeout/`BackendConfigurationError`→`503 MSG127`;
  - no upstream error body, token or backend URL appears in any response;
  - route modules call the proxy (list and detail), and `GET` is the only exported method.
- **Code:** proxy with a local `travelerToken()` following `canonicalReviewProxy` (the same logic already exists in five
  proxies; unifying them is out of scope and noted as debt); handlers with `export const dynamic = 'force-dynamic'`.
- **Verify:** vitest on the two test files; `npm run build` route table must list `/api/v1/traveler/trips` and
  `/api/v1/traveler/trips/[kind]/[id]` and no `[tripId]` (confirms C2).
- **DoD:** the stub list/detail handlers and their tests are gone; the POST reviews stub test still passes.

### Task 3 — Browser client service

- **Files:** `services/tripHistoryClient.ts` (+ test), trim `services/tripHistoryApi.ts` (+ its test).
- **Tests first** (mock `fetch`):
  - list sends `tab`, `tripType` (omitted for `All`), `fromDate`, `toDate`, `page`, `pageSize=20` and no `status`/`query`;
  - returns the parsed page; the trip-type value maps `ALL`→omitted, `TourBooking`, `SelfPlannedItinerary`;
  - `401/403`→ access-denied error (MSG126); `trip_history.invalid_date_range`→MSG29; `record_not_found` (detail)→ not-found;
    other `4xx`, `5xx`, network failure, malformed JSON → MSG127; `AbortSignal` is forwarded and an abort is not reported as an error;
  - demo gate: demo data only when `allowDemo` and non-production and `NEXT_PUBLIC_ENABLE_DEMO_FIXTURES==='true'`;
    in production the demo flag is ignored and `fetch` is called;
  - no fallback to fixtures when `fetch` fails in any mode.
- **Code:** `fetchTripHistory(filter, {allowDemo, signal})`, `fetchTripDetail(kind, id, {allowDemo, signal})`,
  `TripHistoryClientError`; reuse `isTripDemoAllowedInCurrentEnv` from `tripHistoryApi`. Remove `getTripHistory` from
  `tripHistoryApi.ts`; keep `getTripById`, `TripApiError` and constants for the legacy review stack.
- **Verify:** vitest on both files plus `src/features/reviews` tests (must stay green and unchanged); eslint; typecheck.
- **DoD:** no legacy review file or test was edited.

### Task 4 — Demo fixtures and date utility

- **Files:** `data/tripHistoryDemoFixtures.ts`, `utils/formatTripDate.ts` (+ tests).
- **Tests first:**
  - `formatTripDate('2026-10-20T17:00:00+00:00')` → `21/10/2026` (Vietnam day), `…T16:59:59Z` → `20/10/2026`;
    invalid input returns an empty string instead of `Invalid Date`;
  - fixtures parse with `parseTripHistoryPage` (a contract guard), cover all three tabs, both kinds, a reviewed booking
    (`canReview:false`, `review.exists:true`), an unreviewed Completed booking, a Cancelled booking with refund,
    a Completed itinerary with `visitedCount < stopCount`, and every item has matching detail data.
- **Code:** fixtures builder functions; the demo list filter used by the client (tab, trip type, date range with Vietnam
  day bounds, paging, sort by departure descending then kind then id) lives next to the fixtures.
- **Verify:** vitest on both files; eslint; typecheck.
- **DoD:** fixtures are imported only from the client's gated path.

### Task 5 — List view, filters, summary banner

- **Files:** `TripHistoryView.tsx`, `TripFiltersBar.tsx`, `TripSummaryBanner.tsx`, `resources/en.ts` (+ their tests,
  updated or rewritten).
- **Tests first** (mock the client module):
  - initial load requests `tab=Completed`; switching tab, trip type, dates or page requests exactly those params and
    resets to page 1 when a filter changes;
  - there is no search input; trip-type select and date inputs remain; a reversed range shows MSG29 and sends no request;
  - renders `items` in response order with the key `kind:id`; `totalCount` drives "Showing n of m" and
    `ceil(totalCount/20)` pages; previous/next disabled at the bounds;
  - the summary banner shows `totalCompletedTrips` and `totalVisitedPois` only, and only when `summary` is present;
  - loading skeleton while pending (`aria-label`), empty state (MSG128) with plan/explore links, error state with Retry
    that refetches, MSG126 and MSG127 texts, no pending/501 state;
  - a stale response from a previous filter does not overwrite a newer one;
  - demo banner appears only for `?demo=1` when demo is allowed.
- **Code:** drop `searchQuery`, `pendingNotice` and the submitted-review modal state; use the client; keep layout classes.
- **Verify:** vitest on the three component tests; eslint on changed files; typecheck.
- **DoD:** loading, empty, error and pagination states each have a test; strings come from `resources/en.ts`.

### Task 6 — Trip card

- **Files:** `TripCard.tsx` (+ test).
- **Tests first** (one test per row):
  - booking shows title, `dd/MM/yyyy` departure, booking code, participant count, total amount in VND and status; itinerary
    shows title, date, stop count and "visited n of m" only when `visitedCount` exists; nothing else is rendered
    (no distance, operator, payment method, image, rerouted badge);
  - **Write review** appears iff `actions.canReview === true`, links to `/account/reviews/commerceBooking/{reviewableRecord.id}`;
  - **View review** appears iff `review?.exists === true` (shows the rating when present), same link; both never appear together
    in the backend's own states; `canReview:true` with `review.exists:true` (contradiction) shows both flags honestly, i.e. each follows its own condition;
  - **E-ticket** appears iff `actions.canViewETicket && actions.ticketId`, links to `/bookings/{ticketId}/ticket`, never the booking id;
  - **View refund** appears iff `actions.canViewRefund` and calls the open-detail handler; **View details** always appears;
  - itinerary shows **Open itinerary** → `/itinerary/{id}`; no Write/View review, no e-ticket;
  - status chip text/colour per tab; accessible names on all actions; the old tour link is gone.
- **Code:** props `{ item, onOpenDetail(item, focus?: 'refund') }`; remove `refund` modal and review-modal code.
- **Verify:** `npx vitest run src/features/trips/components/TripCard.test.tsx`; eslint; typecheck.
- **DoD:** every `actions.*` flag and `review.exists` has an on and an off test.

### Task 7 — Trip detail dialog

- **Files:** `components/TripDetailDialog.tsx` (+ test), wiring in `TripHistoryView.tsx`.
- **Tests first** (mock the client):
  - opening fetches `kind/id` once, shows a loading state, then the detail; focus moves into the dialog, Tab is trapped,
    Escape and the close button close it and return focus to the trigger (`useModalFocusTrap`);
  - booking: tour title and destination, schedule start/end and meeting point, participant counts, and for a Cancelled
    booking the cancellation reason and the refund status, amount and channel (a `null` channel shows a neutral
    "not available" text, not an empty value);
  - itinerary: ordered stops with Reached / Skipped / Pending labels and times, "visited n of m", session start, end and
    reason (`RouteFinished`, `TravelerStopped`, `Expired` → readable text); planned itinerary shows planned stops without visit labels;
  - error shows MSG127 with Retry (refetches); `record_not_found` shows a "no longer available" text; aborting on close
    ignores a late response;
  - opened from **View refund** it scrolls/highlights the refund section.
- **Code:** one dialog component with two small kind sections; strings in resources; `role="dialog"`, `aria-modal`, labelled title.
- **Verify:** vitest on the dialog and view tests; eslint; typecheck.
- **DoD:** loading, error, not-found and both kinds are tested; no new route or global state.

### Task 8 — Cleanup, docs, final verification

- **Files:** `docs/UC32-API-INTEGRATION.md`, leftover obsolete tests and resource keys, `README`/docs pointers if needed.
- **Work:** remove dead history-only keys and types; confirm no import of the removed stubs; write the integration note
  (routes, parameters, error mapping, demo flag, known limits, what remains for Mobile).
- **Verify (all must pass, in order):** `npm install`-equivalent already done via `npm ci`; `npm test`, `npm run lint`,
  `npm run typecheck`, `npm run build`; confirm `git status` shows no generated files and `package-lock.json` is unchanged;
  manual check with `npm run dev -p 3001` in demo mode: tabs, filters, pagination, dialogs, keyboard, narrow and desktop widths,
  recorded honestly (not claimed if not performed).
- **DoD:** the frontend validation checklist in `AGENTS.md` is filled in the PR body: tests, TypeScript, ESLint, build,
  responsive, loading, error, accessibility.

## 4. Traceability

| Spec item | Task |
| --- | --- |
| §5.1 proxy | 2 |
| §5.2 types and client | 1, 3 |
| §5.3 list UI | 5 |
| §5.4 card actions | 6 |
| §5.5 detail dialog | 7 |
| §5.6 demo fixtures | 4 |
| §5.7 tests and docs | every task, 8 |
| §6 error mapping | 2, 3, 5, 7 |
| Acceptance 1 (no token or URL in the browser) | 2 |
| Acceptance 6 (no production fallback) | 3 |
| Acceptance 7 (four checks) | 8 |

## 5. Risks

- The BE PR #105 is not merged, so nothing here proves live integration; the PR description will say the tests use mocked transport.
- The legacy review page changes from a "pending" notice to "not found" for a direct visit (C2); it is not linked from anywhere after this change.
- Removing the 501 stubs means an environment without the new BE shows the error state, which is the intended fail-safe.
- The proxy token helper stays duplicated (technical debt, listed in the PR).

## 6. Finishing

When all tasks pass and are reviewed, stop. Present the options (merge, open a PR, keep the branch, discard) and act only on the
developer's choice. Mobile starts only after the Web part is finished.

## 7. Execution log (2026-10-22)

All eight tasks were done test first. Differences from the plan as approved:

| # | Deviation | Reason |
| --- | --- | --- |
| E1 | Order was 1, 2, 4, 3, 6, 7, 5, 8. | The client's demo path needs the fixtures (4 before 3); the list view renders the card and opens the dialog (6 and 7 before 5). |
| E2 | `getTripHistory` was removed from `tripHistoryApi.ts` in Task 5, not Task 3. | `TripHistoryView` still called it until Task 5, so removing it earlier would have broken the typecheck. |
| E3 | Added `formatTripDateTime` and `formatTripTime` (with tests) to `utils/formatTripDate.ts`. | The dialog shows times; the plan listed only the date formatter. |
| E4 | Tab, filter and card tests assert the Vietnam day with the real `Intl` time zone. | Confirms CR-07 on the machine's ICU data. |
| E5 | Removed resource keys, the legacy list types and `DEMO_TRIP_SUMMARY` that only the old UI used. | Task 8 clean-up; legacy `TripCardDto`, `getTripById` and `tripDemoFixtures.ts` stay, marked `@deprecated`. |
| E6 | Manual browser check of the demo mode was **not performed**. | No browser tooling was available in this session; behaviour is covered by component tests, including loading, empty, error, pagination, dialog, focus and keyboard cases. |

Validation on the final tree: `npm test` (Node 63/63, Vitest 249 files, 2773 tests), `npm run lint`,
`npm run typecheck` and `npm run build` all pass. `package.json` and `package-lock.json` are unchanged.
