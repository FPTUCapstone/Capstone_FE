
UC-06 Frontend Specification — Reset Password

Feature: UC-06 Reset Password
Layer: Frontend / Web
Status: Draft for Developer Approval
Implementation Status: Not Started

1. Purpose

UC-06 allows an unauthenticated user who has forgotten their local TripMate password to reset it by requesting a one-time password (OTP) through email and submitting that OTP together with a new password.

The Frontend is responsible only for:

collecting and validating user input;

calling the Backend Reset Password APIs;

presenting safe feedback;

managing the recovery user experience.

The Backend remains the sole authority for password-reset eligibility, OTP validity, password updates, and session/token effects.

Firebase Password Reset must not be used.

2. Scope

2.1 In Scope

Public Forgot Password flow from Sign In.

Administrator self-service Forgot Password flow from Admin Login.

Email submission for password-reset request.

Enumeration-safe request-result UX.

OTP input.

New Password input.

Confirm Password input.

Reuse of the existing Frontend password policy.

Resend OTP.

60-second resend cooldown UX.

Handling of Backend validation, reset, rate-limit, system, and network errors.

Successful navigation back to Sign In.

Automated Frontend tests for the UC-06 flow.

2.2 Out of Scope

Firebase Password Reset.

Backend implementation changes.

Database/schema changes.

OTP generation.

OTP verification logic in the Frontend.

Password hashing.

Refresh-token or access-token revocation logic in the Frontend.

Authenticated Change Password.

Administrator-driven password reset.

MFA.

Mobile implementation.

Changes to account status, role, or TourOperator approval.

Administrator resetting another user's password.

Any admin-driven password reset for another account.

3. Primary Actors

Unauthenticated user who has forgotten the password of a local TripMate account.

Unauthenticated Administrator who has forgotten the password of their own local Administrator account.

UC-06 is self-service password recovery only.

An Administrator may reset their own password through the same Backend UC-06 API, but UC-06 does not allow an Administrator to reset another user's password.

The Frontend must not attempt to determine whether the supplied email is eligible for password reset.

4. User Flow

Public user

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

Administrator self-service recovery

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

Both flows use the same Backend Reset Password endpoints and the same validation/security rules. The only required navigation difference after success is the destination login route.

There is no separate OTP verification step.

OTP validity is checked only when the final reset request is submitted to the Backend.

5. Functional Requirements

FR-01 — Open Forgot Password

From public Sign In, the user can open the public Forgot Password flow.

From Admin Login, an Administrator can open the Administrator self-service Forgot Password flow.

Both recovery flows start with an email form and use the same Backend UC-06 endpoints.

FR-02 — Request Reset OTP

The user enters an email address and submits a reset request.

The Frontend must:

validate the email using the existing authentication email-validation convention;

prevent duplicate submission while the request is pending;

show the existing project loading state;

call the Backend password-reset request endpoint;

treat every successful 200 response with the same generic UX;

retain the email only as required for the active recovery flow;

proceed to the reset form after success;

start the 60-second resend cooldown after success.

The Frontend must never reveal whether the account:

exists;

does not exist;

is Google-only;

is Locked;

is Inactive;

is otherwise reset-ineligible.

FR-03 — Enter Reset Information

After a successful reset request, the user is presented with one form containing:

OTP;

New Password;

Confirm Password.

There must not be a fake or client-side OTP verification step.

FR-04 — Validate OTP

OTP must:

be required;

be stored and handled as a string;

contain exactly 6 ASCII numeric characters;

preserve leading zeroes.

Canonical validation rule:

^[0-9]{6}$

Example of a valid OTP:

012345

The Frontend must not convert OTP to a number.

FR-05 — Validate New Password

New Password must use the existing authoritative Frontend password policy already used for local-password registration.

UC-06 must not introduce a different password policy.

Current required behavior includes:

required;

no leading or trailing whitespace;

length 8–72 characters;

at least one uppercase letter;

at least one lowercase letter;

at least one digit;

at least one special character.

FR-06 — Validate Confirm Password

Confirm Password must:

be required;

exactly match New Password;

remain Frontend-only;

never be sent to the Backend.

FR-07 — Confirm Password Reset

When the reset form is valid, the Frontend must:

prevent duplicate submission while pending;

submit the retained email, OTP string, and New Password to the Backend;

not include Confirm Password in the request.

On successful reset:

display success feedback using the existing project convention;

clear the active recovery flow state;

return a public user to public Sign In;

return an Administrator using the admin recovery flow to Admin Login;

not automatically authenticate the user.

FR-08 — Resend OTP

The user can resend the reset OTP.

Frontend behavior:

resend is disabled during a 60-second local cooldown;

successful resend restarts the 60-second cooldown;

resend uses the same Backend password-reset request endpoint;

the previously issued OTP must be treated as potentially superseded;

the Frontend must not claim that an older OTP remains valid.

The local cooldown is UX-only.

The Backend remains authoritative for cooldown and rate limiting.

FR-09 — OTP Expiration

Backend OTP TTL is 3 minutes.

The Frontend may communicate that the code expires after 3 minutes.

The Frontend must not use its own timer as the authority for OTP validity.

Actual validity is determined by the Backend.

FR-10 — Wrong OTP Attempt Limit

The Backend enforces a maximum of 5 actual wrong-code attempts for the current reset state.

The Frontend must not maintain its own authoritative wrong-attempt counter.

The Frontend must not:

decide that the reset is invalid based on a client-side attempt count;

expose remaining attempts unless a future approved Backend contract explicitly provides that information;

claim that the user has a specific number of attempts remaining.

When the Backend invalidates the reset state after the allowed wrong attempts are exhausted, subsequent confirmation failures continue to be handled through the safe MSG14 reset feedback.

The user may request a new OTP and restart the recovery flow according to Backend rules.

6. Backend API Contract

6.1 Request Reset OTP

Endpoint

POST /api/v1/auth/password-reset/request

Request

{
  "email": "user@example.com"
}

Success

HTTP 200

{
  "message": "If an account exists for this email, reset instructions have been sent."
}

This response is enumeration-safe.

The Frontend must preserve that property.

6.2 Confirm Reset

Endpoint

POST /api/v1/auth/password-reset/confirm

Request

{
  "email": "user@example.com",
  "code": "012345",
  "newPassword": "NewPassword1!"
}

Success

HTTP 200

{
  "message": "Your password has been reset. You can now sign in with your new password."
}

Invalid Reset

HTTP 400 with Backend problem response containing:

MSG14

MSG14 represents a safe invalid-reset outcome, including cases such as:

incorrect OTP;

expired OTP;

consumed OTP;

superseded OTP;

otherwise invalid reset state.

The Frontend must not reveal the exact internal reason.

System Failure

HTTP 500 with Backend problem response containing:

MSG127

Rate Limit

The Backend may return:

HTTP 429

7. API Response Requirements

UC-06 must follow the actual Backend reset contract.

Successful reset endpoints return direct success DTOs.

The Frontend must not require these success responses to use a legacy API success envelope.

Backend validation/business/system failures must be handled through the Backend problem-response formats used by the reset endpoints, including:

ValidationProblemDetails where applicable;

ProblemDetails for reset/system failures.

The implementation must adapt these responses into the existing Frontend error-handling convention.

8. Error Handling Requirements

ER-01 — MSG14 / HTTP 400

Display safe reset-specific feedback, for example:

The verification code is invalid or has expired. Please try again or request a new code.

The Frontend must:

keep the user in the reset flow;

allow retry;

allow resend when permitted;

not expose the exact Backend failure reason;

not expose remaining attempt count unless a future approved Backend contract explicitly provides it.

Reset-specific MSG14 handling must not change or break existing MSG14 behavior used by other authentication flows.

ER-02 — MSG127 / HTTP 500

Display a generic system-error message using the existing authentication error convention.

Do not expose Backend technical details.

ER-03 — HTTP 429

Display safe rate-limit feedback.

The Frontend must:

not automatically retry;

keep or restart an appropriate local cooldown;

continue treating the Backend as authoritative.

ER-04 — Validation Errors

Backend validation errors must be mapped safely into the existing Frontend validation/error convention.

ER-05 — Network or Unexpected Failure

Display the existing generic/network authentication error feedback.

After failure:

loading state must be released;

the user must be able to retry explicitly;

safe entered form data may remain where appropriate.

9. Recovery State and Navigation

Recovery state must remain temporary.

The Frontend must not persist OTP or passwords in:

URL/query parameters;

localStorage;

sessionStorage;

analytics;

logs.

Direct Access

Direct access to the public Forgot Password page is allowed.

The flow starts at the email-request step.

Reload

Reloading the recovery page starts a fresh recovery flow.

Missing Recovery Context

If required recovery context is missing, the user must return to the email-request step.

The Frontend must not fabricate recovery state.

Successful Reset

After successful reset:

recovery state is no longer reusable;

public recovery returns to public Sign In;

Administrator self-service recovery returns to Admin Login.

10. Security and Privacy Requirements

The Frontend must satisfy all of the following:

Backend is the sole local-password authority.

Firebase Password Reset is not used.

sendPasswordResetEmail() is not used.

OTP validity is not decided locally.

OTP is never converted to a number.

OTP leading zeroes are preserved.

OTP is not logged.

Password is not logged.

OTP/password are not sent to analytics.

OTP/password are not persisted.

OTP/password are not placed in URLs.

Account existence is not disclosed.

Reset eligibility is not disclosed.

Account status is not changed by the Frontend.

Role is not changed by the Frontend.

No automatic login is performed after reset.

Frontend does not revoke tokens itself.

11. UI Requirements

The implementation must follow existing authentication UI conventions.

Email Request State

Must support:

idle;

validation error;

submitting;

successful transition;

rate-limited;

unexpected/system failure.

Reset State

Must support:

idle;

validation error;

submitting;

invalid reset;

rate-limited;

system failure;

success.

Resend State

Must support:

cooldown;

available;

sending;

success;

failure.

Duplicate request, reset, and resend actions must be prevented.

12. Accessibility and Input Requirements

The flow must follow existing project form accessibility conventions.

At minimum:

inputs have associated labels;

validation feedback is visible;

keyboard form submission works;

password fields use password input semantics;

OTP uses text/string semantics;

inputMode="numeric" may be used for OTP;

type="number" must not be used for OTP;

OTP may use autoComplete="one-time-code";

new password fields may use autoComplete="new-password".

13. Public/Admin Recovery Boundary

UC-06 supports self-service password recovery for both:

public local-password users through /forgot-password;

local-password Administrators through /admin/forgot-password.

Both flows use the same Backend UC-06 endpoints, validation rules, OTP rules, resend rules, error handling, and security requirements.

The required navigation difference is:

public flow success → public Sign In;

admin flow success → Admin Login.

UC-06 does not include an Administrator resetting another user's password.

If the existing Frontend shares recovery UI between public and admin routes, the implementation may reuse the shared component as long as route-specific success navigation and existing UI conventions are preserved.

14. Testing Requirements

Automated tests must cover at least the following.

TR-01 — Forgot Password Entry

public Sign In exposes Forgot Password;

navigation reaches the public recovery flow;

Admin Login exposes Forgot Password;

navigation reaches the Administrator self-service recovery flow.

TR-02 — Request Reset

empty email is rejected;

invalid email is rejected;

valid email calls the correct Backend endpoint;

successful request uses generic enumeration-safe UX;

duplicate submission is prevented;

request failure releases loading state.

TR-03 — OTP

"012345" is accepted;

"012345" is submitted unchanged;

fewer than 6 digits are rejected;

more than 6 digits are rejected;

alphabetic characters are rejected;

non-ASCII digits are rejected;

OTP is never numerically coerced.

TR-04 — Password

existing password policy is reused;

invalid password is rejected;

Confirm Password mismatch is rejected;

Confirm Password is not included in Backend request.

TR-05 — Confirm Reset

correct endpoint is called;

request contains only email, code, newPassword;

MSG14 produces reset-specific safe feedback;

MSG127 produces generic system feedback;

validation problem responses are handled safely;

success returns to Sign In;

duplicate submission is prevented.

TR-06 — Resend

resend is unavailable during cooldown;

resend becomes available after 60 seconds;

resend calls the request endpoint;

successful resend restarts cooldown;

429 is handled safely;

duplicate resend is prevented.

TR-07 — Security and Role Regression

Firebase Password Reset is not called;

account-enumeration UX is not introduced;

existing Sign In/password-authority behavior is not regressed;

public recovery success returns to public Sign In;

Administrator self-service recovery success returns to Admin Login;

no UI or API behavior is added for an Administrator to reset another user's password;

no client-side authoritative wrong-attempt counter is introduced.

15. Acceptance Criteria

AC-01
The user can open public Forgot Password from Sign In.

AC-02
A valid email can request reset instructions through the Backend request endpoint.

AC-03
Every successful reset request produces the same enumeration-safe UX.

AC-04
The Frontend never reveals whether an account exists or is reset-eligible.

AC-05
OTP accepts only exactly six ASCII numeric characters.

AC-06
OTP remains a string and preserves leading zeroes such as "012345".

AC-07
The reset form contains OTP, New Password, and Confirm Password together.

AC-08
No standalone client-side OTP verification behavior is introduced.

AC-09
New Password uses the same authoritative Frontend password policy as local registration.

AC-10
Confirm Password must match New Password.

AC-11
Confirm Password is never sent to the Backend.

AC-12
The confirm request contains email, code, and newPassword.

AC-13
HTTP 400 / MSG14 produces reset-specific safe invalid-code feedback.

AC-14
HTTP 500 / MSG127 produces generic system-error feedback.

AC-15
HTTP 429 produces safe rate-limit feedback without automatic retry.

AC-16
Resend is locally throttled for 60 seconds.

AC-17
The Backend remains authoritative for resend and rate limiting.

AC-18
A successful resend restarts the local cooldown.

AC-19
The Frontend does not claim a previous OTP remains valid after resend.

AC-20
A successful reset returns the user to public Sign In without automatically logging them in.

AC-21
Reload/direct access without recovery context safely starts at the email-request step.

AC-22
Request, confirm, and resend actions prevent accidental double submission.

AC-23
Firebase Password Reset is not used.

AC-24
OTP/password values are not logged, persisted, placed in URLs, or sent to analytics.

AC-25
Reset success DTOs are handled according to the direct Backend success contract.

AC-26
Backend problem responses are mapped into existing safe Frontend error conventions.

AC-27
Reset-specific MSG14 handling does not regress existing authentication flows.

AC-28
A local-password Administrator can use /admin/forgot-password to reset their own password through the same Backend UC-06 API.

AC-29
Administrator self-service reset success returns to Admin Login.

AC-30
UC-06 does not provide an Administrator with functionality to reset another user's password.

AC-31
The Backend's maximum 5 actual wrong-code attempts remain Backend-authoritative; the Frontend does not maintain an authoritative attempt counter.

AC-32
The Frontend does not display remaining OTP attempts unless a future approved Backend contract explicitly exposes them.

AC-33
After Backend invalidation caused by exhausted wrong-code attempts, the Frontend continues to handle the result through safe MSG14 feedback and allows the user to request a new OTP according to Backend rules.

AC-34
Existing Sign In and Backend-only password-authority behavior remains working.

AC-35
Automated tests cover public and admin self-service success paths, validation, errors, resend, leading-zero handling, wrong-attempt authority, and security scenarios.

16. Non-Functional Requirements

Preserve the existing Frontend architecture and authentication conventions.

Do not introduce an unnecessary dependency.

Maintain TypeScript type safety.

Keep tests deterministic.

Maintain existing responsive/auth UI behavior.

Do not duplicate the password policy.

Do not expose sensitive values or Backend internals.

Lint must pass.

Typecheck must pass.

Tests must pass.

Production build must pass.

17. Definition of Done

UC-06 FE is complete only when:

this Spec is approved;

an implementation Plan is approved;

implementation matches the approved Spec and Plan;

the public flow uses the real Backend reset APIs;

public mock password-reset behavior is removed;

Backend direct success response contract is handled correctly;

Backend problem responses are handled correctly;

OTP leading-zero behavior is preserved;

the existing password policy is reused;

resend behavior satisfies the 60-second UX requirement;

no account-enumeration behavior is introduced;

no Firebase Password Reset is used;

public and Administrator self-service recovery both work with the same Backend UC-06 contract;

UC-06 does not introduce Administrator reset-other-user behavior;

the Backend remains authoritative for the 5 wrong-code attempt limit;

all required automated tests pass;

lint passes;

typecheck passes;

production build passes;

Open Code Review reports no blocking finding;

developer explicitly approves delivery.

18. Open Questions / Blockers

There are no known Backend-contract blockers for UC-06 self-service recovery.

The public and Administrator recovery routes may share existing Frontend components. The implementation Plan should reuse that architecture where practical while preserving route-specific success navigation.

No separate Administrator-reset-other-user behavior is part of this UC.

SPEC READY FOR DEVELOPER REVIEW — NOT APPROVED FOR IMPLEMENTATION
