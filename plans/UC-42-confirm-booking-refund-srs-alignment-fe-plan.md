# UC-41 / UC-42 / UC-67 — Confirm Booking Refund SRS Alignment (FE) — Plan v1

Spec: `specs/UC-42-confirm-booking-refund-srs-alignment-fe-spec.md` v1.

Process: wait for spec approval (incl. Q-FE1, Q-FE2) → isolated branch (done:
`fix/linhnv-confirm-booking-refund`, worktree `Capstone_FE-confirm-booking-refund`) → TDD per task
→ review between tasks → `npm run lint && npm run typecheck && npm run build` before each commit.

Convention: one commit per task, Conventional Commits (`feat(refund): ...`, `test(refund): ...`,
`chore(refund): ...`), never commit `.env.local` or `.claude/`.

---

## Task 0 — Baseline (no behavior change)
- Confirm worktree is clean at `origin/develop` HEAD.
- Run `npm run lint && npm run typecheck && npm run build` and the existing refund-related test
  files (`RefundProgressPage`, `InitiateRefundDialog`, `operatorBookingService` refund tests) to
  record a pass/fail baseline before any change.
- Gate: baseline green (or only pre-existing known-red items) before proceeding.

## Task 1 — Types and constants for the new refund state machine
Red:
- `refundLifecycle.test.ts` (new, under `src/features/bookings/types/` or a shared
  `src/features/refunds/types/` module if the BE's refund concept now spans Traveler/Operator/
  Staff/Admin enough to warrant its own feature folder — decide based on Q-FE1 sign-off, default to
  a new `src/features/refunds/` feature root mirroring `src/features/admin/payout-settlements/`'s
  structure): a `RefundStatus` union including all BE statuses (`PendingOperatorConfirmation`,
  `AwaitingPartnerReturn`, `ReturnReported`, `ReturnReceived`, `Reconciliation`, `Escalated`, plus
  the pre-existing `Pending/Processing/RetryPending/ManualReview/Processed/Failed/Rejected`); a
  parser/validator rejecting an unknown status string (mirrors `PAYOUT_SETTLEMENT_STATUSES`'s
  pattern in `payoutSettlements.ts`).
Green:
- Add the module, export the status union and a `validateReturnReference` validator (MSG172,
  non-blank after trim — same shape as `validateResolutionReason`).

## Task 2 — BFF proxy routes
Red: `refundsProxy.test.ts` — for each of the four mutating routes and three reads in the spec's
API contract table:
- Forwards only the documented fields (confirm/return-received/resolve: no body beyond what each
  needs; return: strips any field but `returnReference`).
- Maps `refund.request_not_pending`→409, `refund.operator_not_owner`→403,
  `refund.return_reference_required`→400, `refund.status_persist_failed`→500 (and whatever the BE
  actually returns for the three new read endpoints once Q-FE2 is resolved).
- Rejects a cross-origin request per existing CSRF pattern (same test as `payoutSettlementsProxy`).
Green:
- `app/api/operator/refunds/[refundId]/confirm/route.ts`, `.../return/route.ts`,
  `app/api/admin/refunds/[refundId]/return-received/route.ts`, `.../resolve/route.ts`
  (or reuse the existing `complete-manual` route if Q-FE2 resolves to "same endpoint"), plus the
  three GET reads, each a thin route calling a shared `proxyRefundAction`/`proxyRefundRead`
  helper (mirrors `proxyPayoutBatchAction`).

## Task 3 — Service layer
Red: `refundsService.test.ts` — one function per BFF route, happy path + each mapped error code →
typed error, matching `payoutSettlementsService.ts`'s pattern (a shared `RefundsError` class with
`status`/`errorCode`).
Green: implement the service functions.

## Task 4 — Confirm Booking Refund screen (Tour Operator, screen 90)
Red: `ConfirmBookingRefundScreen.test.tsx`:
- Loads detail, shows booking summary + refund details per spec's field list.
- `[Confirm Refund]` visible only while `PendingOperatorConfirmation`; calls confirm, re-fetches,
  renders the re-fetched status (not an assumed one) — covers both the zero-share (skips straight
  to settled, no Return area) and non-zero-share (`AwaitingPartnerReturn`, Return area appears)
  branches.
- `[Confirm Return]` disabled until reference non-blank; MSG172 inline error before any request;
  on success re-fetches and shows the reference read-only.
- U03 stale-reload race: an earlier reload resolving after a newer one must not overwrite it (same
  test shape as `FailedPayoutSettlementScreen.test.tsx`'s equivalent).
- 401/403/404/409/500 handling (redirect to sign-in, forbidden view, not-found view, "no longer
  pending" message, generic retry banner).
Green: build the screen component + route `app/partner/refunds/[refundId]/page.tsx`, reusing
`useAccessibleDecisionDialog` for the inline reference input's focus/validation behavior where it
fits, `PartnerWorkspaceLayout` for the shell.

## Task 5 — Refund Return Reconciliation screen (Staff, screen 100)
Red: `RefundReturnReconciliationScreen.test.tsx`: list renders `ReturnReported` rows, empty state,
`[Confirm Receipt]` calls the return-received proxy and the row disappears only after a successful
re-fetch (not optimistic removal), error on action leaves the row in place with an inline error.
Green: screen + `app/admin/refund-reconciliation/page.tsx`, list/row component mirroring
`PayoutSettlementsScreen.tsx`'s table pattern.

## Task 6 — Escalated Refunds Monitor screen (Administrator, screen 101)
Red: `EscalatedRefundsMonitorScreen.test.tsx`: list renders both `Escalated` and `Reconciliation`
rows with visually distinct treatment (different badge/tone, asserted via accessible name or test
id, not just color), `Escalated` rows show Attempt Count/Last Error, `Reconciliation` rows don't
fabricate those fields, `[View Details]` opens the existing manual-completion flow.
Green: screen + `app/admin/refunds/escalated/page.tsx`, reusing the existing
`CompleteManualRefund`-calling component if one already exists for the admin refunds controller,
else a thin new detail view calling the same backend route.

## Task 7 — Traveler Refund Progress status copy
Red: `RefundProgressPage.test.tsx` — one test per new status (`PendingOperatorConfirmation`,
`AwaitingPartnerReturn`, `ReturnReported`, `ReturnReceived`, `Reconciliation`, `Escalated`)
asserting a *defined* (non-default-fallback) `statusCopy` result — i.e. the test must fail if a
status silently falls through to the generic "Refund requested" default without an explicit case
written for it, so this guards against exactly the kind of silent mislabeling the current `default`
branch produces for every one of these six statuses today.
Green: add the six `switch` cases per the spec's label/tone/description table, extend the
`RefundProgress["status"]` union type.

## Task 8 — Retire the demo-mode UC-42 workaround
Red: none (this is a deletion task) — instead, grep-verify after Green that no remaining reference
to `InitiateRefundDialog`, `initiateBookingRefund`, `InitiateRefundPayload`, `InitiateRefundResult`,
or `PENDING_BE_INTEGRATION` (refund-specific usages only — the string itself may be used elsewhere
in the codebase for unrelated pending-integration stubs; check case by case) exists.
Green:
- Delete `InitiateRefundDialog.tsx` + its test file.
- Delete `initiateBookingRefund` from `operatorBookingService.ts` (and its test cases).
- Remove `calculateDemoBookingRefundPreview` from `operatorBookingDemoPolicy.ts` if nothing else
  calls it (verify with a repo-wide grep before deleting).
- Remove `InitiateRefundPayload`/`InitiateRefundResult` from `bookingLifecycle.ts` if unused
  elsewhere after the above.
- In `OperatorBookingListView.tsx`, replace the dialog trigger with a link to
  `/partner/refunds/[refundId]` shown when `refundFollowUpRequired` is true (or, if the
  cancellation response by then carries a real `refundId`, link directly using it — check the BE's
  actual cancellation response shape at implementation time rather than assuming).
- Update `OperatorBookingListView.test.tsx` and any other test exercising the old dialog wiring.

## Task 9 — Verification
- `npm run lint && npm run typecheck && npm run build`.
- Full test suite run, not just the refund-scoped filter, to catch fallout from Task 8's deletions
  elsewhere in the operator bookings feature.
- Manual walkthrough (per this repo's CLAUDE.md "test the golden path and edge cases... in a
  browser" rule) of: Tour Operator confirm → return → Staff reconcile → traveler sees "Processing
  refund"; and the zero-share / escalated / reconciliation paths if a backend test fixture for them
  is available in the dev environment.
- Record head SHA, commands, exit codes, pass/fail/skip counts in the PR description per
  TEAM_ENGINEERING_RULES §20/§30 (same evidence discipline as the BE plan's Task 11).

---

## Out of scope
- UC-66 weather-cancellation refund path (BE spec §6).
- UC-68/69/75 complaint and partial-refund-proposal screens (BE has no complaint module yet).
- BR-158 partial-participant cancellation (BE spec G12).
- Any real-gateway integration work for UC-67 (Q4: simulated gateway, FE-invisible either way).

## Stop conditions
- Q-FE1 unresolved → do not start Task 4 (screen layout) without explicit developer sign-off on
  the proposed layout, per this repo's CLAUDE.md rule against inventing screens.
- Q-FE2 unresolved → do not start Task 2's three read-route implementations against a guessed
  response shape; confirm the actual BE contract first (ask, or re-read the BE spec once it's
  updated).
- A new question surfaces mid-task that the spec doesn't already answer → stop and ask, same as
  the BE plan's stop condition.
