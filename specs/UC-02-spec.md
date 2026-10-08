# UC-02 Register Tour Operator Account Frontend Specification

## Status

**Approved design; MSG157-MSG160 UC-02 constants decided; PC-03 review-list
dependency and end-to-end verification remain.** Branch
`feature/linhnv-register-tour-operator` (based on latest `origin/develop`, `2170bc9` —
the `Capstone_FE` develop tip). Companion to `Capstone_BE/specs/UC-02-spec.md` (source of
truth for the contract and the message reconciliation; the BE plan records the BE SHA
separately). Implementation follows `plans/UC-02-plan.md`.

## Sources and scope

- SRS §3.2.2: Guest submits account + company info + business documents → one `TourOperator`
  account (Pending Approval) + one application (Pending Review). The current UC-50 Admin
  detail route can read it by userId. A list/review queue does not yet exist, so SRS PC-03
  remains an explicit dependency; this FE spec does not claim queue visibility.
- BE contract: `POST /api/v1/auth/register/operator` (multipart; see BE spec for fields,
  statuses, and the reconciled message mapping — several SRS MSG references are wrong and the
  BE spec's M-table governs).
- **The screen already exists as a prototype**: `/partner/register` renders
  `OperatorRegistrationForm` (mock, no API). This UC **wires the existing screen** to the real
  endpoint following the UC-50 review detail's field structure (company name, tax code,
  business licence number, contact/address, documents) — no new visual screen is created.

## Route and session contract

### Owner-decided Tax Code and Travel Licence formats (2026-10-08)

Before Firebase identity creation, validate trimmed Tax Code as 10 digits or
10 digits-3 digits (branch). Validate the Business Licence Number as two
province digits, a hyphen, one or more serial digits, slash, four year digits,
slash, and `TCDL-GPLHQT` or `SDL-GPLHND`. Examples are
`0101234567`, `0315678901-001`, `79-0123/2026/TCDL-GPLHQT`, and
`01-0456/2025/SDL-GPLHND`. Show format guidance and field errors using BE
codes `OPERATOR_TAX_CODE_INVALID` and `OPERATOR_TRAVEL_LICENSE_INVALID`.
Do not filter keystrokes; the BE remains the authoritative check.

- Route unchanged: `/partner/register` (public, Guest). [Back to Sign In] links to
  `/sign-in` per SRS.
- **Registration order:** validate client fields; create the Firebase identity with
  `createUserWithEmailAndPassword`; obtain its ID token; POST the multipart form to BE with
  the required `firebaseIdToken` field. Only **after** BE returns `201` does FE call
  `sendEmailVerification` with continue URL `/verify-email?flow=operator`. This follows the
  traveler flow's commit-before-email ordering. The token binds the Firebase identity to the
  submitted email; it does not mean the email has been verified.
- The guest form calls the BE directly through the existing `NEXT_PUBLIC_API_URL` base, as
  `registerTraveler` does. The multipart token is a form field, **not** a bearer header;
  there is no admin cookie.
- **Verification endpoint:** the operator branch of `/verify-email` calls the existing
  `webVerifyEmail(idToken)` client (`POST /api/v1/auth/web/verify-email`) after Firebase
  applies the action code. That endpoint must be amended to set `EmailVerifiedAtUtc` for a
  pending operator while preserving `PendingApproval`; it does not issue a session. The
  traveler branch continues using `/auth/verify-email` unchanged. The operator signs in
  separately after verification.
- **Recovery:** if BE deterministically rejects registration, delete the Firebase identity
  just created best-effort. If the POST outcome is unknown (network failure), retain it and
  retry using the same Firebase identity/token; never create another Firebase user blindly.
  A subsequent 409 does not by itself prove whether the earlier POST committed: preserve the
  Firebase identity and guide the applicant through sign-in/verification recovery rather than
  deleting it. If BE committed but email delivery failed, keep the application, show the resend-capable
  verification screen, and do not POST registration again. A browser without the original
  Firebase session can reconcile verified status during password sign-in after the BE
  amendment; resending first requires restoring the Firebase session with the applicant's
  credentials. Test all three paths.
- On success: MSG08 (locked business-submission text) shown with the "Submitted" state,
  **plus the locked MSG07 verification handoff** ("Account registered successfully! Please
  verify your email/OTP to activate your account.") — the operator completes the existing
  email-verification flow before sign-in resolves (the `AccountEligibilityResolver`
  requires a real verification marker; no fabricated timestamps). After verification,
  sign-in lands at `/partner/application` (Pending Review) — the operator workspace stays
  locked until approval (PC-04).

## Form fields (wired per SRS §3.2.2 + BE contract)

- Account: Email Address, Password, Confirm Password.
- Company: Company Name, Business Licence Number, Tax Code, Business Address (optional),
  **Contact Person (required — stored into the account's full name)**, Contact Phone Number
  (optional). The prototype currently requires every text field — the implementation amends
  validation (re-review point 3).
- Upload: Business Licence document (required), supporting documents (optional) — file inputs
  with type/size hints; actual storage per the BE DEC (multipart passthrough).
- Checkbox: Accept Terms of Service + Privacy Policy + Partner Agreement (required).
- Buttons: [Submit Application] (loading + duplicate-submit guard), [Back to Sign In].

## States and error handling

| Situation | Behavior |
| --- | --- |
| Success (`201`) | Locked MSG08 text in the existing Submitted state; send verification email, then show locked MSG07 and the verification handoff. No auto-login. |
| Email send failure after `201` | Preserve the submitted application, show a delivery warning and resend action; never submit registration again merely to resend. |
| Deterministic BE rejection after Firebase creation | Preserve form values and delete only the newly created Firebase identity best-effort; show the BE field/alert error. |
| Unknown BE POST outcome | Preserve Firebase identity and form values; offer a retry with the same identity/token. A confirmed existing BE account follows verification recovery. |
| Field errors (`400`: MSG01/02/05/06/157/158) | Rendered under the offending control using locked SRS text for existing codes and the agreed UC-02 constant text for MSG157/158; inputs preserved. |
| Email exists (`409` MSG03) | Locked MSG03 text at the email control. |
| Missing/invalid Firebase token (`400`/`401`) or token-email mismatch (`400`) | Do not upload or retry with another Firebase identity; refresh the matching Firebase user's token when possible and show a safe field/session error. |
| License/tax code exists / duplicate pending application (`409`, MSG159/MSG160) | Alert at the company section; inputs preserved. |
| `503` storage/system (MSG127) | Alert with Retry; all inputs and files preserved; no database record was created and uploaded files were compensated best-effort server-side. |
| Network failure | Show MSG127, but do not claim no BE record was created; the commit outcome is unknown. Use the recovery path above. |

Client-side guards mirror the BE: required fields (**including Contact Person** — the
prototype's require-everything validation is relaxed for the optional address/phone),
email format, password policy, confirm match (locked MSG06), licence document presence,
terms accepted — the submit is blocked before any request when these fail (locked
MSG01/02/05/06 texts inline).

## Acceptance criteria

1. The existing `/partner/register` route submits a real multipart request to
   `POST /api/v1/auth/register/operator` and shows locked MSG08 on success (PC-01/PC-02 are
   BE-side).
2. Every validation message renders its reconciled SRS catalog text (MSG01/02/03/05/06) or the
   approved UC-02 feature-local text (MSG157–MSG160) mapped from the BE error code; these four
   messages are constants rather than `dbo.Messages` rows. Inputs and files are
   preserved on any failure. Contact Person is required; Business Address / Contact Phone
   are optional. An ambiguous POST outcome never triggers deletion of the Firebase identity.
3. Client guards prevent invalid submissions before the request (required fields, email
   format, password policy, confirm match, licence document, terms).
4. Loading and duplicate-submit protection on [Submit Application]; [Back to Sign In]
   navigates to `/sign-in`.
5. Firebase identity and BE registration are reconciled on deterministic rejection,
   ambiguous network outcome, and post-commit email failure. The operator verification link
   uses `/auth/web/verify-email` without auto-login; a verified operator can subsequently
   sign in and view the pending application.
6. Responsive 320/768/1280px without page-level horizontal overflow; visible keyboard focus;
   labels associated; file inputs accessible; status never color-alone.
7. Service/form tests cover multipart fields and token, message mapping, all failure/recovery
   states, and duplicate-submit protection; a cross-flow test covers registration, verified
   operator link, password sign-in, pending application and locked workspace.

## Non-goals

Creating a new verification provider; auto-login after registration; approval/rejection
(UC-50/51); resubmission (UC-03); changes to `/partner/application` beyond what the existing
prototype already renders; document preview/storage UI beyond the file inputs.
