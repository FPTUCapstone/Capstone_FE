# UC-07 Change Password — Web Implementation Plan

**Status:** DRAFT — execute only after approval of `specs/UC-07-change-password-web-spec.md` and the Backend UC-07 contract.

## Preconditions

1. Record the team decision that Staff is included for Web internal UC-07 self-service. Staff uses `/admin/account/security`; Mobile remains Traveler/Tour Operator only.
2. Backend UC-07 routes, safe response DTOs, error codes, current-session renewal behavior, and Web cookie behavior are implemented and documented.
3. Confirm whether public-account and admin session transports need distinct BFF routes. Do not route an admin session through a public-account helper or vice versa.
4. Run current baseline checks before code changes.

## Task 1 — Replace pending capability with typed API contract

**Files:** `src/features/account/security/changePasswordCapability.ts` and new focused API/adapter module(s).
**RED tests:** request body contains only `currentPassword` and `newPassword`; confirmation, user ID, role, access token, and refresh token are absent; success and safe failure parsing match the approved contract.
**Implement:** typed request/result/error mapping and role-specific transport composition using existing session conventions.

**Verify:** focused Vitest tests.

## Task 2 — Wire Traveler/Tour Operator form behavior

**Files:** `ChangePasswordForm.tsx`, `useChangePassword.ts`, `ChangePasswordPage.tsx`, tests.
**RED tests:** valid submit calls real adapter once; local invalid values do not call it; success follows a 200 response only; fields clear; `MSG17` targets Current Password; `MSG05` targets New Password.

**Implement:** inject available capability only after adapter is ready. Remove the pending notice only for delivered actor/route.

**Verify:** focused form/hook/page tests and keyboard behavior.

## Task 3 — Implement internal-role composition and server guard

**Files:** `app/admin/account/security/page.tsx`, admin feature module(s), admin session helpers/tests as needed.
**RED tests:** valid Administrator and Staff direct navigation render; public or invalid sessions are denied; missing, expired, modified, or token-mismatched internal session redirects before rendering; 401 clears internal cookies while 403 preserves a valid session.

**Implement:** use established server-side guard and admin BFF session design. Do not use public client session as the authorization boundary.

**Verify:** route and proxy tests using real signed-session helpers.

## Task 4 — Enable Staff self-service through the approved internal route

**RED tests:** verified Staff BFF session can submit a valid request; invalid/tampered sessions are rejected before the backend is called; the Staff role remains sealed when replacement tokens are issued.
**Implement:** use the same `/admin/account/security` route and BFF proxy for Staff and Administrator. Keep the authenticated session role server-side and never accept a subject or role selector from the browser. Mobile remains out of scope for Staff.

## Task 5 — Error, session, accessibility, and responsive hardening

**RED tests:** no false success on 400/401/403/429/5xx/network error; 401 sign-out/redirect; Google-only public account receives a dedicated `auth.local_password_unavailable` message while other 403 values remain access denied; 403 does not clear a valid session; no secret serialization; values clear after success/cancel.
**Implement:** safe feedback mapping, including Google-only public accounts without a local password; `no-store` BFF behavior where applicable; focus/ARIA feedback; and responsive styles.

**Manual verification:** 320 px, tablet, desktop, keyboard navigation, password visibility controls, and screen-reader labels.

## Task 6 — Full validation and scope review

Run in order:

```powershell
npm install
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

Review the final diff against the spec: no Firebase action, mock mutation, refresh token exposed to JS, role-to-role session crossover, or unsolved Staff claim. Do not push or open a PR until these checks pass and the developer requests delivery.
