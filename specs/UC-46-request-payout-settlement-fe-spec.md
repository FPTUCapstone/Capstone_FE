# UC-46 — Request Payout Settlement (Web Specification)

## Status

Draft v3 — pending developer/PO approval. Depends on `Capstone_BE/specs/UC-46-request-payout-settlement-be-spec.md` v3 and its OPEN-1 to OPEN-6. Items marked **[OPEN-n]** depend on those decisions.

## Scope

Tour Operator payout workspace at `/partner/payouts` (existing route). It shows settlement months with server-computed amounts, the beneficiary bank account in masked form, the payout history, and the request and cancel actions.

Included:
- Settlement month table with server amounts and request eligibility.
- Beneficiary bank card: masked display, protected edit form.
- Request confirmation dialog, including any adjustments the server applies.
- Payout history with cancel action where allowed.
- Cancel confirmation dialog.

Excluded:
- Any financial calculation in the browser. Every amount, count, and status comes from the server response.
- A payout detail screen. The SRS defines no operator detail view for UC-46.
- Staff review (UC-64/73/74) and Administrator settlement (UC-65) screens.
- Mobile. Web-first release, consistent with UC-44 and UC-45 (BE OPEN-6).

Existing components under `src/features/operator/finance/components/payouts/` are reused. Their demo behaviour, including displaying the full account number, is replaced in production.

## Business and display rules

- **BR-105:** the page requires an authenticated operator session. Missing session redirects to sign-in with `returnUrl`. A non-operator role shows the access message (MSG126).
- **BR-109 / BR-111 / BR-112:** the browser never computes or re-derives gross, discounts, refunds, commission, net sales, adjustments, or payable net. It displays server values only.
- **Settlement month:** a month is the Vietnam calendar month of when each booking becomes payout-eligible. The UI labels it "Settlement month" and never calls it a payment month.
- **Labels:** the settlement card shows `Payments Received − Refunded − Commission = Payable Net`, matching UC-44. The amount requested is labelled **Net Payout**. The term Net Amount is not used on this page.
- **CR-07:** dates arrive as `YYYY-MM-DD` and display as `dd/MM/yyyy` in `Asia/Ho_Chi_Minh`.
- **CR-05:** [Request Payout] and [Cancel Request] open a confirmation dialog. The action runs only after explicit confirm.

## Settlement months

Controls: year selector (default current year). Columns: Month, Eligible Bookings, Payments Received, Refunded, Commission, Adjustments Outstanding, Payable Net, Status, Action.

- Action [Request Payout] is enabled only when `requestable` is true.
- When disabled, the server's `blockReason` is shown through `aria-describedby`, not only a tooltip.
- A month with an active payout shows that payout's code and status instead of the button.
- Empty result for the selected year: MSG128.

## Beneficiary bank card

Display:
- Account Holder, Bank Name, and `maskedAccountNumber` from the server.
- When nothing is saved, show "Not set".
- The browser never receives or renders the full account number.

Edit form:
- The account number input always starts empty. The masked value from GET is never used to fill it.
- All three fields are required. Empty required field: inline MSG01. Server validation is authoritative.
- On success, show the new masked value and a success notice; clear the account number from state.
- On failure, show MSG127 with Retry. Typed values stay in the form.

## Request confirmation dialog

- Shows the month, Payable Net, and the destination bank as masked text.
- Shows the adjustments the server will apply, when any: "Adjustments from earlier refunds: −X VND". This line is display-only; the amount comes from the server.
- Explains that the request goes to review and cannot be edited after submission.
- A checkbox confirms the bank information. Confirm stays disabled until it is ticked and while in flight.
- On success: close the dialog, refresh months and history, and show the new payout code with status `PendingReview`.
- Errors shown inline; the dialog stays open:
  - `MONTH_NOT_CLOSED`, `NO_ELIGIBLE_BOOKING`, `PAYOUT_NOT_REQUESTABLE`, `ACTIVE_PAYOUT_EXISTS`, `BELOW_MINIMUM_PAYOUT`: display per the mapping table below.
- `SYSTEM_ERROR` (500 or network): MSG127 with Retry. Retry resubmits the same month.

## Payout history

Columns: Payout Code, Settlement Month, Payable Net, Status, Requested Date, Settled Date, Actions.

- [Cancel Request] is shown only when `cancellable` is true.
- A rejected row shows the rejection reason.
- A `SettlementFailed` row shows that payment is being retried. No operator action is offered.
- Empty result: "No payout requests have been submitted yet."

## Cancel confirmation dialog

- Shows payout code and Payable Net.
- Buttons: [Confirm Cancellation] and [Keep Request].
- On success: MSG129; refresh months so the month can be requested again.
- On 409 `PAYOUT_NOT_CANCELLABLE`: re-fetch and show the current status. Actions stay disabled until the re-fetch completes. No automatic retry.

## States

| Situation | UI behaviour |
|---|---|
| Loading | Skeleton per section; action buttons disabled. |
| No session (401) | Redirect to sign-in with `returnUrl`. |
| Not an approved operator (403) | MSG126; no data loaded. |
| Payout not found (404) | MSG128 with link back to the list. |
| Server or network failure (500) | MSG127 with Retry, per section, so one failing section does not hide the others. |

## Data and BFF contract

The browser calls only same-origin route handlers. Each handler reads the session cookie, exchanges it for an access token, verifies the operator role, and forwards to the backend, following `operatorRevenueProxy.ts`.

| BFF route | Backend |
|---|---|
| `GET /api/operator/payouts/settlement-months?year=` | `GET /api/v1/operator/payouts/settlement-months?year=` |
| `POST /api/operator/payouts` | `POST /api/v1/operator/payouts` |
| `GET /api/operator/payouts` | `GET /api/v1/operator/payouts` |
| `POST /api/operator/payouts/[payoutCode]/cancel` | `POST /api/v1/operator/payouts/{payoutCode}/cancel` |
| `GET` / `PUT /api/operator/payouts/bank-account` | `GET` / `PUT /api/v1/operator/payouts/bank-account` |

The request body contains only `year` and `month`. The browser never sends amounts, totals, adjustments, or payable net.

`operatorPayoutService.ts` switches from `PENDING_BE_INTEGRATION` to these routes in production. Demo fixtures stay behind `isFinanceDemoAllowedInCurrentEnv()` and `?demo=1`.

## Error code to display mapping

The service maps backend `errorCode` values to display keys in one table. The UI never matches raw strings.

| `errorCode` | Display |
|---|---|
| `VALIDATION_REQUIRED_FIELD` | MSG01 |
| `OPERATOR_NOT_APPROVED` | MSG126 |
| `NO_ELIGIBLE_BOOKING` | MSG128 |
| `PAYOUT_NOT_FOUND` | MSG128 |
| `SYSTEM_ERROR` | MSG127 |
| `INVALID_SETTLEMENT_MONTH`, `MONTH_NOT_CLOSED`, `PAYOUT_NOT_REQUESTABLE`, `ACTIVE_PAYOUT_EXISTS`, `BELOW_MINIMUM_PAYOUT`, `PAYOUT_NOT_CANCELLABLE` | Placeholder text until PO assigns message numbers (BE OPEN-4) |
| Cancel success | MSG129 |

Do not use MSG29, MSG31, MSG118, MSG119, MSG120, or MSG131–MSG136 for these outcomes.

## Security and privacy rules

- The full account number never appears in the DOM, logs, analytics, URLs, or client state after a successful save.
- Masked values come only from the server.
- Payout codes in URLs are opaque identifiers; no financial values in URLs.
- Route handlers do not forward or log the session cookie.

## Accessibility and responsive behaviour

- Tables scroll horizontally on tablet and mobile widths; no page-level horizontal scroll.
- Dialogs trap focus, return focus to the trigger on close, and announce results through a live region.
- Disabled controls explain why through `aria-describedby`.
- Inputs have visible labels; the account number input uses `autocomplete="off"`.

## Acceptance criteria

- Every amount, count, status, and adjustment shown matches the server response for the same month.
- A request can be created only when the server reports `requestable`; the browser does not decide eligibility.
- The bank card never shows the full account number, and the edit form does not prefill it.
- Each error code in the mapping table produces the specified display; a 409 re-fetches before re-enabling actions.
- Layout works at 375 px and desktop widths.
- Mobile is not implemented; the deferral is recorded in the scope matrix (BE OPEN-6).
