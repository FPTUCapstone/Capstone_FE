# UC-41 / UC-42 / UC-67 — Confirm Booking Refund SRS Alignment (FE) — Spec v1

## Status

**APPROVED (developer sign-off 13/11/2026, Nguyễn Văn Linh).** Q-FE1 (the proposed screen layout
for screens 90/100/101) and Q-FE3 (listing `Escalated` and `Reconciliation` together on screen 101)
are approved. **Q-FE2 is resolved:** the backend now exposes the operator detail and the
Staff/Administrator list reads listed below, and the BFF proxies consume those exact routes.
The implementation is awaiting the final validation evidence recorded in the plan; it must not be
described as merge-ready before that gate passes. Backend contract: BE spec
`specs/UC-42-confirm-booking-refund-srs-alignment-be-spec.md` v1.1 and plan
`plans/UC-42-confirm-booking-refund-srs-alignment-be-plan.md`, on `Capstone_BE-confirm-booking-refund`
branch `fix/linhnv-confirm-booking-refund` (worktree `D:\study\Project-Capstone\Capstone_BE-confirm-booking-refund`).
Owner decisions Q1–Q4 are already closed there; this FE spec treats them as fixed and does not
re-litigate them.

**Owner decision 13/11/2026 (Nguyễn Văn Linh) — UC-42/screen 90 is web-only:** SRS 3.8.4.3 lists
the Confirm Booking Refund screen on both the Flutter mobile application and the Next.js web
application (no web-only exception is written for it, unlike UC-41/screen 89). This spec closes
that open point by deciding UC-42 ships on the Next.js web application only — `Capstone_Mobile`
does **not** get an equivalent screen for this feature. This is the same kind of platform
exception already made for UC-41 on 10/11/2026 (recorded in the SRS revision history); SRS
3.8.4.3's Interface line needs the matching "...on the Next.js web application only" correction in
a future SRS revision, tracked as a documentation follow-up, not a blocker for this FE spec.

SRS source: `SRS_rev10 (5).docx` (12/11/2026), §3.8.4.2 (UC-41), §3.8.4.3 (UC-42, screen 90),
§3.9.1.x-style Staff reconciliation screen (screen 100), §3.10.2 (UC-67), plus the owner decisions
of 10/11, 11/11 and 13/11/2026 that the BE spec already cites (BR-135, BR-139, BR-143, BR-144,
BR-187, BR-188, BR-189, BR-161).

## Scope

Bringing the FE's refund surfaces up to the new BE state machine. Three screens are new or
replaced, one existing screen gets new status labels:

1. **Tour Operator — Confirm Booking Refund** (SRS screen 90, 3.8.4.3). Replaces the current
   `InitiateRefundDialog` / `initiateBookingRefund` NO_BACKEND flow **entirely** — that flow was a
   deliberate workaround for the exact BE gap (G2 in the BE spec) this work closes, and ships with
   a `PENDING_BE_INTEGRATION` stub for any non-demo call. The real screen lets the Tour Operator
   `[Confirm Refund]` a `PendingOperatorConfirmation` request, then (only if its return share is
   non-zero) `[Confirm Return]` with a bank transfer reference once they've paid TripMate back.
2. **Staff — Refund Return Reconciliation** (SRS screen 100). Lets Staff record that a Tour
   Operator's reported return has been fully credited (`ReturnReported` → `ReturnReceived`),
   triggering UC-67.
3. **Administrator — Escalated Refunds Monitor** (SRS screen 101, mentioned in BE spec §2.3/§7).
   Lists refunds in `Escalated` (gateway retries exhausted, BR-161) or `Reconciliation` (amount
   mismatch, UC-41 6.b1) for manual resolution via the existing `CompleteManualRefund` endpoint.
4. **Traveler — Refund Progress** (`RefundProgressPage.tsx`, existing, UC-67 read model). Add
   status copy for the six new BE statuses; no new screen.

**Out of scope for this spec** (mirrors BE spec §5/§6): UC-66 weather-cancellation refund path,
UC-68/69/75 complaint and partial-refund-proposal screens (BE has no complaint module yet),
BR-158 partial-participant cancellation.

## Current FE state (for contrast)

- `src/features/operator/bookings/components/InitiateRefundDialog.tsx` — a notes-only dialog that
  calls `initiateBookingRefund`, which returns `{ success:false, messageCode:'PENDING_BE_INTEGRATION' }`
  for any real (non-demo) call. No refund amount, no return share, no state machine — it exists
  purely to let the demo mode simulate *something* happening after cancellation.
- `src/features/operator/bookings/services/operatorBookingService.ts`'s `cancelOperatorBooking`
  exposes `refundFollowUpRequired: boolean` (paidAmount > 0) as a signal the operator should go
  "initiate" a refund — this concept survives, but the action it points to is now "open the
  Confirm Booking Refund screen for this refund request," not the old dialog.
- `src/features/bookings/components/RefundProgressPage.tsx` — traveler-facing, reads
  `GET /api/v1/bookings/{bookingId}/refund` through `refundProgressProxy.ts`. Its `status` union is
  `Pending | Processing | RetryPending | ManualReview | Processed | Failed | Rejected` — the BE's
  pre-confirmation statuses (`PendingOperatorConfirmation`, `AwaitingPartnerReturn`,
  `ReturnReported`, `ReturnReceived`) and new terminal ones (`Reconciliation`, `Escalated`) are
  missing entirely; an unrecognized status currently falls through `statusCopy`'s `default` case
  and is mislabeled "Refund requested."
- No operator, Staff, or Administrator UI exists for UC-42 or UC-67's escalation path at all — the
  BFF only has the traveler/operator read route (`refundProgressProxy.ts`) and the demo dialog.

## Routes

- `/partner/refunds/[refundId]` — Tour Operator Confirm Booking Refund screen (new). Reached from
  a "Refund follow-up required" indicator on the booking list/detail where `refundFollowUpRequired`
  (or the BE's own `PendingOperatorConfirmation` listing) is true.
- `/admin/refund-reconciliation` — Staff Refund Return Reconciliation screen (new). Lists
  `ReturnReported` refunds queued for a Staff member to confirm receipt.
- `/admin/refunds/escalated` — Administrator Escalated Refunds Monitor (new). Lists `Escalated`
  and `Reconciliation` refunds.
- `/bookings/[id]/refund` — unchanged route, `RefundProgressPage.tsx` gets new status copy only.

Route access follows the existing pattern in this repo (`PartnerRouteGuard`, the admin workspace's
own role guard) — Tour Operator routes require an Active Tour Operator session; Staff/Admin routes
require the matching role, exactly as the daily-payout-transfer screens already do.

## API contract (BFF proxy routes, mirrors BE spec §3.3 exactly)

| FE proxy route | Backend route | Actor | Body |
|---|---|---|---|
| `POST /api/operator/refunds/[refundId]/confirm` | `POST /api/v1/operator/refunds/{refundId}/confirm` | Tour Operator | none |
| `POST /api/operator/refunds/[refundId]/return` | `POST /api/v1/operator/refunds/{refundId}/return` | Tour Operator | `{ returnReference: string }` |
| `POST /api/admin/refunds/[refundId]/return-received` | `POST /api/v1/admin/refunds/{refundId}/return-received` | Staff | none |
| `POST /api/admin/refunds/[refundId]/resolve` | `POST /api/v1/admin/refunds/{refundId}/resolve` | Administrator | per existing `CompleteManualRefund` contract (gateway reference) |
| `GET /api/operator/refunds/[refundId]` | `GET /api/v1/operator/refunds/{refundId}` | Tour Operator | — |
| `GET /api/admin/refunds?status=ReturnReported` | `GET /api/v1/admin/refunds?status=ReturnReported` | Staff | — |
| `GET /api/admin/refunds?status=Escalated,Reconciliation` | `GET /api/v1/admin/refunds?status=Escalated&status=Reconciliation` | Administrator | — |

No proxy route invents a field the backend doesn't have (operator id, amounts) — every mutating
route forwards only what SRS §3.8.4.3 asks the actor to supply (confirmation has no body; return
needs only the reference), identical to how `payoutSettlementsProxy.ts` strips unknown fields
today. The two `GET` resources are implemented by the backend controller contract above; the admin
route accepts repeated `status` query parameters, not a client-defined comma-separated value.

## Screen 1 — Confirm Booking Refund (Tour Operator, UC-42 screen 90)

Per SRS 3.8.4.3's own (TBD) "Screen Layout" field list — see Q-FE1 for the open layout question —
the content is:

- **Booking summary area**: Booking Code, Tour Name, Departure Date, Paid Amount, Cancellation or
  Complaint Reference.
- **Refund details area**: Refund Amount, Tour Operator Share (BR-139: 0/70%/90% of the refund,
  computed server-side, never recalculated client-side), Return Deadline, Return Reference,
  Status.
- **Return area** (shown only after confirmation, and only when the Tour Operator Share > 0):
  Bank Transfer Reference input.
- **Buttons**: `[Confirm Refund]` (visible while `PendingOperatorConfirmation`), `[Confirm
  Return]` (visible while `AwaitingPartnerReturn` and share > 0), `[Back]`.

Behavior:
- `[Confirm Refund]` calls the confirm proxy. On success, show the MSG173 success toast ("The
  confirmation is submitted successfully" per SRS 3.8.4.3's Validation line) and re-fetch the
  detail (never assume the new status locally — same pattern as the daily-payout-transfer
  screens' `reloadToken`).
  - If the refetched detail's Tour Operator Share is 0, the status will already have moved past
    `AwaitingPartnerReturn` straight to settled (BE spec §2.2: "4.b1" skips the return steps) — the
    screen shows a completed/read-only state, no Return area.
  - If share > 0, status becomes `AwaitingPartnerReturn` and the Return area appears, with the
    Return Deadline shown (3 working days — BE sets it, FE only displays it).
- `[Confirm Return]` is disabled until the reference field is non-blank after trim (MSG172,
  `refund.return_reference_required`, mirrors `validateResolutionReason`'s pattern in the payout
  feature). On success, re-fetch; status becomes `ReturnReported`, Return area becomes read-only
  (shows the submitted reference and reported time).
- A request already past `PendingOperatorConfirmation` when the screen loads (e.g. the BR-187
  auto-confirm job ran first) shows the current state directly — `[Confirm Refund]` never appears
  for a status other than `PendingOperatorConfirmation`.
- Error mapping: `refund.request_not_pending` (409, MSG171) → "This refund request is no longer
  pending your confirmation."; `refund.operator_not_owner` (403, MSG126) → generic forbidden view;
  `refund.return_reference_required` (400, MSG172) → inline field error; `refund.status_persist_failed`
  (500, MSG127) → generic retry banner; `refund.payment_not_verified` (409, MSG136) → "This refund
  is being reconciled by our team; no action is needed from you right now." with `[Confirm Refund]`
  hidden (the refund has moved to `Reconciliation`, not `PendingOperatorConfirmation` anymore).
  This covers SRS 3.8.4.3's own Validation line *"The original transaction is not verified, or the
  refund amount does not match the verified paid amount → MSG136"* (abnormal case 2.a1) — missing
  from the BE spec's §3.2 error-code list (only `request_not_pending`/`operator_not_owner`/
  `return_reference_required`/`status_persist_failed` are listed there); `refund.payment_not_verified`
  needs adding to the BE spec and to the shared message catalogue the same way Task 8 of the
  daily-payout-transfer plan wired MSG157, since MSG136 itself is an existing SRS code (reused from
  UC-41) but has no stable error-code slug yet for this UC-42 confirmation-time check.

## Screen 2 — Refund Return Reconciliation (Staff, screen 100)

- List of `ReturnReported` refunds: Refund Code/Booking Code, Tour Operator, Operator Share
  Amount, Return Reference, Reported At.
- Row action `[Confirm Receipt]` → calls the return-received proxy, then removes the row from the
  list (or re-fetches the filtered list) on success. No confirmation dialog needed per SRS (the
  Staff action already requires navigating into this one screen and clicking a named button — the
  existing daily-payout-transfer screens use a confirm dialog for destructive/irreversible admin
  actions; recording a bank reconciliation that's already independently verified against a real
  bank statement does not need a second in-app confirmation step, but this is itself part of
  Q-FE1 since SRS leaves screen 100's layout undetermined).
- Empty state: "No returns awaiting reconciliation."

## Screen 3 — Escalated Refunds Monitor (Administrator, screen 101)

- List of `Escalated` and `Reconciliation` refunds: Refund Code, Booking Code, Amount, Status,
  Attempt Count (Escalated only), Last Error (Escalated only), `[View Details]`.
- `[View Details]` opens the existing manual-completion flow (`CompleteManualRefundCommand`,
  already implemented BE-side as `AdminRefundsController`'s `complete-manual` route) — this spec
  does not change that command's contract, only adds the list screen that surfaces refunds needing
  it. The FE component for this can largely follow the pattern of the admin payout-settlements
  list/detail pair (`PayoutSettlementsScreen.tsx` / `FailedPayoutSettlementScreen.tsx`).

## Screen 4 — Refund Progress (Traveler, existing, status copy only)

Add `statusCopy` cases in `RefundProgressPage.tsx` for the BE statuses not yet in the FE's
`RefundProgress["status"]` union:

| BE status | Traveler-facing label | Tone | Description |
|---|---|---|---|
| `PendingOperatorConfirmation` | "Refund requested" | blue (existing default) | "Your refund request has been received and is awaiting the tour operator's confirmation." |
| `AwaitingPartnerReturn` | "Refund requested" | blue | same as above — the operator-share mechanics are not traveler-visible (BE spec: amount is never recalculated and the traveler's own eventual refund is unaffected by the share percentage). |
| `ReturnReported` | "Refund requested" | blue | same as above. |
| `ReturnReceived` | "Processing refund" | blue (reuse `Processing` tone) | "Your refund is being sent." |
| `Reconciliation` | "Under review" | amber (reuse `ManualReview` tone) | "We're verifying the payment details for this refund." |
| `Escalated` | "Needs attention" | rose (reuse `Failed` tone) | "We could not complete the refund automatically. Support will follow up." |

Rationale for collapsing the four pre-settlement statuses into one "Refund requested" label: SRS
3.10.2's own traveler-facing "Refund Progress Screen" (Figure 99) describes a four-step timeline
(*Refund Created, Submitted to Gateway, Verified by Gateway, Credited to Traveler*) that begins
only once UC-67 actually starts — the UC-42 confirmation/return bookkeeping that precedes it is
TripMate/operator-internal state the traveler was never shown a breakdown of in the SRS screen
layout. Exposing six technical status names to a traveler risks more confusion than the one
generic "requested, waiting" message already in the component's `default` branch provides. **This
specific choice is part of Q-FE1** — flag for sign-off since SRS's screen 90/100/101 TBD note
plausibly extends to "how much of the UC-42 sub-state the traveler sees" too.

## Retiring the demo-mode UC-42 workaround

Removed entirely (not just "hidden behind a flag"), since the real backend confirmation flow makes
them unreachable and unnecessary:
- `src/features/operator/bookings/components/InitiateRefundDialog.tsx` and its test file.
- `initiateBookingRefund` from `src/features/operator/bookings/services/operatorBookingService.ts`
  (the whole function — `PENDING_BE_INTEGRATION` stub included).
- `calculateDemoBookingRefundPreview` from `src/features/operator/bookings/data/operatorBookingDemoPolicy.ts`
  if nothing else in that module uses it after the dialog is gone (verify at implementation time).
- `InitiateRefundPayload` / `InitiateRefundResult` types from `bookingLifecycle.ts` if unused
  elsewhere after the above removals.
- The dialog's wiring in `OperatorBookingListView.tsx` — replaced with a link/button to the new
  `/partner/refunds/[refundId]` screen when `refundFollowUpRequired` is true (or, once the BE
  exposes a real `refundId` on the booking/cancellation response, link directly to that refund).

`refundFollowUpRequired` itself (the boolean signal on `cancelOperatorBooking`'s result) is kept —
it's still the correct "should I prompt this operator toward the refund screen" signal, it just
now points at a real screen instead of a stub dialog.

## Responsive & accessibility

Matches existing conventions in this repo for operator/admin workspace screens: `PartnerWorkspaceLayout`
wrapper, focus trap + Escape handling on any dialog (`[Confirm Return]`'s reference input can stay
inline on the screen rather than a modal, since SRS doesn't describe a dialog for it — only
`Buttons: [Confirm Refund], [Confirm Return], [Back]` on one screen), minimum touch target sizes,
and keyboard-operable action buttons — same bar as `FailedPayoutSettlementScreen.tsx`.

## Message codes

Reuses SRS message codes already defined for this feature (per BE spec): MSG126 (ownership
denied), MSG127 (persistence failure), MSG136 (original transaction not verified / amount
mismatch — reused from UC-41, see Screen 1's error mapping above), MSG171 (not pending), MSG172
(reference required), MSG173 (confirmation submitted — success toast). No new MSG *numbers* are
invented client-side; `refund.payment_not_verified` is a new error-code *slug* for an existing
MSG136, not a new message — it still needs adding to the shared catalogue (same mechanism as the
daily-payout feature's Task 8, e.g. `database/migrations/..._add_refund_payment_not_verified.sql`
if the catalogue is DB-backed) before Task 2 (BFF proxies) can map it.

## Acceptance criteria

1. Tour Operator opens a `PendingOperatorConfirmation` refund, clicks `[Confirm Refund]`: screen
   re-fetches and shows the real post-confirmation status (never assumes `AwaitingPartnerReturn`
   locally if the operator share was actually 0).
2. Tour Operator with a non-zero share enters a reference and clicks `[Confirm Return]`: status
   becomes `ReturnReported`, reference is shown read-only afterward.
3. Blank reference blocks `[Confirm Return]` with the MSG172 inline error, client-side, before any
   request is sent (and the backend's own 400 is still handled if it somehow gets through).
4. Staff sees a `ReturnReported` refund on the reconciliation screen and can mark it received;
   the refund disappears from that list afterward (re-fetch, not local removal-then-trust).
5. Administrator sees `Escalated` and `Reconciliation` refunds on the monitor screen with distinct
   visual treatment, and can act on each without the two categories being confusable.
6. Traveler's `RefundProgressPage` never shows a raw/unmapped status string for any of the six new
   BE statuses — every one maps to a defined `statusCopy` case.
7. `InitiateRefundDialog` and `initiateBookingRefund` no longer exist in the codebase; no reference
   to `PENDING_BE_INTEGRATION` remains for the refund flow.
8. A stale reload race (U03, same pattern as `FailedPayoutSettlementScreen`'s test) is covered on
   the Confirm Booking Refund screen: an earlier in-flight re-fetch resolving after a later action's
   own re-fetch must not overwrite the newer result.

## Tests (TEAM_ENGINEERING_RULES U01–U05, V01–V02 style, matching this repo's existing test philosophy)

- Confirm/Return/Return-received/Resolve proxies: forward only the documented fields, strip
  anything else, map each documented error code to the right HTTP status (mirrors
  `payoutSettlementsProxy.test.ts`).
- `RefundProgressPage`: one test per new status mapping to a defined, non-default `statusCopy`
  result (so a future status without copy fails loudly, not silently falls into "Refund requested").
- Confirm Booking Refund screen: happy path (confirm → return → reported), zero-share path
  (confirm skips straight to settled, no Return area ever shown), blank-reference validation,
  stale-reload race (U03), 409/403/400/500 error mapping.
- Reconciliation and Escalated Monitor screens: list renders, empty state, action removes/updates
  the row via re-fetch not local mutation.
- Regression: existing cancellation-flow tests that reference `InitiateRefundDialog` are removed
  along with the component, not left red or skipped.

## Decided (owner, inherited from BE spec §8)

Same as BE spec: Q1 (BR-135 cutover date), Q2 (retry count), Q3 (legacy Pending rows — FE-invisible),
Q4 (simulated refund gateway for UC-67 — FE-invisible, the traveler-facing copy in Screen 4 does
not distinguish simulated from real since BE spec treats the simulated gateway as behaviorally
identical to a real one).

## Open questions

- **Q-FE1 (screen layout) — RESOLVED, approved 13/11/2026.** SRS marks 3.8.4.3's own layout
  `[TBD - Screen layout will be added after the Functional Specification is approved]`, and screens
  100/101 have no SRS screen-layout section at all (they're referenced only in prose). The layout
  this spec proposed for all three — directly from SRS's own enumerated "Screen Layout"
  field/button lists (Booking summary / Refund details / Return area / buttons for screen 90; list
  + row action for 100; list + detail link for 101, following this repo's existing admin
  list/detail pattern) — is approved as the working layout; Task 1 of the plan may proceed.
- **Q-FE3 (screen 101 scope — Escalated vs. Reconciliation) — RESOLVED, approved 13/11/2026.**
  SRS's own screen catalogue (Table 3, row 101) and 3.10.2's Figure 99 describe the Escalated
  Refunds Monitor as listing refunds whose *retries are exhausted* (`Escalated`, BR-161) only;
  neither place mentions `Reconciliation` refunds (the UC-41 6.b1 / UC-67 5.a1/6.a1 amount-mismatch
  or unverifiable-signature cases) as belonging to screen 101. Approved to list both statuses on
  one screen/API as this spec's Screen 3 proposed (mirroring the BE spec's single
  `GET .../admin/refunds?status=Escalated,Reconciliation` endpoint), since there is no other
  SRS-named screen for `Reconciliation`.
- **Q-FE2 (new BE read endpoints) — RESOLVED 15/11/2026.** `OperatorRefundsController` exposes
  `GET /api/v1/operator/refunds/{refundId}`; `AdminRefundsController` exposes
  `GET /api/v1/admin/refunds` with repeated `status` query parameters and `GET` detail. The BFF
  proxy and strict parsers use that concrete contract; no route is implemented from an assumed
  response shape.
