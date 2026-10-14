# UC-63 View Payout Records Frontend Specification

## Status

**Amended 2026-10-12** against the latest SRS Use Case catalogue and the approved
shared-payout-list decision. UC-63 is the **Staff** review scope. The shared route does
not give Staff settlement authority or give Administrator Staff-review authority.

The companion backend specification at `Capstone_BE/specs/UC-63-spec.md` is the
authoritative API and authorization contract.

## Authoritative payout workflow

```text
PendingReview --Staff approve (UC-73)--> ApprovedForSettlement
PendingReview --Staff reject (UC-74)--> Rejected
ApprovedForSettlement --Administrator authorize (UC-65)--> SettlementProcessing
SettlementProcessing --worker/gateway success--> Settled
SettlementProcessing --worker/gateway final failure--> SettlementFailed
```

UC-63 is read-only. It does not approve, reject, authorize, settle, recalculate a
monetary amount, or invoke a payment gateway.

## Shared route and role-resolved scope

`/admin/payouts` is a shared internal route. The server determines scope from the
verified session role; query parameters and client state must never select a scope.

| Role | Scope | Default status | This delivery |
| --- | --- | --- | --- |
| Staff | UC-63 review queue | `PendingReview` | Implemented by this specification. |
| Administrator | UC-65 settlement queue | `ApprovedForSettlement` | Separate UC-65 delivery and separately authorized backend query. |

Staff may access only the review query and only the statuses `PendingReview`,
`ApprovedForSettlement`, and `Rejected`. An Administrator must not receive Staff data
or Staff actions. The future Administrator settlement screen must not receive Staff
review actions or scope.

## Staff route and BFF contract

- Route: `/admin/payouts` under the internal console layout.
- Staff BFF query: same-origin `GET /api/admin/payouts`, backed by the Staff-only review
  endpoint. It forwards only `keyword`, `status`, `periodFrom`, `periodTo`, and `pageNumber`;
  the BFF appends a fixed `pageSize=20` and ignores any browser-supplied page size.
- The browser never receives or sends a bearer token. The BFF uses the existing signed
  administration session/cookie helpers.
- The future Administrator settlement BFF/query belongs to UC-65. UC-63 must not fake an
  Administrator result while that contract is unavailable.

## Staff screen content

1. **Header** — eyebrow `Staff finance`, title `Payout Records`, and a concise review-queue
   description.
2. **Filtered result summary** — `totalCount` and `totalAmount` supplied by the backend for
   the current Staff filter. These are not dashboard-wide pending-review metrics.
3. **Filters** — Keyword (payout code or operator company name), Staff-visible Status,
   Period From, Period To, Apply Filters, and Clear. An inverted range is blocked before a
   request and shows the approved payout-period validation message inline.
4. **Table** — Payout Code, Tour Operator, Settlement Period, Gross Revenue, Commission,
   Net Payout, Requested Date, and Status. Values are backend-calculated snapshots; money
   uses VND formatting. No bank account, gateway reference, reviewer identity,
   authorization, or settlement-execution data appears.
5. **Review action** — a disabled, clearly explained placeholder until UC-64 is delivered.
   It does not navigate or mutate a record.
6. **Footer** — current filtered total plus pagination. Filters remain in the URL while
   paging.

## States and error handling

| Situation | Required behaviour |
| --- | --- |
| Loading | Accessible `role="status"`; stale rows are not presented as current. |
| Success | Render Staff summary and table. String IDs never round-trip through `Number`. |
| Empty | Locked MSG128 and retain filters. |
| `401` | Redirect to `/admin/login?returnUrl=%2Fadmin%2Fpayouts`. |
| `403` | Locked MSG126; render no protected payout data. |
| `400` | Show only the safe backend ProblemDetails message. Do not present it as a system outage or show Retry. |
| Network/`503` | Locked MSG127 with Retry; retry uses the same search criteria. |

## Acceptance criteria

1. A valid Staff session loads the default `PendingReview` queue through direct navigation
   and refresh; a non-Staff session never receives Staff records or Staff review actions.
2. Only Staff-visible statuses can be selected or forwarded. Settlement execution statuses
   are absent from UC-63.
3. The BFF allow-lists search keys, fixes `pageSize=20`, does not expose a token, clears the
   administration session only on upstream `401`, and preserves it on upstream `403`.
4. Filtered `totalCount` and `totalAmount` match the current backend result. The UI does not
   invent legacy Pending/Requested/Confirmed/Paid metrics.
5. Filters, pagination, empty, loading, `400`, `401`, `403`, and unavailable states are
   covered by service/proxy/screen tests.
6. The screen is usable at 320/768/1280px, retains keyboard focus visibility, uses semantic
   headings/table markup, and does not convey status with colour alone.

## Non-goals

UC-64 request detail/review, UC-73 approve, UC-74 reject, UC-65 Administrator authorization,
payout worker/outbox processing, gateway integration, export, and any mutation are excluded.
