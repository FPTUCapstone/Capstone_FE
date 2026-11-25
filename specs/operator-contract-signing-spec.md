# Operator contract signing — FE spec
Status: APPROVED for implementation by the user on 24/11/2026.
Branch: fix/linhnv-operator-sign-up.

## Canonical cross-repository documents
- ../../Capstone_BE-confirm-booking-refund/specs/operator-contract-signing-spec.md
- ../../Capstone_BE-confirm-booking-refund/plans/operator-contract-signing-plan.md
Use the corresponding BE PR links when reviewing outside this workspace.

## Scope
Staff approval moves the account to PendingContractSignature while the application is Approved.
TO login redirects to the contract. Business access remains blocked by backend authorization.
A successfully verified and durably saved signature activates the account; no TripMate countersignature follows.
Existing registration consent remains separate. Rejection/resubmission behavior is retained.
Signature method, official template, signer authority, OTP policy, legacy accounts and retention require approval under specification section 12.

Web owns the contract viewer/signing page, authorized BFF proxies, partner route/session guards, signed-document profile entry and Staff approval feedback.

## Execution and completion
Follow implementation plan section 6, after BE contract and persisted authorization are available.
Split viewer, capture/confirmation, submit/retry, session refresh and signed-document viewing into separate units.
Write behavioral tests first: awaiting-signature routing, owner/version validation, failed signing, duplicate requests, changed contract and cross-device completion.
Keep API dates ISO and display dates dd/MM/yyyy. Do not infer activation locally.
Check long documents, keyboard/accessibility and narrow layouts visually; do not add automated tests solely for CSS/positioning, following the user's preference.
Run lint, typecheck, relevant behavior tests and production build.
Complete real BE integration and two-pass review; report skipped checks and provider limitations.
Preserve existing unrelated UI/UX changes. No implementation, commit, push or deployment is authorized merely by drafting these documents.

## Approved implementation decisions on 24/11/2026
- The user selected drawn signature, matching full name, explicit consent and actual email OTP. Existing Active operators retain access; only newly approved applications enter the waiting-signature flow.
- The selected test DOCX remains a test fixture. The UI does not describe drawing/OTP as a certified digital signature or infer that a contact person has representative authority.
- `/partner/contract` displays the issued immutable document. TO supplies signer name, title and representation basis before preparing the PDF; once frozen these fields are read-only. Original account and company data come from the server snapshot.
- Backend operations are `/api/v1/operator/contracts/current`, `/{id}/prepare`, `/{id}/signing-challenges`, `/{id}/sign`, `/{id}/documents/{unsigned|signed}`. Web BFF exposes only these operations under `/api/operator/contracts`, uses the HttpOnly session and verifies the TO role, same-origin mutations and bounded input.
- Contract status is PendingSignature, Signed or Voided; document state is NeedsSignerDetails, Processing, Ready or Failed. Metadata includes rowVersion, canPrepare, canSign, accepted/unsigned/signed SHA256 values, signer snapshot and server OTP policy. No internal storage key is returned.
- Prepare freezes the declared identity and starts async PDF generation. Polling stops after 30 checks and provides a manual retry. PDF is fetched privately as a Blob, displayed in the page and available for download.
- Sign requires the current loaded PDF, explicit acknowledgement, PNG signature, matching signer name and unexpired six-digit OTP. OTP challenge binds the accepted hash and returns the rowVersion required by Sign. Expiry/resend limits come from challenge timestamps, not a client-created deadline.
- An idempotency key is retained for the same exact retry and replaced if name, consent, OTP, challenge or drawing changes. Duplicate submissions are locked. A 409 refreshes authoritative metadata and clears stale signing fields; an uncertain response first checks whether the contract is already Signed.
- Only a Signed response or recovered Signed state displays completion. The existing webRefresh mechanism then updates the session. The UI does not activate the account locally.
- Optional onboardingState/contractStatus/currentContractId preserve old payload compatibility. AwaitingSignature routes to the contract; explicitly unresolved states fail closed. A parent `/partner` boundary also covers older business routes lacking individual guards.
- Signed contracts remain read-only and are linked from the operator profile when a current contract ID exists. Existing legacy accounts without a contract do not get a misleading download link.
- Staff approval feedback and Admin account status filters distinguish PendingContractSignature from Active.
