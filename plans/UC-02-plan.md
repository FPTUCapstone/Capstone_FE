# UC-02 Register Tour Operator Account Frontend Implementation Plan

Status: **Web implementation complete in the working tree; live Firebase/BE/SQL smoke test and PC-03 review-list dependency remain.** MSG157-MSG160 use BE/FE constants without message-table seeding. Follow `specs/UC-02-spec.md` and the BE multipart contract.

Branch: `feature/linhnv-register-tour-operator`.

## Baseline evidence (2026-10-01)

- Repository: `Capstone_FE`; baseline `2170bc99ff25dbd9646c7232d7ebbd0c3f1d925d` (`origin/develop` at the recorded time). BE baseline is recorded separately in its plan.
- `npm run lint` and `npm run typecheck` passed; `npm test`: 74 files / 741 tests passed; `npm run build` passed. Re-run after implementation.

## Task 1 — Guest multipart client and messages

Under `src/features/operator/application/`, add `registerOperator.ts` with typed form fields/files and a direct `NEXT_PUBLIC_API_URL` request to `POST /api/v1/auth/register/operator`. Append required `firebaseIdToken` as a **multipart field**; do not set a bearer header or manually set Content-Type. Include the required Business Licence file and optional supporting files.

Map locked SRS MSG01/02/03/05/06/07/08/127 verbatim and the approved UC-02 extension MSG157-MSG160 by stable BE codes to matching FE text constants. The four UC-02 texts are defined in BE `OperatorRegistrationMessages`; they are not seeded into `dbo.Messages`. Assert exact code/text/placement in FE tests so the two repositories do not drift. Parse field errors safely: 400/401 token failures need a safe field/session error, 409 email belongs at the email field, business identity/pending application at the company section, and 503/network uses MSG127. Tests first: exact field names/files/token, status mapping, malformed response, and network failure.

## Task 2 — Wire the registration form and Firebase identity

Replace the mock submit in `OperatorRegistrationForm.tsx`, preserving its layout. Make Contact Person required; Business Address and Contact Phone optional. Replace the document checkbox with a required Business Licence input and optional supporting inputs. Validate password/confirmation, PDF/JPG/PNG, 5 MB per file, maximum five supporting files, and terms before external calls.

After client validation: create Firebase identity using `createUserWithEmailAndPassword`, get its ID token, then POST to BE. On a deterministic 400/401/409/422 rejection **before any ambiguous attempt**, delete only the identity created in this attempt best-effort; preserve form values and report the BE error. On transport failure, BE commit is unknown: **retain** the Firebase identity and retry with its refreshed token, without calling `createUserWithEmailAndPassword` again. A later 409 cannot by itself prove the earlier commit outcome; preserve the Firebase identity and offer sign-in/verification recovery rather than deleting it.

After BE `201`, show MSG08, send the verification email with continue URL `/verify-email?flow=operator`, then show locked MSG07. If delivery fails, preserve the committed application, show a warning, and offer resend without re-registering. Loading/duplicate-submit protection covers Firebase creation, BE POST, and post-commit email handling.

Tests first: validation; Firebase identity/token before multipart POST; successful ordering (BE commit **before** email); deterministic rejection cleanup; ambiguous network retry with same identity; email delivery failure without second POST; double submit.

## Task 3 — Operator verification and resend handoff

Update `app/verify-email/page.tsx` and `VerifyEmailHandler.tsx` to accept `flow=operator`. After Firebase action-code application, the operator branch calls the existing `webVerifyEmail(idToken)` client (`POST /api/v1/auth/web/verify-email`), does **not** call traveler `verifyEmail()`, and does **not** store session tokens. Default/traveler behavior remains unchanged. On success, show a sign-in link; BE preserves PendingApproval and sets the genuine verified marker.

Update `/verify-account` handoff/resend UI for the operator flow. With a Firebase browser session, resend via `sendEmailVerification` using the operator continue URL. Without that session, allow the applicant to restore their Firebase session with their credentials before resend; a link already verified in another browser is reconciled by the BE during password sign-in. Never create another BE account to resend email.

Tests: operator and traveler endpoint selection, no operator auto-login, missing-session recovery, resend URL, and no duplicate BE registration.

## Task 4 — Route metadata and integration verification

Keep `/partner/register` and `/sign-in` routes. Run:

1. `npm run lint`
2. `npm run typecheck`
3. `npm test`
4. `npm run build`

Manual browser checklist with running BE/SQL/Firebase: register new operator → BE 201/MSG08 → email send/MSG07 → click link → BE marker set while status stays PendingApproval → password sign-in → `/partner/application` Pending Review → Admin UC-50 detail route retrieves the application by userId → operator workspace denied. Also test email-send failure/resend, link opened in another browser, deterministic BE rejection, ambiguous POST outcome, and file-validation errors. PC-03 list/queue visibility remains an unmet dependency until a collection screen/API exists. Record final-head results and screenshots in the PR; do not claim E2E without them.

Non-goals: a new verification provider, auto-login after registration, approval/rejection (UC-50/51), resubmission (UC-03), and changes to unrelated screens.

## Working-tree verification (2026-10-04)

- Branch: `feature/linhnv-register-tour-operator`; changes are uncommitted, so this is not final-HEAD/CI evidence.
- `npm run lint`, `npm run typecheck`, `npm run build`, and `npm test` passed on the final working tree (76 Vitest files / 752 tests plus 46 Node proxy tests).
- Focused tests cover multipart field names/files, safe errors, Firebase-before-BE ordering, deterministic cleanup, token rejection, ambiguous retry, email-delivery failure, and operator verification without traveler tokens.
- Manual cross-flow registration with a real Firebase Android/Web project, BE and SQL Server is not yet verified; do not claim PC-03 review-queue visibility.
