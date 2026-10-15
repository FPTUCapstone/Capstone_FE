# UC-07 Change Password — Web Specification

**Status:** DRAFT — awaiting developer approval
**Product reference:** SRS §3.2.7 and the current UC-07 catalogue entry supplied by the product team.

## 1. Purpose

The Web application lets an authenticated user replace their own local TripMate password from account settings. It collects the current password, a valid distinct new password, and a confirmation; the Backend verifies and updates credentials.

The existing `/account/security` prototype is an explicitly non-operational pending-Backend screen. This delivery replaces that pending capability only after the approved Backend contract exists.

## 2. Scope

### In scope

- Traveler and Tour Operator self-service screen at `/account/security`.
- Administrator and Staff self-service screen at `/admin/account/security` using the existing internal-session architecture.
- Current Password, New Password, Confirm New Password, Change Password, and Cancel.
- Client-side required/policy/distinct/confirmation validation; accessible inline feedback; pending, success, error, and session-expired states.
- Same-origin/BFF-safe transport consistent with each existing session architecture.
- Session replacement after a successful password change without exposing refresh tokens to browser JavaScript.

### Out of scope

- Forgot/reset password, OTP, password recovery, MFA, password-manager integration, account/profile edits, changing another account, or Firebase password flow.
- Mock credential mutation, synthetic success, or local-only password storage.
- A new global authentication architecture.

## 3. Staff actor decision

The supplied UC catalogue includes Staff while detailed SRS §3.2.7 omits it. On 2026-10-15, the team confirmed that Staff is an authorized UC-07 actor for the Web internal workspace. A valid Staff session may use `/admin/account/security` to change only its own password. This does not create a Staff Mobile route.

## 4. Routes and authorization

| Actor | Route | Guard |
| --- | --- | --- |
| Traveler / Tour Operator | `/account/security` | Restored authenticated public-account session; redirect unauthenticated users to `/sign-in?returnUrl=...` |
| Administrator | `/admin/account/security` | Valid server-side internal session; redirect an invalid session before rendering |
| Staff | `/admin/account/security` | Valid server-side internal session sealed with `Staff`; the same BFF endpoint changes only the authenticated subject's password |

The subject comes solely from the verified session. The URL and request body never include a user ID or role selector.

## 5. Form behavior

Inputs:

1. **Current Password** — `autocomplete="current-password"`.
2. **New Password** — `autocomplete="new-password"`.
3. **Confirm New Password** — `autocomplete="new-password"`; frontend-only and never sent to the API.

All fields begin masked with accessible show/hide controls. The shared `getPasswordPolicyIssue` policy remains the client-side policy source: 8–72 characters, no whitespace, uppercase, lowercase, digit, and special character. The client rejects a new password equal to the current input and confirmation mismatch before network submission.

Cancel clears secret values and returns to the role-appropriate account/dashboard destination. Secrets are cleared after success, cancel, unmount/navigation where practical, and completed requests; they are never placed in route state, local/session storage, logs, analytics, error reporting, or user-visible debug output.

## 6. API/BFF contract

The final adapter is enabled only after BE delivers its approved UC-07 endpoint. The browser sends:

```json
{
  "currentPassword": "CurrentPassword1!",
  "newPassword": "NewPassword2@"
}
```

The Web adapter uses the approved same-origin/BFF or existing authorized Web auth transport. It forwards authenticated context, forwards neither user ID nor `confirmNewPassword`, uses `credentials: 'include'` where required, and uses `Cache-Control: no-store` for responses containing authentication state.

On success, the Backend/Web adapter refreshes the current session. The frontend updates in-memory access context only from the safe response DTO and never reads, stores, or displays a refresh token. A 401 clears the corresponding session and redirects to role-appropriate sign-in. A 403 preserves a valid session. For a public Google-only account, `auth.local_password_unavailable` explains that the account has no local password and should continue using Google sign-in; other 403 results show access denied.

## 7. Backend result mapping

**SRS_INTERNAL_CONFLICT — message codes:** see BE spec §5. `MSG05` (not `MSG03`) is the catalog/codebase code for password-policy/same-as-current; `MSG06` (not `MSG04`) is the catalog/codebase code for confirm-mismatch (client-side only, never sent to Backend).

| Backend result | Web behavior |
| --- | --- |
| 200 success / `MSG18` | Clear fields, announce `Password updated successfully.`, refresh session context, keep the user in the role-appropriate workspace |
| 400 `MSG01` | Required-field inline feedback |
| 400 `MSG05` | New-password policy or same-as-current feedback |
| 400 `MSG17` | Current-password field feedback: `Current password does not match our records.` |
| Other 400 validation | Map only approved safe field messages; otherwise show generic form feedback |
| 401 | Clear session according to its owner and redirect to sign-in |
| 403 `auth.local_password_unavailable` | Public Google-only account: explain that no TripMate password exists; preserve session and never claim success |
| Other 403 | Access denied; preserve a valid session and never claim success |
| 429/5xx/network | Show generic retry feedback; never show success |

## 8. Accessibility and responsive requirements

- Associate labels, inline errors, help text, and visibility controls using accessible names and `aria-describedby`.
- Announce pending and completion/error states through project feedback conventions.
- Keyboard-only use supports field traversal, visibility toggles, submit, and cancel.
- Do not disable a control without an accessible explanation when integration is intentionally pending.
- Verify 320 px, tablet, and desktop layouts; no horizontal overflow and all actions remain reachable.

## 9. Acceptance criteria

1. A valid self-service user submits only Current Password and New Password to the approved UC-07 endpoint.
2. Confirm password never leaves the client.
3. Invalid local inputs cause no network request.
4. The UI cannot display success without a successful Backend response.
5. Missing/expired/tampered session redirects before protected screen can mutate credentials.
6. A successful change clears visible form secrets and refreshes only the caller session; refresh tokens remain inaccessible to JavaScript.
7. Wrong current password maps to `MSG17`; same password/policy violation maps to `MSG05`; failures never become success.
8. Administrator and public-account session boundaries remain separate.
9. A valid Staff internal session can use the same self-service screen and BFF endpoint; Staff cannot select another subject or role.

## 10. Test requirements

- Form tests: labels, masking toggle, client validation, confirmation omission, no false success, secret clearing, cancel navigation, and error mapping.
- Adapter/BFF tests: payload allow-list, no token exposure, 401 clear-and-redirect, Google-only and other 403 session preservation, and safe handling of 5xx/network failure.
- Route tests: direct navigation for valid role, wrong role, missing/expired/tampered session.
- Responsive/manual keyboard review before delivery.
