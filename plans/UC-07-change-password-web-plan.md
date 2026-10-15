# UC-07 Change Password — Web Implementation Plan

**Status:** DRAFT — execute only after approval of `specs/UC-07-change-password-web-spec.md` and the Backend UC-07 contract.

## Preconditions

1. Resolve the Staff actor conflict in the SRS and `docs/WEB_SCOPE_MATRIX.md`.
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

## Task 3 — Implement Administrator composition and server guard

**Files:** `app/admin/account/security/page.tsx`, admin feature module(s), admin session helpers/tests as needed.  
**RED tests:** valid Administrator direct navigation renders; Staff/public/wrong role is denied; missing, expired, modified, or token-mismatched admin session redirects before rendering; 401 clears admin cookies while 403 preserves a valid session.

**Implement:** use established server-side guard and admin BFF session design. Do not use public client session as the authorization boundary.

**Verify:** route and proxy tests using real signed-session helpers.

## Task 4 — Implement Staff only after actor decision

**Condition:** execute only when the SRS conflict is resolved in writing.  
**RED tests:** Staff allowed only to their self-service route; Administrator/public roles denied where appropriate.  
**Implement:** role-specific route/navigation only if approved; otherwise leave task unstarted and document deferral.

## Task 5 — Error, session, accessibility, and responsive hardening

**RED tests:** no false success on 400/401/403/429/5xx/network error; 401 sign-out/redirect; 403 no cookie clearing; no secret serialization; values cleared after success/cancel.  
**Implement:** safe feedback mapping, `no-store` BFF behavior where applicable, focus/ARIA feedback, and responsive styles.

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

