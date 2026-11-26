# TM-82 / UC-36 (Web) — Update Tour Package: consume the backend pending-change API

Status: **Draft, awaiting Task Owner approval** (Mai Nguyễn Tiến Đạt).

## 0. Why this spec exists

Backend TM-82 (`Capstone_BE` PR #212, merged to `develop` at `1809df3b`) shipped a `TourPendingChangeSet`
entity and 8 new endpoints (`specs/TM-82-spec.md §5` in `Capstone_BE`) so an Operator can edit an
`Approved`/`Published` tour through a draft version that Staff reviews, instead of mutating the live
tour directly. The acceptance recheck for that backend work passed (35/35 API/SQL Server tests,
724/724 unit tests — see `_handover/tasks/TM-82/2026-11-26_1353_nghiem-thu-dat-sau-fix-0f7e1d09.md`).

**This repo (`Capstone_FE`) does not call any of those 8 endpoints.** `updateTourPackage` in
`src/features/operator/tours/services/operatorTourService.ts` (lines ~709-721), when the current
tour is `Approved`/`Published`, instead calls `createTour({ sourceTourId: currentTour.id })` — the
pre-existing `SourceTourId`/`VersionRootTourId` tour-cloning path that the backend spec explicitly
marks **out of scope and carrying its own defect** ("approving a new version from it can leave two
Published rows for the same logical tour live at once"). When `allowDemo` is true, the whole flow
runs against an in-memory `demoToursStore` and calls no API at all.

This spec's scope is: make the Web Operator UI call the real `pending-changes` endpoints, and add
the Staff-side screen to approve/reject them. It does **not** touch Mobile (separate spec, separate
repo) and does **not** change the existing UC-35 direct-edit flow for `Draft`/`Rejected` tours,
which already works correctly and is unaffected by backend TM-82.

## 1. Sources

1. `Capstone_BE/specs/TM-82-spec.md` (revision 6, this repo's sibling spec) — the approved backend
   contract. This FE spec treats it as authoritative for routes, payload shapes, status codes, and
   error codes; it is not re-derived or re-interpreted here.
2. `_handover/tasks/TM-82/2026-11-26_1420_phat-hien-fe-chua-noi-api-moi.md` and
   `2026-11-26_1500_mobile-cung-chua-trien-khai-uc36.md` — the gap analysis that triggered this
   spec.
3. Current code: `src/features/operator/tours/**` (Operator-side UC-35/36/37), `src/features/admin/
   tour-reviews/**` (Staff-side UC-60 moderation queue for first-time `Pending` submissions — a
   structurally similar but functionally separate queue, used here only as a UI/code pattern to
   reuse, not as a dependency).
4. `docs/WEB_SCOPE_MATRIX.md` §UC-36 (Screen #82, actor Tour Operator, `WEB_AND_MOBILE`) — confirms
   this is in-scope for Web.
5. Task Owner decisions from this session (2026-11-26): remove the `allowDemo` UC-36 code path
   entirely rather than keeping it alongside the real path; Staff approve/reject for TM-82 draft
   versions belongs on Web only, not Mobile.

## 2. Scope

**In scope:**
- Operator: create/resume a draft version for an `Approved`/`Published` tour (replacing the
  `createTour(sourceTourId)` call).
- Operator: view, edit, save, discard, and submit that draft version.
- Operator: the existing direct-edit screen for `Draft`/`Rejected` tours is unaffected — no change.
- Staff: a new moderation queue screen listing both first-time `Pending` submissions and
  `PendingReview` draft versions in one place (per backend's combined `moderation-queue` endpoint,
  `kind` discriminator `NewSubmission` | `DraftVersion`), **or**, if the Task Owner prefers (open
  question, §9), a dedicated draft-version queue separate from the existing `/admin/tours/reviews`
  first-time queue.
- Staff: approve/reject a `DraftVersion` row, showing the proposed values (not the live tour's
  current values) per backend AC — this closes the P1 gap from the original backend acceptance
  recheck ("Staff queue returns draft title, but detail API returns price/schedule/capacity of the
  live tour").
- Removing the `allowDemo`/`demoToursStore` code path for UC-36 specifically (Task Owner decision,
  §1 point 5). The rest of `operatorTourDemoFixtures.ts`/demo mode for UC-35 create/list is
  untouched unless it turns out to share code that cannot be split — if so, stop and ask rather
  than removing more than decided.

**Out of scope:**
- Mobile (`Capstone_Mobile`) — separate spec, separate repo, separate approval.
- Any change to the backend contract itself.
- Any change to the existing first-time-submission Staff queue (`admin/tour-reviews`) beyond what
  is needed to add or merge the draft-version queue (exact approach is §9 open question).
- Tour media editing inside a draft version — backend TM-82 spec `§0` scopes tour media as closed/
  out of scope for TM-82 itself; this FE spec follows that.

## 3. Current behavior (verified against code, not assumed)

- `operatorTourService.ts` `updateTourPackage`, lines ~709-721 (demo branch) and ~826-838 (real
  branch): for `Approved`/`Published`, demo calls local store logic simulating a "draft vN+1";
  real calls `createTour({ ...toBackendPayload(payload), sourceTourId: asBackendId(currentTour.id)
  })`.
- `UpdateTourPackageView.tsx` line ~200-214: passes `createNewVersion: isApproved` into
  `updateTourPackage`, and on success redirects to `OPERATOR_TOUR_ROUTES.edit(result.data.id)` —
  i.e. it navigates to the **new tour's own edit page**, not back to a draft-version editor for the
  original tour. This confirms the UI's mental model is "new tour", not "draft version of this
  tour", and needs to change.
- `operatorTourApi.ts` has no function for any `pending-changes` path. `ApiCreateTour` has no field
  for it either.
- No Staff-side code anywhere references `pending-changes` or `moderation-queue` (grep confirmed
  empty across `Capstone_FE`).

## 4. Backend contract this spec consumes — verified against `Capstone_BE` source on `develop`
(`OperatorToursController.cs:235-300`, `OperatorTourErrorCodes.cs`, `ApiControllerBase.cs:335-355`,
the five `PendingChanges/**` command/query files), not re-derived from the backend spec prose.
If this ever disagrees with `Capstone_BE/specs/TM-82-spec.md §5`, the live source above wins.

| Operation | Method & path | Success | Failure (error code → HTTP status) |
|---|---|---|---|
| Create/resume draft | `POST /operator/tours/{tourId}/pending-changes` | `201` (`IsNew: true`) or `200` (`IsNew: false`, resumed) — body `PendingChangeResponse { id, tourId, status, isNew }` | `403` access_required; `404` not_found; `409` invalid_state (covers `Draft`/`Rejected`/`Pending`/`Inactive` — the server does not distinguish MSG110 vs MSG122 in the error **code**, only in the human-readable `detail` string; FE must read `detail`, not infer from `code` alone, to show the right message) |
| View current draft | `GET /operator/tours/{tourId}/pending-changes/current` | `200` `GetCurrentPendingChangeResponse` (see field list below) | `403` access_required; `404` pending_change_not_found (no open draft — **not an error state for FE**, it means "nothing to resume", so the create-or-resume call should be used as the entry point rather than calling this alone and treating 404 as failure) |
| Save draft | `PUT /operator/tours/{tourId}/pending-changes/{pendingChangeId}` | `200` `PendingChangeSavedResponse { id, tourId, status }` | `400` schedule_not_owned_by_tour / invalid_schedule_date (validator-level, FluentValidation via `SavePendingChangeCommandValidator`); `403`; `404` tour/pending-change not found; `409` invalid_state (not `Draft`/`Rejected`) or schedule_has_active_bookings (BR-61, MSG143) |
| Discard draft | `DELETE /operator/tours/{tourId}/pending-changes/{pendingChangeId}` | `204` | `403`; `404`; `409` invalid_state (not `Draft`/`Rejected`) |
| Submit draft | `POST /operator/tours/{tourId}/pending-changes/{pendingChangeId}/submit` | `200` `PendingChangeSubmittedResponse { id, tourId, status }` | `400` pending_change_review_prerequisites_missing (BR-101 completeness — **400 here, unlike the existing first-time-submission flow's 422** for the equivalent `ReviewPrerequisitesMissing`, confirmed deliberate in `OperatorTourErrorCodes.cs` comment); `403`; `404`; `409` invalid_state or schedule_has_active_bookings (MSG143) |
| Staff: combined queue | `GET /admin/tours/moderation-queue?page=1&pageSize=20` | `200` `ModerationQueueResponse { items: ModerationQueueItem[], page, pageSize, totalCount }`. Each `ModerationQueueItem` is **minimal**: `{ id, tourId, kind: "NewSubmission" \| "DraftVersion", operatorUserId, title, status, submittedAtUtc }` — no price/location/duration/capacity. This is a **separate, additive endpoint** from the existing `GET /admin/tours` (`fetchPendingTourPage`, `NewSubmission`-only, richer row shape) — it does not replace it. | `403` admin_access_required |
| Staff: draft version detail | `GET /admin/tours/pending-changes/{pendingChangeId}` | `200`, reuses `GetCurrentPendingChangeResponse` verbatim (same shape as the Operator's own `GET .../pending-changes/current` — spec §4's field list) — **the proposed values only**, not a diff and not the live tour. | `404` pending_change_not_found |
| Staff: live tour (for the diff) | `GET /admin/tours/{tourId}` | `200`, reuses `OperatorTourDetailDto` — **the exact same shape** `operatorTourApi.ts`'s existing `ApiTourDetail`/`getTour` already models (verified: both resolve to `GetTourReviewDetailQuery`/`OperatorTourDetailDto` in `Capstone_BE`). No new type needed — reuse `ApiTourDetail`. | `404` |
| Staff: approve draft | `POST /admin/tours/pending-changes/{pendingChangeId}/approve` | No body. `200` `PendingChangeDecisionResponse { id, tourId, status, tourStatus, message }`, `message` carries MSG144. **No checklist parameter** — unlike the existing first-time-submission `approve` (`ApproveTourRequest { checklist, note }`), this endpoint takes nothing; the 5-criterion checklist UI (`TourReviewDecisionPanel`'s `CRITERIA`) does not apply here and must not be reused as-is. | `404`; `409` invalid_state (MSG133, stale decision) |
| Staff: reject draft | `POST /admin/tours/pending-changes/{pendingChangeId}/reject` | Body `RejectTourRequest { reason }`. `200` `PendingChangeDecisionResponse`, `message` carries MSG145. | `400` pending_change_rejection_reason_invalid (empty reason, MSG123); `404`; `409` invalid_state (MSG133) |

All five Staff routes are under `[Authorize(Roles = "Staff")]` in `AdminToursController.cs` (verified) — same guard already governing `/admin/tours/reviews`.

**`GetCurrentPendingChangeResponse` fields** (exact names, from `GetCurrentPendingChangeQuery.cs`):
`id, tourId, status, categoryId (int?), title, description, basePrice, durationDays, inclusions,
exclusions, highlights, travellerRequirements, timeZoneId, destinationIds (long[]),
destinationSummary, cancellationPolicyTemplateId, itineraryItems[], schedules[], createdAtUtc,
updatedAtUtc, submittedAtUtc, reviewedAtUtc, rejectionReason`.

**`itineraryItems[]` item shape** (`CreateTourItineraryItemRequest`, reused from the existing
create/update flow, same shape `operatorTourApi.ts`'s `ApiItineraryItem` already models): `dayNo,
sequenceNo, poiId, plannedTime, stayDurationMinutes, notes, isRequiredForWeather?`.

**`schedules[]` item shape** (`PendingChangeScheduleItem` — note this is a **different, superset**
shape from the existing `ApiDeparture`/`CreateTourScheduleRequest`, with two new optional fields):
`scheduleId (long?, null = new schedule), startAtUtc, endAtUtc, meetingPoint, totalCapacity,
minimumCapacity, registrationDeadlineAtUtc, adultPrice, childPrice, infantPrice, meetingLatitude?,
meetingLongitude?`. **`scheduleId: null` means a newly proposed schedule; a non-null id must match
an existing `TourSchedule.Id` on the same tour** (server validates this — `operator_tour.
schedule_not_owned_by_tour`, `400`) and is updated in place, not replaced. The FE payload builder
for Save must carry the right `scheduleId` for every past-departure schedule (never omit it, never
send `null` for one) — this is the exact mechanism behind backend AC §9.8/§9.11 (past-departure
immutability) and the P1 defect that was fixed in `0f7e1d09`; the FE form must round-trip the id
losslessly for every schedule row it did not add new, or the save silently creates a duplicate
schedule instead of updating the existing one.

Error codes this FE must map to user-facing Vietnamese messages (do not invent new codes; constants
in `OperatorTourErrorCodes.cs`): `operator_tour.invalid_state` (409, multiple meanings — read
`detail` for MSG110 vs MSG122 wording), `operator_tour.pending_change_not_found` (404),
`operator_tour.schedule_has_active_bookings` (409, MSG143), `operator_tour.schedule_not_owned_by_tour`
(400), `operator_tour.invalid_schedule_date` (400), `operator_tour.pending_change_review_
prerequisites_missing` (400, BR-101 at submit).

## 5. Proposed FE design

### 5.1 API client (`operatorTourApi.ts` additions)

New functions, same `request<T>` helper, same error-mapping conventions as existing functions:
- `createOrResumePendingChange(tourId): Promise<ApiPendingChange>`
- `getCurrentPendingChange(tourId): Promise<ApiPendingChange | null>` (maps `404` → `null`, not a
  thrown error — callers need to distinguish "no draft open" from a real failure)
- `savePendingChange(tourId, pendingChangeId, body: ApiCreateTour): Promise<ApiPendingChange>`
- `discardPendingChange(tourId, pendingChangeId): Promise<void>`
- `submitPendingChange(tourId, pendingChangeId): Promise<ApiPendingChange>`

New types mirroring the backend DTO shape (exact field names TBD against the live OpenAPI spec at
plan time — `Capstone_BE`'s `specs/TM-82-spec.md §5` names the operations but the plan phase must
read the actual response DTOs in `Capstone_BE/src/.../PendingChanges/**` before finalizing field
names, since this spec does not re-type them from memory).

### 5.2 Staff API client (new file, `src/features/admin/tour-pending-changes/api/...` or extending
`tourModerationApi.ts` — exact placement is a plan-time decision, not fixed here) for:
- `fetchModerationQueue` (combined or draft-only, per §9 decision)
- `fetchPendingChangeDetail(pendingChangeId)` — must return the **proposed** values, not the live
  tour's, closing the original P1 gap.
- `approvePendingChange(pendingChangeId)`
- `rejectPendingChange(pendingChangeId, reason)`

### 5.3 Operator UI changes

- `UpdateTourPackageView.tsx`: when `isApproved` (tour is `Approved`/`Published`), the view must
  load (or create/resume) the **draft version**, not edit the live tour's own fields directly.
  Concretely: on mount, call create-or-resume; render the draft's proposed fields (seeded from the
  live tour per backend behavior); "Lưu thành bản nháp mới" calls save-draft, not `createTour`;
  "Gửi xét duyệt" calls submit-draft, not the existing direct-edit submit path.
- A tour whose live status is `Approved`/`Published` **and already has an open draft version**
  (`Draft`/`PendingReview`/`Rejected` kind) must resume that draft when the Operator opens edit —
  never silently create a second one (backend already guarantees this server-side via the unique
  filtered index; FE must not route around it by calling create twice without checking
  create-or-resume's idempotent `200` response first).
- `OperatorTourListView.tsx` / wherever the tour list links to edit: no route change needed (same
  `OPERATOR_TOUR_ROUTES.edit(tourId)` — the tour's own id, not a pending-change id — since the
  draft-version concept is resolved inside the edit page, consistent with how `PendingReview`
  already locks the page today).
- Remove the `allowDemo`/`demoToursStore` branches specific to the `Approved`/`Published` case in
  `updateTourPackage` (Task Owner decision, §1.5). Leave Draft/Rejected demo editing and Create
  demo flow alone unless investigation shows they share unsplittable code — if so, stop and ask.

### 5.4 Staff UI

New screen (route and exact queue-merge approach: §9 open question) showing `DraftVersion` rows
with: tour title, operator, proposed vs. current diff summary (price/capacity/schedule at minimum,
matching backend's §9 AC "Staff reads the content actually submitted for review"), approve/reject
actions reusing `ModerationDialog`/`RejectTourDialog`/`ConfirmationDialog` patterns already in
`admin/tour-reviews` and `operator/tours` where they fit without forcing an awkward shared
abstraction (do not prematurely unify two features' dialogs into one component merely because they
look similar — AGENTS.md "no invented abstractions beyond what the task requires").

## 6. Business rules carried over from backend (FE must enforce defensively, backend is authority)

- BR-61 capacity guard: FE already validates capacity ≥ reserved client-side for the direct-edit
  path (`validateUpdateTourPackage`); the same client-side check applies to the draft-version save/
  submit forms so Operators get instant feedback, but the backend's own re-check at submit/approve
  (MSG143) remains the actual gate — FE failure handling for a `409`/MSG143 response must be wired
  (show the message, do not treat it as a generic error), not just the client-side pre-check.
- Past-departure schedule immutability: when rendering a draft version's schedules, a schedule
  whose departure date is already in the past must render read-only, matching backend's guarantee
  that it is carried over unchanged and can never trigger BR-61 "removed schedule" on this path.
- MSG110 routing: calling the **existing** direct-edit `PUT /operator/tours/{tourId}` against an
  `Approved`/`Published` tour must no longer happen from this UI at all once §5.3 lands (today it
  only happens via `createTour`, never direct-edit `PUT`, so this is a non-regression note, not a
  new failure mode to add handling for).

## 7. Edge cases to cover (acceptance criteria, draft — Task Owner to confirm/amend at approval)

1. Opening edit on an `Approved`/`Published` tour with **no** open draft version creates one
   (`201`), seeded from live values, and the editor shows it as the thing being edited (not the
   live tour).
2. Opening edit on an `Approved`/`Published` tour that **already has** an open draft version
   (`Draft`, `PendingReview`, or `Rejected` kind) resumes it (`200`) — verified by asserting no
   second create call fires and the same `pendingChangeId` is reused across repeated opens.
3. A draft version in `PendingReview` is read-only in the Operator UI (mirrors today's `isPending`
   lock for the direct-edit path) — Operator cannot save or discard, only view.
4. Discarding a `Draft`/`Rejected` draft version removes it; re-opening edit then creates a fresh
   one (not a resume of the discarded row).
5. Saving a draft with a schedule capacity below its `reservedCapacity` shows the existing client
   validation message before any network call; if it somehow reaches the server (e.g. stale sold-
   count), the `409`/MSG143 response is shown as a dedicated message, not a generic failure.
6. Submitting a draft that fails BR-101 completeness re-check server-side surfaces the specific
   blocker list (reuse `TourReadinessPanel`/`reviewBlockers` pattern already used for first-time
   submission), not a generic error.
7. A rejected draft version (`Rejected` kind) shows the rejection reason and allows the Operator to
   edit and resubmit the **same** pending-change row (not a new one) — matches backend's "Operator
   edits and resubmits with the same draft" acceptance criterion.
8. Staff approving a `DraftVersion` row applies changes to the live tour; the live tour's status
   itself never changes (still `Approved`/`Published`) — Staff UI must not show a status-change
   affordance that implies otherwise.
9. Staff rejecting requires a non-empty reason (client-side required field, mirroring MSG123)
   before the request is even sent.
10. Staff attempting to decide on a pending-change that is no longer `PendingReview` (e.g. another
    Staff already decided, or Operator discarded it mid-review) gets the `409`/MSG133 response
    surfaced as "this item was already decided/withdrawn — refresh the queue", not a generic
    error, and the row is removed/refreshed from the queue view.
11. A tour with multiple past-departure schedules plus one future schedule: editing the draft and
    removing the future schedule from the form, then saving, must not be able to also drop the
    past schedules (they are not shown as editable/removable per §6).
12. Network/5xx failures on any of the 5 Operator or 4 Staff calls degrade the same way existing
    `OperatorTourApiError`/`ModerationApiError` failures do today (status 0 → "check connection",
    5xx → "server could not process, retry", etc.) — no new ad-hoc error UI pattern.

## 8. Out-of-scope defects noticed but not fixed here

None discovered yet beyond what's already tracked in the backend handoffs. If plan-phase
exploration of the actual response DTOs surfaces a backend contract gap (missing field, wrong
type), stop and ask rather than guessing a shape.

## 9. Decisions locked by the Task Owner (2026-11-26)

1. **Queue placement — merged.** The Staff draft-version queue reuses the existing
   `/admin/tours/reviews` screen and the backend's combined `GET /admin/tours/moderation-queue`
   endpoint (`kind: "NewSubmission" | "DraftVersion"`). `TourReviewQueue` is extended to render
   both kinds in one list rather than adding a separate route. Any row-level action (approve/
   reject) must dispatch to the right backend endpoint based on `kind` — a `NewSubmission` row
   keeps calling the existing `/admin/tours/{id}/approve|reject`; a `DraftVersion` row calls the
   new `/admin/tours/pending-changes/{pendingChangeId}/approve|reject`. This is a routing concern
   inside the queue/detail components, not a backend contract change.
2. **Diff presentation — full field-by-field diff.** The Staff detail view for a `DraftVersion` row
   shows proposed vs. live value for every editable field (title, description, price, capacity,
   itinerary, schedules, cancellation policy, etc.), not only price/schedule/capacity. This is new
   UI, not a reuse of `TourFacts.tsx` as-is (`TourFacts.tsx` renders one tour's facts, not a diff of
   two) — plan phase decides whether to adapt it or build a dedicated diff component.
3. **Phasing — two separate plans.** Plan A covers Operator-side only (§5.1 API client subset for
   create/resume/save/discard/submit, §5.3 UI). Plan B covers Staff-side (§5.2 API client subset,
   §5.4 UI, queue merge from decision 1, diff view from decision 2). Plan A must reach its own
   Local Verification (`npm run lint && npm run typecheck && npm run build`) and be presented to the
   Task Owner for the branch-finishing choice (merge/PR/keep/discard) before Plan B's implementation
   plan is written. Until Plan B ships, Staff can decide on a Operator-submitted draft version only
   out-of-band (direct API call or DB), which is an accepted interim gap, not a defect to fix in
   Plan A.
