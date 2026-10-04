# UC-67 Export Statistical Reports Frontend Implementation Plan

Status: **Draft — NOT ready for implementation.** Blocked on the four team decisions recorded
in the BE spec (DEC-1…DEC-4); Task 4's export row additionally depends on DEC-1.

Branch: `feature/linhnv-export-statistical-reports`.

## Baseline evidence (recorded 2026-10-01, per re-review R6)

- Commit: `2170bc99ff25dbd9646c7232d7ebbd0c3f1d925d` (`origin/develop` tip), working tree
  clean except this UC's untracked spec/plan files.
- `npm run lint` — 0 errors. `npm run typecheck` — 0 errors (after regenerating `.next`;
  the stale-artifact error seen mid-session does not exist on a clean state).
- `npm test` — 74 files / 741 tests passed, 0 failed.
- `npm run build` — compiled successfully.

## Task 1 — Types, criteria compiler, and contract parsing

`src/features/admin/statistics/`:

- `statistics.ts`: report types, period types, the criteria model with the **adaptive period
  compiler** (Month `yyyy-MM` → first/last day; Quarter `Q1–Q4 + yyyy` → aligned dates;
  Year `yyyy`; misaligned manual dates rejected) — the compiler mirrors BE alignment rules
  (R5); required-field guard (locked MSG01); DTO types per report type per the BE spec table;
  runtime narrowing guards; VND/CR-07 formatters; unified bucket label rule.
- Contract tests first: criteria compilation edges (quarter/year boundaries, leap February),
  required-field guard, per-type payload parsing, malformed payloads rejected.

DoD: `npx vitest run src/features/admin/statistics` green.

## Task 2 — Same-origin proxy routes

- `statisticsProxy.ts` (server-only) + `app/api/admin/statistics/reports/generate/route.ts`
  and `.../export/route.ts` reusing the shared admin cookie helpers; the export route streams
  the upstream CSV with `Content-Type`/`Content-Disposition`; session cookie cleared on
  upstream `401`.
- Proxy tests: cookie forwarding, `403`/`422`/`503` passthrough, cookie clearing, export
  stream headers, backend-unreachable mapping.

## Task 3 — Service client

`statisticsService.ts`: `generateStatisticalReport(criteria, signal)` (returns figures +
`resultToken`) and `exportStatisticalReport(resultToken, format)` (returns the response for a
browser download), mapping errors to the screen state model with `errorCode`/`serverMessage`
carried verbatim for 422/503. Tests: URL/credentials, the token-carrying export body (R3),
status mapping with verbatim messages, malformed-success rejection.

## Task 4 — Platform Statistics screen (TDD per state)

`PlatformStatisticsScreen.tsx` built to `specs/UC-67-web-screen-spec.md`: criteria form with
the adaptive compiler and client-side guards (MSG01 + alignment); result area (summary cards +
CSS bar chart + table per report type); **Export submits only the token**; the SRS
discard-on-change rule clears result + token on any criterion change; export row per DEC-1;
MSG136 toast on success.

Screen tests, in order: initial (no result, Export disabled); missing type/period blocked with
MSG01 inline; misaligned/open period blocked with the server wording; generate success
rendered for each of the five report types; locked MSG128 on empty; criteria change discards
result + token; export success downloads + shows proposed MSG136; expired-token 422 with the
criteria preserved; `403`/`401`/`503` states; Cancel resets everything.

## Task 5 — Route wiring and navigation

- `app/admin/(console)/statistics/page.tsx` (server component + cookie redirect, audit-logs
  pattern) composing the screen.
- `ROUTES.admin.statistics = '/admin/statistics'` in `src/lib/routes.ts`.
- Admin console navigation: add the `Statistics` entry. Update navigation tests.

## Task 6 — Verification

1. `npm run lint` (0 errors; no new warnings)
2. `npm run typecheck`
3. `npm test` (full suite)
4. `npm run build` (new route appears in the manifest)
5. Manual browser checklist against a running BE with seeded data: each report type; filters;
   export CSV matching the screen; open-period rejection; direct refresh. Evidence (screenshots
   or recorded results) attached to the PR; do not claim E2E without it.

Non-goals guard: no Excel/PDF until DEC-1; no Booking Type filter until DEC-2; no chart
library; no mutation; no changes to other Admin screens beyond the nav entry.
