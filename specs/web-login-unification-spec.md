# Web Login Unification — Frontend Specification

## Status

**Draft — awaiting approval.** Direction approved by the developer on 2026-10-24. Companion to
`Capstone_BE/specs/web-login-unification-spec.md`, which holds the authoritative decisions D1–D7.
No code may start until both specifications are approved.

## Problem

Two sign-in screens exist: `/sign-in` (every role) and `/admin/login` (Administrator and Staff).
An Administrator who signs in at `/sign-in` is sent to `/admin/*` and must sign in again at
`/admin/login`, because the admin console requires a separately minted admin cookie.

## Scope

1. **One sign-in screen.** `/sign-in` handles every role. `/admin/login` becomes a redirect to
   `/sign-in`. `returnUrl` is accepted only when all of these hold, checked **before** any redirect
   after sign-in:
   - it is a same-origin relative path (no scheme, host, or `//` prefix; reject `\` tricks);
   - it starts with `/admin/`, and is not `/admin/login`;
   - the signed-in role may access it: Administrator for any `/admin/*` route, Staff only for the
     routes in `STAFF_ALLOWED_EXACT_ROUTES`. Otherwise the role's default destination is used.
   Invalid values fall back silently to the role default. Traveler and Tour Operator never get an
   admin `returnUrl`.
2. **Destination by role** (already implemented in `signInDestination`): Administrator →
   `/admin/dashboard`, Staff → `/admin/staff-dashboard`, Traveler → home, Tour Operator → partner
   dashboard or application page. Unchanged.
3. **Admin console auth.** A server-side resolver (`resolveWebSession`) replaces the sealed admin
   cookie. For each admin request it reads the `tripmate_refresh` cookie, calls
   `/api/v1/auth/web/refresh`, verifies `role ∈ {Administrator, Staff}` and `status = Active` on the
   returned context, and passes only the short-lived access token to the BFF handler in memory. The
   token is never written to a cookie or to browser storage. The sealed `tripmate_admin_*` cookies,
   `ADMIN_SESSION_SECRET`, and `/api/admin/session` are removed. The pattern follows the existing
   refresh-then-forward proxies (for example `canonicalReviewProxy.ts`).
4. **Retire** `/api/admin/session` and the admin-only sign-in path in `useSignInEngine` (`admin`
   flag). `LoginForm` calls the single web login only.
5. **Google sign-in** stays on the shared sign-in screen. The role is unknown before
   authentication, so the FE cannot hide the button for administration accounts. The Backend
   rejects Google sign-in for Administrator and Staff with `auth.admin_google_sign_in_disabled`,
   and the FE shows that message in the existing feedback area.

## Behaviour and states

| Situation | Behaviour |
| --- | --- |
| Administrator signs in at `/sign-in` | Lands on `/admin/dashboard` with no second password prompt. |
| Staff signs in at `/sign-in` | Lands on the Staff dashboard. |
| Traveler or Tour Operator opens `/admin/*` | Access-denied view (existing behaviour). |
| Unauthenticated user opens `/admin/*` | Redirect to `/sign-in?returnUrl=…` (same-origin `/admin/*` only). |
| Session expires while in the admin console | Redirect to `/sign-in?returnUrl=…`; no admin-specific prompt. |
| Old bookmark to `/admin/login` | Redirect to `/sign-in`. |
| Wrong credentials | Existing sign-in error message. |
| Account locked | Existing locked-account message. |

## Acceptance criteria

1. Administrator and Staff complete sign-in once, at `/sign-in`, and reach their dashboards.
2. `/admin/login` redirects to `/sign-in`; `returnUrl` is honoured only for same-origin `/admin/*`.
3. No code path reads, sets, or clears `tripmate_admin_access_token` or
   `tripmate_admin_session_seal`; `/api/admin/session` is removed.
4. Every admin route is guarded server-side by role and status on each request.
5. Existing copy stays English (CR-09); no new Vietnamese text is introduced in the admin console.
6. Tests cover: role-based destination, `/admin/login` redirect with and without `returnUrl`,
   admin layout denial for non-admin roles, and removal of the admin session route.

## Non-goals

Visual redesign of the sign-in page, MFA, password policy, and changes to the Tour Operator or
Traveler flows beyond the removal of the admin branch.
