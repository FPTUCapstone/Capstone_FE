# UC-65 Confirm Payout Settlement — Web Implementation Plan

Status: **Approved 2026-11-01** (execute Task 0 to Task 10). Spec: `specs/UC-65-confirm-payout-settlement-web-spec.md`. Contract:
`Capstone_BE/docs/UC-65-api-contract.md`. Branch: `feature/uc65-confirm-payout-settlement-web` (from `develop`).

Method: one task at a time, test first (Red → Green → Refactor), review against the spec after each task,
Critical findings block the next task. No push, PR or merge without the developer's choice at the end.
Each task ends with `npm exec eslint -- <changed files>` and the task's tests; the full gate runs in Task 10.

New code lives in `src/features/admin/payout-settlement/` (D4). Shared formatters are imported from
`src/features/admin/payout-records/payoutRecords.ts`.

## Task 0 — Baseline

- `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` on the clean branch.
- Record results. Do not start on a broken baseline; report any pre-existing failure to the developer.

## Task 1 — Domain helpers and response parsers (`payoutSettlement.ts`)

Test first (`payoutSettlement.test.ts`):
- `SETTLEMENT_STATUSES` (4 values), default `ApprovedForSettlement`, labels.
- `parseSettlementSearch` / `serializeSettlementSearch` (invalid status → default, default status not serialized,
  keyword trim ≤ 200, bad dates dropped, page ≥ 1).
- `parseSettlementDetail` (valid, null `outcome`, nullable beneficiary fields, unknown status, wrong types,
  non-object) and `parseAuthorizeResult`.
- `failureMessage(code)` and `gatewayStateText(state)` incl. unknown/missing fallbacks.
- `canAuthorize(detail)` (status + `bankBinResolved` + beneficiary complete) and `authorizeBlockedReason`.
Code: the new module plus an optional `allowedStatuses` argument on `parsePayoutsResponse`/`parseItem` in
`payoutRecords.ts` (default = current `PAYOUT_STATUSES`; the existing tests must stay green unchanged).
Add `ROUTES.admin.payoutSettlementDetails(id)` to `src/lib/routes.ts` (test in the routes test if present).

## Task 2 — BFF proxy (`payoutSettlementProxy.ts` + three route handlers)

Test first (`payoutSettlementProxy.test.ts`, same harness as `payoutReviewProxy.test.ts`):
- Administrator allowed; Staff `403`; no session `401` + session cleared.
- List: allow-list `keyword/status/periodFrom/periodTo/pageNumber`, `pageSize` fixed at 20, path
  `/api/v1/admin/payout-settlements`.
- Detail: `isValidPayoutId` guard, `no-store`; authorize: same-origin required, `POST` with no body.
- `4xx` body sanitized to `title`, `errorCode`, `currentStatus`; `5xx` → `503`; non-JSON → `503`;
  `202` passed through.
Code: `payoutSettlementProxy.ts`; `app/api/admin/payout-settlements/route.ts`,
`[payoutId]/route.ts`, `[payoutId]/authorize/route.ts` (`dynamic = 'force-dynamic'`).

## Task 3 — Client service (`payoutSettlementService.ts`)

Test first: `fetchSettlementQueue`, `fetchSettlementDetail`, `authorizeSettlement` map 401/403/404/409/422/5xx,
network failure, malformed JSON and HTML to `PayoutSettlementError(status, errorCode, message, currentStatus)`;
AbortError is re-thrown; a malformed success body is an error, not a success.
Code: the service and the error class.

## Task 4 — Queue screen (`PayoutSettlementQueueScreen.tsx`)

Test first (`PayoutSettlementQueueScreen.test.tsx`): rows and badges; summary cards; status select with the four
options and URL update; period validation message; empty, 403, 400, 5xx + Retry, 401 redirect; pagination;
`Review` vs `View` link text and href.
Code: client component modelled on `PayoutRecordsScreen`; no auto-refresh; `Refresh` button.

## Task 5 — Detail screen read-only (`PayoutSettlementDetailScreen.tsx`)

Test first: sections per status (`ApprovedForSettlement`, `SettlementProcessing`, `Settled`,
`SettlementFailed`); masked account only; `Not available` for missing beneficiary values; outcome panel
absent when `outcome` is null; failure text and technical code line (D5); reconciliation banner with no retry
control; 404/403/5xx/loading states; stale response ignored (U03).
Code: the screen without the action area yet.

## Task 6 — Authorize dialog and action area (`PayoutSettlementAuthorizeDialog.tsx`)

Test first: button only for `ApprovedForSettlement`; disabled with reason when `canAuthorize` is false (D3);
dialog content (code, company, net amount, bank, holder, masked account, warning sentence); double click sends
one request; each response row of the spec table (202, 409, 422 ×3, 404, 403, 401, 5xx/network + Retry); focus
trap and Escape (blocked while in flight).
Code: dialog on `ModerationDialog`, wired into the detail screen with success/warning/error messages and a
re-fetch after every outcome.

## Task 7 — Auto-refresh while processing

Test first (fake timers): polls every 15 s only while `SettlementProcessing` and not `reconciliationRequired`;
stops on a final status, on reconciliation, on unmount, when `document.hidden`, and after 401/403/404; a slow
response from an earlier poll never overwrites a newer one; an `aria-live` region announces the status change.
Code: a small `useSettlementPolling` hook inside the feature folder.

## Task 8 — Pages and cleanup

Test first: update `app/admin/(console)/payouts/settlement/page.test.tsx` (redirect with `returnUrl`, Staff →
access denied, Administrator → queue screen); add `settlement/[payoutId]/page.test.tsx` (invalid id → not found,
redirect with the detail `returnUrl`, Staff → denied, Administrator → detail).
Code: both `page.tsx` files; delete `PayoutSettlementUnavailableView.tsx`; remove now-dead references (the
`BATCH_I_*` planning docs are historical and stay).

## Task 9 — Regression and review pass

- Staff screens, proxy and tests unchanged and green (`payout-records`, `payout-review`).
- Search the DOM tests and the proxy for any full-account-number leakage.
- Two-pass self-review against the spec (compliance, then quality); fix Critical findings, list Minor ones.

## Task 10 — Full verification and wrap-up

- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`; responsive screenshots at 320 / 390 / 768 /
  1024 / 1440 px; keyboard walk-through of the dialog; check loading and error states.
- Optional, only if a BE with the UC-65 branch and a payout with a saved beneficiary is available locally:
  walk through the queue → detail → authorize → `SettlementProcessing` flow against the `Mock` gateway. UAT is
  not used for this (see the spec's open question 2).
- Report results honestly, including anything skipped. Then present the options (merge, PR, keep, discard) and
  wait; do not push or open a PR unprompted.

## Risks

1. **Contract drift** — BE field names or error codes change before merge. Mitigation: parsers are strict and the
   fixtures in the tests are copied from `docs/UC-65-api-contract.md`.
2. **Scope-matrix wording** ("no dedicated route implied") may be read to forbid a detail route. Mitigation: D1
   is raised for explicit approval.
3. **Local E2E depends on a readable beneficiary** — see the spec's open question 2; not an FE blocker.
4. **Commit attribution** — decided: follow this repo's `AGENTS.md`, i.e. `Co-Authored-By: Codex <noreply@openai.com>`.

## Execution log (2026-11-01)

| Task | Result |
| --- | --- |
| 0 Baseline | `npm ci`, 310 files / 3411 tests, lint, typecheck, build all green before any change. |
| 1 Helpers and parsers | `payoutSettlement.ts` (53 tests). `parsePayoutsPage` generalizes the list parser; `parsePayoutsResponse` (Staff) is unchanged and still refuses settlement statuses. |
| 2 BFF proxy | `payoutSettlementProxy.ts` + 3 route handlers (34 tests). |
| 3 Service | `payoutSettlementService.ts` (20 tests). |
| 4 Queue screen | `PayoutSettlementQueueScreen.tsx` (13 tests). |
| 5 Detail screen | `PayoutSettlementDetailScreen.tsx` (13 tests). |
| 6 Authorize dialog | `PayoutSettlementAuthorizeDialog.tsx` + action area (16 tests). |
| 7 Auto-refresh | `useSettlementPolling.ts` (13 tests); a 401 now shows a "Redirecting to sign-in" state so polling stops. |
| 8 Pages | Queue and detail pages and tests; `PayoutSettlementUnavailableView` deleted. |
| 9 Regression | Staff payout screens/tests unchanged and green; added a sign-in redirect test proving Staff is never sent to a settlement route; no account number in sources or DOM. |
| 10 Verification | Final run: 318 files / 3588 tests, lint, typecheck, build all green. Browser check (Edge via Playwright, stub backend, `next dev`): 8 views x 5 widths (320/390/768/1024/1440) with no page-level horizontal overflow; the queue table minimum width was lowered from 1120 px to 960 px after the first run cut the Action column at 1440 px. Real-browser walk: Review -> Authorize -> double-click Confirm sent exactly one POST, the status moved to Settlement processing, a repeat authorize returned 409, and a cross-origin POST returned 403 without reaching the backend. |

Not verified: a run against the real UC-65 backend (UAT cannot decrypt a seeded beneficiary, see the spec's open
question 2). The shared layout's `auth/web/refresh` call to a backend on port 5021 failed in the stub setup; it is
not part of this feature.
