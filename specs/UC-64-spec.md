# UC-64 View Payout Details Frontend Specification

## Status

**Proposed — pending developer approval.** Companion to `Capstone_BE/specs/UC-64-spec.md`; the
BE contract there is the source of truth. Branch `feature/linhnv-view-payout-details` stacked on
UC-63 — this UC **enables** the disabled [View Details] row action on the Payout Records list
(UC-63 D11). Implementation follows `plans/UC-64-plan.md` only after approval.

## Sources and scope

- SRS §3.9.9.2: Administrator verifies one payout record's computation against its contributing
  bookings before settlement. Read-only; settlement (§3.9.9.3/UC-65) and export are **not**
  implemented here (disabled placeholders, D9/D10).
- BE contract: `GET /api/v1/admin/payouts/{id}` — see the BE spec for the DTO, the MSG128
  missing-record contract (D3), the omitted transfer section (D7), and the BR-130 audit (D8).

## Route and session contract

- Route: `/admin/payouts/[id]` (App Router dynamic segment; `ROUTES.admin.payoutDetails(id)`).
- Same-origin proxy: `GET /api/admin/payouts/[id]` server route handler reusing the shared admin
  cookie contract. **Trip-ID style strict validation** (canonical decimal `^[1-9]\d*$` within
  the signed 64-bit maximum; no `parseInt`/`Number`): invalid page-route ID renders the
  not-found boundary without an API call; invalid proxy ID answers `400` without contacting the
  backend — both boundaries share one validator (UC-59 pattern).
- Non-Administrator cannot load data; the backend remains the authorization authority.

## Screen content (read-only monitoring of one payout)

Single-column responsive page under the Admin console layout:

1. **Header** — back link to `/admin/payouts` (SRS [Back to List]), eyebrow
   `Administrator finance`, title `PO-{id}`, badges for status (badge + text, never color
   alone), identity line with the operator company name, and a manual Refresh control.
2. **Payout header card** — Payout Code, Tour Operator, Settlement Period
   (`dd/MM/yyyy – dd/MM/yyyy`), Requested Date (CR-07 `dd/MM/yyyy HH:mm`, "Not available" when
   null), Status.
3. **Amount breakdown card** — Gross Revenue, **Commission Rate** (percentage, e.g. `10%`),
   Commission Amount, **Net Payout Amount** (emphasized); all VND-formatted (BR-79).
4. **Contributing booking list** — table in an explicitly scrollable container: Booking Code,
   Tour Name, Paid Amount, Refunded Amount, Net Amount (per BE contract D6; the SRS "Completion
   Date" column is omitted — recorded schema gap). Empty list renders MSG128.
5. **Transfer information** — **omitted entirely** (BE D7: no bank-account storage exists in
   the schema; defect recorded). No placeholder card is invented.
6. **Action row** — **[Confirm Settlement] disabled** with an explanatory title (UC-65 owns the
   action, D9) and **[Export Payout Statement] disabled** with an explanatory title (D10:
   wrong-referenced MSG116, unapproved format — defect recorded). No other actions; BR-130
   auditing of the access happens server-side.

## States and error handling

| Situation | Behavior |
| --- | --- |
| Loading | Accessible `role="status"`; no data claimed before load. |
| Success | All sections above. |
| `404` (unknown or non-integer-boundary missing record) | Locked MSG128 text — `No records found matching your criteria.` (SRS §3.9.9.2 explicitly names MSG128 for this context, D3) — with a **back-to-list action** (SRS 2.a1). |
| `401` | Redirect to `/admin/login?returnUrl=<detail route>`. |
| `403` | Locked MSG126 alert; no data rendered. |
| `400` / `503` / network | MSG127-style unavailable alert with Retry (SRS 3.a1); a 400 renders the BE message verbatim (UC-63 amendment pattern). |

## Acceptance criteria

1. Every Payout Records row's [View Details] action becomes an **enabled** link to the detail
   route (UC-63 D11 fulfilled); direct navigation and browser refresh work on the detail route.
2. All BE fields render with CR-07/VND formatting; string IDs never round-trip through `Number`.
3. The trip-ID-style validator rejects the full reject list at both boundaries (page → not-found
   without API call; proxy → `400` without backend call).
4. Loading/success/empty-bookings/`404`/`401`/`403`/`400`/unavailable states behave exactly as
   the table above; the two placeholder buttons are visible, disabled, non-interactive, and
   explained.
5. Responsive at 320/768/1280px without page-level horizontal overflow; visible keyboard focus;
   semantic landmarks/headings; status never color-alone.
6. Proxy/service unit tests cover cookie forwarding, ID validation, status passthrough, DTO
   narrowing; screen tests cover every state, the disabled placeholders, and the empty-bookings
   MSG128 row.

## Non-goals

Settlement confirmation (UC-65), export (D10), bank-account display (D7 — future schema),
completion-date display (D6 gap), any mutation, any change to the UC-63 list contract beyond
enabling its row action.
