# UC-63 View Payout Records Frontend Implementation Plan

Status: **Approved 2026-10-01** (spec rewritten against SRS §3.9.9.1; decisions D1–D11
approved). Tasks are atomic and sequenced; tests come first per task.

Branch: `feature/linhnv-view-payout-records` (baseline: latest `origin/develop`; lint/typecheck/
test/build verified green on this baseline).

## Task 1 — Types, search model, and contract parsing

`src/features/admin/payout-records/`:

- `payoutRecords.ts`: DTO types mirroring the BE response — `payoutCode` (derived string),
  `operator { userId, companyName }` (no email/rate), `requestedAtUtc` nullable, numeric money,
  `yyyy-MM-dd` periods; the five status constants; VND formatter; the three summary counters;
  a runtime narrowing guard; the search model + `parsePayoutsSearch`/`serializePayoutsSearch`
  (allow-listed keys) and `validatePeriodRange` mirroring BE rules.
- Contract tests first: valid payload parses (derived code verbatim, null requested date,
  numeric money); malformed statuses/periods/ids rejected; date-range validation boundaries;
  summary counters typed as numbers.

DoD: `npx vitest run src/features/admin/payout-records` green.

## Task 2 — Same-origin proxy route

- `payoutRecordsProxy.ts` (server-only) + `app/api/admin/payouts/route.ts` reusing the shared
  admin cookie helpers: read `tripmate_admin_access_token`, forward GET with the allow-listed
  query keys (`keyword`, `status`, `periodFrom`, `periodTo`, `pageNumber`, `pageSize`) only,
  pass upstream statuses through, clear the session cookie on upstream `401`.
- Proxy tests: cookie forwarding, key allow-listing, `400`/`403`/`503` passthrough, cookie
  clearing, backend-unreachable mapping.

## Task 3 — Service client

`payoutRecordsService.ts` calling the same-origin proxy (`credentials: 'same-origin'`, no
Authorization header) and mapping responses/errors to the screen state model
(`loading | ready | forbidden | unavailable`; `400` surfaces the upstream payload so the
proposed MSG134 wording from the inverted-range case is distinguishable). Tests: URL/
credentials, status mapping, malformed-success rejection, network failure mapping.

## Task 4 — List screen (TDD per state)

`PayoutRecordsScreen.tsx` built to `specs/UC-63-web-screen-spec.md`: header; three summary
cards (Pending Requests, Total Requested Amount, Total Confirmed Amount); filter panel with
client-side period validation using the proposed MSG134 wording; scrollable table in the SRS
column order (Payout Code, Tour Operator, Settlement Period, Gross Revenue, Commission, Net
Payout, Requested Date, Status) with the **disabled [View Details] row action**; pagination
footer with filters persisted in the URL query (PC-03). No enabled navigation anywhere.

Screen tests, in order: loading → success renders summary + rows with VND formatting, period
ranges, and "Not available" requested dates; empty MSG128 with filters kept; inverted range
blocked client-side with the MSG134 wording and no request; `403` MSG126; `401` redirect with
`returnUrl`; `503` unavailable + retry; disabled row action present on every row and
non-interactive; Clear resets and repaginates.

## Task 5 — Route wiring and navigation

- `app/admin/(console)/payouts/page.tsx` (+ metadata) composing the screen.
- `ROUTES.admin.payouts = '/admin/payouts'` in `src/lib/routes.ts`.
- Admin console navigation: add the `Payout Records` entry (active-state highlight consistent
  with existing entries). Update navigation tests.

## Task 6 — Verification

1. `npm run lint` (0 errors; pre-existing warnings noted, no new ones)
2. `npm run typecheck`
3. `npm test` (full suite)
4. `npm run build` (new route appears in the manifest)
5. Manual browser checklist against a running BE with seeded payouts: admin login → nav →
   list; keyword on code and operator name; status/period filters; direct refresh; pagination
   with persisted filters; non-admin rejection. Record actual evidence; do not claim E2E
   without it.

Non-goals guard: no detail route (row action stays disabled), no settlement actions, no
export, no changes to the shared session contract.
