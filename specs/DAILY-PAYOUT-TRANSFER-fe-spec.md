# DAILY-PAYOUT-TRANSFER — Web Screen Specification

## Status

**v2.** Tasks 0–9 below (v1) were built and verified against an earlier backend contract (v3:
`Main`/`Retained` kinds, `Carried Over` status, three UC-73 actions). The backend has since moved
to spec v7 on `Capstone_BE-fix-daily-payout` branch `fix/linhnv-daily-payout-transfer` (SRS
rev10-6, mục 3.10.4–3.10.6) with the changes below — this is the delta this FE branch
(`Capstone_FE-fix-daily-payout`, same branch name) now implements. Open questions 6–7 (below)
remain genuinely open and out of scope for this delta.

### v2 change — backend contract delta (v3 → v7)

1. **Kind:** `'Main' | 'Retained'` → **`'Advance' | 'Final'`** (BR-142, BR-177: 70% after the
   24-hour Awaiting Window, 20% after the tour ends). No FE component hardcodes the old strings
   outside `PAYOUT_SETTLEMENT_KINDS` (admin and operator `payoutSettlements.ts`) — `Kind` is
   rendered as a plain string everywhere else, so this is a type/constant-only change there.
2. **Status:** `'Carried Over'` removed, **`'Resolved'`** added (UC-73 `[Mark as Resolved]`).
   `PAYOUT_SETTLEMENT_STATUSES` stays a six-value union (`Awaiting Window`, `Scheduled`,
   `Processing`, `Settled`, `SettlementFailed`, `Resolved`). Every other mention of a specific
   status string in this spec ("Carried Over") is superseded by this — read "Resolved" instead
   wherever this document is not updated inline.
3. **UC-73 actions — `[Carry Over]` and `[Record Manual Transfer]` removed, `[Mark as Resolved]`
   added:**
   - `[Retry Transfer]` stays, but is now **synchronous**: the backend resends once and the
     response already reflects the outcome (`Settled`, or back to `SettlementFailed` if it fails
     again, MSG176) — no longer "resend happens on the backend's own schedule." The dialog's
     success copy (spec v1 Screen 2, Task 6) must say so, not the old wording.
   - `[Mark as Resolved]` replaces both removed actions: one required text field, the resolution
     **reason** (not a transfer reference). Validation: non-blank after trim (backend:
     `daily_payout.resolution_reason_required`, 400, MSG178). No money moves.
   - Endpoint: `POST /api/v1/admin/payout-settlements/{batchId}/resolve`, body `{ reason: string }`
     — replaces `/carry-over` and `/manual-settlement`. `/retry` is unchanged.
4. **Error codes:** `daily_payout.manual_reference_required` removed →
   **`daily_payout.resolution_reason_required`** (400, MSG178). `daily_payout.not_failed` is
   unchanged (409, MSG177, both actions).
5. **Out of scope for this delta (decided):** the new Staff "unlock a locked Tour Operator"
   endpoint (`POST /api/v1/admin/payout-settlements/tour-operators/{id}/unlock`, part of UC-48) has
   no FE at all yet and is **not** added by this delta — it is a different screen (account
   management), not a UC-71–74 payout screen. A separate task, once that screen's scope is
   defined.

Everything else in this document (routes, server-side guards, Screen 1/3 content, states,
responsive, tests philosophy) is unchanged by v7 and stays as v1 described it, except where a
section below is marked **(v2)**.

## Status (v1, superseded by "v2 change" above except where noted)

**Draft — pending Lead/PO approval for the remaining open questions (4–7).** Open questions 1–3
are decided (see "Decided (previously open)" below, and "Old UC-46 FE code — removed"). Backend
is implemented and locally verified (simulated gateway) on `Capstone_BE` branch
`feature/linhnv-daily-payout-transfer`, not yet merged to `develop`.

SRS sources: Report3 v12, §2.2 (UC-71 through UC-74, named "View Payout Records" for UC-72),
§3.1.2.1 Table 4.1 (screen list items — Payout Records List, Failed Payout Settlement Details,
Failed Payout Settlement Action), §3.1.2.2 Table 4.2 row 91 (Payout Settlement History, Tour
Operator), §3.9.9.1–3.9.9.2.

Backend contract: `specs/DAILY-PAYOUT-TRANSFER-be-spec.md` (v3) and
`plans/DAILY-PAYOUT-TRANSFER-be-plan.md`, on the `Capstone_BE-daily-payout` branch
`feature/linhnv-daily-payout-transfer` (check out that branch, or its worktree, to read them).

### v12 change — Awaiting Window

v12 adds a new status, **Awaiting Window** (BR-141): every paid booking is held 24 hours after
payment confirmation before it is eligible for any settlement run — a race-condition fix so a
cancellation inside BR-157's 24-hour full-refund window is (almost always) resolved before any
money is transferred to the Tour Operator. SRS §3.9.9.1 lists it alongside `Scheduled`,
`Processing`, `Settled`, `SettlementFailed`, `Carried Over` as a status Screen 1 must show and
filter by. The BE's status enum and FE's `PayoutSettlementStatus` type (Task 1) now include it.

**Update:** the BE read API now does synthesize this status (`DAILY-PAYOUT-TRANSFER-be-plan.md`
Task 10A, shipped). `GetPayoutSettlementsQuery` unions real settlement rows with a synthetic
`Awaiting Window` row for every paid, not-fully-refunded booking with no settlement yet (whether
still inside its window, or its operator is locked under BR-160). These rows have no
`SettlementId`/`RunDate` (both nullable in the response DTO now) and a preview `PayoutAmount`
(gross less commission, not yet net of any debt offset) — Task 1's `parsePayoutSettlementListItem`
must accept a null `settlementId`/`runDate`, which it currently does not (its strict parser
requires both as non-null integers/dates). A `RunDateFrom`/`RunDateTo` filter always excludes
these rows server-side, since they have no date to compare against.

BR-160 (Tour Operator account locked): a locked operator's settlements stay in their current
status — `Awaiting Window` or `Scheduled` — and are not transferred until unlocked. No FE-visible
difference from an ordinary `Awaiting Window`/`Scheduled` row; mentioned here only so the status
isn't mistaken for a stuck/broken state when an operator is locked.

## Scope

Three read screens and one action surface, replacing the old UC-46 payout-request model (request
payout, approve/reject, available balance, settlement months) that SRS v11 removed:

1. **Payout Settlements List** (UC-72) — Staff and Administrator, read-only.
2. **Failed Payout Settlement Details + Action** (UC-73) — Administrator only: view a failed
   batch's gateway history and act on it (Retry Transfer / Mark as Resolved, v2).
3. **Payout Settlement History** (PD-13, Table 4.2 row 91) — Tour Operator, read-only, their own
   settlements only.

Out of scope for this spec:
- Any backend change (already done on the BE branch above).
- Mobile. **Decided:** Screen 3 (Payout Settlement History) is Web-only, confirmed by the
  developer. `docs/WEB_SCOPE_MATRIX.md` classifies the equivalent old screens (UC-63/64/65) as
  `ADMIN_WEB_ONLY`, consistent with this.

## Old UC-46 FE code — removed (resolved)

`develop` had a substantial FE implementation of the **old** UC-46 model (request payout
settlement, approve/reject, available balance, settlement months, cancel). **Decided and done**
(on this branch, before Task 1 of the plan): removed entirely —
- `src/features/admin/payout-records/*`, `src/features/admin/payout-review/*`, and their routes
  `app/admin/(console)/payouts/{page.tsx,[payoutId]/page.tsx,settlement/page.tsx}`.
- `app/api/admin/payouts/*` (list, detail, approve, reject) and
  `app/api/operator/payouts/{route.ts,[payoutCode]/cancel,available-balance,settlement-months}`.
- The old request-flow components under `src/features/operator/finance/components/payouts/*`
  (`RequestPayoutDialog`, `CancelPayoutDialog`, `PayoutRequestHistoryTable`,
  `SettlementMonthsTable`) and the corresponding service/proxy/type/fixture code trimmed to
  bank-account only.
- Sidebar links ("Payout Review", "Payout Settlement") and route constants
  (`ROUTES.admin.payouts`, `.payoutDetails`, `.payoutSettlement`) removed.

**Kept, unchanged:** `/api/operator/payouts/bank-account` (GET/PUT) and the
`OperatorPayoutView`/`BeneficiaryBankCard` UI at `/partner/payouts` — a Tour Operator still needs
to configure a beneficiary bank account to receive the new model's automatic transfer.

Verified on this branch: `npm run lint`, `npm run typecheck`, `npm test` (3424/3424), and
`npm run build` all pass after the removal, before any of this spec's new code was written.

This spec's new screens still use **new, separate routes** (below), now simply because they are
a different feature, not to dodge a collision.

## Routes

- `/admin/payout-settlements` — Payout Settlements List (UC-72). Staff and Administrator.
- `/admin/payout-settlements/[batchId]` — Failed Payout Settlement Details + Action (UC-73).
  Administrator only. Reachable directly, and via a row action from the list when a row's status
  is `SettlementFailed`.
- `/partner/payout-settlements` — Payout Settlement History (PD-13). Tour Operator only.

Web proxy only: the browser calls `app/api/admin/payout-settlements/...` and
`app/api/operator/payout-settlements/...` route handlers; those call the backend. The browser
never calls the backend directly (existing pattern — the old `payout-records`/`payout-review`
proxies that set this pattern were removed with the rest of UC-46 (see above); the still-standing
reference is `src/features/admin/platform-bookings/platformBookingsProxy.ts`, same session +
role-check + upstream-forward shape).

Backend endpoints these routes proxy (v2):
- `GET /api/v1/admin/payout-settlements` (Staff or Administrator)
- `GET /api/v1/admin/payout-settlements/{batchId}` (Administrator)
- `POST /api/v1/admin/payout-settlements/{batchId}/retry` (Administrator)
- `POST /api/v1/admin/payout-settlements/{batchId}/resolve` (Administrator) — replaces
  `/carry-over` and `/manual-settlement` (v2 change 3)
- `GET /api/v1/operator/payout-settlements` (Tour Operator, scoped to the signed-in operator)

## Server-side guards

- `/admin/payout-settlements`: no valid session → redirect to admin sign-in with `returnUrl`
  set to this route; role other than `Staff` or `Administrator` → access-denied view before any
  data loads. **Decided:** extend `AdminAccessDeniedView` to accept either role (plan Task 3a)
  rather than adding a second component.
- `/admin/payout-settlements/[batchId]`: same pattern, required role `Administrator` only — this
  one already fits `AdminAccessDeniedView` as-is.
- `/partner/payout-settlements`: existing `PartnerRouteGuard` / `partnerRouteDecision` pattern
  (`src/features/operator/access/*`). This is role **and** application-status gated, not role
  alone: `<PartnerRouteGuard route="dashboard">`, the same check the bank-account page at
  `/partner/payouts` already uses — only an **Approved** Tour Operator enters; Traveler/Staff/
  Administrator are redirected to their own home, and a TourOperator whose application is not yet
  Approved is redirected to `/partner/application`, not shown a generic denial. `PartnerRoute`
  (`partnerRouteDecision.ts`) has no dedicated `'payout-settlements'` member and does not need
  one — reusing `'dashboard'`'s check is correct unless the developer wants a distinct permission.
- The BFF role check is a second layer, not a replacement, same as every existing admin/partner
  route (`platformBookingsProxy.ts` pattern).

## Screen 1 — Payout Settlements List (UC-72)

Content (SRS Table 4.1, UC-72 description):
- Filter bar: Status (dropdown: all statuses, or one of `Awaiting Window`, `Scheduled`,
  `Processing`, `Settled`, `SettlementFailed`, `Carried Over` — see "v12 change — Awaiting
  Window" above for why `Awaiting Window` is listed but not yet returned by the BE), Run Date
  From, Run Date To, `[Apply Filter]`, `[Clear Filter]`.
- Table columns: Booking reference, Tour Operator, Run Date, Kind (`Main` / `Retained`), Payout
  Amount (VND, formatted, backend value never recalculated in the browser), Status badge,
  Transfer Reference.
- A row with status `SettlementFailed` links to Screen 2 (Administrator only — Staff sees the row
  but no link, consistent with read-only access).
- Pagination, same control as the existing `PlatformBookingsScreen`
  (`src/features/admin/platform-bookings/`) — the old `PayoutRecordsScreen` this would otherwise
  cite was removed with the rest of UC-46 (see above).

States: loading (skeleton), empty ("No payout settlements match the filters" — SRS Table 4.1
validation line), forbidden (401 → sign-in with return URL; 403 → access-denied), unavailable
(500/network → retry).

## Screen 2 — Failed Payout Settlement Details + Action (UC-73) (v2)

Content (SRS rev10-6, 3.10.6):
- Header: batch id, Tour Operator, Run Date, Total Amount, Status (`SettlementFailed`), Attempt
  Count.
- Attempt history table: Attempt Number, Sent At (Asia/Ho_Chi_Minh), Outcome, Failure Reason.
- Actions, each a confirmation dialog, mutually exclusive (one batch, one resolution):
  - **`[Retry Transfer]`** — no extra input. Confirms, the backend resends **once, synchronously**
    — the response already carries the outcome: `Settled`, or back to `SettlementFailed` if it
    fails again (MSG176). The dialog's success copy must say the result is immediate, not that a
    resend happens later on a schedule (v1 said the latter; no longer true, v2 change 3).
  - **`[Mark as Resolved]`** — a required text field, the resolution **reason** (no money moves).
    Validation: non-blank after trim (backend: `daily_payout.resolution_reason_required`, 400,
    MSG178). Replaces `[Carry Over]` and `[Record Manual Transfer]` (removed, v2 change 3).
- After any action succeeds: close its dialog, re-fetch the detail, show the new status from
  that response (never assume the client-side guess is final — same re-fetch-after-action
  philosophy as `TourOperatorApplicationDetailView`'s Approve/Reject flow
  (`src/features/admin/tour-operator-applications/`; the old `PayoutReviewScreen` this would
  otherwise cite was removed with the rest of UC-46), even though this backend does not currently
  model a concurrent-admin 409 for these actions — see **Open question 4**).
- Actions are visible only while `Status === 'SettlementFailed'`; once changed (by this admin or
  another), the re-fetched detail drives which, if any, actions show again.

States: loading, not found (`daily_payout.batch_not_found`), forbidden (401/403), unavailable
(500/network + retry). Not-failed on direct action attempt (`daily_payout.not_failed`, 409 or
400 depending on BE's final mapping — **Open question 5**) re-fetches and shows the current
status instead of a generic error.

## Screen 3 — Payout Settlement History (Tour Operator, PD-13)

Content (SRS Table 4.2 row 91: "Displays the Tour Operator's scheduled and settled payouts per
booking"):
- Table columns: Booking reference, Run Date, Kind, Payout Amount, Status, Transfer Reference.
- No filters beyond pagination in SRS's one-line description; **Open question 6**: whether to add
  a status/date filter to match Screen 1's affordance (recommended, for consistency, but not SRS-
  mandated — needs Lead/PO confirmation before adding UI the SRS does not describe).
- Scoped to the signed-in Tour Operator only; the backend already enforces this
  (`currentUserService.UserId`), the FE does not pass or trust any operator id from the client.
- No actions. Read-only, same as Screen 1 / the `platform-bookings` pattern on the admin side.

States: loading, empty, forbidden (401 → sign-in; Traveler/Staff/Administrator → redirected to
their own home per `partnerRouteDecision`; TourOperator not yet Approved → redirected to
`/partner/application`), unavailable (500/network + retry).

## Behaviour rules

- Server decides everything: amounts, statuses, and which actions apply. The browser never
  computes or guesses a settlement amount or status transition.
- Currency and date formatting: there is no single shared formatter across admin features (each
  feature keeps its own small `format.ts`/util, e.g. `src/features/admin/tour-reviews/utils/
  format.ts`, `platformBookings.ts`'s `formatVnd`/`formatVietnamDateTime`). This feature follows
  that convention with its own `formatVnd`/`formatRunDate` (Task 1 of the plan), not a new
  cross-feature shared module.
- Keyboard and a11y: dialogs trap focus, Escape closes when no request is in flight (same as
  `ApproveModal`/`RejectModal` in `src/features/admin/tour-operator-applications/`), WCAG 2.2 AA
  per NFR 4.2.1.
- Double-submit protection on every action button (disabled while in flight), same pattern as
  those existing Approve/Reject modals.

## Responsive

- Breakpoints 320 / 390 / 768 / 1024 / 1440 px (TEAM_ENGINEERING_RULES V01). Tables scroll
  horizontally inside their own container at narrow widths; no page-level horizontal scroll.
  Dialogs full-width on phones.

## Message codes

SRS v11 leaves these as unassigned placeholders: `[MSG-new-A]`...`[MSG-new-T]` for several
UC-73-adjacent validations, and `[MSG-new-F]`/`[MSG-new-G]` for "retry scheduled" / "all retries
failed". Following the precedent set by MSG157 (O1 decision in the UC-64/73/74 spec): **this FE
spec does not invent wording.** Exact user-facing copy for each state (not-found, forbidden,
validation, success per action) is assigned from the message catalogue once Lead/PO assigns real
MSG codes, or from a project-approved interim catalogue entry if that is faster — this is
**Open question 7**, and blocks only the exact copy, not the screen structure or logic above.

## Acceptance criteria

1. Staff and Administrator can both open `/admin/payout-settlements` and filter by status and
   run-date range; a Tour Operator or Traveler gets access-denied with no data loaded.
2. Only a Staff/Administrator session gets any settlement data back from
   `app/api/admin/payout-settlements/...`; the response contains server-computed amounts only.
3. `/admin/payout-settlements/[batchId]` is reachable only by an Administrator; Staff is denied.
4. Both actions on Screen 2 (v2: Retry Transfer, Mark as Resolved) are visible only when status is
   `SettlementFailed`, confirm in a dialog, and re-fetch the detail on success rather than
   assuming the new status locally.
5. Mark as Resolved blocks submission on a blank reason, with the entered (blank) state visibly
   flagged, consistent with existing form validation patterns in this repo.
6. `/partner/payout-settlements` shows only the signed-in Tour Operator's own rows; the id used to
   scope the query is never taken from a client-supplied value.
7. 401/403/404/500/network each show the mapped state; double-clicking any action button sends
   exactly one request.
8. No console errors on the happy path for any of the three screens.

## Tests (TEAM_ENGINEERING_RULES U01–U05, V01–V02)

- Unit: query/response parsers for all three screens (strict shape validation, as
  `platformBookings.ts`'s `parsePlatformBookingsResponse` does — the old `payoutReview.ts`'s
  `parsePayoutDetail` this would otherwise cite was removed with the rest of UC-46);
  resolution-reason validator (blank/whitespace rejected, trimmed value kept on success).
- Component: list renders every status badge (including `Resolved`); row link to Screen 2 appears
  only for `SettlementFailed` **and** an Administrator session; action buttons on Screen 2 appear
  only for `SettlementFailed` and disappear once re-fetch shows otherwise; history table never
  renders a row whose operator id differs from the session (defence-in-depth check even though the
  backend already filters).
- Service/proxy: 401/403/404/500/network and malformed/HTML-instead-of-JSON bodies all mapped to
  failure, never success (U01); BFF forwards only the allowed fields on the resolve body (just
  `reason`).
- Race (U03): a stale detail response arriving after an action does not overwrite a newer status
  already rendered from that action's own re-fetch.
- Double-submit (U05): each of the two Screen 2 actions sends exactly one request when its
  button is double-clicked.
- Direct navigation to each route: missing/expired/tampered session → sign-in with the right
  `returnUrl`; wrong role → the matching denial view, with no settlement data fetched beforehand.
- Responsive: 320 / 390 / 768 / 1024 / 1440 px, no overflow (V01).

## Decided (previously open)

1. **Platform ownership of Screen 3: Web-only.** Confirmed by the developer. Matches
   `docs/WEB_SCOPE_MATRIX.md`'s `ADMIN_WEB_ONLY` classification of the equivalent old screens.
2. **Fate of the old UC-46 FE code: removed.** See "Old UC-46 FE code — removed" above for the
   exact file list and verification.
3. **Dual-role access-denied: extend `AdminAccessDeniedView`.** One component, a
   `requiredRoles?: RequiredAdministrationRole[]` prop (plan Task 3a), not a second component.
4. **Concurrent-admin race on Screen 2 actions: no distinct conflict code.** Confirmed against
   the BE code directly (`DailyPayoutErrorCodes`, `ApiControllerBase.HandleFailure`): there is no
   dedicated conflict code for a second admin acting on an already-resolved batch. It just gets
   the same `daily_payout.not_failed` as any other wrong-state attempt, now mapped to 409 (see
   item 5). The proxy's error-mapping table needs only one entry for this case, not two.
5. **Exact HTTP status for `daily_payout.not_failed`: 409 Conflict.** Previously unmapped on the
   BE (fell through to a generic 400 for every `DailyPayoutErrorCodes` value, including
   `Forbidden`/`BatchNotFound`) — fixed on the BE branch, now `Forbidden` → 403,
   `BatchNotFound` → 404, `NotFailed` → 409, `ManualReferenceRequired` → 400, matching this
   codebase's convention for the same shape of error elsewhere (e.g.
   `TourOperatorApplicationErrorCodes.NotPending` → 409). Locked in by a new BE endpoint test
   suite (`DailyPayoutSettlementActionsEndpointTests`, 8 tests) that calls the real routes.
6. **(v2) Staff "unlock a locked Tour Operator" UI: out of scope for this delta.** Confirmed by
   the developer. The backend endpoint (`POST /admin/payout-settlements/tour-operators/{id}/unlock`,
   part of UC-48) exists with no FE anywhere; it belongs to an account-management screen, not a
   UC-71–74 payout screen, and gets its own task once that screen's scope is defined.

## Open questions

These block specific details, not the overall screen structure; the plan sequences work so
unaffected tasks are not stalled by them. Open questions 4 and 5 are now decided — see "Decided
(previously open)" below.

6. **Add filters to Screen 3?** SRS's one-line description does not ask for them; recommended for
   consistency with Screen 1 but needs explicit Lead/PO sign-off before adding UI beyond the SRS
   text (AGENTS.md "Clarify First").
7. **Message catalogue codes** for every state on all three screens (see "Message codes" above).
