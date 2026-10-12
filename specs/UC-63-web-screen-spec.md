# UC-63 Payout Records — Staff Web Screen Specification

## Route and scope

- `/admin/payouts` is a shared internal route. This specification defines only the
  **Staff UC-63 review scope**.
- The server-side role guard selects scope from the verified session. Staff receives the
  review queue; Administrator settlement scope is UC-65 and is not implemented as a
  substitute for Staff data.
- Data comes only from same-origin `/api/admin/payouts`. The BFF forwards an allow-listed
  search query and never exposes a backend token to the browser.
- This is a read-only screen. UC-64 detail/review, UC-73 approval, UC-74 rejection, and
  UC-65 settlement authorization are separate deliveries.

## Layout

- Header: eyebrow `Staff finance`, title `Payout Records`, description `Review payout
  requests awaiting Staff assessment.`
- Two filtered-result summaries: `Records` (`totalCount`) and `Total Net Payout`
  (`totalAmount`). They reflect the current filters; they are not global dashboard metrics.
- Filter panel: Keyword, Status (`PendingReview`, `ApprovedForSettlement`, `Rejected`),
  Period From/To, Apply Filters, Clear.
- Table in a named, keyboard-focusable horizontal-scroll region on small screens:
  Payout Code, Tour Operator, Settlement Period, Gross Revenue, Commission, Net Payout,
  Requested Date, Status, Action.
- The `Review` row action is disabled with the accessible explanation `Payout review details
  will become available after UC-64 is delivered.` It must not navigate or mutate state.
- Footer: filtered record total and Previous/Next controls. The URL preserves all filter
  criteria while paging.

## Field mapping

| UI element | Staff review-query field / rule |
| --- | --- |
| Keyword | `keyword`, matching derived payout code or operator company name |
| Status | `status`, one of the three Staff-visible statuses |
| Period | `periodFrom` / `periodTo`, ISO `yyyy-MM-dd` transport format |
| Page | `pageNumber`, with BFF-enforced `pageSize=20` |
| Summary | `totalCount`, `totalAmount` for the filtered result |
| Payout code | Backend-provided derived string; never reconstructed from a numeric ID |
| Operator | `operator.companyName` only |
| Period | `periodStart`–`periodEnd`, shown as `dd/MM/yyyy – dd/MM/yyyy` |
| Money | Persisted snapshot fields, formatted as VND |
| Requested date | `requestedAtUtc`, shown in `Asia/Ho_Chi_Minh`; `Not available` if null |

String IDs remain strings. The screen never displays bank details, gateway references,
reviewer identity, administrator authorization data, or worker execution outcomes.

## States and accessibility

- Loading: accessible status indicator; no stale rows represented as current.
- Empty: MSG128 and retained filters.
- Invalid date range: inline validation at both controls and no request.
- `401`: redirect to sign-in with this route as `returnUrl`.
- `403`: MSG126 and no protected records.
- Backend `400`: safe validation message only, with no Retry.
- Network/`503`: MSG127 and Retry.
- Use one `h1`, semantic table caption/headers, labelled form controls, visible focus, and
  status text alongside badges. At 320px the table scrolls within its region rather than
  producing page-level horizontal overflow.
