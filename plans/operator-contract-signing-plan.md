# Operator contract signing — FE plan
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

## Implementation units executed on 24/11/2026
1. Added local SignaturePad with test-first pointer/keyboard capture, normalized bounded strokes, transparent PNG, clear/cancel and stale callback protection. No drawing dependency added. 16 behavior tests passed; independent component review finding was fixed with a regression test.
2. Added typed operatorContracts transport and bounded operatorContractsProxy BFF with owner APIs, private PDF streaming, semantic errors, same-origin checks and TO role enforcement. Added catch-all API route.
3. Added optional authoritative onboarding metadata to the shared Web context; updated sign-in destination, PartnerRouteGuard policy and the `/partner` parent boundary. Legacy omitted metadata retains existing behavior; waiting accounts cannot render older workspace pages.
4. Added `/partner/contract` viewer and identity preparation, finite PDF polling, actual OTP challenge controls, required consent/name/drawing, idempotent Sign, conflict/lost-response recovery and signed-session refresh.
5. Added profile contract link, waiting-signature application action, truthful Staff approval feedback and persisted Admin account status filter/labels.
6. Added behavior tests for the viewer, API/BFF, auth routing, global boundary, retry keys, OTP expiration, signer mismatch, PDF failures and Admin filtering. Validation logs are local artifacts under the parent workspace `.tmp`; they must not be committed.
7. Full production build is coordinated by the parent after BE integration. Interactive visual checks, real email OTP and end-to-end signing require the issued TO fixture and the final BE runtime; mock-based unit tests do not establish those outcomes.

Parent final verification 24/11/2026: scoped lint/typecheck and Next 16.4.5 webpack production build passed. The final contract/application edge suite passed 42 tests, including renewing server session before leaving an already-open review screen. FE is running at port 3002 against the signing-enabled BE at 5022; `/partner/contract` serves successfully. Real mailbox OTP and browser signing interaction are still manual checks, not inferred from the automated suite. Existing legacy TO accounts retain workspace access and are not automatically issued a new contract.
