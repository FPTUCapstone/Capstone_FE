# UC-03 Resubmit Tour Operator Application — Web Implementation Plan

Status: **Revised draft — 2026-10-08**. Follows `specs/UC-03-spec.md` and the shared BE contract. Branch: `feature/linhnv-resubmit-tour-operator-application`.

## Task 0 — Baseline and contract verification

1. Record branch SHA/status and `npm`/Node versions.
2. Run baseline lint, typecheck, tests, and production build; record pass/fail/skip.
3. Confirm existing HttpOnly session helpers, `fetchBackend`, auth-context refresh/invalidation API, route constants, and operator application prototypes.
4. Lock the canonical route `/partner/application/resubmit` and message mapping MSG01/127/157/158/159/161/162.

DoD: baseline and reusable infrastructure are documented before implementation.

## Task 1 — Types, API client, and BFF route handlers

1. Define shared FE types matching the BE DTO exactly: numeric `userId`, `userStatus`, `approvalStatus`, `reviewedAtUtc`, and document `documentId`, `documentType`, `status`, `uploadedAtUtc`, `downloadUrl`, `downloadUrlExpiresAtUtc`.
2. Add same-origin client calls for GET and PUT.
3. Implement Next.js route handlers that use HttpOnly session credentials, forward `request.signal`, preserve `FormData` boundaries, and sanitize upstream failures.
4. Do not expose raw storage references, tokens, cookies, backend exception text, or backend URLs.
5. Tests: authenticated forwarding, absent/expired session, abort propagation, repeated supporting-document keys, multipart content header behavior, and safe error mapping.

DoD: browser code can only access UC-03 through the BFF.

## Task 2 — Real application status page

1. Replace mock data with the GET client.
2. Render loading, rejected, pending, approved, not-found, forbidden, retryable error, and session-expired states.
3. Show rejection reason/review timestamp and authorized document links for rejected applications.
4. Show Resubmit only for rejected state and navigate using the route constant.
5. Redirect `401` to `/sign-in?returnUrl=/partner/application`.

Tests cover each state, document URL expiry handling, keyboard focus, and route navigation.

## Task 3 — Resubmit form and validation

1. Prefill the form from fetched application data and guard direct route access.
2. Reuse exact UC-02 normalization and tax/licence/phone regex helpers rather than copying divergent patterns.
3. Preserve Unicode input. Validate required/length rules after trimming.
4. For selected files, check size and extension only; accept empty MIME and leave content validation to BE.
5. Build browser `FormData` with optional licence and repeated `supportingDocuments` keys. Do not set multipart Content-Type manually.
6. Disable duplicate submit and preserve all input/files after recoverable failures.

Tests cover Unicode, whitespace/max boundaries, formats, empty MIME, invalid extension/size, supporting count, optional licence, and double click.

## Task 4 — Outcome mapping and session synchronization

1. Map `400`, `401`, `403`, `404`, MSG159 conflict, MSG161 stale state, `503`, abort, and network failure to the behaviors in the spec.
2. On MSG162, invalidate/refetch application data and auth/session context before navigating/rendering Pending Review.
3. Ensure route guards observe `PendingApproval` and cannot reuse a stale rejected session snapshot.
4. Add integration tests for success refresh, expired session redirect, conflict form preservation, and stale-state recovery.

DoD: UI and guards agree with both BE state fields after resubmission.

## Task 5 — Final verification and evidence

Run the repository's actual scripts from `package.json` against final HEAD, including lint, typecheck, tests, build, and:

```text
git diff --check
```

Record final SHA, exact commands, pass/fail/skip, browser, BE SHA, seed account state, and screenshots for rejected → form → Pending Review. Smoke test with the Mobile client against the same BE contract. Do not count mock UI evidence as completion.
