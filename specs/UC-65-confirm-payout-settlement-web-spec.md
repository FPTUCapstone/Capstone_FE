# UC-65 Confirm Payout Settlement — Web Screen Specification

## Status

Status: **Approved 2026-11-01** by the developer, including decisions D1–D6 as recommended below. D1: the
scope-matrix note "no dedicated route implied" predates the Staff/Administrator split; both roles now have
separate endpoints and screens, so Administrator gets its own queue and detail routes. D6 (inline English
strings) is accepted; MSG catalogue codes remain a possible later swap.

Backend contract: `Capstone_BE/docs/UC-65-api-contract.md` and `Capstone_BE/specs/UC-65-spec.md` (Approved
2026-11-01). BE is implemented and committed on `feature/uc65-confirm-payout-settlement` (not merged). The
FE is built against that contract (FE-first rule: a missing deployed endpoint is not a blocker, a hidden fake
fallback is).
Scope sources: UC catalogue UC-65 (Administrator, `ADMIN_WEB_ONLY`), `docs/WEB_SCOPE_MATRIX.md` row UC-65
("Detail-screen action plus dialog"), BR-105. The older SRS §3.9.9.3 (typed bank transfer reference,
`Confirmed` status) is superseded and is **not** built.

## What this replaces

`/admin/payouts/settlement` currently renders `PayoutSettlementUnavailableView` ("Pending Backend Settlement
Service", disabled placeholder form). It is removed and replaced by the queue below. The sidebar entry
"Payout Settlement" (Administrator, `AdminSidebar.tsx`) already points to this route and stays unchanged.

## Route and scope

- Actor: Administrator only. Staff keeps `/admin/payouts` and `/admin/payouts/[payoutId]`, which stay
  Staff-only and are not touched. Neither role may use the other's endpoints (BE returns `403`).
- Routes:
  - `/admin/payouts/settlement` — settlement queue (list).
  - `/admin/payouts/settlement/[payoutId]` — settlement detail with the `[Authorize settlement]` action and its
    confirmation dialog. (`settlement` is a static segment, so it wins over `[payoutId]`; no collision with the
    Staff detail route.)
- Server-side guard on both pages, same pattern as the existing pages: no valid session → redirect to sign-in
  with `returnUrl` set to the current URL; role other than Administrator → `AdminAccessDeniedView` before any
  data loads. The BFF check is a second layer.
- Web proxy only: the browser calls `app/api/admin/payout-settlements/...`; those handlers call the backend.
  The browser never calls the backend directly. The existing `/api/admin/payouts` proxy is Staff-only and is
  not reused.
- The Administrator only **authorizes**. No field for a bank transfer reference, no amount editing, no manual
  transfer, no retry. The amount shown is the persisted snapshot and is never recalculated in the browser.

## Screen 1 — Settlement queue

- Header: "Payout Settlement", subtitle that the Administrator authorizes approved payouts and the system
  sends them to the bank.
- Summary cards (from the response): record count, total net payout (sum over the filtered set).
- Filters (URL query, shareable): `Status` select, `Keyword` (≤ 200, payout code or company), `Period From`,
  `Period To`. Status options: **Approved for settlement** (default, sent as no `status` param),
  **Settlement processing**, **Settled**, **Settlement failed**. Any other value in the URL is normalized to the
  default. `periodFrom > periodTo` is blocked client-side with the existing message and also handled if BE
  returns `400 payout.invalid_period_range`.
- Table columns: Payout Code, Tour Operator, Settlement Period (+ "· N months" when `periodCount > 1`), Gross,
  Commission, Net Payout, Requested Date, Status badge, Action (`Review` link to the detail; for statuses
  other than `ApprovedForSettlement` the link text is `View`).
- Pagination: page size 20 (fixed by the proxy, as in UC-63), Previous/Next, `Page x of y`.
- States: loading; empty (`No data is available for the selected criteria.`); forbidden (403); invalid filters
  (400 with BE title); unavailable (5xx/network) with Retry; 401 → sign-in with return URL.
- A manual `Refresh` button reloads the list. The queue does not auto-refresh.

## Screen 2 — Settlement detail

Data: `GET /api/v1/admin/payout-settlements/{payoutId}` (never cached; each view is audited by BE, BR-130).

Sections:
1. **Header** — payout code, status badge, company name, settlement period, `Back to Payout Settlement`,
   `Refresh`.
2. **Amounts** — gross revenue, commission (`commissionRate` is a ratio: `0.1` → `10%`) and commission amount,
   net payout. VND, from the response only.
3. **Timeline facts** — requested at, reviewed at and reviewer id, settlement authorized at and authorizer id
   (only when present). Times in Asia/Ho_Chi_Minh via the existing formatter. User ids are shown as returned
   (`Staff user #5`); no names are invented.
4. **Beneficiary** — bank name, account holder, `maskedAccountNumber`. Missing values show `Not available`.
   The full account number is never requested, shown or logged; there is no reveal control.
5. **Outcome panel** — only when `outcome` is not `null` (status ≠ `ApprovedForSettlement`):
   - Status line from `status`.
   - `outcome.gatewayState` shown as plain text (table below).
   - `SettlementFailed`: the mapped failure message (table below) and, in small monospace text, the technical
     code for support (decision D5).
   - `reconciliationRequired = true`: a prominent warning banner (see below). No retry control anywhere.
6. **Action area** — described below.

`outcome.gatewayState` text:

| Value | Text |
| --- | --- |
| `NotQueued` | Not queued for transfer |
| `Pending` | Waiting to be sent to the bank |
| `Submitting` | Being sent to the bank |
| `Submitted` | Sent. Waiting for the bank's confirmation |
| `Completed` | Transfer completed (for a `SettlementFailed` payout: Transfer not completed, because `Completed` only means the worker is finished) |
| `ManualReconciliation` | Needs manual reconciliation |
| anything else | Status unavailable |

`outcome.failureCode` text (unknown or missing code → "The transfer could not be completed."):

| Code | Text |
| --- | --- |
| `gateway_rejected` | The bank or payment provider rejected the transfer. |
| `gateway_failed` | The transfer failed at the bank. |
| `gateway_cancelled` | The transfer was cancelled. |
| `gateway_reversed` | The transfer was returned by the bank. |
| `gateway_insufficient_balance` | The payout account does not have enough balance. |
| `gateway_invalid_account` | The beneficiary account was not accepted by the bank. |
| `gateway_unauthorized` | The payment provider refused our credentials. Contact the developers. |
| `gateway_unavailable` | The payment provider was unavailable. |
| `beneficiary_incomplete` | The beneficiary bank details are incomplete. |
| `beneficiary_unreadable` | The saved bank account could not be read. The Operator must save it again. |

Reconciliation banner (`reconciliationRequired`): "The system stopped checking after 24 hours without a final
answer from the payment provider. The payout stays Processing and no second transfer is created automatically.
Finance must reconcile payout `<code>` with the payment provider." The banner never offers a retry button.

### Action area and the authorize dialog

- `[Authorize settlement]` is shown only when the server-returned `status` is `ApprovedForSettlement`. In any
  other status the area shows the current status and what happens next, with no button.
- Pre-checks from the response (decision D3): when the beneficiary is incomplete or `bankBinResolved = false`,
  a warning is shown explaining that authorizing would be refused (the Operator must fix the bank name or bank
  account) and the button is disabled. The server stays the authority: a `422` is still handled if it arrives.
- The dialog (CR-05, built on the existing `ModerationDialog`): payout code, company, net payout amount, bank,
  account holder, masked account number, and the sentence "Confirming starts the bank transfer. The system sends
  it automatically; you do not transfer money yourself. This cannot be undone here."
  Buttons: `[Confirm settlement]`, `[Cancel]`. No input fields.
- Double submit: the confirm button is disabled while the request is in flight; exactly one request is sent.
- Result handling for `POST /api/v1/admin/payout-settlements/{payoutId}/authorize` (no body):

| Response | UI |
| --- | --- |
| `202` | Close the dialog, success message "Settlement authorized. The transfer is being processed.", re-fetch the detail (status becomes `SettlementProcessing`), start auto-refresh (decision D2). |
| `409` `payout.not_approved_for_settlement` | Close the dialog, warning "This payout is no longer waiting for authorization. The latest status has been reloaded.", re-fetch. The re-fetch is authoritative; `currentStatus` in the body is informational. |
| `422` `payout.beneficiary_incomplete` | Keep the dialog closed, show an error: ask the Operator to complete the bank account. Re-fetch. |
| `422` `payout.bank_bin_unresolved` | Error: the bank name does not match the standard bank list; ask the Operator to correct it. Re-fetch. |
| `422` `payout.amount_invalid` | Error: the amount cannot be sent; contact the developers. Do not offer to edit the amount. |
| `404` | "Payout unavailable", link back to the queue. |
| `403` | Access denied. `401` → sign-in with return URL. |
| `5xx` / network | Keep the dialog open with the message and a Retry (the same `[Confirm settlement]` button). The server's work-item uniqueness makes a repeat safe; the UI still never auto-retries. |

## Behaviour rules

- Server decides everything. Visible actions depend only on the `status` returned by the detail API. The browser
  computes no amounts, transitions or permissions.
- Strict response parsing: a malformed body, HTML instead of JSON, an unknown `status`, or a non-numeric amount
  is a failure, never a success (U01). Unknown `gatewayState` / `failureCode` use the fallbacks above.
- Stale responses never overwrite newer state (U03): each fetch is aborted on unmount and superseded fetches are
  ignored.
- Auto-refresh (decision D2) runs only while the status is `SettlementProcessing` and `reconciliationRequired` is
  false. It stops when the status leaves `SettlementProcessing`, on unmount, when the tab is hidden, and after a
  `401/403/404`.
- Currency and dates reuse the formatters from `payout-records/payoutRecords.ts`.
- Operator-facing wording never appears here; raw failure codes are shown only as the small support line in D5.
- Keyboard and accessibility: the dialog traps focus and closes on Escape unless a request is in flight; status
  changes are announced in an `aria-live="polite"` region; badges have text, not colour alone (WCAG 2.2 AA).
- Responsive: 320 / 390 / 768 / 1024 / 1440 px, table scrolls inside its container, dialog full-width on phones.

## Out of scope

Manual retry of `SettlementFailed`, a reconciliation screen, settlement batches, bank transfer reference input,
Operator bank-BIN capture (a UC-46 follow-up), the Staff review screens, and any change to the Staff routes or to
`PAYOUT_STATUSES` as used by the Staff list.

## Acceptance criteria

1. Administrator opens `/admin/payouts/settlement` and sees the queue of `ApprovedForSettlement` payouts, with the
   four status filters; `PayoutSettlementUnavailableView` is gone.
2. Staff and unauthenticated users are redirected or denied before any data loads, on both pages.
3. Opening a payout shows amounts, beneficiary (masked only) and, for non-approved statuses, the outcome.
4. `[Authorize settlement]` appears only for `ApprovedForSettlement`, is disabled with an explanation when
   `bankBinResolved` is false or the beneficiary is incomplete, and always goes through the confirmation dialog.
5. A successful authorize shows `SettlementProcessing` after the re-fetch and keeps refreshing until a final
   status or a reconciliation state; it stops on its own.
6. 409, 422 (three codes), 404, 403, 401, 5xx and network failure each show the mapped message and next action.
7. One click on `[Confirm settlement]` sends exactly one request, even on double click.
8. `reconciliationRequired` shows the banner and no retry control; `SettlementFailed` shows the mapped reason.
9. The full account number appears nowhere in the DOM, responses seen by the browser, or logs.
10. Staff payout screens and their tests are unchanged and still pass.

## Tests (TEAM_ENGINEERING_RULES U01–U05, V01–V02)

- Unit: queue search parse/serialize (default status, invalid status normalized, page bounds); queue and detail
  response parsers (valid, missing field, unknown status, wrong types, HTML body); failure-code and gateway-state
  mappers including the fallbacks.
- Proxy: Administrator allowed; Staff/other role `403`; no session `401` with session cleared; query allow-list
  and `pageSize` fixed; same-origin check on `POST`; no body forwarded on authorize; `4xx` bodies sanitized
  (`title`, `errorCode`, `currentStatus` only); `5xx` → `503`; non-JSON → `503`.
- Service: error mapping for 401/403/404/409/422/500, malformed JSON and HTML treated as failure.
- Component — queue: renders rows; filter changes update the URL; empty, 403, 400, 5xx + Retry.
- Component — detail: each status renders the right sections; button only for `ApprovedForSettlement`; disabled
  with warning for `bankBinResolved=false`; failure text per code; reconciliation banner without retry; masked
  account only.
- Component — dialog: one request on double click; each response row of the table above; focus trap and Escape.
- Auto-refresh: polls while `SettlementProcessing`, stops on a final status, on `reconciliationRequired`, on
  unmount and when the tab is hidden (fake timers); stale response ignored (U03).
- Pages: redirect with `returnUrl`; Staff → access denied with no data loaded; Administrator → screen.
- Existing Staff payout tests keep passing unchanged.
- Responsive screenshots at 320 / 390 / 768 / 1024 / 1440 px with no page-level overflow (V01).

## Decisions

Each decision shows the recommendation; the developer confirms or overrides it.

- **D1 — Routes.** Queue at the existing `/admin/payouts/settlement`; detail at
  `/admin/payouts/settlement/[payoutId]`. The scope matrix says "detail-screen action plus dialog, no dedicated
  route implied"; this keeps exactly that (the action lives on the detail screen) and reuses the sidebar entry
  that already exists. *Recommended.*
- **D2 — Auto-refresh.** Detail polls every 15 s while `SettlementProcessing` (no more than 24 h of page life
  matters; polling stops as listed in the rules). The queue is manual only. The BE has no push channel.
  *Recommended.*
- **D3 — Disable the button when `bankBinResolved` is false or the beneficiary is incomplete.** It avoids a
  guaranteed `422`; the BE remains the authority. *Recommended.* Alternative: keep it enabled and show only the
  warning.
- **D4 — Separate feature folder** `src/features/admin/payout-settlement/` and BFF path
  `/api/admin/payout-settlements`. The Staff `PAYOUT_STATUSES` constant is **not** widened, because the Staff
  list builds its status filter from it and would start offering settlement statuses Staff cannot query. The item
  parser in `payoutRecords.ts` gains an optional allowed-statuses argument (default unchanged) so the list shape
  is not duplicated. This differs from the contract note ("add the statuses to `PAYOUT_STATUSES`") on purpose.
  *Recommended.*
- **D5 — Show the technical failure code to the Administrator** as a small monospace line under the friendly
  text, to help support and reconciliation. Operators never see it (they get the generic notification from BE).
  *Recommended.* Alternative: friendly text only.
- **D6 — UI language and messages.** English copy, like the other admin screens. No MSG catalogue codes are
  assigned to UC-65 settlement states; messages are inline strings kept in one resource object. If the PO wants
  catalogue codes, they are swapped in without changing behaviour.

## Open questions

1. Does the PO want catalogue message codes (MSG) for the settlement confirmation and result messages, or are the
   inline texts above acceptable? (D6)
2. UAT end-to-end needs payouts whose beneficiary was saved through the deployed app: the Data Protection key
   ring is not persisted in the BE, so seeded ciphertext cannot be decrypted by the deployed backend. This is a
   BE/ops matter, not an FE blocker; it only affects when a live UAT walk-through is possible.
