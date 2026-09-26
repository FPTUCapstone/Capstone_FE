# UC-58 View Active Trips Frontend Implementation Plan

## Status and scope

Implemented in the local working tree on 2026-09-26; pending commit, push, remote CI, and final browser review.

This plan implements the read-only Administrator list screen in [`specs/UC-58-spec.md`](../specs/UC-58-spec.md). UC-59 details/navigation and all trip intervention actions are excluded.

Repository: `Capstone_FE` (`https://github.com/FPTUCapstone/Capstone_FE.git`)

Branch in this repository: `feature/linhnv-view-active-trips`. The BE repository uses the same branch name but has an independent Git history and therefore a different HEAD.

Baseline HEAD: `283a2244e152c86423730bbff75bd7c25ae00c0c`

## Baseline evidence — 2026-09-26

- `npm test`: 280 passed, 0 failed.
- `npm run lint`: 0 errors and 3 pre-existing `@next/next/no-img-element` warnings in public landing components outside UC-58.
- `npm run typecheck`: passed after removing the generated `.next` cache left by the previous Audit Logs branch.
- `npm run build`: passed; 22 routes generated.
- The working tree also contains pre-existing untracked `plans/UC-57-plan.md` and `specs/UC-57-spec.md`. They must never be staged or committed with UC-58.

## Implementation evidence — 2026-09-26

- `npm test`: 292 passed, 0 failed, including UC-58 contract, proxy, service, and screen tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 0 errors and the same 3 pre-existing landing-page image warnings.
- `npm run build`: passed; `/admin/trips/active` and `/api/admin/trips/active` are present in the generated route inventory.
- `git diff --check`: passed. The pre-existing untracked UC-57 documents remain outside UC-58 scope.

## Architectural decisions

- Route: `/admin/trips/active`; implementation under `src/features/admin/active-trips/`.
- Client code calls only `/api/admin/trips/active`. The Next.js proxy owns the server-held Admin token and upstream URL.
- Do not use `useWebSession()` as an Admin authorization gate.
- Use submitted/applied filter state separately; typing does not fetch.
- Serialize applied filters and page in the URL. Ignore unknown query keys and canonicalize only approved values without causing request loops.
- Runtime-validate every successful Backend payload; TypeScript types alone are not evidence of a valid response.
- Keep Backend timestamps as UTC ISO 8601 strings at the contract boundary. Format them with an explicit `Asia/Ho_Chi_Minh` `Intl.DateTimeFormat` configuration as `dd/MM/yyyy HH:mm`; do not depend on the browser time zone or show seconds.
- UC-58 renders no View Details column/action until UC-59 exists.

## Required design gate

Before production JSX, create `specs/UC-58-web-screen-spec.md` containing desktop/mobile layout, component states, 320px overflow strategy, focus/error behavior, and a field-to-API mapping. The repository has no established `docs/UC{N}-WEB-SCREEN-SPEC.md` convention; `specs/` is selected because AGENTS.md already defines it as the feature-specification location. Use Tailwind CSS 4, existing Admin visual tokens, and shared components. Do not add CSS modules, a UI framework, or a styling dependency. Implementation begins only after that screen specification is reviewed.

## Atomic tasks

### F1 — Web screen specification and route contract

- Draft `specs/UC-58-web-screen-spec.md` from the approved behavioral spec.
- Define desktop table and mobile card/scroll behavior, loading/empty/forbidden/unavailable states, and summary/filter layout.
- Verify that no View Details control is shown in UC-58.
- Update `src/lib/routes.ts` contract in tests only after screen review approval.

Exit: reviewed screen specification exists and maps every visible field to the Backend DTO.

### F2 — Runtime contract and URL model

Tests first:

- Add `src/features/admin/active-trips/activeTrips.test.ts` for valid/malformed payloads, nullable fields, non-negative counts, allowed statuses/types, ID safety, query parsing/serialization, unknown keys, and date-range validation.

Production changes:

- Add `activeTrips.ts` for DTOs, runtime guards, constants, messages, explicit `Asia/Ho_Chi_Minh` date/time formatting, and pure URL/form transformations.
- Require `tripId` to be a non-empty decimal string and preserve it unchanged in state and future route construction. The approved BE contract also returns a string, so no JavaScript number conversion is permitted.

Verification:

`npx vitest run src/features/admin/active-trips/activeTrips.test.ts`

Exit: malformed success data cannot render as a valid monitoring result.

### F3 — Admin-session proxy and browser service

Tests first, using the repository's two existing runners deliberately:

- Add `tests/active-trips-proxy.test.cjs` with `node:test` and the existing `tests/load-ts.cjs` harness for missing cookie, query allowlist, Authorization forwarding, no-store, `400`, upstream `401/403` cookie clearing, `5xx`, malformed upstream response, timeout/network failure, and cancellation. Server proxy tests remain in the established CommonJS suite; existing proxy tests are not migrated.
- Add `src/features/admin/active-trips/activeTripsService.test.ts` with Vitest for browser request URL generation and safe error mapping.

Production changes:

- Add `src/features/admin/active-trips/activeTripsProxy.ts` and `activeTripsService.ts`.
- Add `app/api/admin/trips/active/route.ts` as a thin GET route.
- Reuse `ADMIN_ACCESS_TOKEN_COOKIE`, `clearAdminSession`, `jsonNoStore`, and `fetchBackend`.
- Forward only `keyword`, `tripType`, `destination`, `startDateFrom`, `startDateTo`, `alertState`, `pageNumber`, and `pageSize`.
- Clear the Admin cookie only for upstream `401/403`; never expose token or private upstream errors.

Verification:

```powershell
node --test tests/active-trips-proxy.test.cjs
npx vitest run src/features/admin/active-trips/activeTripsService.test.ts
```

Exit: proxy behavior matches the clarified session rules.

### F4 — Active Trips screen behavior

Tests first:

- Add `src/features/admin/active-trips/ActiveTripsScreen.test.tsx` with Vitest/Testing Library, covering initial load, explicit search, no fetch while typing, clear, URL state, page navigation, date error MSG29, empty MSG128, forbidden MSG126, unavailable MSG127/retry, stale response ordering, unmount safety, and absence of View Details.

Production changes:

- Add `ActiveTripsScreen.tsx` and small feature-local components only where they reduce duplication.
- Add `app/admin/(console)/trips/active/page.tsx` as route composition/metadata.
- Keep draft filters separate from applied URL criteria. Abort or ignore superseded requests so an older response cannot replace a newer result.
- Render all states from approved English messages; do not introduce mock production data.

Verification:

`npx vitest run src/features/admin/active-trips/ActiveTripsScreen.test.tsx`

Exit: all screen states and interactions match the spec without using `useWebSession()`.

### F5 — Navigation, responsive, and accessibility integration

Tests first:

- Extend navigation tests for the Active Trips link and component tests for labels, status semantics, field-associated errors, disabled pagination boundaries, and no action-only color meaning.

Production changes:

- Add `ROUTES.admin.activeTrips` in `src/lib/routes.ts`.
- Add Active Trips to `AdminNavigation.tsx` following the existing navigation pattern.
- Implement the reviewed 320px strategy with no page-level horizontal overflow.

Manual evidence:

- Check 320px, tablet, and desktop widths.
- Keyboard through search, filters, clear, retry, and pagination.
- Confirm no precise location data appears in DOM or network response.

Exit: route is discoverable and responsive/accessibility requirements are met.

### F6 — Real integration and final verification

- Run the corrected Admin login flow, confirm the HttpOnly cookie is created, open `/admin/trips/active`, and exercise GET, filters, empty results, pagination, expiry redirect, and `403` behavior against the real UC-58 Backend.
- Add an integration-level test proving Admin cookie -> same-origin proxy -> Backend response. Do not replace this evidence with a mocked `useWebSession` test.
- Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- Run `git diff --check`; inspect `origin/develop...HEAD`; verify UC-57 files, `.env.local`, `.next`, screenshots, secrets, and generated artifacts are not included.
- Perform a spec-compliance review followed by a code-quality review.
- Record final commit SHA and remote CI status after commit/push.

## Dependencies and stop conditions

- Do not claim end-to-end completion until the Admin login branch is merged/synchronized and the real cookie flow succeeds.
- Do not render View Details until UC-59 supplies the route.
- If the Backend response changes, update and reapprove both specs before adapting the FE silently.
- If a reviewed visual design is unavailable, Backend work may proceed but production FE JSX pauses at F1.

## Definition of done

- All approved FE acceptance criteria have automated or manual evidence.
- Admin-cookie integration is verified against the real Backend.
- Required checks pass and pre-existing warnings are reported accurately.
- Only UC-58 files are committed; pre-existing UC-57 files remain outside the change.
- No push, PR, or merge occurs without a separate explicit request.
