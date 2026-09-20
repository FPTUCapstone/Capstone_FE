UC-06 Frontend Implementation Plan — Reset Password

Feature: UC-06 Reset Password
Layer: Frontend / Web
Branch: feature/PhucTV-reset-password
Status: Draft for Developer Approval
Specification: specs/UC-06-reset-password-fe-spec.md

1. Goal

Implement the public UC-06 Reset Password flow using the existing TripMate Frontend architecture and the completed Backend Reset Password APIs.

Target flows:

Public:
Sign In
  ↓
Forgot Password
  ↓
Enter Email
  ↓
Request Reset OTP
  ↓
OTP + New Password + Confirm Password
  ↓
Reset Password
  ↓
Success
  ↓
Sign In

Administrator self-service:
Admin Login
  ↓
Forgot Password
  ↓
Enter Email
  ↓
Request Reset OTP
  ↓
OTP + New Password + Confirm Password
  ↓
Reset Password
  ↓
Success
  ↓
Admin Login

The Frontend must preserve these core rules:

Backend is the sole local-password authority.

Firebase Password Reset is not used.

OTP is a 6-character ASCII digit string.

Leading zeroes must be preserved.

Backend request success is enumeration-safe.

Backend reset success uses direct DTO responses.

Backend reset errors use ProblemDetails / ValidationProblemDetails.

UC-06 supports Administrator self-service reset through the existing admin recovery route.

UC-06 must not add Administrator reset-other-user functionality.

Backend remains authoritative for the maximum 5 actual wrong-code attempts.

Existing Frontend password rules must be reused.

2. Delivery Rules

Implementation follows the repository/team workflow:

Approved Spec
→ Approved Plan
→ TDD per task
→ Open Code Review after each task
→ Full validation
→ Developer chooses delivery

Do not:

commit before explicit delivery approval;

push before explicit delivery approval;

create a PR before explicit delivery approval;

merge/rebase during implementation unless explicitly approved;

use Firebase Password Reset;

introduce a second password policy;

change Backend code;

add any Administrator reset-other-user capability.

After every implementation task, run the relevant tests and then use:

Review my current changes using Open Code Review

Do not start the next task until the current task review has no blocking finding.

3. Baseline Before Implementation

Before modifying code:

git status --short
git branch --show-current
npm test
npm run lint
npm run typecheck
npm run build

Expected branch:

feature/PhucTV-reset-password

Record the baseline result.

If an existing baseline failure is unrelated to UC-06, document it before implementation rather than silently fixing unrelated code.

Task 1 — Establish Shared Password Validation

Goal

Ensure UC-06 and local registration use the same Frontend password policy without duplicating the rules.

Inspect First

Inspect:

src/features/traveler/registration/TravelerRegistrationForm.tsx

Identify the current canonical password-validation logic and existing test coverage.

TDD

Add tests first for the shared policy covering at least:

required password;

no leading whitespace;

no trailing whitespace;

minimum 8 characters;

maximum 72 characters;

uppercase required;

lowercase required;

digit required;

special character required;

valid password accepted.

The test expectations must preserve the existing registration behavior/messages.

Implementation

Preferred approach:

Create:

src/lib/passwordPolicy.ts

Move/extract the existing password-validation logic into the shared helper.

Update:

src/features/traveler/registration/TravelerRegistrationForm.tsx

to use the shared helper with no user-visible registration behavior change.

Do not invent new password requirements.

Expected Files

Likely:

src/lib/passwordPolicy.ts
src/lib/passwordPolicy.test.ts
src/features/traveler/registration/TravelerRegistrationForm.tsx

and existing registration tests only if required.

Task Validation

Run focused password-policy/registration tests, then:

npm run typecheck
npm run lint

Task Acceptance

One canonical FE password policy exists.

Registration behavior is unchanged.

UC-06 can reuse the shared policy.

No unrelated auth behavior changes.

Review Gate

Run Open Code Review.

Do not proceed until PASS/no blocking finding.

Task 2 — Add Reset Password API Client Support

Goal

Add typed Frontend API support for the two Backend UC-06 endpoints while respecting the actual Backend response contract.

Backend Contract

Request OTP

POST /api/v1/auth/password-reset/request

Request:

{
  "email": "user@example.com"
}

Success:

{
  "message": "If an account exists for this email, reset instructions have been sent."
}

Confirm Reset

POST /api/v1/auth/password-reset/confirm

Request:

{
  "email": "user@example.com",
  "code": "012345",
  "newPassword": "NewPassword1!"
}

Success:

{
  "message": "Your password has been reset. You can now sign in with your new password."
}

Errors:

400 + MSG14

500 + MSG127

possible 429

ValidationProblemDetails where applicable

TDD

Add API tests first for:

Request API

correct URL;

POST method;

correct JSON body;

direct { message } success DTO handled correctly;

no legacy-success-envelope requirement.

Confirm API

correct URL;

POST method;

body contains exactly:

email

code

newPassword

OTP "012345" is serialized unchanged;

confirmPassword is never present;

direct { message } success DTO handled correctly.

Error Responses

Cover normalization of:

ProblemDetails + MSG14;

ProblemDetails + MSG127;

ValidationProblemDetails;

HTTP 429;

unexpected/network failure.

Implementation

Update:

src/lib/authApi.ts

Add typed request/response structures and wrappers for:

requestPasswordReset(...)
confirmPasswordReset(...)

Do not force the reset success DTO through an incompatible legacy envelope.

Reuse existing transport/error normalization where possible, but adapt reset responses to the Backend contract.

Expected Files

src/lib/authApi.ts
src/lib/authApi.test.ts

Task Validation

Run focused API tests plus:

npm run typecheck
npm run lint

Task Acceptance

Both Backend endpoints are callable.

Direct success DTOs work.

ProblemDetails/ValidationProblemDetails are safely normalized.

"012345" remains "012345".

confirmPassword cannot enter the Backend request.

Review Gate

Run Open Code Review.

Do not proceed until PASS/no blocking finding.

Task 3 — Add UC-06 Recovery Service and Error Mapping

Goal

Expose UC-06 through the existing web recovery feature module and add reset-specific safe error mapping.

Inspect First

Inspect:

src/features/auth/recovery/webRecovery.ts
src/features/auth/recovery/webRecovery.test.ts
src/lib/authErrorMapper.ts
src/lib/authErrorMapper.test.ts

Preserve existing sign-in/password-authority behavior.

TDD

Add tests first for recovery orchestration:

Request

email normalized consistently with existing web sign-in;

calls request-reset API;

returns generic success without account-specific interpretation.

Confirm

normalized retained email is used;

OTP remains a string;

exact email/code/newPassword payload used.

Error Mapping

Test:

MSG14 maps to reset-specific invalid/expired-code feedback;

repeated MSG14 responses do not create a client-authoritative attempt counter;

no remaining-attempt count is shown unless provided by an approved Backend contract;

existing non-reset MSG14 behavior does not regress;

MSG127 maps to generic system failure;

HTTP 429 maps to rate-limit feedback;

network error maps to existing connection feedback;

unknown backend message is not leaked raw.

Implementation

Update:

src/features/auth/recovery/webRecovery.ts
src/lib/authErrorMapper.ts

Add reset-specific recovery functions using the Task 2 API wrappers.

Use a reset-specific mapper/context for MSG14.

Do not globally rewrite MSG14 wording if that would affect email verification.

Expected Files

src/features/auth/recovery/webRecovery.ts
src/features/auth/recovery/webRecovery.test.ts
src/lib/authErrorMapper.ts
src/lib/authErrorMapper.test.ts

Task Validation

Run focused recovery/error-mapper tests plus:

npm run typecheck
npm run lint

Task Acceptance

Recovery feature module owns UC-06 web orchestration.

No Firebase reset path is introduced.

Reset-specific MSG14 is safe.

Existing auth error behavior remains intact.

No account-enumeration logic is introduced.

Review Gate

Run Open Code Review.

Do not proceed until PASS/no blocking finding.

Task 4 — Replace the Recovery Prototype

Goal

Replace the mock password-recovery behavior with the real Backend-backed UC-06 self-service flow for both public users and Administrators.

Route Boundary

The repository currently has:

/forgot-password
/admin/forgot-password

Both routes should use the same UC-06 Backend reset behavior.

Before implementation, inspect how:

src/components/auth/PasswordRecoveryFlow.tsx

is consumed by the public and admin pages.

Use the minimum-change repository-compatible solution.

Required route-specific success behavior:

public /forgot-password → ROUTES.signIn

admin /admin/forgot-password → ROUTES.admin.login

Do not add functionality for an Administrator to reset another user's password.

TDD

Create/extend component tests first.

Request Step

Test:

email input renders;

empty email blocked;

invalid email blocked;

valid email invokes reset request;

success advances to the reset form;

success UX is generic;

double-submit prevented;

request failure releases loading state.

Reset Form

Test fields:

OTP;

New Password;

Confirm Password.

OTP tests:

"012345" accepted;

leading zero preserved;

fewer than 6 digits rejected;

more than 6 digits rejected;

letters rejected;

non-ASCII digits rejected.

Password tests:

shared canonical password policy used;

invalid password blocked;

confirm mismatch blocked.

Confirm tests:

correct recovery function called;

exact values passed;

success feedback rendered;

success navigates to ROUTES.signIn;

no automatic authentication behavior;

duplicate confirm prevented.

Navigation / Recovery State

Test:

fresh /forgot-password begins at email step;

fresh /admin/forgot-password begins at email step;

missing recovery context returns to email step;

no OTP/password URL persistence;

public reset success navigates to public Sign In;

admin self-service reset success navigates to Admin Login;

reset success makes prior recovery UI state unusable.

Implementation

Replace the public prototype behavior.

Remove from the public flow:

simulateMockRequest;

mock OTP acceptance;

magic expired behavior;

15-minute TTL copy;

prototype-only footer/copy;

prototype password regex.

Implement:

Email request form
→ combined OTP + New Password + Confirm Password form
→ success
→ Sign In

Use:

existing form controls;

existing FeedbackAlert;

existing action/loading conventions;

shared password policy;

recovery functions from Task 3.

Recommended OTP input:

type="text"
inputMode="numeric"
maxLength={6}
autoComplete="one-time-code"

Do not use type="number".

Expected Files

Likely:

src/components/auth/PasswordRecoveryFlow.tsx
src/components/auth/PasswordRecoveryFlow.test.tsx

Potentially a new public-specific recovery component if required to preserve the admin boundary.

Do not change route definitions unless inspection proves it necessary.

Task Validation

Run focused component tests plus:

npm run typecheck
npm run lint

Task Acceptance

Public mock flow is replaced by real Backend flow.

Combined reset form matches the Spec.

OTP leading zero is preserved.

Existing UI conventions are followed.

Public and Administrator self-service recovery both use the Backend UC-06 flow.

Public success returns to public Sign In.

Admin success returns to Admin Login.

No Administrator reset-other-user behavior is introduced.

No Firebase reset behavior exists.

Review Gate

Run Open Code Review.

Do not proceed until PASS/no blocking finding.

Task 5 — Implement Resend Cooldown and Runtime Error UX

Goal

Complete the public recovery UX for resend, Backend rate limiting, and reset failures.

Existing Utility

Prefer reuse of:

src/lib/useVerificationEmailCooldown.ts

with:

60 seconds

if its current behavior fits UC-06.

TDD

Use fake timers if consistent with current Vitest patterns.

Test:

Initial request

successful reset request starts a 60-second cooldown;

resend disabled during cooldown;

countdown state updates;

resend becomes available after 60 seconds.

Resend

calls same request endpoint with retained email;

duplicate click does not generate parallel resend;

success restarts countdown;

safe generic resend feedback shown;

UI does not claim old OTP remains valid.

HTTP 429

safe rate-limit message shown;

local cooldown remains/starts;

no automatic retry.

MSG14

reset-specific message shown;

user remains on reset form;

user can retry;

user can resend when permitted;

entered safe values are not unnecessarily discarded;

FE does not maintain an authoritative wrong-attempt counter;

FE does not display remaining attempts unless an approved Backend contract provides them;

after Backend invalidation caused by exhausting 5 actual wrong-code attempts, the same safe MSG14 path is used and the user may request a new OTP.

MSG127 / Network

generic error displayed;

loading state releases;

explicit retry remains available.

Implementation

Integrate the existing cooldown hook into the public UC-06 flow.

Backend remains authoritative.

Do not create client logic that decides OTP validity based solely on timers.

Show 3-minute OTP TTL as informational copy only.

Expected Files

Primarily:

src/components/auth/PasswordRecoveryFlow.tsx
src/components/auth/PasswordRecoveryFlow.test.tsx

and only minimal supporting changes if needed.

Task Validation

Run focused component tests plus:

npm run typecheck
npm run lint

Task Acceptance

60-second resend UX works deterministically.

429 is handled safely.

3-minute TTL is informational only.

MSG14/MSG127/network behavior matches the Spec.

No retry spam or duplicate actions.

Review Gate

Run Open Code Review.

Do not proceed until PASS/no blocking finding.

Task 6 — Auth Integration and Regression Coverage

Goal

Verify UC-06 integrates with the existing Sign In/authentication behavior without regression.

TDD / Regression Tests

Verify or add tests for:

Sign In

public "Forgot password?" link remains available;

public link points to the correct public recovery route;

existing local-password sign-in still uses Backend-only authority;

Google sign-in remains unchanged.

Firebase

Verify no UC-06 code imports or calls:

sendPasswordResetEmail

or equivalent Firebase password-reset behavior.

Administrator Self-Service

Verify:

/admin/forgot-password uses the same UC-06 Backend reset API;

admin recovery success returns to ROUTES.admin.login;

no Administrator reset-other-user UI or API behavior is introduced;

shared-component behavior remains explicit and tested.

Security

Verify:

no account-existence message;

no OTP/password logging;

no OTP/password localStorage/sessionStorage persistence;

no OTP/password URL/query persistence.

Expected Files

Only existing relevant auth/recovery tests unless a small regression test file is warranted.

Possible:

src/components/auth/SignInForm.test.tsx
src/components/auth/PasswordRecoveryFlow.test.tsx

Do not modify SignInForm.tsx unless a real UC-06 requirement is missing.

Task Validation

Run all auth/recovery tests, then:

npm run typecheck
npm run lint

Task Acceptance

Sign In integration remains correct.

Existing auth behavior does not regress.

Firebase reset remains absent.

Public/admin boundary is protected.

Security requirements remain satisfied.

Review Gate

Run Open Code Review.

Do not proceed until PASS/no blocking finding.

Task 7 — Full Validation

Goal

Validate the complete FE branch before delivery.

7.1 Working Tree Review

Run:

git status --short
git diff --check
git diff --stat

Inspect all changed files.

Confirm there are no:

unrelated changes;

secrets;

generated artifacts that should not be committed;

accidental package/dependency changes;

Firebase password-reset code;

accidental route-role behavior changes.

any reset-other-user behavior.

7.2 Full Automated Validation

Run:

npm test
npm run lint
npm run typecheck
npm run build

Required result:

tests: PASS
lint: PASS
typecheck: PASS
build: PASS

No failing test may be ignored.

7.3 UC-06 Contract Audit

Verify manually from code/tests:

Request

POST /api/v1/auth/password-reset/request

Payload:

{
  "email": "..."
}

Confirm

POST /api/v1/auth/password-reset/confirm

Payload exactly:

{
  "email": "...",
  "code": "012345",
  "newPassword": "..."
}

Confirm:

leading zero survives;

no confirmPassword;

no legacy-success-envelope assumption;

ProblemDetails/ValidationProblemDetails supported;

MSG14 reset mapping is safe;

MSG127 generic;

429 safe;

no client-authoritative wrong-attempt counter;

no remaining-attempt disclosure without approved Backend contract;

public success returns to public Sign In;

admin self-service success returns to Admin Login;

no Administrator reset-other-user behavior.

7.4 Security Audit

Search/review for:

sendPasswordResetEmail
parseInt
Number(
localStorage
sessionStorage
console.log

Evaluate findings specifically in UC-06-related changed files.

Confirm:

OTP/password not logged;

OTP/password not persisted;

OTP/password not placed in URLs;

no account enumeration;

no Firebase password-reset action.

7.5 Final Open Code Review

Run exactly:

Review my current changes using Open Code Review

Resolve every blocking finding.

Re-run impacted tests after any review fix.

Then re-run:

npm test
npm run lint
npm run typecheck
npm run build
git diff --check

4. Expected Final Change Set

The exact change set depends on implementation inspection, but it should remain minimal.

Expected areas:

src/lib/authApi.ts
src/lib/authApi.test.ts

src/lib/authErrorMapper.ts
src/lib/authErrorMapper.test.ts

src/lib/passwordPolicy.ts
src/lib/passwordPolicy.test.ts

src/features/auth/recovery/webRecovery.ts
src/features/auth/recovery/webRecovery.test.ts

src/features/traveler/registration/TravelerRegistrationForm.tsx

src/components/auth/PasswordRecoveryFlow.tsx
src/components/auth/PasswordRecoveryFlow.test.tsx

possibly a minimal SignInForm regression test update

Do not change:

Backend repository;

Firebase password behavior;

session/cookie architecture;

route architecture unless necessary;

any unrelated Administrator management behavior.

5. Implementation Order Summary

Task 1
Shared password policy
        ↓
Task 2
Reset API client
        ↓
Task 3
Recovery service + safe error mapping
        ↓
Task 4
Real public recovery UI
        ↓
Task 5
Resend + cooldown + runtime errors
        ↓
Task 6
Auth/security/admin regression coverage
        ↓
Task 7
Full validation + final Open Code Review

Each task uses:

Test first
→ minimal implementation
→ focused validation
→ Open Code Review
→ next task

6. Plan Approval Gate

No implementation starts until the developer explicitly approves this Plan.

Required approval phrase:

APPROVED FOR IMPLEMENTATION

Until that approval:

do not modify application code;

do not modify tests for implementation;

do not commit;

do not push;

do not create a PR.

PLAN READY FOR DEVELOPER REVIEW — NOT APPROVED FOR IMPLEMENTATION
