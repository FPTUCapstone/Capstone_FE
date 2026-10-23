# UC-46 — Request Payout Settlement (Web Plan)

## Status

**Blocked on spec approval.** Do not start until `specs/UC-46-request-payout-settlement-fe-spec.md` v3 is approved and the backend spec v3 is confirmed. Route handlers and components can be built against the contract with test doubles, but the browser flow in Task 8 needs the backend branch.

## Preconditions

- Branch `feature/linhnv-request-payout-settlement`, clean baseline, `npm run lint` and `npm run typecheck` green.
- Existing payout components in `src/features/operator/finance/components/payouts/` are the starting point; do not rebuild them.

## Task 1 — Types and error mapping (TDD)

- Extend `src/features/operator/finance/types/payoutLifecycle.ts` with the v3 DTOs: settlement month, payout summary (`payoutCode`, `year`, `month`), history item, masked bank account, `blockReason` and status unions, and adjustment amounts.
- One mapping table from backend `errorCode` to display key, in the service file. Codes whose text is pending (`INVALID_SETTLEMENT_MONTH`, `MONTH_NOT_CLOSED`, `PAYOUT_NOT_REQUESTABLE`, `ACTIVE_PAYOUT_EXISTS`, `BELOW_MINIMUM_PAYOUT`, `PAYOUT_NOT_CANCELLABLE`) map to a placeholder key, not to a catalogue code.

Tests: every error code in the backend table maps; unknown code falls back to MSG127; no mapping uses MSG118, MSG119, MSG120, or MSG131–136.

**Done when:** pure functions pass unit tests.

## Task 2 — BFF route handlers (TDD)

Create under `app/api/operator/payouts/`:
- `settlement-months/route.ts` (GET, forwards `year`)
- `route.ts` (GET history, POST request)
- `[payoutCode]/cancel/route.ts` (POST)
- `bank-account/route.ts` (GET, PUT)

No detail route. Implementation follows `src/features/operator/finance/api/operatorRevenueProxy.ts`: cookie → refresh → role check → forward with bearer token, `Cache-Control: no-store`, `MSG127`-class failure on upstream error.

Tests: no cookie → 401; non-operator role → 401/403; body and status pass-through; POST body forwards only `year` and `month`; query string preserved.

## Task 3 — Service layer (replace the pending path)

Rewrite `src/features/operator/finance/services/operatorPayoutService.ts`:
- Live calls to the Task 2 routes.
- Demo branch unchanged behind `isFinanceDemoAllowedInCurrentEnv()` and `?demo=1`.
- Remove `PENDING_BE_INTEGRATION` from the production path only.

Update `operatorPayoutService.test.ts`: replace the test that asserts `PENDING_BE_INTEGRATION` in production with one that asserts a live call and a parsed result. Mock `fetch`, not the component.

**Done when:** service tests pass.

## Task 4 — Settlement months table and bank card

- `SettlementPeriodsTable` (rename to settlement months): year selector; render `requestable`, server `blockReason` in an `aria-describedby` description, Payable Net, adjustments outstanding, and status badge. Empty year → MSG128.
- `BeneficiaryBankCard`: masked display; "Not set" state; edit form whose account number input starts empty and never reads the GET value; MSG01 for empty required fields; save and error handling as in the spec.
- Remove the current full-number rendering (`BeneficiaryBankCard.tsx` line 217) in the production path.

Tests: each block reason renders a disabled button with its description; GET masked value never appears in the edit input; full number absent from the DOM after save; clearing the number after success.

## Task 5 — Request dialog

`RequestPayoutDialog`:
- Confirm checkbox gates the submit button; in-flight guard prevents double submit.
- Display the server-returned adjustment amount when present (display only, no client calculation).
- Map errors per the Task 1 table; on `SYSTEM_ERROR`, MSG127 with Retry for the same month.
- On success, refresh months and history.

Tests: each dialog state; double-submit guard; adjustment line shown only when the server returns one; success refreshes both lists.

## Task 6 — History and cancel

- `PayoutRequestHistoryTable`: Cancel shown only when `cancellable`; Rejected shows reason; `SettlementFailed` shows a retrying notice with no action.
- `CancelPayoutDialog`: MSG129 on success; 409 `PAYOUT_NOT_CANCELLABLE` triggers a re-fetch and keeps actions disabled until it completes.

Tests: cancel visibility by status; 409 flow does not auto-retry; `SettlementFailed` shows no action.

## Task 7 — Page wiring and responsive check

- `OperatorPayoutView` loads sections independently so one failure shows MSG127 without hiding the others.
- The `PartnerRouteGuard` on `app/partner/payouts/page.tsx` is unchanged.
- Layout checked at 375 px and desktop width; no page-level horizontal scroll.

## Task 8 — Verification

- `npm run lint`, `npm run typecheck`, `npx vitest run` on the finance feature. Pre-existing failures in `OperatorRevenueView.test.tsx` and `operatorRevenueService.test.ts` are out of scope and reported as unchanged, not silently fixed.
- Browser on the real backend: request a closed month → history shows `PendingReview` → cancel → month requestable again. Check at 375 px and desktop. Use demo mode only for states the backend cannot produce.

**Done when:** automated checks pass, the browser flow is verified on the real backend, and each spec testing requirement maps to a named test.
