# DAILY-PAYOUT-TRANSFER — Web Implementation Plan

Spec: `specs/DAILY-PAYOUT-TRANSFER-fe-spec.md` (v2). Tasks 0–9 below are the v1 history (done,
against the old v3 backend contract). **Tasks 10–14 are the v2 delta**, bringing this branch up
to the v7 backend contract (`Capstone_BE-fix-daily-payout`, branch `fix/linhnv-daily-payout-transfer`):
Kind `Main`/`Retained` → `Advance`/`Final`; status `Carried Over` → `Resolved`; UC-73 actions
`Retry`/`Carry Over`/`Record Manual Transfer` → `Retry Transfer` (now synchronous) /
`Mark as Resolved`. Developer-approved (spec v2 change log + the one scope question — Staff
unlock-TO UI — answered "out of scope for now").

## v2 delta — bring up to backend spec v7 (Tasks 10–14)

### Task 10 — Kind/Status/validator (`payoutSettlements.ts`, admin + operator)

- `PAYOUT_SETTLEMENT_KINDS`: `['Main', 'Retained']` → `['Advance', 'Final']` (both files).
- `PAYOUT_SETTLEMENT_STATUSES`: remove `'Carried Over'`, add `'Resolved'` (both files).
- Admin file: rename `validateManualTransferReference` → `validateResolutionReason` (identical
  blank/whitespace-after-trim rule; doc comment now cites `daily_payout.resolution_reason_required`
  instead of `daily_payout.manual_reference_required`). Operator file has no such validator (read
  -only) — no change there beyond the two constants.
- Tests (red first): parser accepts `'Advance'`/`'Final'`/`'Resolved'`, rejects `'Main'`/
  `'Retained'`/`'Carried Over'`; `validateResolutionReason` boundaries (empty, whitespace-only,
  trimmed value kept) — same cases the old validator's tests already cover, renamed.

### Task 11 — Service (`payoutSettlementsService.ts`, admin only)

- Remove `carryOverFailedPayoutBatch`, `recordManualPayoutSettlement`.
- Add `markPayoutBatchResolved(batchId, reason, signal)`: `POST /api/admin/payout-settlements/{id}/resolve`,
  body `{ reason }`, same error-mapping discipline as the removed functions (malformed body never
  success).
- `retryFailedPayoutBatch` unchanged in signature/call shape — only Task 13's dialog copy
  reflects its new synchronous behavior, not this function.
- Tests: `markPayoutBatchResolved` sends exactly `{ reason }`; 400/403/404/409/500/network mapped;
  old carry-over/manual-settlement tests removed (functions no longer exist).

### Task 12 — BFF proxy + routes

- `payoutSettlementsProxy.ts`: `PayoutBatchAction` → `'retry' | 'resolve'`. The action-body
  allow-list for `'resolve'` forwards only `reason` (string, else `null` — backend's own validator
  rejects blank, 400), replacing the `'manual-settlement'` branch's `transferReference` handling.
- Delete `app/api/admin/payout-settlements/[batchId]/carry-over/route.ts` and
  `.../manual-settlement/route.ts`. Add `.../resolve/route.ts` (same 6-line shape as `retry/route.ts`,
  calling `proxyPayoutBatchAction(request, batchId, 'resolve')`).
- Tests: resolve route forwards only `reason` from an extra-fields body; cross-origin → 403 without
  calling the backend; invalid `batchId` → 400; the two removed routes' tests removed; `retry`
  route's existing tests unchanged (same action name, same forwarding).

### Task 13 — Screen + dialogs (`FailedPayoutSettlementScreen.tsx`)

- Delete `ManualSettlementDialog.tsx` (and its test); add `MarkAsResolvedDialog.tsx` (and test) —
  same shape (one required text field, `useAccessibleDecisionDialog`, double-submit guard via
  `inFlight` ref), field renamed Transfer Reference → **Reason**, uses
  `validateResolutionReason`, calls the passed-in `onConfirm(reason)`. Title/body copy: "Mark as
  Resolved" / "Enter the reason this settlement is being closed without a transfer. The amount is
  not recalculated."
- `ConfirmActionDialog` usage for `[Carry Over]` removed (no replacement dialog needed —
  `[Retry Transfer]` keeps using `ConfirmActionDialog`, just with new copy below).
- `FailedPayoutSettlementScreen.tsx`: `OpenDialog` union `'retry' | 'carryOver' | 'manualSettlement' | null`
  → `'retry' | 'markResolved' | null`. Two buttons instead of three: `[Retry Transfer]`,
  `[Mark as Resolved]`. Retry dialog body copy updated: "The system resends the transfer now. The
  result — settled, or failed again — is reflected immediately." (replaces the old "not
  immediately" wording, v2 change 3). Resolved dialog wired to `markPayoutBatchResolved`.
- Tests: two buttons only (Carry Over button gone); Mark as Resolved blocks on blank reason with
  the typed value kept; Retry dialog's updated copy; both actions still only visible while
  `status === 'SettlementFailed'`, both re-fetch on success (U03 race test kept, same mechanism).

### Task 14 — Verification

- `npm run lint && npm run typecheck && npm test && npm run build`, all green. No leftover
  reference to `Main`/`Retained`/`Carried Over`/`carry-over`/`manual-settlement`/
  `ManualSettlementDialog`/`validateManualTransferReference` anywhere under
  `src/features/{admin,operator}/payout-settlements` or `app/api/{admin,operator}/payout-settlements`.
- Manual check against the running `Capstone_BE-fix-daily-payout` API (already up on
  `localhost:5022` this session): list screen shows `Advance`/`Final` kind and a `Resolved` badge
  where applicable; detail screen's two buttons work against the real backend.


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

## Task 6 — Retry / Carry Over / Record Manual Transfer dialogs — done

- `ConfirmActionDialog.tsx`: a no-input confirm dialog shared by Retry Transfer and Carry Over —
  same shape, only the title/body/confirm label and the service call passed in differ.
  `ManualSettlementDialog.tsx`: the one dialog with an input, validated with Task 1's own
  `validateManualTransferReference` rather than re-implementing the trim/blank check. Both reuse
  `useAccessibleDecisionDialog` from `tour-operator-applications/components/` directly (it is
  already cross-feature-imported there by `tour-reviews/ModerationDialog.tsx` — a precedent for
  reusing it rather than duplicating; the plan's original reference, `PayoutApproveDialog`, was
  removed with UC-46). Confirm → call the passed-in service function → `onSuccess` (caller closes
  and re-fetches) → on failure, the dialog stays open with the mapped error (manual-settlement
  keeps the typed value, per spec).
- `FailedPayoutSettlementScreen.tsx`: three action buttons, rendered only while
  `detail.status === 'SettlementFailed'`; each opens its dialog via an `openDialog` union state.
  `onSuccess` closes the dialog and bumps the same `reloadToken` the unavailable-state "Retry"
  button already used — the status shown is always whatever the re-fetch returns, never assumed
  locally, and a stale in-flight fetch from an earlier reload is aborted by the effect's own
  cleanup when a newer reload supersedes it (U03), with no extra code needed beyond that existing
  mechanism.
- Success copy: Retry Transfer says the resend happens on the backend's own schedule, not
  immediately; Carry Over says the amount moves to the Tour Operator's next scheduled run — per
  spec Screen 2, to avoid implying instant settlement.

Tests (TDD, 5 + 6 dialog unit tests + 5 new screen integration tests, all red-then-green): each
dialog's happy path and double-click-sends-one-request guard (confirmed via a controllable
pending promise, not timing); manual-settlement blank reference blocked with the value preserved;
mapped error shown and dialog kept open on failure. Screen: actions shown only for
`SettlementFailed`, hidden for every other status; each action's confirm → re-fetch → new status
shown; the U03 race (two reloads in flight, the earlier one resolving after the later one must not
overwrite it). `npm run lint && npm run typecheck && npm test` (3576/3576) and `npm run build` all
green.

## Task 7 — Payout Settlement History (`PayoutSettlementHistoryScreen.tsx`, `/partner/payout-settlements`) — done

- Platform: Web-only (decided). Server guard: `app/partner/payout-settlements/page.tsx` just
  wraps the screen in `<PartnerRouteGuard route="dashboard">` — the same check the bank-account
  page at `/partner/payouts` already uses. No page-level test: `PartnerRouteGuard`/
  `partnerRouteDecision` already have their own generic test suites covering every route/role
  combination, and the sibling `/partner/payouts` page has no test of its own either — same
  convention.
- Table (Booking, Run Date, Kind, Payout Amount, Status, Transfer Reference) + local-state
  pagination per spec Screen 3. **No filters** — Open question 6 is still undecided, and the
  SRS's one-line description does not ask for them (AGENTS.md "Clarify First"); add Task 4's
  filter bar here later if confirmed. Read-only: no actions.
- **Found and fixed a real bug while building this**: the operator service
  (`fetchOperatorPayoutSettlementHistory`, written in Task 2) sent `pageNumber` in its query
  string, but `OperatorPayoutSettlementsController.GetHistory` binds `page` — the admin list
  endpoint uses `pageNumber`, but this operator endpoint does not, and the Task 3 proxy's own
  allow-list already only forwarded `page`/`pageSize`. Pagination beyond page 1 was silently
  broken (always returned page 1) until now.
- Added `formatVnd`/`formatRunDate` to the operator's own `payoutSettlements.ts` (Task 1 didn't
  anticipate needing them there, same as the admin side's Task 4 addition).

Tests (TDD, 7 screen + 2 new formatter + 1 service-URL fix, all red-then-green where applicable):
own-operator row renders; a row for a different `tourOperatorUserId` is filtered out
(defence-in-depth, even though the backend already scopes the query); loading/empty/forbidden/
unavailable-with-retry states; pagination requests the right page. `npm run lint && npm run
typecheck && npm test` (3585/3585) and `npm run build` all green; the route registers as static
(client-rendered, no page-level data fetch) in the build output.

## Task 8 — Message catalogue wiring (spec Open question 7)

- Once Lead/PO assigns real MSG codes (or an approved interim catalogue entry) for every state
  surfaced in Tasks 4–7, replace any placeholder copy with the catalogue entries. This task is
  intentionally last and small: if the codes are assigned earlier, fold this into the task that
  needed them instead of waiting.

Tests: snapshot/text assertions updated to the final catalogue strings.

## Task 9 — Verification — done (partial; two sub-items environment-limited, see below)

- `npm run lint && npm run typecheck && npm test && npm run build`: all green.
  Lint clean, typecheck clean (`tsc --noEmit`), tests 3585/3585 passed across 332 files, build
  succeeded and registered every new route (`/admin/payout-settlements`,
  `/admin/payout-settlements/[batchId]`, `/partner/payout-settlements`, plus the 5 admin + 1
  operator BFF API routes) with no build errors.
- Responsive check at 320/390/768/1024/1440px (V01): **not performed**. The dev-server preview
  tool in this sandbox cannot see any route file created in this session — confirmed again just
  now with a fresh server start: `/admin/payout-settlements` 404s while a pre-existing route
  (`/admin/bookings`) still correctly redirects to `/admin/login`, identical to the behavior
  first diagnosed in Task 4 (throwaway probe page, cache clear, server restart — all ruled out
  there as the cause). `npm run build` registering the routes cleanly rules out a code defect;
  this is a tooling/environment limitation, not re-diagnosed further here since Task 4 already
  exhausted the obvious causes. The three screens use the same Tailwind responsive classes
  (`sm:`/`md:`) and table/card patterns as already-shipped screens elsewhere in the app, but this
  has not been visually confirmed in-browser.
- Local end-to-end against the BE branch: **not performed**. This sandbox has no SQL Server
  instance and no way to run the BE API alongside this FE dev server against a real database, so
  a true live end-to-end (list → failed-row → detail → retry/carry-over/manual-settlement;
  partner history scoping) could not be exercised. This is covered instead by the integration-
  style unit tests within each screen (mocked proxy/service layer, real component tree) — see
  Tasks 4–7 — which is the closest substitute available here.

## Out of scope

- Mobile screens (decided Web-only, spec Open question 1).
- Any change to the BE branch itself.

## Risks

- **Spec Open questions 4, 5, 6, 7 are still open** (1–3 decided, see spec). Tasks 1–3 and 4/5's
  read-only parts do not depend on any of them and can start once the spec itself (structure,
  routes, screens) is approved. Task 6 (actions) soft-depends on Open questions 4 and 5 (exact
  conflict/status codes) for its error mapping — confirm before writing those specific test
  cases, not before starting the task.
