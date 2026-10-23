# UC-32 View Trip History — real API integration

## Scope

Traveler Web screen `/account/trips` (`SHARED_WEB_MOBILE`, Report 3 §3.7.1) now reads the Backend TM-78 API
instead of the old `501 PENDING_BE_INTEGRATION` stub. Spec: `specs/UC-32-trip-history-web-spec.md`.
Plan: `plans/UC-32-trip-history-web-plan.md`. Backend contract: `Capstone_BE/docs/TM-78-api-contract.md`
(BE PR #105, `feature/tm-78-trip-history`). Mobile follows after the Web.

The screen shows only what the contract returns. There is no search box and no invented value.

## Data path

```text
Browser (TripHistoryView / TripDetailDialog)
  -> tripHistoryClient.ts            GET /api/v1/traveler/trips[?tab&tripType&fromDate&toDate&page&pageSize]
  -> Next route handler              app/api/v1/traveler/trips/route.ts
     app/api/v1/traveler/trips/[kind]/[id]/route.ts
  -> tripHistoryProxy.ts (server)    refresh cookie -> Traveler access token -> Backend
  -> Backend GET /api/v1/traveler/trips[/{kind}/{id}]
```

- The browser never sees the access token or the Backend URL (`TRIPMATE_API_BASE_URL`, server only).
- The proxy forwards only the six list parameters, validates `kind` (`commerceBooking` | `itinerary`) and a positive
  int64 `id` before any upstream call, and answers `Cache-Control: no-store`.
- The upstream body is parsed with `lossless-json` against the contract (`tripHistoryResponse.ts`). Ids are decimal
  strings, unknown fields are dropped, a malformed body becomes `502 trip_history.invalid_response`.
- Record identity is the pair `kind` + `id`, never an id alone. Links use `reviewableRecord.id` for reviews and
  `actions.ticketId` for the e-ticket (never the booking id).

## Screen behaviour

| Area | Behaviour |
| --- | --- |
| Tabs | Upcoming, Completed (default), Cancelled / Refunded; a tab or filter change returns to page 1 |
| Filters | Trip type (`All`, `TourBooking`, `SelfPlannedItinerary`) and a date range sent as `yyyy-MM-dd`; a reversed range shows MSG29 and sends nothing |
| Paging | 20 per page; pages = ceil(`totalCount` / 20). The Backend caps `page × pageSize` at 1000 |
| Summary | Completed tab only: `totalCompletedTrips` and `totalVisitedPois` |
| Dates | UTC instants shown as `dd/MM/yyyy` (and `HH:mm` in the dialog) in `Asia/Ho_Chi_Minh` |
| Write review | only when `actions.canReview === true` |
| View review | only when `review.exists === true`; both link to `/account/reviews/commerceBooking/{reviewableRecord.id}` |
| E-ticket | `actions.canViewETicket` and a `ticketId` -> `/bookings/{ticketId}/ticket` |
| Refund | `actions.canViewRefund` opens the detail dialog on the refund (status, amount, original gateway) |
| View details | every card; lazy `GET .../{kind}/{id}`: tour, schedule, participants, cancellation and refund for a booking; stops with Visited / Skipped / Not visited and the session for an itinerary |
| Itinerary | "View Itinerary" -> `/itinerary/{id}` |

## Errors

| Source | Shown as |
| --- | --- |
| `401` / `403`, `UNAUTHENTICATED`, `FORBIDDEN`, `trip_history.forbidden` | access-denied text (MSG126), no retry in the dialog |
| `trip_history.invalid_date_range` | MSG29 |
| `trip_history.record_not_found` (detail) | "This trip is no longer available." |
| other `trip_history.*`, `MSG127`, `502`, network, malformed body | generic MSG127 with Retry |
| `items: []` | empty state (MSG128) with the plan and explore links |

Only the allow-listed `trip_history.*` codes cross the proxy; any other code or a non-JSON body becomes `MSG127`,
and no upstream message, token or address is ever returned.

## Demo mode

`/account/trips?demo=1` serves `data/tripHistoryDemoFixtures.ts` (contract-shaped, deterministic) only when
`NODE_ENV !== 'production'` and `NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true`. A demo banner marks it. Production ignores
the flag, and a failed real request never falls back to fixtures.

## Legacy review stack (unchanged)

The old `/account/trips/[id]/review` page (`TripReviewPage`), `getTripById`, `TripCardDto` and
`POST /api/v1/reviews` stub are untouched and no longer linked from Trip History (canonical review, TM-79, is used).
The old `GET /api/v1/traveler/trips/{tripId}` stub was removed: Next.js cannot have `[tripId]` beside `[kind]/[id]`.
A direct visit to the old review page now ends as "trip not found" instead of the pending notice.

## Known limits

- Service bookings are not part of the Backend contract yet.
- Automated tests mock the transport; they do not prove live Backend integration. Real end-to-end needs the
  Backend branch running locally with a Completed booking or a completed trip session (no Backend flow sets
  `Booking.Status = Completed` today).
- The Traveler-token exchange is duplicated across the feature proxies (including this one); sharing it is future work.

## Local setup

Set the server-only `TRIPMATE_API_BASE_URL` in `.env.local` to the running Backend origin (for example
`http://localhost:5021`), sign in as a Traveler, and open `/account/trips`. Without a Backend, use `?demo=1` with
`NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true`.
