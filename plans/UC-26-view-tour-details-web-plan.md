# UC-26 Web plan

Approved 2026-10-17 together with `specs/UC-26-view-tour-details-web-spec.md`. Test first for every task; verify with the listed
command before moving on. Work in worktree `Capstone_FE_UC26`, branch `feature/uc26-web-tour-detail` from
`origin/develop`. Baseline before editing: `npm run typecheck`, `npm test`, `npm run lint` on the clean checkout.

## Task 1 — Types, strict parser and mapper
Add the wire types, `parseTourDetailResponse` and `mapTourDetailResponse`; extend `TourDetailDto` with optional
fields only. Tests: valid payload, every rejected shape (missing field, wrong type, bad `availabilityStatus`,
non-string id), mapper rules (lines, status mapping, unknown→non-bookable, meeting point choice, null lists).
Verify: `npx vitest run src/features/public/tours`.

## Task 2 — `getTourDetail` service
Real mode calls the BFF and returns the mapped model; 404 → `TourApiError(status 404)`; other non-2xx, network
failure, non-JSON or invalid body → `TourApiError` with a safe message; abort is re-thrown. Remove the
`PENDING_BE_INTEGRATION` fallback; keep the demo gate unchanged. Update the old governance tests.
Verify: service tests.

## Task 3 — BFF id guard
Digits-only id (≤ 19) else the same 404 problem body, no upstream call. Tests for valid, non-numeric, `..`,
over-long, encoded input.
Verify: route/proxy tests.

## Task 4 — `TourDetailPage` states
Loading, not-found (MSG65), error with Retry (MSG127), success, demo; back action keeps params; announcements.
Tests for each state, retry re-fetch, and that a non-404 failure is not shown as "not found".
Verify: page tests.

## Task 5 — `TourDetailView` sections and CTA
Structured stops, cancellation rules, destinations, per-schedule meeting point and prices, rating/MSG128, bookable
CTA and guest sign-in link, "as of" note, default selected bookable schedule. Tests per section and per CTA state;
demo fixture still renders.
Verify: view tests.

## Task 6 — Booking handoff compatibility
`TourBookingView` ignores schedules with `bookable === false`; existing booking tests stay green; add one for the
non-bookable case.
Verify: booking tests.

## Task 7 — Full verification and review
`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`; two-pass spec/quality review; manual smoke
against the local Backend (`feature/uc26-view-tour-details`) with the Docker SQL Server when available, and report
what was and was not executed. No push or PR until the developer chooses.
