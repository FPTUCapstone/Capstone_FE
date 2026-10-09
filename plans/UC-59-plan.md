# UC-59 View Active Trip Details Frontend Implementation Plan

Status: **Approved 2026-09-30** (companion to the approved BE/FE specs; UI layout follows
`specs/UC-59-web-screen-spec.md`). Tasks are atomic and sequenced; tests come first per task.

Branch: `feature/linhnv-view-active-trip-details` (baseline: latest
`feature/linhnv-view-active-trips` merge of `origin/develop`; lint/typecheck/test/build verified
green on 2026-09-30).

## Task 1 — Types and contract parsing

`src/features/admin/active-trip-details/`:

- `activeTripDetails.ts`: detail DTO types mirroring the BE response (string IDs, nullable
  `currentLocation`/`weatherEvent`/`destination`/timestamps), severity/state constants, UTC+7
  display formatters (reuse the project's CR-07 formatting helpers where they exist), and a
  runtime narrowing guard for the detail payload.
- Contract tests first: valid payload parses; unknown extra fields ignored; malformed timestamps,
  numeric (non-string) IDs, or missing sections rejected; a shared `isValidTripId` validator unit
  test covers the full reject list (`1abc`, `1.5`, `1e3`, `+1`, whitespace, `0`, negatives,
  leading zeros, overflow past `9223372036854775807`) and canonical accepts.

DoD: `npx vitest run src/features/admin/active-trip-details` green.

## Task 2 — Same-origin proxy route

- `activeTripDetailsProxy.ts` (server-only) + `app/api/admin/trips/active/[id]/route.ts`
  reusing the shared admin cookie helpers: read `tripmate_admin_access_token`, forward a GET to
  `/api/v1/admin/trips/active/{id}`, pass upstream statuses through, clear the session cookie on
  upstream `401` (same behavior as the UC-58 list proxy).
- Validate `[id]` server-side with the approved strict validator (shared with the page route):
  canonical decimal string `^[1-9]\d*$` bounded by `9223372036854775807` compared as a digit
  string — no `parseInt`/`Number`. A rejected id returns `400` without contacting the backend;
  rejects include `1abc`, `1.5`, `1e3`, `+1`, whitespace, `0`, negatives, leading zeros, and
  overflow.
- Proxy tests: cookie forwarding, id-validation reject list, `404`/`403`/`503` passthrough,
  cookie clearing, backend-unreachable mapping.

## Task 3 — Service client

`activeTripDetailsService.ts` calling the same-origin proxy (`credentials: 'same-origin'`, no
Authorization header) and mapping responses/errors to the screen's state model
(`loading | ready | not-found | forbidden | unavailable`). Tests: URL/method/credentials, status
mapping, malformed-success rejection, network failure mapping.

## Task 4 — Detail screen (TDD per state)

`ActiveTripDetailsScreen.tsx` (+ small section components under `components/` if size demands),
built to the layout/states/a11y rules in `specs/UC-59-web-screen-spec.md`: header + back link,
status cards, group panel (group name, host, member table with joined timestamps and
location-sharing badges, per BR-51 state flag only — no coordinates), itinerary progress table,
state-history timeline, incidents list with weather severity badges, rerouting events with the
snapshot-available note, location-trail table, manual Refresh control. No mutation controls
(scope guard).

Screen tests, in order: loading → success renders all eight sections with UTC+7 formatting and
empty-section MSG128 rows; group panel renders member names, joined timestamps, and sharing
badges, shows `Not available` for `null` `groupPanel`, and never renders member coordinates;
`404` state (proposed MSG133 wording "Active trip not found or no
longer available for monitoring."); `401` redirect with `returnUrl`; `403` MSG126; `400`/`503`
unavailable + retry; refresh re-fetch. Route-level test: invalid `[id]` (reject list from the
spec) renders the not-found boundary without an API call; the rerouting section renders
`hasProposedItinerarySnapshot` as a neutral note without snapshot content.

## Task 5 — Route wiring and list integration

- `app/admin/(console)/trips/active/[id]/page.tsx` (+ metadata) composing the screen.
- `ROUTES.admin.activeTripDetails` constant in `src/lib/routes.ts`.
- UC-58 list screen: each row has a visible `View Details` link to the detail route with an
  accessible trip-specific name; keep existing filters/pagination behavior untouched. Update
  `ActiveTripsScreen` tests.

## Task 6 — Verification

1. `npm run lint` (0 errors; pre-existing `<img>` warnings noted, no new warnings)
2. `npm run typecheck`
3. `npm test` (full suite)
4. `npm run build` (new dynamic route appears in the manifest)
5. Manual browser checklist against a running BE: admin login → list → row → detail; direct
   refresh; 404 URL; non-admin rejection. Record actual evidence; do not claim E2E without it.

Non-goals guard: no live map, no polling, no mutation, no changes to the UC-58 list contract or
the shared session contract.
