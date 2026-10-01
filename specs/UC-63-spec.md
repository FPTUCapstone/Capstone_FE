# UC-63 View Payout Records Frontend Specification

## Status

**Approved 2026-10-01** — rewritten against SRS §3.9.9.1 after the first draft was rejected
(invented summary counters, missing columns, missing row action). Companion to
`Capstone_BE/specs/UC-63-spec.md`; the BE contract there is the source of truth. Decisions
D1–D10 (BE spec) apply here; implementation follows `plans/UC-63-plan.md`.

## Sources and scope

- SRS §3.9.9.1: screen **Payout Settlement** — Administrator reviews payout records of Tour
  Operators (operator info, settlement period, backend-calculated amounts, settlement status,
  summary counters). Read-only; settlement confirmation belongs to §3.9.9.3 (UC-65) and details
  to §3.9.9.2 (UC-64).
- BE contract: `GET /api/v1/admin/payouts` with `keyword` (Payout Code or operator company
  name), `status` (five-value superset, D3a), `periodFrom`/`periodTo`, CR-01 pagination, and
  the three filtered summary counters (D4). List columns per SRS order: Payout Code, Tour
  Operator, Settlement Period, Gross Revenue, Commission, Net Payout, Requested Date, Status —
  plus the **[View Details] row action** (D11 below).
- Screen belongs to Web Batch 5; listed in the Admin navigation. Precedent: the approved UC-68
  audit-log list on this baseline.

## Route and session contract

- Route: `/admin/payouts`, added to `ROUTES.admin` and the Admin console navigation
  ("Payout Records"; the SRS screen name "Payout Settlement" is recorded here for traceability).
- Same-origin proxy: `GET /api/admin/payouts` server route handler reusing the shared admin
  cookie contract — query keys allow-listed (`keyword`, `status`, `periodFrom`, `periodTo`,
  `pageNumber`, `pageSize`) before forwarding; the browser never handles a bearer token.
- Non-Administrator cannot load data; the backend remains the authorization authority.

## Screen content (read-only)

Single-column responsive page under the Admin console layout:

1. **Header** — eyebrow `Administrator finance`, title `Payout Records`, concise description.
2. **Summary cards** (recomputed with the applied filters, D4) —
   `Pending Requests` (count), `Total Requested Amount` (SUM over Pending+Requested),
   `Total Confirmed Amount` (SUM over Confirmed+Paid); VND formatted (BR-79).
3. **Filter panel** — Keyword (placeholder "Payout code or operator name"), Status
   (`All` + the five lifecycle values — superset per D3a, SRS defect noted), Period From,
   Period To; Apply Filters and Clear. Client-side validation mirrors BE rules: an inverted
   range shows the proposed MSG134 wording inline at the date controls and sends no request
   (SRS's MSG29 reference is a recorded defect — D10).
4. **Payout table** — in an explicitly scrollable container, columns in the SRS order:
   Payout Code (`PO-{id}`), Tour Operator (company name), Settlement Period
   (`dd/MM/yyyy – dd/MM/yyyy`), Gross Revenue, Commission, Net Payout (right-aligned numeric
   column), Requested Date (`dd/MM/yyyy` UTC+7 per CR-07; "Not available" when null), Status
   (badge + text), and the **row action**.
5. **Row action [View Details] (D11)** — rendered on every row per the SRS screen spec, in a
   **disabled** state with an explanatory accessible title ("Settlement details will become
   available after UC-64 is approved"). It must not navigate anywhere: creating the detail
   route is UC-64 scope. The button becomes enabled as a one-line change once UC-64 lands.
6. **Footer** — total record text plus Previous/Next pagination; filters remain applied while
   browsing (PC-03 — the search is serialized into the URL query).

## States and error handling

| Situation | Behavior |
| --- | --- |
| Loading | Accessible `role="status"`; stale rows never presented as current. |
| Success | Summary + table; empty match renders locked MSG128 (`No data is available for the selected criteria.`) and keeps the filters (SRS 5.a1). |
| `401` | Redirect to `/admin/login?returnUrl=%2Fadmin%2Fpayouts`. |
| `403` | Locked MSG126 alert; no data rendered. |
| `400` (invalid filters, incl. inverted period range → proposed MSG134) / `503` / network | Locked MSG127 alert with Retry; retry refetches without a full page reload (SRS 5.a2). |

## Acceptance criteria

1. The route supports direct navigation and browser refresh; the nav entry highlights the
   active workspace; filters persist across pagination.
2. Summary cards and table render the exact BE fields: derived `payoutCode` verbatim, money as
   VND (`Intl.NumberFormat`), periods `dd/MM/yyyy`, `requestedAtUtc` as CR-07 date with
   "Not available" for null; string IDs never round-trip through `Number`.
3. The table shows exactly the SRS columns — no commission rate, no operator email (D6) — and
   the disabled [View Details] action per row (D11).
4. Filters submit only allow-listed query keys; the inverted range is blocked client-side with
   the proposed MSG134 wording before any request; Clear resets to the default search.
5. Loading/success/empty/`401`/`403`/`400`/unavailable states behave exactly as the table above.
6. Responsive at 320/768/1280px without page-level horizontal overflow (table scrolls inside
   its own region); visible keyboard focus; semantic landmarks and headings; status conveyed by
   text, never color alone.
7. Proxy/service unit tests cover cookie forwarding, query-key allow-listing, status mapping,
   and DTO parsing (derived code, string IDs, numeric money, nullable requested date); screen
   tests cover every state above, the disabled row action, and pagination with persisted
   filters.

## Non-goals

Detail view (UC-64 — the row action stays disabled), confirm/settle actions (UC-65),
operator-side request flow (UC-46), export, and any mutation — all excluded until separately
approved.
