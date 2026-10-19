# UC-64 / UC-73 / UC-74 Web Implementation Plan

Spec: `specs/UC-64-73-74-review-payout-request-web-spec.md`
Backend contract: `Capstone_BE/specs/UC-64-73-74-review-payout-request-spec.md` (decisions D1–D6).

Branch: `feature/linhnv-review-payout-request` (FE), rebased on `feature/linhnv-view-payout-records` (UC-63 FE, rebased onto `develop`).

Parallel work: BE branch of the same name builds the endpoints. FE is verified against a test double until the BE branch runs locally. Merge order is in the spec (O3).

## Task 1 — Pure parsing and validation (`src/features/admin/payout-review/payoutReview.ts`)

- `PAYOUT_REASON_MIN_LENGTH = 10`, `PAYOUT_REASON_MAX_LENGTH = 500` (fallback values).
- `validateRejectionReason(value)` → `{ ok: true, value: trimmed } | { ok: false, messageCode: 'MSG157' }`.
- `parsePayoutDetail(body)`: strict parser of the UC-64 response. Throws on wrong types, status outside the known set, or non-string IDs. `maskedAccountNumber` may be `null`.
- `isReviewable(status)` → `status === 'PendingReview'`.

Tests first: boundaries 9/10 and 500/501, whitespace-only, null, parser rejects HTML/malformed bodies, accepts null masked account.

## Task 2 — Service (`payoutReviewService.ts`)

- `fetchPayoutDetail(id, signal)`, `approvePayout(id, signal)`, `rejectPayout(id, reason, signal)`.
- Error class with `status`, `errorCode`, `title`. 401/403/404/409/500/network mapped; malformed body is failure, never success (U01).
- Calls only `/api/admin/payouts/...` BFF routes.

Tests: each status mapping; HTML-instead-of-JSON treated as failure; AbortError rethrown.

## Task 3 — BFF proxy (`payoutReviewProxy.ts` + `app/api/admin/payouts/[payoutId]/...`)

- Same session and Staff-role checks as `payoutRecordsProxy.ts`.
- Validates `payoutId` as decimal string before forwarding.
- Forwards only the three allowed upstream paths; strips unknown body fields on reject (only `reason` forwarded).
- Maps upstream 5xx to 503 with safe title; forwards `errorCode` only if it matches the safe pattern.

Tests: no token → 401; Administrator → 403; invalid ID → 400; body with extra fields forwards only `reason`; upstream 409 forwarded.

## Task 4 — Detail screen (`PayoutReviewScreen.tsx`, route `app/admin/(console)/payouts/[payoutId]/page.tsx`)

- Server guard in the page, same as `app/admin/(console)/payouts/page.tsx`: invalid session → redirect to sign-in with the detail `returnUrl`; non-Staff → `AdminAccessDeniedView` before any UI or data loads.
- Commission rate rendered from the ratio (`0.1` → `10%`).
- Sections: header, amount breakdown, contributing bookings, beneficiary block (`Not available` for null mask).
- Actions Approve / Reject shown only for `PendingReview`; other statuses show status text.
- States: loading, not-found (MSG128), forbidden (MSG126), unavailable (MSG127 + Retry).

Tests: direct navigation (missing/expired/tampered session → sign-in with `returnUrl`; Administrator → access denied; Staff → screen); `0.1` shown as `10%`; status-driven action visibility; masked account null; no full account text in DOM; retry works.

## Task 5 — Approve and Reject dialogs

- Approve: confirmation dialog, double-submit guard; on 409 show a conflict message, re-fetch the detail and take the status from it.
- Reject 400 with the reason error code maps to MSG157 and keeps the entered text.
- Reject: textarea with counter `0/500`, MSG157 inline on invalid input, value preserved on error, submit blocked while invalid.
- Success: close dialog, re-fetch detail.

Tests: double click sends one request; reject boundary via UI; 409 handling; stale response does not overwrite newer status (U03).

## Task 6 — Link from UC-63 list

- Rows in the existing `PayoutRecordsScreen` link to `/admin/payouts/[payoutId]`.
- Test: link present for each row; no change to list behaviour otherwise.

## Task 7 — Verification

- `npm run lint && npm run typecheck && npm test && npm run build` (build may need env; record result honestly).
- Responsive check at 320 / 390 / 768 / 1024 / 1440 px (V01), same set as the spec.
- Local end-to-end with the BE branch once it runs: list → detail → approve; list → detail → reject → resubmit path not in FE scope.

## Out of scope

- Administrator settlement screens (UC-65) and Payout Details for Administrator (SRS 3.9.9.2).
- Tour Operator resubmission UI.
- Export statement.
