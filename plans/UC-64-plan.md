# UC-64 View Payout Details Frontend Implementation Plan

Status: **Draft — contingent on approval of `specs/UC-64-spec.md` (FE) and the BE spec/plan.**
Tasks are atomic and sequenced; tests come first per task.

Branch: `feature/linhnv-view-payout-details` — stacked on UC-63; inherits its proxy/service/
screen patterns and the Payout Records list with the disabled [View Details] action.

## Task 1 — Types and contract parsing

`src/features/admin/payout-details/`:

- `payoutDetails.ts`: DTO types mirroring the BE response (string IDs, numeric money,
  `commissionRate`, nullable `requestedAtUtc`, `bookings[]`), status constants, a runtime
  narrowing guard, and reuse of the shared strict ID validator pattern from UC-59
  (`isValidPayoutId`: canonical decimal `^[1-9]\d*$`, signed 64-bit maximum, digit-string
  comparison, no `parseInt`/`Number`).
- Contract tests first: valid payload parses; derived `payoutCode` verbatim; null requested
  date; malformed statuses/periods/ids/money rejected.

DoD: `npx vitest run src/features/admin/payout-details` green.

## Task 2 — Same-origin proxy route

- `payoutDetailsProxy.ts` (server-only) + `app/api/admin/payouts/[id]/route.ts` reusing the
  shared admin cookie helpers: validate `[id]` with the shared validator (reject → `400`
  without a backend call), read `tripmate_admin_access_token`, forward GET, pass upstream
  statuses through, clear the session cookie on upstream `401`.
- Proxy tests: cookie forwarding, ID reject list, `404`/`403`/`503` passthrough, cookie
  clearing, backend-unreachable mapping.

## Task 3 — Service client

`payoutDetailsService.ts` calling the same-origin proxy and mapping responses/errors to the
screen state model (`loading | ready | not-found | forbidden | invalid-request | unavailable`),
carrying the upstream `errorCode`/message for 400s. Tests: URL/method/credentials, status
mapping, malformed-success rejection, network failure mapping.

## Task 4 — Detail screen (TDD per state)

`PayoutDetailsScreen.tsx` built to `specs/UC-64-web-screen-spec.md`: header + back link +
Refresh, payout header card, amount breakdown card (Net Payout emphasized), contributing
booking table (no Completion Date column — recorded gap), MSG128 empty-bookings row, and the
two **disabled** placeholders ([Confirm Settlement], [Export Payout Statement]) with titles.
No navigation or mutation.

Screen tests, in order: loading → success renders all sections with formatting; empty bookings
MSG128 row; `404` MSG128 wording + back-to-list; `401` redirect with `returnUrl`; `403` MSG126;
`400` with the verbatim BE message and no Retry; `503` unavailable + Retry; both placeholders
disabled and titled; refresh re-fetch. Route-level test: invalid `[id]` (reject list) renders
the not-found boundary without an API call.

## Task 5 — Route wiring and list integration

- `app/admin/(console)/payouts/[id]/page.tsx` (server component + cookie redirect + ID
  validation → not-found) composing the screen.
- `ROUTES.admin.payoutDetails(id)` in `src/lib/routes.ts`.
- **Payout Records list (UC-63):** replace the disabled [View Details] button with an enabled
  link to the detail route (accessible name `View Details for PO-{code}`); update the UC-63
  screen tests accordingly. No other change to the UC-63 contract.

## Task 6 — Verification

1. `npm run lint` (0 errors; no new warnings)
2. `npm run typecheck`
3. `npm test` (full suite)
4. `npm run build` (new dynamic route appears in the manifest)
5. Manual browser checklist against a running BE with seeded payouts: list → View Details →
   detail; direct refresh; unknown ID (`404`); non-numeric ID (not-found boundary); non-admin
   rejection. Record actual evidence; do not claim E2E without it.

Non-goals guard: no settlement action, no export, no bank-account section, no Completion Date
column, no changes to the UC-63 contract beyond enabling the row action.
