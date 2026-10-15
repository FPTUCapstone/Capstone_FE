# UC-64 / UC-73 / UC-74 Staff Payout Request Review — Web Screen Specification

## Status

Status: **pending Lead/PO approval.** Developer-confirmed: D1 (Staff approves and rejects), D3 (masked bank data), D4 (resubmission allowed), D5 (snapshot columns), O1–O3. Awaiting Lead/PO confirmation: D2 (rejection reason 10–500; the minimum of 10 is a recommendation) and D6 (MSG157). The status becomes Approved only after that confirmation. Until then, code is limited to pure helpers (parser, validator) that are revisable.

Backend contract: `Capstone_BE/specs/UC-64-73-74-review-payout-request-spec.md` (draft, decisions D1–D6 recorded there).
SRS sources: §2.2 (UC-64, UC-73, UC-74), §3.1.2.2 screen list items 39–41 (Payout Request Review, Approve Payout Request Confirmation, Reject Payout Request Confirmation).

## Route and scope

- Actor: Staff only. Administrator and other roles never see these screens or actions.
- Routes (under the existing admin console):
  - `/admin/payouts` — shared list from UC-63 (existing, Staff scope, default `PendingReview`).
  - `/admin/payouts/[payoutId]` — review detail (UC-64), with actions `[Approve]` and `[Reject]`.
- Approve and Reject open a confirmation dialog. They do not navigate away.
- Server-side guard on `app/admin/(console)/payouts/[payoutId]/page.tsx`, same pattern as the list page: no valid session → redirect to sign-in with `returnUrl` set to the detail URL; role other than Staff → render `AdminAccessDeniedView` (required role Staff) before any detail UI or data loads. The BFF Staff check is a second layer, not a replacement.
- Web proxy only: browser calls `app/api/admin/payouts/...` route handlers; those call the backend. Browser never calls the backend directly.

## Dependencies (must be resolved before implementation)

1. **UC-63 FE is not on this branch.** The list screen (`src/features/admin/payout-records/*`, `app/admin/(console)/payouts/page.tsx`, `app/api/admin/payouts/route.ts`) lives on `feature/linhnv-view-payout-records` (last commit `1db9261`), not on `feature/linhnv-review-payout-request`. The list must be present before the review route links into it.
2. **Backend endpoints are not implemented.** `GET /api/v1/admin/payouts/{payoutId}`, `POST .../approve`, `POST .../reject` exist only as the BE draft spec. FE can be built against the contract with a test double, but integration check needs the BE branch.

## Screen 1 — Payout Request Review (UC-64)

Content (SRS items 39 and UC-64 description):
- Header: payout code, Tour Operator company name, settlement period, requested date (dd/MM/yyyy, Asia/Ho_Chi_Minh), status badge.
- Amount breakdown: gross revenue, commission rate, commission amount, net payout amount (VND, formatted; values as returned by the backend, never recalculated in the browser). `commissionRate` is a ratio: `0.1` is displayed as `10%`, never `0.1%`.
- Contributing bookings table: booking code, tour name, completed date, paid amount, refunded amount, net amount.
- Beneficiary block: bank name, account holder, masked account number (`maskedAccountNumber`).
  - When `maskedAccountNumber` is null: show "Not available" (no placeholder account number).
- Actions: `[Back to list]`, `[Approve]`, `[Reject]`. Approve and Reject are enabled only when status is `PendingReview`. In any other status both are hidden or disabled, with the current status shown.

States:
- Loading: skeleton; buttons disabled.
- Not found (404): MSG128, with link back to the list.
- Forbidden (403) / no session (401): MSG126; 401 redirects to sign-in with return URL (existing admin pattern).
- Unavailable (500 / network): MSG127 with Retry.

## Screen 2 — Approve Payout Request Confirmation (UC-73)

- Dialog with payout code, net payout amount and a confirmation sentence that the request moves to settlement queue for Administrator.
- `[Confirm approval]` and `[Cancel]`.
- On success: close dialog, refresh the detail, show success toast with the new status `ApprovedForSettlement`.
- On 409 (not in `PendingReview`): show a conflict message, then re-fetch the detail and render the status from that response. The UI does not rely on a field in the 409 body; the re-fetch is authoritative (the BE also returns `errorCode: "payout.not_pending_review"` and a `currentStatus` extension, see the backend spec — FE treats both as informational). Actions stay disabled until the re-fetch finishes. No automatic retry of the decision.
- On 404 / 403 / 500: show the matching message from Screen 1 states; keep the dialog open for 500 with Retry.
- Double-click protection: the confirm button is disabled while the request is in flight.

## Screen 3 — Reject Payout Request Confirmation (UC-74)

- Dialog with payout code and a required text area `Reason for rejection`.
- Validation (decision D2 in backend spec): trimmed length 10–500 characters.
  - Shown inline under the field; the value is kept on error.
  - Character counter visible (e.g. `0/500`).
  - Message: **MSG157** (`RedUnderTextbox`), "Rejection reason must be between {min_length} and {max_length} characters.", from the message catalogue (decision O1: catalogue first, SRS MSG list has no entry). Values come from the backend-reported limits, with 10 and 500 as fallback.
- `[Confirm rejection]` and `[Cancel]`.
- On 400 with `errorCode: "payout.rejection_reason_invalid"` (as implemented in `PayoutErrorCodes.RejectionReasonInvalid`) **or** a non-empty `errors.reason` array — check either, since both are present on the same response: show MSG157 inline, keep the dialog open and the user's text unchanged.
- On success: close dialog, refresh the detail, status shows `Rejected` with the reason.
- On 409, 404, 403, 500: same handling as Approve.
- Double-submit protection as in Approve.

## Behaviour rules

- Server decides everything. The browser never computes amounts, status transitions or permissions; the UI only enables actions based on the status returned by the detail API.
- After any successful decision, the list (if open in another tab) is not auto-refreshed. The detail re-fetches its own record.
- Bank data is shown exactly as the backend returns it. The UI never requests the full account number and has no reveal control (decision D3).
- Currency and date formatting use the existing shared formatters used by the UC-63 list.
- Keyboard: dialogs trap focus, Escape closes when no request is in flight, the reason field has an associated label and error text (WCAG 2.2 AA, per NFR 4.2.1).

## Responsive

- Breakpoints 320 / 390 / 768 / 1024 / 1440 px (TEAM_ENGINEERING_RULES V01). Bookings table scrolls horizontally inside its container at narrow widths; no page-level horizontal scroll.
- Dialogs are full-width on phones.

## Acceptance criteria

1. Staff opens `/admin/payouts/[id]` for a `PendingReview` request and sees all sections listed above.
2. Approve and Reject are the only actions that change status; each is confirmed in a dialog first.
3. Reason field enforces 10–500 characters after trim; submit is blocked on invalid input with the value kept.
4. Status returned by the server, not the client, controls which actions are visible.
5. No full account number appears in the DOM, network responses seen by the browser, or logs.
6. 401, 403, 404, 409, 500 and network failure each show the mapped message and the mapped next action.
7. Double click on Approve or Reject sends one request.
8. No console errors on the happy path.

## Tests (TEAM_ENGINEERING_RULES U01–U05, V01–V02)

- Unit: reason validator boundaries (9/10, 500/501, whitespace-only, null).
- Component: detail renders each status; actions hidden for non-`PendingReview`; masked account null shows "Not available".
- Service/proxy: error mapping for 401/403/404/409/500, malformed JSON and HTML-instead-of-JSON response are treated as failure, not success (U01).
- Race: stale detail response after a decision does not overwrite the newer status (U03).
- Double submit sends one request (U05).
- Direct navigation to `/admin/payouts/[id]`: missing, expired or tampered session → sign-in with the detail `returnUrl`; Administrator → access denied with no detail data loaded; Staff → screen.
- Reject 400 with the reason error code → MSG157 shown, input preserved.
- Responsive: screenshots at 320 / 390 / 768 / 1024 / 1440 px; no overflow (V01).

## Decisions

- **O1 (decided):** message from the catalogue, MSG157 (added to `dbo.Messages` in the BE branch by `database/migrations/20261014_add_msg157_rejection_reason_length.sql`). SRS §5.3 must be updated to list MSG157 as well.
- **O2 (decided):** UC-63 FE rebased onto `develop` (`feature/linhnv-view-payout-records`, 4 commits, 76 tests pass, tsc clean). This branch is rebased onto it.
- **O3 (decided):** FE is built in parallel with BE against the contract. Merge order: BE UC-63 → BE UC-64/73/74 → FE UC-63 → FE UC-64/73/74, after local end-to-end verification.

## Open questions

None.
