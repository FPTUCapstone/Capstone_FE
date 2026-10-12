# UC-63 View Payout Records Frontend Implementation Plan

## Status and baseline

**Replanned 2026-10-12** after the approved shared-route decision. UC-63 is the Staff
review queue at `/admin/payouts`; UC-65 owns the separately authorized Administrator
settlement scope. Do not infer role/scope from a URL parameter or reuse Staff data for an
Administrator view.

Before implementation, align the FE contract with
`Capstone_BE/specs/UC-63-spec.md`. Do not begin a visual change until the updated web-screen
specification is approved.

## Task 1 — Replace legacy payout contract and tests

Update `src/features/admin/payout-records/` contracts/tests before UI code:

- Replace `Pending`, `Requested`, `Confirmed`, and `Paid` with Staff-visible
  `PendingReview`, `ApprovedForSettlement`, and `Rejected`.
- Parse string IDs and backend-provided payout codes without coercion to `number`.
- Model persisted snapshot money values plus `totalCount` and `totalAmount` for the current
  filtered result. Remove legacy three-summary-card assumptions.
- Validate an inverted period range before calling the service.

**Verification:** focused contract tests prove malformed status/date/ID data is rejected;
allowed statuses and summary semantics are accepted.

## Task 2 — Staff BFF proxy and service

- Keep the Staff review BFF as same-origin `/api/admin/payouts`.
- Allow-list only `keyword`, `status`, `periodFrom`, `periodTo`, `pageNumber`; set
  `pageSize=20` server-side rather than trusting a browser value.
- Reuse signed administration-session helpers. Do not add an Authorization header to browser
  fetches or return upstream internals.
- Map upstream `401` to session cleanup, preserve a valid session on `403`, surface safe
  `400` validation messages, and map network/`503` to unavailable.

**Verification:** proxy/service tests cover modified, missing, expired, and token-mismatched
sessions; query allow-listing; `401` cookie cleanup; `403` cookie preservation; safe error
mapping; and malformed success payloads.

## Task 3 — Role-resolved route composition

- Add a server-side role guard before rendering protected payout content.
- Staff renders the UC-63 review queue with default `PendingReview`.
- Do not let an Administrator render Staff records or actions. The separately authorized
  Administrator settlement composition is deferred to UC-65 rather than mocked here.
- Preserve direct navigation and safe sign-in return URLs.

**Verification:** route-level tests cover valid Staff, valid Administrator, missing/expired/
modified session, and direct refresh.

## Task 4 — Read-only Staff list UI

- Update the header, two filtered summaries, filter options, table status labels, and empty/
  error copy to the Staff specification.
- Keep Review disabled until UC-64, with an accessible explanation.
- Preserve URL filters across pagination; render a scrollable table region at narrow widths.
- Do not add approve, reject, settlement, export, bank, gateway, or fake action behaviour.

**Verification:** screen tests cover loading, success, empty MSG128, invalid client range,
safe backend `400`, `401`, `403`, unavailable/retry, disabled Review, pagination, URL
persistence, keyboard focus, and 320px table overflow containment.

## Task 5 — Full verification and handoff

1. Run focused feature tests.
2. Run `npm run lint`, `npm run typecheck`, and `npm run build` on the exact branch head.
3. Manually verify Staff direct navigation/filter/pagination and denied non-Staff behaviour
   against a seeded backend.
4. Record that Administrator settlement scope is intentionally deferred to UC-65; do not
   claim it is integrated before its authorized backend query exists.

## Non-goals

UC-64 detail/review, UC-73 approval, UC-74 rejection, UC-65 authorization,
payout-processing worker/gateway, export, and all payout mutations are out of scope.
