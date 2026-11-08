# DAILY-PAYOUT-TRANSFER — Web Implementation Plan

Spec: `specs/DAILY-PAYOUT-TRANSFER-fe-spec.md` (draft; open questions 1–5 decided, 6–7 pending
Lead/PO approval; updated for SRS v12's Awaiting Window status). **Do not start Task 3 until the
spec is approved**, per CLAUDE.md/AGENTS.md — Tasks 1/2 below predate the v12 update and are
already done.

## v12 update — Awaiting Window status (done)

SRS v12 adds `Awaiting Window` (BR-141) to the six statuses Screen 1 must show/filter by (spec
"v12 change — Awaiting Window"). `PayoutSettlementStatus`'s six-value union (Task 1, both admin
and operator `payoutSettlements.ts`) and the Screen 1 filter dropdown text (spec) now include it.
The backend now does synthesize this status for a not-yet-settled booking
(`DAILY-PAYOUT-TRANSFER-be-plan.md` Task 10A, shipped): its response has no `settlementId`/
`runDate` for such a row, so `PayoutSettlementListItem` (Task 1, both admin and operator files)
was updated to `settlementId: number | null` / `runDate: string | null`, and both parsers accept
a null value for either field. Task 4 (Screen 1) and Task 7 (Screen 3) must render a row with
either field null without crashing (e.g. no run-date column text, no settlement-id-based key).

## Task 0 — Remove the old UC-46 FE code (done)

Completed on this branch, before any new-feature code. See the spec's "Old UC-46 FE code —
removed" section for the exact file list. Verified: `npm run lint`, `npm run typecheck`,
`npm test` (3424/3424 passing), `npm run build` all green after the removal.

Backend: `Capstone_BE-daily-payout` branch `feature/linhnv-daily-payout-transfer` (implemented,
local tests green, simulated gateway). Endpoints are stable; only message-catalogue codes (spec
Open question 7) and Screen 3's optional filters (Open question 6) are unsettled on the BE/spec
side — the HTTP status mapping (Open question 5) and UC-72's Awaiting Window read-model (BE plan
Task 10A) are both done.

Branch: `feature/linhnv-daily-payout-transfer` (FE), from `origin/develop`.

Each task follows TDD (failing test first), is independently verifiable, and ends with
`npm run lint && npm run typecheck && npm test` before moving to the next. `npm run build` runs
at Task 9 and again before any PR.

## Task 1 — Pure parsing/formatting (`src/features/admin/payout-settlements/payoutSettlements.ts`) (done)

- `PayoutSettlementStatus` union type matching the backend's six statuses (`Awaiting Window`,
  `Scheduled`, `Processing`, `Settled`, `SettlementFailed`, `Carried Over` — v12 update above).
- `parsePayoutSettlementListItem(body)` / `parsePayoutSettlementsResponse(body)`: strict parsers,
  throw on wrong types or an unrecognized status string (same discipline as
  `parsePayoutDetail` in the existing `payoutReview.ts`).
- `parseFailedPayoutBatchDetail(body)`: strict parser for the UC-73 detail shape, including the
  attempt-history array.
- `validateManualTransferReference(value)` → `{ ok: true, value: trimmed } | { ok: false }`
  (blank/whitespace-only rejected; exact message code deferred per Open question 7).
- `formatRunDate`, reusing the existing shared date formatter (Asia/Ho_Chi_Minh) rather than a
  new one.

Tests first: malformed/HTML body rejected by each parser; unrecognized status string rejected;
reference validator boundaries (empty, whitespace-only, leading/trailing spaces trimmed).

## Task 2 — Services (`payoutSettlementsService.ts`, admin and operator) (done)

The operator service needs the same strict list/item parser Task 1 wrote, but this repo's admin
and operator feature slices do not import each other (same reason each keeps its own small
format/error-code module instead of a shared one). Rather than have
`features/operator/payout-settlements` import from `features/admin/...`, it got its own small
`payoutSettlements.ts` (just the list/item types + parser the operator side needs, no detail/
attempt types, which are Administrator-only). Kept in its own file, not folded into the service
file, so a future Task 7 (operator history screen) can import the types without pulling the
service's `fetch` call along.

- `fetchPayoutSettlements(filters, signal)`, `fetchFailedPayoutBatchDetail(batchId, signal)`,
  `retryFailedPayoutBatch(batchId, signal)`, `carryOverFailedPayoutBatch(batchId, signal)`,
  `recordManualPayoutSettlement(batchId, transferReference, signal)` — admin side.
- `fetchOperatorPayoutSettlementHistory(page, pageSize, signal)` — operator side, separate file
  under `src/features/operator/payout-settlements/`.
- Shared error class with `status`, `errorCode`, `title`, matching the existing
  `payoutReviewService.ts` pattern. 401/403/404/409 (or 400, per Open question 5)/500/network
  mapped; malformed body is failure, never success (U01).
- Calls only the BFF routes from Task 3, never the backend directly.

Tests: each status code mapped; HTML-instead-of-JSON treated as failure; `AbortError` rethrown
unchanged; manual-settlement body sends only `transferReference`.

## Task 3 — BFF proxies and routes — done

- `src/features/admin/payout-settlements/payoutSettlementsProxy.ts` +
  `app/api/admin/payout-settlements/route.ts`,
  `app/api/admin/payout-settlements/[batchId]/route.ts`,
  `app/api/admin/payout-settlements/[batchId]/retry/route.ts`,
  `app/api/admin/payout-settlements/[batchId]/carry-over/route.ts`,
  `app/api/admin/payout-settlements/[batchId]/manual-settlement/route.ts`.
  - List and detail: Staff-or-Administrator session check for list, Administrator-only for
    detail and all three action routes (`payoutRecordsProxy.ts`/`payoutReviewProxy.ts`, the
    originally-cited reference, were removed with UC-46 — followed `tourOperatorApplicationProxy.ts`
    and `platformBookingsProxy.ts` instead, the two live admin proxies closest to this shape).
  - `batchId` validated as a positive integer string (`parseBatchId`) before forwarding or
    touching the session, same discipline as `parseApplicationId` in
    `tour-operator-applications/utils/applicationId.ts`.
  - The three action routes also require a same-origin request (`isSameOriginRequest`), same CSRF
    guard as `tourOperatorApplicationProxy.ts`'s non-GET calls.
  - Manual-settlement route strips unknown body fields; forwards only `transferReference`
    (`null` if absent/non-string — the backend's own validator rejects blank/whitespace, 400).
  - Upstream 5xx mapped to 503 with a safe title; 401 clears the admin session cookie; 403 is
    re-worded; `errorCode`/`title` otherwise forwarded only through `safeProblem` (same pattern as
    `platformBookingsProxy.ts`), never the raw upstream body.
- `src/features/operator/payout-settlements/payoutSettlementsProxy.ts` +
  `app/api/operator/payout-settlements/route.ts` — TourOperator-only session check via the
  refresh-cookie exchange, same pattern as `operatorPayoutProxy.ts`'s `bank-account` resource, but
  its own small proxy (not another resource path on that function) since the backend path is the
  distinct `/api/v1/operator/payout-settlements`, not `/api/v1/operator/payouts/...`.

Tests (23 new, admin + operator, TDD red-then-green): no token → 401 on every route; wrong role →
403 (Staff on an Administrator-only route, TourOperator on either); invalid `batchId` → 400
without calling the backend; cross-origin action request → 403 without calling the backend;
manual-settlement body with extra/wrong-type fields forwards only `transferReference`; upstream
404/409/500 forwarded as mapped; backend problem details sanitized (no `detail`/`traceId` leak).
`npm run lint && npm run typecheck && npm test && npm run build` all green; the 6 new routes
appear in the build's route list with no errors.

### Task 3a — Dual-role guard helper — done

- Added `requiredRoles?: RequiredAdministrationRole[]` to `AdminAccessDeniedView` (one component,
  not a second variant; `RequiredAdministrationRole` now exported for Task 4 to import). When
  set, denial copy says "Staff or Administrator Access Required" (new `eitherAccessDenied` resource
  entry) and only the sign-in link is shown — no "return to your own dashboard" link, since the
  viewer has neither role at all. The existing single-`requiredRole` behaviour is unchanged for
  every current caller (5/5 tests cover both paths).
- For use by the Task 4 list page guard (detail page keeps the existing single-role
  `AdminAccessDeniedView` as-is, since UC-73 is Administrator-only).

## Task 4 — Payout Settlements List (`PayoutSettlementsScreen.tsx`, `/admin/payout-settlements`) — done

- Server guard in `app/admin/(console)/payout-settlements/page.tsx`: no session → sign-in with
  `returnUrl`; role not Staff/Administrator → Task 3a's denial view, before any data loads. In
  practice the `(console)` route group's own `layout.tsx` already redirects every unauthenticated
  request to `/admin/login` (no `returnUrl`) before this page ever runs — this page's own guard
  still exists per the spec and is what actually fires for an authenticated-but-wrong-role case
  (today unreachable too, since the admin session cookie only ever encodes Staff or
  Administrator — kept anyway, see the page's own comment).
- Filter bar (status — all six values including `Awaiting Window` — run date from/to) + table
  (Booking, Tour Operator, Run Date, Kind, Payout Amount, Status, Transfer Reference, Actions) +
  pagination (`totalCount`/`pageSize`, no `totalPages` field on this DTO so computed client-side),
  per spec Screen 1. A null `runDate` (Awaiting Window row) renders "Not yet scheduled"; a null
  `transferReference` renders "Not available".
- Row link to Screen 2 only rendered when `status === 'SettlementFailed'` AND `viewerRole ===
  'Administrator'` (passed down from the server guard's own verified session role, not re-derived
  client-side) — Staff sees the row, no link.
- States: loading, empty (SRS's own "No payout settlements match the filters" line, exactly once —
  not duplicated into both a title and body), forbidden, unavailable + retry, 401 → sign-in with
  `returnUrl`.
- Added to `payoutSettlements.ts`: `formatVnd`, and the URL search-state helpers
  (`PayoutSettlementsSearch`, `defaultPayoutSettlementsSearch`, `parsePayoutSettlementsSearch`,
  `serializePayoutSettlementsSearch`, `validRunDateRange`) that Task 1 didn't anticipate needing.

Tests (TDD, 11 screen + 4 page-guard, all red-then-green): direct navigation (missing/tampered
session → sign-in with `returnUrl`; Staff and Administrator → screen with the right `viewerRole`);
every status (including `Awaiting Window` and a null `runDate`/`settlementId` row) renders without
crashing; failed-row link visibility by role (shown for Administrator, hidden for Staff, hidden on
a non-failed row even for Administrator); empty/forbidden/unavailable states; inverted date range
blocked before navigating; status-filter and pagination navigation. `npm run lint && npm run
typecheck && npm test` (3548/3548) and `npm run build` all green; the page and all 6 Task 3 routes
register cleanly in the build's route list.

**Not verified in a live browser.** `preview_start` consistently 404'd on this route — and on a
throwaway brand-new probe page at an unrelated path — even after a full process restart and a
cleared `.next` cache, while every pre-existing `(console)` route kept working. This points to the
preview tooling's dev server not seeing files created in this session, not a defect in the code:
`npm run build` compiles and registers the exact same route with no errors, and the component is
covered by the unit/integration tests above. Added `.claude/launch.json` for whoever can run the
dev server in an environment that does see this session's files.

## Task 5 — Failed Payout Settlement Detail (`FailedPayoutSettlementScreen.tsx`, `/admin/payout-settlements/[batchId]`) — done

- Server guard in `app/admin/(console)/payout-settlements/[batchId]/page.tsx`: Administrator-only,
  single-role `AdminAccessDeniedView` pattern (the plan's original reference,
  `app/admin/(console)/payouts/[payoutId]/page.tsx`, was removed with UC-46 — followed
  `tour-operator-applications/[userId]/page.tsx` instead, the closest live dynamic-segment,
  single-role detail guard). `batchId` validated with Task 3's own `parseBatchId` (imported from
  `payoutSettlementsProxy.ts`, which only needs `server-only` guaranteed by the page itself) rather
  than duplicating the regex a third time; an invalid ID renders a plain message, not the screen.
- Header (Batch ID, Tour Operator, Run Date, Total Amount, Status badge, Attempt Count) +
  attempt-history table (Attempt Number, Sent At in Vietnam time via a new `formatVietnamDateTime`
  in `payoutSettlements.ts`, Outcome, Failure Reason — `null` renders "Not available"). No action
  buttons — Retry/Carry Over/Record Manual Transfer are Task 6.
- States: loading, not found (`daily_payout.batch_not_found` → 404), forbidden (403), unavailable
  (network/5xx + retry), 401 → sign-in with a `returnUrl` back to this same detail page.

Tests (TDD, 6 screen + 4 page-guard, all red-then-green): header fields and every attempt row in
order; loading; not-found; 401 redirect with `returnUrl`; forbidden; unavailable with a working
retry (re-fetches, call count increments). Page guard: no session → sign-in with `returnUrl`;
Staff → `AdminAccessDeniedView`; non-numeric `batchId` → invalid-ID message, screen never
rendered; Administrator with a valid ID → screen. `npm run lint && npm run typecheck && npm test`
(3559/3559) and `npm run build` all green; the new dynamic route registers cleanly.

**Not independently verified in a live browser** — same `preview_start` limitation recorded under
Task 4 (the tool doesn't see this session's new files); not retried here since Task 4 already
ruled out a code-side cause.

## Task 6 — Retry / Carry Over / Record Manual Transfer dialogs

- Three dialogs, each: confirm → call its Task 2 service function → on success, close and
  re-fetch the detail (never assume the new status locally) → on failure, keep the dialog open
  with the mapped error (manual-settlement's blank-reference case shown inline, value kept).
- Actions rendered only while `status === 'SettlementFailed'`; hidden once the re-fetched detail
  says otherwise.
- Double-submit guard on each confirm button, same as `PayoutApproveDialog`.
- Success copy: Retry says the resend happens on the backend's own schedule, not immediately;
  Carry Over says the amount moves to the operator's next run — per spec Screen 2, to avoid
  implying instant settlement.

Tests: each dialog's happy path (confirm → re-fetch → new status shown); double-click sends one
request per action; manual-settlement blank reference blocked with value preserved; a stale
detail response arriving late does not overwrite the status just set by the action's own
re-fetch (U03).

## Task 7 — Payout Settlement History (`PayoutSettlementHistoryScreen.tsx`, `/partner/payout-settlements`)

- Platform: Web-only (decided). Server guard: `PartnerRouteGuard` / `partnerRouteDecision`
  pattern, TourOperator-only, same as
  other `/partner/*` routes.
- Table + pagination per spec Screen 3; no filters unless Open question 6 is confirmed (if
  confirmed, add the same filter bar as Task 4's, reusing its component rather than duplicating).
- Read-only: no actions.

Tests: direct navigation guard (non-TourOperator → denial, no data fetched); table renders only
rows whose `tourOperatorUserId` matches the session's own id (defence-in-depth, even though the
backend already scopes the query); empty/forbidden/unavailable states.

## Task 8 — Message catalogue wiring (spec Open question 7)

- Once Lead/PO assigns real MSG codes (or an approved interim catalogue entry) for every state
  surfaced in Tasks 4–7, replace any placeholder copy with the catalogue entries. This task is
  intentionally last and small: if the codes are assigned earlier, fold this into the task that
  needed them instead of waiting.

Tests: snapshot/text assertions updated to the final catalogue strings.

## Task 9 — Verification

- `npm run lint && npm run typecheck && npm test && npm run build` (record result honestly,
  including any environment-limited step).
- Responsive check at 320 / 390 / 768 / 1024 / 1440 px (V01) for all three screens.
- Local end-to-end against the BE branch (not the simulated-only unit tests): list → failed-row
  → detail → retry; list → failed-row → detail → carry-over; list → failed-row → detail →
  manual-settlement; partner history shows only that operator's rows.

## Out of scope

- Mobile screens (decided Web-only, spec Open question 1).
- Any change to the BE branch itself.

## Risks

- **Spec Open questions 4, 5, 6, 7 are still open** (1–3 decided, see spec). Tasks 1–3 and 4/5's
  read-only parts do not depend on any of them and can start once the spec itself (structure,
  routes, screens) is approved. Task 6 (actions) soft-depends on Open questions 4 and 5 (exact
  conflict/status codes) for its error mapping — confirm before writing those specific test
  cases, not before starting the task.
