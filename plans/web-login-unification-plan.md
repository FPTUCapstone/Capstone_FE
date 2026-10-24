# Web Login Unification — Frontend Plan

Companion to `specs/web-login-unification-spec.md`. Backend plan:
`Capstone_BE/plans/web-login-unification-plan.md`. Branch: `fix/linhnv-fix-login-web`.

Status: **Draft — starts only after the spec and this plan are approved.**

## Baseline (verified in code)

- `src/lib/server/adminSession.ts` holds the sealed admin cookies (`tripmate_admin_access_token`,
  `tripmate_admin_session_seal`), the admin session verifier, and `isSameOriginRequest`.
- 38 non-test files reference that module or the admin cookies (18 under `app/`, 20 under `src/`):
  - 1 is the module itself (`adminSession.ts`).
  - 4 are shared consumers that import **only** `isSameOriginRequest`: `paymentProxy.ts`,
    `tourBookingProxy.ts`, `travelerProfileProxy.ts`, `canonicalReviewProxy.ts`. These are
    traveler and reviews flows, not admin flows.
  - The remaining 33 are admin pages, admin proxies, the sign-in handlers, and the admin guards.
    Some are deleted in F5 instead of migrated.
- `src/features/admin/auth/sessionHandlers.ts` calls `/api/v1/auth/web/admin/login` and sets the
  admin cookies. `/api/admin/session` exposes it.
- `signInDestination` already sends Administrator and Staff to the correct dashboards.

## Work

### F1 — Relocate `isSameOriginRequest` (no behaviour change)

- Move `isSameOriginRequest` to `src/lib/server/sameOrigin.ts`, unchanged, with its tests.
- Point the four shared consumers at the new module.
- Keep `adminSession.ts` re-exporting nothing new; it is deleted in F5.

Exit: the four shared flows pass their existing tests. No user-visible change.

### F2 — Session resolver for the admin console

- Add `src/lib/server/webSession.ts` with `resolveWebSession(cookies)`:
  - reads `tripmate_refresh`;
  - calls `/api/v1/auth/web/refresh` server-side;
  - returns `{ accessToken, role, status }` only when `role ∈ {Administrator, Staff}` and
    `status = Active`; otherwise returns `null`.
- The access token is returned to the caller in memory and never written to a cookie or storage.
- Tests: missing cookie, refresh failure, Traveler/Tour Operator role, inactive status, Staff and
  Administrator success, expired refresh token, refresh token revoked.

Exit: resolver tests green. No consumer uses it yet.

### F3 — Migrate admin consumers from the sealed cookie to the resolver

Migrate in groups, one group per commit, each with its existing tests updated:
1. `app/admin/(console)/layout.tsx` and `app/admin/(console)/page.tsx` (the guard for everything
   else). Redirect to `/sign-in?returnUrl=…` on `null`; show the access-denied view for a non-admin
   role.
2. Admin pages under `app/admin/(console)/*` and `app/admin/catalogue/*` (the remaining app files).
3. Admin proxies under `src/features/admin/*` (excluding the sign-in handlers deleted in F5).
4. `src/features/admin/reports/guards/statisticalReportAuth.ts`.

Each migrated handler calls `resolveWebSession`, then forwards with the in-memory access token.
Staff allow-list (`STAFF_ALLOWED_EXACT_ROUTES`) stays enforced on the server.

Exit: `grep` for `tripmate_admin_`, `ADMIN_ACCESS_TOKEN_COOKIE`, `ADMIN_SESSION_SEAL_COOKIE`,
`verifyAdminSessionFromCookies`, and `api/admin/session` returns nothing in `src` and `app`.

### F4 — Single sign-in and redirects

- `/sign-in` (`LoginForm`) calls the single web login only. Remove the `admin` option from
  `useSignInEngine`.
- Keep the Google button. Show `auth.admin_google_sign_in_disabled` in the existing feedback area.
- `/admin/login` becomes a server redirect to `/sign-in`, forwarding `returnUrl` only after the
  validator in the spec (same-origin, `/admin/*`, not `/admin/login`, allowed for the role).
- Post-login destination: `signInDestination`, unchanged, with the validated `returnUrl` applied
  first when valid for the role.
- Tests: Administrator and Staff land on their dashboards; invalid, external, `//`, and
  `/admin/login` values are ignored; Traveler and Tour Operator never receive an admin `returnUrl`.

Exit: `/admin/login` renders no form; `/sign-in` handles every role.

### F5 — Remove the old admin session

- Delete `src/features/admin/auth/sessionHandlers.ts`, `app/api/admin/session/route.ts`,
  `src/features/admin/auth/services/adminSessionClient.ts`, and `src/lib/server/adminSession.ts`.
- Update `AdminLogoutButton` to call the existing `web/logout` endpoint, then go to `/sign-in`.
- Remove the admin route tests that assert the sealed cookies.
- Confirm B3 (no caller of `auth/web/admin/login`) before this step is merged.

Exit: the grep in F3 returns nothing; `npm run lint`, `npm run typecheck`, `npm test`,
`npm run build` pass.

## Deploy order

1. F1, then F2 (no user-visible change).
2. F3 group by group (behaviour preserved, admin still works end to end).
3. F4 (new sign-in path live; old path still removed later).
4. Backend B1–B2 can run in parallel with step 1.
5. F5 and B4 together, after F4 is live in production.

Rollback: keep F5 in its own commit so it can be reverted without touching F1–F4.

## Verification

- Manual, against the running backend with a seeded Administrator and Staff account:
  - sign in once at `/sign-in`, reach the dashboard, navigate admin pages, refresh the browser,
    let the access token expire and confirm the next request refreshes it;
  - open `/admin/login` and confirm the redirect;
  - sign out and confirm `/admin/*` redirects to sign-in;
  - sign in as a Traveler and confirm `/admin/*` shows the access-denied view.
- Record the screenshots or results in the PR. Do not claim end-to-end coverage without them.

## Out of scope

Visual redesign of the sign-in page, MFA, password policy, failed-attempt lockout, rate limiting.
