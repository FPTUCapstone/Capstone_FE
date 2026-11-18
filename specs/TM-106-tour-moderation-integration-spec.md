# TM-106 FE — Connect Tour Moderation Screens 13/14 to the Backend (UC-60)

Status: scope agreed with the requester on 2026-11-19 ("tạo trang cho FE luôn"). Depends on Backend branch `feature/tm-106-pending-tour-queue` (stacked on BE PR #188), spec `Capstone_BE/specs/TM-106-pending-queue-spec.md`.

## What already exists (do not recreate)
`/admin/tours/reviews` (queue, Screen 13) and `/admin/tours/reviews/[id]` (detail, Screen 14) in `src/features/admin/tour-reviews/`, Staff-only at page level. They show a "not connected" notice in production and sample data only with `?demo=1` (dev flag). The decision panel (checklist, approve/reject dialogs) is a local simulation.

## Goal
In production (non-demo) mode, the queue and detail load **real** data and the decision panel **really** approves/rejects through the existing Backend endpoints. Demo mode keeps working unchanged.

## Non-goals
- No new routes/screens, no new state library, no backend change, no change to demo fixtures' behaviour.
- No hidden fake fallback: when the backend is down the UI says so; it never shows fixtures.
- Email/notification UI, Administrator access (Staff only, like the pages already are).

## Design
- **Server-only proxy** (`api/tourModerationProxy.ts`, pattern of `platform-bookings`): 4 routes under `app/api/admin/tours/` — `pending` (GET), `[tourId]/review` (GET), `[tourId]/approve` (POST), `[tourId]/reject` (POST). Staff session required; forwards only whitelisted query fields and forces `pageSize=20`; maps 401 (clear session), 403, 5xx → 503; passes through safe problem bodies (title + errorCode only).
- **Client API** (`services/tourModerationApi.ts`): typed fetchers and strict response parsers (malformed payload → error, never partial render); image URLs must be `https:`.
- **UI states** for live mode: loading, ready, empty, forbidden, unauthorised (redirect to login), unavailable (retry). Detail adds: not found / already decided (409).
- **Contract adaptations (Backend ↔ UI):** `durationDays` shown as days; `languages` is not provided by Backend so the row is hidden (never invented); cancellation policy rendered from rules; itinerary from POI name + planned time; images rendered so the reviewer can judge "image appropriateness".
- **Decisions:** approve posts the 5-item checklist + optional note; reject posts the reason (category label prefixed, ≤ 500 chars enforced client-side). Outcomes: 200 success notice and controls locked; 409 "no longer pending" (MSG133); 503 "temporarily unable" (MSG127) with retry; 401/403 handled as above. The success/failed copy never claims an email was sent (PC-03 email is deferred).

## Acceptance
- Production build never renders fixtures; demo (`?demo=1` in dev) is unchanged.
- Live queue: 20/page, keyword applies only on submit, state survives round trip to detail (existing CR-01/CR-02 behaviour).
- Live detail shows images, price, policy, schedule, itinerary; decision panel disabled after a decision; double submit is impossible.
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` all pass.
