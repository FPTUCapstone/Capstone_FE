# UC-69 Respond to Post-Trip Complaint — Frontend Specification

## 1. Scope

This feature provides the Next.js Tour Operator experience for UC-69: list owned post-trip complaints, open complaint details and respond with full acceptance, a partial-refund proposal or rejection. It consumes backend authority; it must not calculate a refundable amount, infer ownership, create a refund directly or call a payment gateway.

The SRS makes Tour Operator functions available on web and mobile except where explicitly restricted. This specification covers the Next.js web client only; the Flutter client must implement the same API contract in a companion delivery before UC-69 can be declared fully cross-platform.

Related flows are explicitly separate:

- UC-68: Traveler submits the complaint and evidence.
- UC-75: Traveler accepts or declines a partial proposal.
- UC-42 and UC-67: an approved complaint refund is confirmed, reconciled and paid by existing refund flows.

## 2. SRS alignment

| Requirement | UI behaviour |
| --- | --- |
| UC-69 / BR-151 | Show backend response deadline and disable submission when `availableActions` is empty or the record is expired. |
| UC-75 / BR-153 | After a partial proposal succeeds, show the backend-provided three-day Traveler response deadline; the web UI does not make the Traveler decision. |
| BR-150 / MSG162 | Partial proposal is client-validated against backend `refundableAmount`; server validation remains authoritative. |
| BR-152 / MSG163 | Rejection requires a non-whitespace reason and shows an inline error. |
| MSG164 | On a successful response, show the server-confirmed outcome and refresh list/detail state. |
| MSG165 | Show the response-window/state error inline, preserve entered data and reload authoritative detail. |
| CR-01/02/03/04/05 | Paginate at 20 by default, submit search explicitly, use inline validation and a confirmation dialog before the irreversible response. |

## 3. Routes and navigation

- List: `/partner/post-trip-complaints`.
- Detail/response: `/partner/post-trip-complaints/[complaintId]`.
- Add `Post-trip complaints` to the Partner sidebar under booking operations.
- Preserve page, status filter and search in the URL when returning from detail.

The route guard requires the existing Tour Operator session. Server authorization is mandatory even when the UI does not show a record.

## 4. Backend contract

The client uses only these backend endpoints:

| Method | Endpoint | Client usage |
| --- | --- | --- |
| `GET` | `/api/v1/operator/post-trip-complaints?status=&page=&pageSize=` | Owned paginated list. |
| `GET` | `/api/v1/operator/post-trip-complaints/{complaintId}` | Detail, evidence links, deadline, amount and allowed actions. |
| `POST` | `/api/v1/operator/post-trip-complaints/{complaintId}/response` | Submit confirmed response with a generated `Idempotency-Key`. |

The response form sends `action`, `proposedRefundAmount` only for a partial proposal, and `rejectionReason` only for rejection. Detail and response results include immutable `refundableAmount`, `responseDeadline`, optional `travelerResponseDeadline`, `status`, `response`, `evidence[]`, and `availableActions`. The client never sends booking ownership, payment data, refundable amount, deadline or refund status values.

## 5. List screen

Columns: complaint reference, booking code, tour package, submitted timestamp, response deadline, status and action link. Filters: status and submitted-date range; optional explicit search by complaint/booking code. Use the established empty/error/loading/pagination patterns.

For an expired complaint, render `Expired` and a non-actionable `View` link. Do not imply the operator can resolve a contract dispute from this screen.

## 6. Detail and response screen

### Read-only complaint section

Show booking code, tour name, submission timestamp, response deadline, category, detail, backend-provided immutable refundable amount and evidence items. Evidence opens the backend-provided time-limited URL in a safe new tab (`noopener,noreferrer`); never manufacture a URL from storage identifiers.

### Response form

Use a single radio action selector:

- **Accept full refund:** display the backend-provided immutable refundable amount; no editable amount.
- **Propose partial refund:** currency input in VND; required, greater than zero and no more than `refundableAmount`.
- **Reject:** required reason textarea.

Before submit, use a confirmation dialog that identifies the selected business outcome. On success, replace stale form data with returned detail/status and show MSG164. Full acceptance must say only that the refund has entered the refund-confirmation workflow; it must never claim the Traveler was already paid.

## 7. Errors, accessibility and security

- Map server error codes/messages to MSG162, MSG163, MSG165, MSG126 and MSG127; prefer the server message when it is safe to display.
- Inline validation fields have associated labels, `aria-describedby` and error text. Focus the first invalid field after submit.
- Disable duplicate submission while pending. Preserve draft inputs after recoverable network/state failure.
- Never render permanent evidence URLs, payment references, bank details or internal storage metadata.
- Use semantic table/list controls and keyboard-operable evidence/action controls.

## 8. Acceptance criteria

1. The owning operator can list, filter, paginate and open only its complaints.
2. Detail shows authoritative deadline, refundable amount and safe evidence links.
3. Full acceptance has no editable amount and, after confirmation, records the backend result once.
4. Partial proposals cannot be submitted empty, non-positive or above the displayed immutable amount; a successful proposal shows the authoritative three-day Traveler deadline and server rejection remains visible inline.
5. Reject requires a non-empty reason; server field errors remain visible and do not erase the draft.
6. Expired/non-actionable records cannot be submitted; an MSG165 response refreshes detail safely.
7. The UI does not call a payment/refund endpoint directly and does not claim a refund is paid before UC-42/67.

## 9. Out of scope

- UC-68 complaint submission and uploads.
- UC-75 traveler proposal decision.
- Staff/Administrator dispute handling.
- Any payment gateway, payout, complaint financial formula or evidence storage implementation.
