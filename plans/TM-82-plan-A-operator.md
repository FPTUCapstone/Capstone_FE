# TM-82 Plan A — Operator-side: consume the real pending-change API

Status: **Draft, awaiting Task Owner approval.** Covers `specs/TM-82-spec.md` §5.1/§5.3/§7 edge
cases 1-7, 11-12 (Operator side only). Staff-side (§5.2/§5.4, edge cases 8-10) is Plan B, written
and approved separately once this plan's branch has gone through the Finishing-the-Branch step.

Branch: new branch off current `origin/develop`-tracking branch, name TBD at execution time (per
AGENTS.md §5.1 git conventions — confirm clean baseline `npm run lint && npm run typecheck` before
branching).

## Task 1 — API client: 5 new functions + types in `operatorTourApi.ts`

**Files:** `src/features/operator/tours/services/operatorTourApi.ts`

Add, next to the existing `createTour`/`updateTour`/`submitTour`:
- `ApiPendingChangeScheduleItem` type: `{ scheduleId: number | null; startAtUtc: string; endAtUtc:
  string; meetingPoint: string | null; totalCapacity: number; minimumCapacity: number;
  registrationDeadlineAtUtc: string | null; adultPrice: number | null; childPrice: number | null;
  infantPrice: number | null; meetingLatitude?: number | null; meetingLongitude?: number | null }`
  (spec §4 — a distinct, superset shape from `ApiDeparture`, do not reuse or coerce one into the
  other).
- `ApiPendingChange` type mirroring `GetCurrentPendingChangeResponse` field-for-field (spec §4 field
  list) using `ApiItineraryItem[]` for `itineraryItems` (already exists, same shape) and
  `ApiPendingChangeScheduleItem[]` for `schedules`.
- `ApiPendingChangeCreateResult { id: number; tourId: number; status: string; isNew: boolean }`.
- `ApiPendingChangeSaveResult { id: number; tourId: number; status: string }` (reused for save and
  submit — both return this exact shape per `PendingChangeSavedResponse`/
  `PendingChangeSubmittedResponse`).
- `createOrResumePendingChange(tourId: number): Promise<ApiPendingChangeCreateResult>` → `POST
  /operator/tours/${tourId}/pending-changes`, no body.
- `getCurrentPendingChange(tourId: number): Promise<ApiPendingChange | null>` → `GET
  /operator/tours/${tourId}/pending-changes/current`; must special-case the `404
  operator_tour.pending_change_not_found` response to return `null` rather than throwing (spec §4 —
  this is not a failure, it means "nothing open yet"). Every other non-OK response still throws via
  the existing `fail()` helper. Implement this by catching `OperatorTourApiError`, checking
  `error.code === 'operator_tour.pending_change_not_found'`, and returning `null` only for that
  exact code — not for any 404.
- `savePendingChange(tourId: number, pendingChangeId: number, body: ApiPendingChangeSaveBody):
  Promise<ApiPendingChangeSaveResult>` → `PUT .../pending-changes/${pendingChangeId}`, where
  `ApiPendingChangeSaveBody` mirrors `SavePendingChangeCommand`'s own fields (`categoryId, title,
  description, basePrice, durationDays, destinationIds, cancellationPolicyTemplateId, inclusions,
  exclusions, itineraryItems, schedules, timeZoneId?, highlights?, travellerRequirements?`).
- `discardPendingChange(tourId: number, pendingChangeId: number): Promise<void>` → `DELETE
  .../pending-changes/${pendingChangeId}`, same no-body-on-204 pattern as `deleteOperatorTour`.
- `submitPendingChange(tourId: number, pendingChangeId: number):
  Promise<ApiPendingChangeSaveResult>` → `POST .../pending-changes/${pendingChangeId}/submit`, no
  body.

**Verification (TDD, red→green):** write `operatorTourApi.test.ts` cases first (file does not exist
yet — check before creating, in case a sibling test file already covers part of this module) for:
each function's happy path (correct method/path/body sent, response parsed), the 404→null special
case for `getCurrentPendingChange`, and that every other status still throws `OperatorTourApiError`
with the right `code`/`status`. Run `npm run lint && npm run typecheck` after.

## Task 2 — Payload mapping: `operatorTourService.ts` draft-version functions

**Files:** `src/features/operator/tours/services/operatorTourService.ts`

Add new exported functions (do not yet wire them into `UpdateTourPackageView.tsx` — that's Task 4):
- `createOrResumeDraftVersion(tourId: string): Promise<TourPackageDto>` — calls
  `createOrResumePendingChange`, then `getCurrentPendingChange` to fetch the full payload (the
  create call's response has no content fields), then maps `ApiPendingChange` → `TourPackageDto`
  shape the existing `UpdateTourPackageView` already renders (reuse the existing `ApiTourDetail` →
  `TourPackageDto` mapper if one already exists in this file — inspect
  `loadTourDetail`/equivalent before writing a second mapper from scratch; if none exists as a
  reusable function today, extract one rather than duplicating field-by-field mapping logic twice).
- `saveDraftVersion(tourId: string, pendingChangeId: string, payload: UpdateTourPackagePayload):
  Promise<TourActionResult<TourPackageDto>>` — maps `UpdateTourPackagePayload` to
  `ApiPendingChangeSaveBody`, calling `savePendingChange`, returning the same
  `TourActionResult<TourPackageDto>` envelope `updateTourPackage` already returns today (so
  `UpdateTourPackageView`'s existing success/error handling branches do not need to change shape).
  **Schedule `scheduleId` round-trip (spec §4):** every schedule row the form did not add new must
  carry its original numeric id forward into this payload; a new row sends `scheduleId: null`.
  Trace how today's `TourDepartureSchedule.id` (a `string`, possibly client-generated for new rows)
  distinguishes "existing, from server" vs. "new, client-only" before writing this mapping — do not
  guess; if the distinction is not already tracked cleanly, this is the place to make it explicit
  (e.g. a new-row id prefix check, or a boolean flag on the schedule row state) rather than
  threading a parallel data structure through the component.
- `discardDraftVersion(tourId: string, pendingChangeId: string): Promise<void>`.
- `submitDraftVersion(tourId: string, pendingChangeId: string):
  Promise<TourActionResult<TourPackageDto>>`.

Remove, in this same task (Task Owner decision, spec §1.5): the `Approved`/`Published` +
`allowDemo` branch inside `updateTourPackage` (the block creating/mutating a `demoToursStore`
"draft vN+1" row) and the real-mode `Approved`/`Published` branch calling `createTour({
sourceTourId })`. Leave `updateTourPackage`'s `Draft`/`Rejected` handling (both demo and real)
untouched — that is UC-35, out of scope. If removing the `Approved`/`Published` branches leaves
`updateTourPackage` itself with no remaining reason to accept a `createNewVersion` parameter, remove
that parameter too and update its one caller (`UpdateTourPackageView.tsx`, addressed in Task 4) in
the same task — do not leave a dead parameter.

**Verification:** extend `operatorTourService.test.ts` (exists per Task 1's earlier find) with
cases for each new function's success path, the schedule-id round-trip (a schedule with an existing
id stays that id in the outgoing payload; a client-only new row sends `null`), and that
`updateTourPackage` no longer has an `Approved`/`Published` code path (assert it now only handles
`Draft`/`Rejected`, e.g. by checking the function's behavior when called with an `Approved` tour —
decide at execution time whether that means removing the parameter/throwing/becoming unreachable
based on how Task 4 ends up calling things). `npm run lint && npm run typecheck`.

## Task 3 — Validation: capacity/schedule client-side checks reused for drafts

**Files:** `src/features/operator/tours/services/operatorTourService.ts` (or wherever
`validateUpdateTourPackage` lives — confirm, same file per Task 2's reads)

`validateUpdateTourPackage` already checks capacity ≥ reserved (spec §6). Confirm it works
unchanged against a draft version's schedule list (same `TourDepartureSchedule[]` shape the form
uses) — no new validator needed if the existing one is agnostic to "is this a draft or the live
tour", which it should be since it only reads the `payload`/`currentTour` shapes already passed to
it today. If it turns out the function assumes something only true for the live tour (e.g. reads a
live-tour-only field), fix that assumption here, scoped narrowly — do not rewrite the validator.

Add, only if not already covered: a check that a past-departure schedule (date in the past relative
to now) is never submitted with a changed `totalCapacity`/removed from the list, mirroring backend
AC §9.8 so the Operator gets instant feedback instead of waiting for a `400`
`schedule_not_owned_by_tour`/`invalid_schedule_date` response — but only add this if inspection
shows the existing validator does not already guard it implicitly via the "owned schedule ids only"
constraint from Task 2. Do not duplicate a check that already exists.

**Verification:** unit tests for the new/confirmed validation paths. `npm run lint && npm run
typecheck`.

## Task 4 — Wire `UpdateTourPackageView.tsx` to the draft-version flow

**Files:** `src/features/operator/tours/components/UpdateTourPackageView.tsx`

This is the task that changes the component's actual data flow for the `isApproved` case (spec
§5.3, edge cases 1-4, 7):

- On mount, when `isApproved` is true: call `createOrResumeDraftVersion(initialTour.id)` instead of
  rendering `initialTour`'s own fields directly as "the thing being edited". Show a loading state
  while this resolves (the view currently has no loading state for this path since it was
  synchronous before — add one, following whatever loading pattern `SubmitTourApprovalView.tsx` or
  this same file's `catalogues` loading already uses, do not invent a new spinner pattern).
- The form's state (`title`, `destination`, `schedules`, etc., lines ~62-80 today) initializes from
  the **draft version's** proposed values once loaded, not from `initialTour` directly, when
  `isApproved`. When not `isApproved` (the existing `Draft`/`Rejected` direct-edit case), behavior
  is unchanged — initializes from `initialTour` as today.
- "Lưu thành bản nháp mới" button (`handleSave(false)` today, line ~716): when `isApproved`, calls
  `saveDraftVersion` with the currently-open pending-change id instead of `updateTourPackage`. The
  pending-change id must come from the create-or-resume response/state, not be re-derived.
- "Gửi xét duyệt" (line ~721 today, which currently routes to `OPERATOR_TOUR_ROUTES.submit
  (initialTour.id)` — the **existing UC-37 submit page**, built for first-time `Draft`/`Rejected`
  submission): when `isApproved`, this must instead call `submitDraftVersion` directly (not route to
  the existing submit page, whose `SubmitTourApprovalView` checklist/copy is written for first-time
  submission and is out of scope to adapt for drafts per spec §2 "out of scope: any change to the
  existing first-time-submission Staff queue beyond what's needed" — the Operator-side submit page
  is a separate, pre-existing screen this spec does not extend). Confirm this interpretation is
  right before building it — if the Task Owner actually wants a shared/adapted submit screen for
  both flows, that is a spec-level scope change, stop and ask rather than deciding it mid-plan.
- Remove the post-save redirect to `OPERATOR_TOUR_ROUTES.edit(result.data.id)` (line ~211 today,
  which navigated to the **newly created tour's own** edit page under the old `createTour`
  mechanism) for the `isApproved` branch — there is no new tour id now, the Operator stays on the
  same tour's edit page, which now shows the (just-saved) draft version.
- `isPending`-gated disabled states (BR-61 read-only lock) already present throughout the form stay
  as-is; verify they still correctly gate the draft version's own `PendingReview` status, not just
  the live tour's `Pending` status, since `isPending` today is computed from `initialTour.status`
  (line 51) — once the view renders draft-version data, the lock must key off the draft version's
  own status (`PendingReview`) for the `isApproved` case, not off `initialTour.status` (which stays
  `Approved`/`Published` throughout — it does not change until Staff approves).
- The "Lịch sử phiên bản" (Version History) card (line ~671-696 today) references
  `initialTour.version + 1` and "v1 · Đã duyệt" placeholder text that assumed the old versioning
  mechanism (new tour row per version). Re-examine whether this card's copy still makes sense once
  there's no new tour row — likely needs to describe "draft version" state instead of a numbered
  tour-version lineage. Decide the simplest honest copy at execution time; do not leave the old
  wording if it now describes something that no longer happens.
- Rejected draft version (edge case 7): when the resumed pending-change's own `status` is
  `Rejected`, show its `rejectionReason` (from `ApiPendingChange.rejectionReason`) in the same
  rejection-notice UI pattern the component already has for a `Rejected` **tour** (line ~314-329
  today) — adapted to read from the draft version, not `initialTour`, for the `isApproved` case.

**Verification:** extend `UpdateTourPackageView.test.tsx` for: create-or-resume on mount (asserted
via mocked API calls, not a live backend), save calling the draft endpoint, submit calling the
draft endpoint directly (not routing to the old submit page), the `PendingReview`-locks-the-form
case keyed off the draft's status, and the rejected-draft-shows-reason case. `npm run lint && npm
run typecheck && npm run build`.

## Task 5 — Full local verification and branch finishing

Run `npm run lint && npm run typecheck && npm run build` clean. Manually exercise, against a real
local backend on `develop` (not demo mode): open edit on a `Draft` tour (unaffected path, sanity
check for regression) and on an `Approved` tour (new path) — confirm the second one creates a draft
version server-side (check via `GET .../pending-changes/current` or DB) rather than a new tour row.

Then stop and present the Task Owner with the branch-finishing choice (merge / open PR / keep
branch / discard) per AGENTS.md §9 — do not merge or push unprompted. Plan B (Staff-side) is written
and approved only after this choice is made, per spec §9 decision 3.
