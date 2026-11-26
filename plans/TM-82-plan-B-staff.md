# TM-82 Plan B — Staff-side: moderate draft versions in the existing queue

Status: **Draft, awaiting Task Owner approval.** Covers `specs/TM-82-spec.md` §5.2/§5.4/§9
decisions 1-2, edge cases 8-10. Operator-side (Plan A) has landed in a separate PR
([Capstone_FE#212](https://github.com/FPTUCapstone/Capstone_FE/pull/212)); this plan does not
depend on that PR being merged first to start (same backend contract either way), but its own PR
stays separate per the approved phasing (spec §9.3).

Branch: new branch off `origin/develop` (not off Plan A's branch — the two are independent diffs on
different files/areas, per AGENTS.md §5.1; confirm clean baseline before branching).

## Backend contract this plan consumes (verified against `Capstone_BE` source, `AdminToursController.cs`)

- `GET /admin/tours/moderation-queue?page=1&pageSize=20` → `{ items: [{ id, tourId, kind:
  "NewSubmission"|"DraftVersion", operatorUserId, title, status, submittedAtUtc }], page, pageSize,
  totalCount }`. **Additive** — the existing `GET /admin/tours` (`fetchPendingTourPage`,
  `NewSubmission`-only, richer row) is untouched and still exists.
- `GET /admin/tours/pending-changes/{pendingChangeId}` → `GetCurrentPendingChangeResponse` shape
  (proposed values only — same shape Plan A's `ApiPendingChange` already models in
  `operatorTourApi.ts`; reuse that type, do not redefine it).
- `GET /admin/tours/{tourId}` → `OperatorTourDetailDto`, **the same shape** the existing
  `ApiTourDetail`/`getTour` in `operatorTourApi.ts` already models (verified: both endpoints
  resolve to the same DTO in `Capstone_BE`). Reuse `ApiTourDetail`, do not redefine it.
- `POST /admin/tours/pending-changes/{pendingChangeId}/approve` → no body → `PendingChangeDecisionResponse
  { id, tourId, status, tourStatus, message }`. **No checklist parameter** — unlike the existing
  `ApproveTourRequest { checklist, note }` for first-time submissions.
- `POST /admin/tours/pending-changes/{pendingChangeId}/reject` → `{ reason }` → same
  `PendingChangeDecisionResponse` shape, `message` carries MSG145.

## Task 1 — Server-side proxy routes + client API (Staff side)

**Architecture correction (found during exploration, not in the original spec draft):** this
feature's existing Staff-side calls (`tourModerationApi.ts`) do **not** call the backend directly
from the browser the way `operatorTourApi.ts` does. They call a same-origin Next.js API route
(`app/api/admin/tours/**/route.ts`), which in turn calls `tourModerationProxy.ts`'s `forward()`
helper — this reads the Staff session from an httpOnly cookie (`verifyAdminSessionFromCookies`,
`ADMIN_ACCESS_TOKEN_COOKIE`), checks `isSameOriginRequest` for mutating calls (CSRF defense), and
re-validates the request body server-side before forwarding to `TRIPMATE_API_BASE_URL` with a
Bearer token the browser never sees. This plan's four new endpoints must follow the **exact same
shape** — not `operatorTourApi.ts`'s direct-fetch-with-`AuthStorage`-token pattern, which is wrong
for Staff. Getting this wrong would ship a client-side-only Staff auth check, bypassable by any
request crafted outside the browser.

**Files:**
- `src/features/admin/tour-reviews/api/pendingChangeModerationProxy.ts` (new, mirrors
  `tourModerationProxy.ts`'s structure/helpers — `requireStaff`, `forward`, `isValidTourId`-style
  guards — reusing its exported helpers where they're generic enough, duplicating only what's
  genuinely proxy-specific per endpoint):
  - `proxyModerationQueue(request)` → `GET /api/v1/admin/tours/moderation-queue` (forward `page`
    only; `pageSize` forced server-side like the existing queue proxy's `TOUR_QUEUE_SERVER_PAGE_SIZE`
    constant — confirm whether to reuse that exact constant or define an equivalent, since this is
    a different backend endpoint with its own `DefaultPageSize`/`MaxPageSize`).
  - `proxyPendingChangeDetail(request, pendingChangeId)` → `GET
    /api/v1/admin/tours/pending-changes/{pendingChangeId}` (validate `pendingChangeId` as a
    positive integer, same as the existing `isValidTourId` pattern but for a pending-change id).
  - `proxyLiveTourForDiff(request, tourId)` → `GET /api/v1/admin/tours/{tourId}` (reuses the
    existing `isValidTourId`).
  - `proxyApproveDraftVersion(request, pendingChangeId)` → `POST
    /api/v1/admin/tours/pending-changes/{pendingChangeId}/approve`, **no body validation needed**
    (the backend endpoint takes none — do not port the existing `proxyApproveTour`'s checklist
    validation, it does not apply here).
  - `proxyRejectDraftVersion(request, pendingChangeId)` → `POST
    /api/v1/admin/tours/pending-changes/{pendingChangeId}/reject`, body `{ reason }` (reuse the
    existing reason-length/non-empty validation shape from `proxyRejectTour`, since BR-115's
    "1..500 chars, non-empty" requirement is the same rule, not a coincidence to re-derive).
- `app/api/admin/tours/moderation-queue/route.ts`,
  `app/api/admin/tours/pending-changes/[pendingChangeId]/route.ts` (GET for detail),
  `app/api/admin/tours/pending-changes/[pendingChangeId]/approve/route.ts`,
  `app/api/admin/tours/pending-changes/[pendingChangeId]/reject/route.ts` — thin route handlers
  exactly like the existing four, each just extracting params and calling its proxy function.
  (The live-tour-for-diff fetch reuses the **existing** `app/api/admin/tours/[tourId]/review/route.ts`'s
  sibling — check whether a plain `GET /api/admin/tours/[tourId]` route already exists for the
  non-review detail; if not, this plan adds one, calling `proxyLiveTourForDiff`.)
- `src/features/admin/tour-reviews/services/pendingChangeModerationApi.ts` (new, client-side —
  calls the same-origin `/api/admin/tours/...` routes above, not the backend directly; mirrors
  `tourModerationApi.ts`'s `requestJson`/`ModerationApiError` pattern for consistency). Exports:
  `fetchModerationQueue(page, signal)`, `fetchPendingChangeDetail(pendingChangeId, signal)`,
  `fetchLiveTourForDiff(tourId, signal)`, `approveDraftVersion(pendingChangeId, signal)`,
  `rejectDraftVersion(pendingChangeId, reason, signal)`.
  - `fetchPendingChangeDetail`'s response shape matches Plan A's `ApiPendingChange`
    (`operatorTourApi.ts`) field-for-field — reuse that type via import rather than redefining it,
    since both ultimately serialize the same backend `GetCurrentPendingChangeResponse`.
  - `fetchLiveTourForDiff`'s response shape matches the existing `ApiTourDetail`
    (`operatorTourApi.ts`) — same reasoning, reuse via import.

**Verification (TDD):** proxy tests mirroring `tourModerationProxy.ts`'s own test file's structure
(session-missing → 401, wrong role → 403, cross-origin mutating request → 403, malformed backend
response → 503, each real failure code forwarded with its status). Client API tests for each
function's success path. `npm run lint && npm run typecheck`.

## Task 2 — Merge the queue: `TourReviewQueue.tsx` renders both kinds

**Files:** `src/features/admin/tour-reviews/TourReviewQueue.tsx`,
`src/features/admin/tour-reviews/utils/queueQuery.ts` (if the detail-link builder needs a `kind`
param)

- Switch the live (non-demo) queue fetch from `fetchPendingTourPage` (existing, `NewSubmission`-
  only) to `fetchModerationQueue` (Task 1, combined). Demo mode is unaffected — it stays on its own
  fixtures (spec §2 "out of scope: any change to the existing first-time-submission Staff queue
  beyond what's needed to add or merge the draft-version queue" — demo fixtures are not part of
  that scope and are left alone).
- `QueueRow` needs a `kind`-aware rendering: a `ModerationQueueItem` lacks `location`/`priceVnd`/
  `departureAtUtc` that the current row layout shows for every item. Decide at execution time
  whether to (a) show a reduced set of columns for a `DraftVersion` row (title, operator, submitted,
  status badge, action only) or (b) fetch each `DraftVesion` row's tour summary separately to fill
  the same columns — (a) is very likely the right call (an extra per-row fetch for a list is a
  stated anti-pattern already avoided elsewhere in this codebase), but confirm the row still reads
  sensibly before committing to it; if neither reads well, stop and ask rather than guessing a
  layout compromise.
- The detail link (`buildTourDetailHref`) must route a `DraftVersion` row to a route that can tell
  Task 3's detail view which kind it's loading (e.g. a query param `?kind=draft-change` alongside
  the existing id-based path, or a new path segment — decide the simplest option consistent with
  this repo's existing route conventions in `routes.ts`/`ROUTES.admin`).
- A `NewSubmission` row's existing link/behavior must be provably unchanged (existing tests for
  `TourReviewQueue.test` — confirm the file name — must still pass unmodified wherever they assert
  on `NewSubmission`-only behavior).

**Verification:** extend/add tests for the merged queue (both kinds render, pagination total count
reflects the combined `totalCount`, a `DraftVersion` row's link carries whatever discriminator Task
3 needs). `npm run lint && npm run typecheck`.

## Task 3 — Draft-version detail + diff view

**Files:** new component (e.g. `src/features/admin/tour-reviews/DraftVersionReview.tsx`), wired from
`TourReview.tsx`'s existing routing based on the kind discriminator from Task 2.

- Fetches `fetchPendingChangeDetail(pendingChangeId)` and `fetchLiveTourForDiff(tourId)` in
  parallel.
- Renders a **full field-by-field diff** (Task Owner decision, spec §9.2): title, description,
  basePrice, category, destinations, cancellationPolicy, itinerary, schedules — proposed value next
  to live value, with an explicit visual marker for "changed" vs. "unchanged" per field (exact
  visual treatment — side-by-side columns, inline strikethrough, a changed-only toggle — is an
  implementation-level choice; keep it simple and consistent with the existing `FactChip`/`dl`
  patterns in `TourFacts.tsx` rather than inventing a new diff-UI primitive library for one screen).
- Schedules need special handling: match by `scheduleId` (proposed) against the live tour's
  schedule `id` (Plan A's §4 round-trip mechanism, same id space) to pair up "same schedule,
  changed terms" rows; a proposed schedule with `scheduleId: null` is a new row with no live
  counterpart to diff against (render it as purely "proposed, not yet on the live tour"); a live
  schedule with no matching proposed row is unchanged (every live schedule appears in every
  proposal per backend's carry-over guarantee — confirm this holds before treating a "missing from
  proposed" live schedule as anything other than a data inconsistency to report, not silently
  drop).
- No 5-criterion checklist (spec §4 — the backend approve/reject endpoints take none). The decision
  controls are a plain Approve/Reject pair.

**Verification:** component test rendering a draft with several changed fields and asserting the
diff shows both values for each; a schedule-only change case; the new-schedule (`scheduleId: null`)
case. `npm run lint && npm run typecheck`.

## Task 4 — Decision panel for a draft version (edge cases 8-10)

**Files:** new component (e.g. `DraftVersionDecisionPanel.tsx`), *not* a prop-driven mode switch
bolted onto `TourReviewDecisionPanel.tsx` — that component's checklist/note model doesn't apply
here (Task 3's note above), so forcing one component to serve both shapes would add conditional
branches for a contract that's genuinely different, not refactor reuse. Reuse what already fits
without forcing it: `ModerationDialog`/`RejectTourDialog`'s dialog *shells* are reusable as-is (they
take arbitrary children/callbacks); the checklist-specific internals are not.

- Approve: confirm dialog → `approveDraftVersion(pendingChangeId)` → on success, same
  "return to queue with outcome" pattern `TourReview.tsx`/`returnToQueue` already uses (reuse
  `rememberApprovalOutcome`/`takeApprovalOutcome` — they're keyed by an opaque token, not coupled to
  the first-time-submission shape).
- Reject: reuse `RejectTourDialog` for the reason-entry UI (it already composes a reason string and
  calls back with it) → `rejectDraftVersion(pendingChangeId, reason)`.
- Edge case 8: approving never implies the live tour's own status changes — the success UI must not
  show a status transition for the *tour*, only for the *draft version* (e.g. "Draft version
  approved and applied" rather than anything implying the tour itself moved out of
  Approved/Published).
- Edge case 9: empty reject reason is blocked client-side before any request (the existing
  `RejectTourDialog` already requires a non-empty detail — confirm this still holds for this reuse,
  don't assume).
- Edge case 10: a `409 operator_tour.invalid_state` (MSG133 — another Staff already decided, or the
  Operator discarded it mid-review) surfaces as "this item was already decided or withdrawn —
  refresh the queue," and the queue view this returns to must actually reflect the removal (a
  stale list showing an undecideable row is worse than a generic reload prompt) — follow this
  file's existing `classifyFailure`/`ModerationFailure` pattern for this status rather than a new
  ad-hoc error path.

**Verification:** approve success path, reject with reason success path, empty-reason-blocked
client-side, 409-stale-decision handling. `npm run lint && npm run typecheck && npm run build`.

## Task 5 — Full local verification and branch finishing

Run `npm run lint && npm run typecheck && npm run build` clean, plus the full `npm run test` suite
(not just the touched feature) to catch any regression in the existing `NewSubmission` queue/detail
flow this plan's changes sit next to. Manually exercise against a real local backend if available:
open the merged queue, confirm both kinds list, open a `DraftVersion` row, confirm the diff reads
correctly against a tour with at least one changed field and one unchanged schedule, approve one,
reject another with a reason.

Then stop and present the Task Owner with the branch-finishing choice (merge / open PR / keep
branch / discard) per AGENTS.md §9 — do not merge or push unprompted.
