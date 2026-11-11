# UC-40 View Customer Bookings — Web implementation plan

Source of truth: `specs/UC-40-view-customer-bookings-web-spec.md` (decisions D1–D4 must be answered first) and
`Capstone_BE/docs/UC-40-api-contract.md`.
Branch: `feature/uc40-view-customer-bookings` (from `develop` @ `4702f4f`).

## Working rules

- Red → Green → Refactor per task: write the failing test, run it and see it fail for the right reason, write the
  minimal code, re-run, refactor. Code written before its test is deleted and restarted.
- One task at a time; after each task run its command, then review the diff against the spec. A Critical finding
  blocks the next task; a Minor one may be deferred with the developer's agreement.
- Next.js here is v16 with breaking changes: before the first route handler read the relevant guide in
  `node_modules/next/dist/docs/` (route handlers, async `params`), and copy the existing
  `app/api/operator/payouts/[payoutCode]/cancel/route.ts` shape.
- Follow the design system (`DESIGN.md`, `.agents/skills/tripmate-design-system`) for any visual change; this task
  adds states and badges only, no new screen.
- Do not commit, push, or open a PR until the developer chooses (Task 9). Commits (when asked) are Conventional
  Commits with `Co-Authored-By`.

Per-task checks (fast): `npx vitest run src/features/operator/bookings app/partner/bookings app/api/operator/bookings`,
`npm run typecheck`, `npm exec eslint -- <touched files>`.

## Task 0 — Baseline

`npm run typecheck`, `npm run lint`, `npm test` on the clean branch (build is part of Task 9). A run was started
on this branch; its result is reported with this plan.
**DoD:** baseline recorded; any pre-existing failure listed and agreed before Task 1.

## Task 1 — Align the model to the BE contract (demo path stays green)

The type change breaks many consumers, so it is one atomic task that keeps the demo flows working.

- **Red:** update the existing demo tests first to the new shape and see them fail/not compile:
  `operatorBookingService.test.ts`, `OperatorBookingListView.test.tsx`, `BookingDetailPanel.test.tsx`,
  `CancelBookingDialog.test.tsx`, `InitiateRefundDialog.test.tsx`, `OperatorBookingPage.test.tsx`. Add cases:
  `Expired` badge and filter option, `canCancel`/`cancelBlockedReason` driving the demo cancel button and
  tooltip text, no participant age/notes, `payment.gateway` shown, MSG82 deadline scenario removed.
- **Green:** `types/bookingLifecycle.ts` (BE-aligned `BookingListItemDto`, `BookingDetailDto`, `BookingStatus` with
  `Expired`, `PaymentStatus`, `PaymentGateway`, `ParticipantType`, `CancelBlockedReason`, list/summary/result
  types; D1 message rename if approved), `data/operatorBookingDemoFixtures.ts` (reshaped, string ids),
  `services/operatorBookingService.ts` (demo path only), `components/*` (list, drawer, dialogs, badge),
  `resources/en.ts` (new strings, search placeholder, summary subtitles).
- **Verify:** bookings test folder + `npm run typecheck`.
- **DoD:** demo list/detail/cancel/refund behave as before except the removed fields; no `any`, no leftover
  references to removed fields (`grep` clean).

## Task 2 — Response parsers

- **Red:** `utils/bookingApiParsers.test.ts`: `parseBookingListResponse` and `parseBookingDetailResponse` accept
  the exact BE examples from the contract doc (including `null` ticket/payment/coupon/checkedInAtUtc and the
  `+00:00` timestamps); reject missing fields, unknown status/gateway/participant type/ticket status, non-string
  ids, negative or non-finite money, non-ISO timestamps, wrong summary shape.
- **Green:** `utils/bookingApiParsers.ts` (type guards in the style of
  `src/features/admin/platform-bookings/platformBookings.ts`; returns a typed value or throws a parser error).
- **Verify:** `npx vitest run src/features/operator/bookings/utils`.
- **DoD:** contract examples parse; every malformed case is rejected.

## Task 3 — BFF proxy and routes

- **Red:** `api/operatorBookingProxy.test.ts` (pattern of `operatorPayoutProxy.test.ts`): no refresh cookie → 401
  `UNAUTHENTICATED`; refresh failure or non-operator role → 401; list forwards only the whitelisted query keys
  and drops others; detail path is `/api/v1/operator/bookings/{id}` for digits and `400` (no BE call) otherwise;
  BE status and body pass through (200, 400 `operator_booking.invalid_date_range`, 403, 404); bearer token is
  sent and never returned; `Cache-Control: no-store`; network failure → 503 `MSG127`. Route tests:
  `app/api/operator/bookings/route.test.ts`, `app/api/operator/bookings/[bookingId]/route.test.ts` (delegation,
  async `params`, `dynamic = 'force-dynamic'`).
- **Green:** `src/features/operator/bookings/api/operatorBookingProxy.ts` (same refresh-cookie → bearer flow as
  `operatorRevenueProxy`, `import 'server-only'`), `app/api/operator/bookings/route.ts`,
  `app/api/operator/bookings/[bookingId]/route.ts`.
- **Verify:** `npx vitest run src/features/operator/bookings/api app/api/operator/bookings`.
- **DoD:** the browser can reach only the two GET routes; no BE URL or token in any response.

## Task 4 — Live service

- **Red:** extend `operatorBookingService.test.ts` with `fetch` mocked: `getOperatorBookings` maps filters to the
  BFF query (omits `ALL`, `startDate/endDate` → `departureFrom/To`, `searchKeyword` → `keyword`, `page` →
  `pageNumber`, `pageSize`), returns parsed items and summary; empty list → `errorMessage` MSG128;
  inverted range blocked before `fetch` (MSG31 per D1); 401/403/404 → MSG126; 400 `invalid_date_range` → range
  message; 5xx, network error, unparseable body and parser failure → MSG127; `getOperatorBookingById` same
  mapping; `getOperatorBookingTourOptions` reads `/api/operator/revenue/tours`; **no fixture and no
  `PENDING_BE_INTEGRATION` for list/detail outside demo**; demo path still isolated by actor.
- **Green:** live branches in `getOperatorBookings` / `getOperatorBookingById`, new
  `getOperatorBookingTourOptions`, small `errorCodeFrom` + message mapper in the bookings feature. Cancel and
  refund keep their existing `PENDING_BE_INTEGRATION` outside demo (D4).
- **Verify:** service test file.
- **DoD:** every row of the spec's error table is asserted; query mapping asserted exactly.

## Task 5 — List view wiring

- **Red:** `OperatorBookingListView.test.tsx`: outside demo it fetches and renders live items and the BE summary
  (no production notice banner); loading state; empty state MSG128; error state MSG127 with Retry that refetches;
  MSG126 state; tour select enabled and filled from tour options, with the failure case (disabled, "All" only,
  list still works); status/date/search controls enabled; applying filters resets to page 1 and syncs the URL;
  inverted range shows MSG31 and does not fetch; pagination uses `totalPages`; `Expired` option.
- **Green:** `OperatorBookingListView.tsx` (remove the NO_BACKEND banner and the `disabled={!isDemoPermitted}`
  gating, tour options state, error/retry UI), keeping demo behaviour intact.
- **Verify:** list view test file + `OperatorBookingPage.test.tsx`.
- **DoD:** acceptance criteria 1, 3, 4, 5 (list) covered; responsive table/card layouts unchanged.

## Task 6 — Detail drawer

- **Red:** `BookingDetailPanel.test.tsx` and a list-view integration test: opening a row requests the detail
  endpoint and shows a skeleton, then the detail sections (participants name + type, booker phone, schedule +
  meeting point, ticket and check-in time, payment gateway/reference/amount/time, paid amount, subtotal,
  discount, total, coupon, cancellation info); `null` ticket/payment/coupon hide their blocks; detail error shows
  MSG126/MSG127 with Retry inside the drawer; a response for a previously selected booking is ignored (race);
  real mode: both action buttons disabled with the locked tooltip; demo mode: Cancel follows `canCancel`, tooltip
  text for `CheckedIn` and `InvalidStatus`; serialized DOM never contains age/notes/ID document/gateway payload.
- **Green:** `BookingDetailPanel.tsx` (loading/error/retry props, new sections), list view detail-fetch handler
  with stale-response guard.
- **Verify:** drawer tests + list view tests.
- **DoD:** acceptance criteria 5 (drawer), 6, 7 covered; focus trap and `aria` attributes preserved.

## Task 7 — Integration doc and inventory

- `docs/UC40-API-INTEGRATION.md` (scope, routes, data path BFF → BE, query mapping, error mapping, demo
  flags, what is not integrated: UC-41/42 actions and UC-43 check-in, not verified live, manual smoke steps for
  after the BE is deployed). Update the `/partner/bookings` row of `docs/FE_SCREEN_INVENTORY_2026-10-17.md`
  only to the extent the new state is true.
- **DoD:** the doc claims nothing that was not verified.

## Task 8 — Full verification

`npm install`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` in that order (AGENTS pre-PR
gate), compared with the Task 0 baseline. Review the whole diff against acceptance criteria 1–9, confirm no
secrets/`.env`/logs, no unrelated formatting, `package-lock.json` unchanged, no `any`/lint disables. Responsive,
loading, error and accessibility items of the Frontend Validation Checklist are checked and reported (UI checks
are code/test based unless a browser run is possible).

## Task 9 — Finish

Report results and stop. Present: merge / open PR / keep branch / discard. Push, PR and merge only on the
developer's choice. The PR description records the validation results and states that live end-to-end was not run
(BE UC-40 not merged/deployed).

## Risks

| Risk | Handling |
| --- | --- |
| Large test and model churn in Task 1 | Tests are updated first and drive the change; the task is atomic and gated by typecheck |
| BE not yet merged/deployed, so no live E2E | Parsers and contract examples catch drift; integration doc lists smoke steps; PR text says so |
| BE contract drift before the BE PR merges | Parsers fail closed to MSG127; the contract doc is the single reference |
| Revenue tours route shared with UC-44 | Read-only reuse, covered by a service test; failure degrades to "All tours" |
| Next 16 route handler differences | Read the bundled docs and copy an existing working dynamic route first |
| Demo flows regress when the model changes | Demo tests are migrated, not deleted; Task 1 DoD requires them green |
