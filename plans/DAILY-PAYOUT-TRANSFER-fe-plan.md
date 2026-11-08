# DAILY-PAYOUT-TRANSFER — Web Implementation Plan

Spec: `specs/DAILY-PAYOUT-TRANSFER-fe-spec.md` (draft; open questions 1–3 decided, 4–7 pending
Lead/PO approval). **Do not start Task 1 until the spec is approved**, per CLAUDE.md/AGENTS.md.

## Task 0 — Remove the old UC-46 FE code (done)

Completed on this branch, before any new-feature code. See the spec's "Old UC-46 FE code —
removed" section for the exact file list. Verified: `npm run lint`, `npm run typecheck`,
`npm test` (3424/3424 passing), `npm run build` all green after the removal.

Backend: `Capstone_BE` branch `feature/linhnv-daily-payout-transfer` (implemented, local tests
green, simulated gateway). Endpoints are stable; only message-catalogue codes (spec Open
question 7) and the exact status code for `daily_payout.not_failed` (Open question 5) are
unsettled on the BE side.

Branch: `feature/linhnv-daily-payout-transfer` (FE), from `origin/develop`.

Each task follows TDD (failing test first), is independently verifiable, and ends with
`npm run lint && npm run typecheck && npm test` before moving to the next. `npm run build` runs
at Task 9 and again before any PR.

## Task 1 — Pure parsing/formatting (`src/features/admin/payout-settlements/payoutSettlements.ts`)

- `PayoutSettlementStatus` union type matching the backend's five statuses.
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

## Task 2 — Services (`payoutSettlementsService.ts`, admin and operator)

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

## Task 3 — BFF proxies and routes

- `src/features/admin/payout-settlements/payoutSettlementsProxy.ts` +
  `app/api/admin/payout-settlements/route.ts`,
  `app/api/admin/payout-settlements/[batchId]/route.ts`,
  `app/api/admin/payout-settlements/[batchId]/retry/route.ts`,
  `app/api/admin/payout-settlements/[batchId]/carry-over/route.ts`,
  `app/api/admin/payout-settlements/[batchId]/manual-settlement/route.ts`.
  - List and detail: Staff-or-Administrator session check for list, Administrator-only for
    detail and all three action routes (mirrors `payoutRecordsProxy.ts` / `payoutReviewProxy.ts`
    session checks, extended to accept either role where the spec calls for it — see Task 3a).
  - `batchId` validated as a positive integer string before forwarding, same as `payoutId` in
    `payoutReviewProxy.ts`.
  - Manual-settlement route strips unknown body fields; forwards only `transferReference`.
  - Upstream 5xx mapped to 503 with a safe title; `errorCode` forwarded only if it matches the
    existing safe pattern already used for payout errors.
- `src/features/operator/payout-settlements/payoutSettlementsProxy.ts` +
  `app/api/operator/payout-settlements/route.ts` — TourOperator-only session check, same pattern
  as the (still-working) `bank-account` proxy under `app/api/operator/payouts/bank-account/`.

Tests: no token → 401 on every route; wrong role → 403; invalid `batchId` → 400; manual-
settlement body with extra fields forwards only `transferReference`; upstream 404/409/500
forwarded as mapped.

### Task 3a — Dual-role guard helper (decided)

- Add `requiredRoles?: RequiredAdministrationRole[]` to `AdminAccessDeniedView` (one component,
  not a second variant). When set, denial copy says "Staff or Administrator required"; the
  existing single-`requiredRole` behaviour is unchanged for every current caller.
- Used only by the Task 4 list page guard (detail page keeps the existing single-role
  `AdminAccessDeniedView` as-is, since UC-73 is Administrator-only).

Tests: denied view renders for a third role (e.g. TourOperator, Traveler); allowed for either
Staff or Administrator.

## Task 4 — Payout Settlements List (`PayoutSettlementsScreen.tsx`, `/admin/payout-settlements`)

- Server guard in `app/admin/(console)/payout-settlements/page.tsx`: no session → sign-in with
  `returnUrl`; role not Staff/Administrator → Task 3a's denial view, before any data loads.
- Filter bar (status, run date from/to) + table + pagination, per spec Screen 1.
- Row link to Screen 2 only rendered when `status === 'SettlementFailed'` AND session role is
  Administrator (Staff sees the row, no link).
- States: loading, empty (SRS's own "No payout settlements match the filters" line), forbidden,
  unavailable + retry.

Tests: direct navigation (missing/expired/tampered session → sign-in with `returnUrl`; TourOperator
or Traveler → denial, no data fetched; Staff and Administrator → screen); every status renders a
badge; failed-row link visibility by role; empty/forbidden/unavailable states.

## Task 5 — Failed Payout Settlement Detail (`FailedPayoutSettlementScreen.tsx`, `/admin/payout-settlements/[batchId]`)

- Server guard: Administrator-only, existing single-role `AdminAccessDeniedView` pattern exactly
  as `app/admin/(console)/payouts/[payoutId]/page.tsx` does today.
- Header, attempt-history table, per spec Screen 2.
- No action buttons in this task — read-only detail only. Actions are Task 6.

Tests: direct navigation guard (same three cases as Task 4, required role Administrator only);
not-found renders the matching state; attempt history renders every row in order.

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
