# UC-52 real API integration

## Scope and acceptance

User approved integration of UC-52 and alignment with the existing TM-98 create contract.
Preserve the current responsive form, replacing simulated saves with authenticated requests.
Use the existing feature/admin-create-poi checkout, preserving the uncommitted screen and
unrelated AGENTS.md changes. Baseline npm run lint and npm run typecheck passed.

- A real Administrator login is the minimal prerequisite. Browser requests use same-origin
  Next route handlers; the BE access token stays in an HttpOnly, SameSite=Strict cookie.
  Backend authorization remains authoritative. No refresh endpoint exists, so expiry requires login.
- Read category/tag IDs from GET /api/v1/admin/pois/catalogue, added in the BE TM-98 worktree.
- Submit a flat camelCase CreatePoiCommand to POST /api/v1/admin/pois. Never submit telemetry
  metadata, mock IDs, status, scores or audit fields.
- Match optional fields, integer duration, coordinate ranges and TimeOnly opening-hour rules.
- Render real 201 IDs, 400 field errors, 401/403, 404 reference failures, 409 duplicate warnings,
  and unavailable/network errors. Only explicit duplicate confirmation resubmits with true.
- Prevent repeated submits; retain input on failure. Remove simulator controls from the live page.
- Maps remain illustrative, explicitly labeled; no live map/geocoding integration in this scope.

## Implementation and verification plan

1. Contract types, mapper, validation and client error parsing; Node contract tests first.
2. Backend catalogue CQRS endpoint and authorization/reference integration tests.
3. Minimal Admin login/session route and same-origin protected POI routes; request/cookie tests.
4. Wire existing components to real catalogues and submission states, including confirmation.
5. Run focused tests, lint, typecheck, build and browser checks. Run BE tests if SDK/database
   are available. Document actual evidence and distinguish stubs from a live database test.

## Local setup

Run the backend containing the Create POI and catalogue endpoints (currently
D:/CapStone/Capstone_BE_tm98_review, feature/datmnt-create-poi). The current checkout at
D:/CapStone/Capstone_BE does not contain Create POI.

Set server-only TRIPMATE_API_BASE_URL in .env.local to the running backend origin, e.g.
http://localhost:5021 for the local HTTP profile. Do not append /api or embed credentials.
Use HTTPS for deployed backends; never disable TLS verification. Start FE with npm run dev.
Visit /admin/login using a real active Administrator, then open Create POI. Categories/tags
must exist in that backend database. Empty catalogues are shown explicitly; no fallback IDs.

No commit, push, merge, schema migration, deployment or production seed operation is included.

## Verified on 2026-09-12

- Final FE checks: npm install, npm test, npm run lint, npm run typecheck and npm run build
  completed successfully. Installation audit findings are listed below; no dependency versions
  were changed. Production build includes dynamic protected UC-52 and all three proxy routes.
- FE Node tests: 21 passed. Tests cover flat DTOs, zero/blank coordinates, integer duration,
  opening-hour rules, nested field errors, real 201 guard, 409 IDs, malformed/non-JSON/network
  responses, bearer forwarding, origin checks, cookie lifecycle and sanitized server failures.
- BE: 134 passed, 0 failed, 0 skipped, including all three SQL Server persistence/rollback
  tests and eight new catalogue endpoint tests. Baseline was 123 passed / 3 SQL skipped.
- Browser used the actual FE at localhost:3001, actual BE at localhost:5021 and disposable SQL
  container tripmate-uc52-e2e at loopback:14331. No stub was used for this browser flow.
- Real Admin login succeeded; catalogue names and IDs came from the test DB. Visiting UC-52
  without a session and after logout redirected to login. Empty-form validation was verified.
- Browser-created POI #1 (UC52 Browser Integration): category 1, latitude 16.123456,
  longitude 108.123456, supplied address/description, Mixed, 90 minutes, shelter true,
  tags 1 and 2. SQL confirmed every field, seven opening-hour rows, two tag rows and POI_CREATE
  audit row. Monday–Saturday 08:00:00–18:30:00; Sunday closed with both times NULL.
- Submitting the same name/coordinates returned 409 and existingPoiId 1. Only clicking
  Confirm duplicate and create produced POI #2. Optional fields omitted on this second form
  persisted as NULL/defaults: Outdoor, 60 minutes, shelter false, zero child rows.
- Desktop 1280px and mobile 390px layouts inspected, including mobile time controls and sticky
  Save. Mobile document scrollWidth equals clientWidth (375px after scrollbar), no horizontal
  overflow. No hydration errors observed; an existing smooth-scroll navigation warning remains.

Local test fixture helpers are outside the repos at D:/CapStone/.codex-tmp/uc52-e2e.
The fixture contains disposable credentials; do not commit it. This does not provision a
production Administrator, change the main backend checkout, or deploy either repository.

## Known limitations and separate follow-ups

- Live maps/geocoding, other Admin pages and password recovery remain prototypes.
- npm install reports existing dependency advisories: next (critical), sharp and js-yaml (high).
  package-lock.json was unchanged by installation. Dependency upgrades are a separate scoped
  task and should be addressed before production deployment.
- Time inputs support keyboard entry and browser pickers. In the browser automation provider,
  fill alone did not commit React time state; keyboard ArrowUp did. Live persisted hours were
  verified from the preview and SQL, rather than inferred from the input's DOM value.
