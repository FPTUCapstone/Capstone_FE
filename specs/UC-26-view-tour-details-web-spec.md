# UC-26 View Tour Details — Web spec

Status: **PROPOSED — awaiting developer approval.**

SRS: Report 3 §3.5.3 (UC-26), BR-54, BR-56, BR-59, BR-60, BR-96, MSG65, MSG127, MSG128.
Platform: `SHARED_WEB_MOBILE`, Web is the "Detail view" (`docs/WEB_SCOPE_MATRIX.md`). Mobile is a separate PR.
Backend contract: `Capstone_BE` `specs/UC-26-view-tour-details-spec.md` (branch `feature/uc26-view-tour-details`,
approved, implemented, not yet merged). **Merge order: Backend first**, otherwise real mode shows MSG65 for
every tour because `GET /api/v1/tours/{id}` does not exist on the deployed API yet.

## Product outcome

A Guest or Traveler opens `/tours/{id}` (from search, a recommendation or a shared link) and sees the real tour:
gallery, operator, price, destinations, day-by-day itinerary with its stops, inclusions, exclusions,
cancellation policy, upcoming departures with the remaining slots, and the rating. Booking needs a Traveler
session; a Guest is sent to sign-in and returned to the booking step.

## What exists today (develop `e41e553`)

`/tours/[id]` → `TourDetailPage` → `TourDetailView`; BFF route `app/api/tours/[id]/route.ts` already proxies to
`/api/v1/tours/{id}`. `getTourDetail()` casts any JSON that has a string `tourId` (no validation) and every
failure is presented as `PENDING_BE_INTEGRATION`. A demo fixture (non-production + `NEXT_PUBLIC_ENABLE_DEMO_FIXTURES`
+ `?demo=1`) feeds `TourDetailView` and `TourBookingView`.

## Scope

In: strict parsing of the real response, mapping to the page view model, honest loading / not-found / error /
retry states, rendering of the new structured sections, BFF id guard, tests.
Out: public review list (the API returns only the aggregate), booking flow behaviour (UC-27), Mobile, any
Backend change, deleting the demo gate.

## Contract consumed (Backend `TourDetailDto`)

Ids are strings, prices whole VND numbers, timestamps UTC ISO strings:
`tourId, title, description?, destination, destinations[], durationDays, basePrice, currency, operator{name, contactPhone?},
images[{url, altText, caption?, isPrimary}], inclusions?, exclusions?, cancellationPolicy{rules[{daysBeforeDeparture,
cancellationFeePercent}]}, itinerary[{dayNo, items[{sequenceNo, poi{poiId,name,address?,latitude,longitude},
plannedTime?, stayDurationMinutes, notes?}]}], schedules[{scheduleId, startAtUtc, endAtUtc, meetingPoint?,
registrationDeadlineAtUtc?, adultPrice, childPrice?, infantPrice?, remainingSlots?, availabilityStatus
(available|soldOut|unknown), bookable}], hasBookableSchedule, rating{average?, count}, asOfUtc`.

## Design

1. **Wire type + strict parser** (`parseTourDetailResponse`): validates presence, type and nullability of every
   field and the three `availabilityStatus` values; rejects anything else with `TourApiError` (a malformed body
   must never render). No `as` cast of server JSON.
2. **View model stays `TourDetailDto`** so the booking page and the demo fixture keep working. It gains optional
   fields only: `destinationSummary`, `rating {average,count}`, `cancellationRules[]`, `itineraryStops` per day,
   per-schedule `meetingPoint`, `registrationDeadline`, `childPrice`, `infantPrice`, `bookable`; the schedule's
   `totalCapacity/reservedCapacity` become optional (the API exposes only remaining slots).
3. **Mapper** (`mapTourDetailResponse`):
   - `inclusions`/`exclusions` text → list by line, trimmed, blanks dropped; null → empty list (section hidden).
   - `availabilityStatus` → `status`: `available`→`Available`, `soldOut`→`SoldOut`, `unknown`→`Scheduled`
     (never bookable); `remainingSlots` null → `0`.
   - `price` = `adultPrice`; `aggregateRating`/`reviewCount` from `rating`.
   - `meetingPoint` (tour level, used by the booking summary) = meeting point of the first bookable schedule,
     else the first schedule, else empty.
   - itinerary days keep their structured stops; the old `activities[]` is left empty for real data.
4. **States in `TourDetailPage`** (`PENDING_BE_INTEGRATION` is removed from real mode):
   - loading skeleton (existing);
   - `404` → "not found / no longer available" (MSG65) with a back-to-results action;
   - network, 5xx, malformed body → error (MSG127) with a **Retry** button; the user's search params are kept;
   - success → `TourDetailView`.
   Demo mode behaves as today and is clearly labelled.
5. **View changes** (`TourDetailView`): render structured stops (time, POI name, address, stay duration, notes);
   render cancellation rules as a list ("Hủy từ 30 ngày trước: 0%" style); show destinations; per-schedule meeting
   point and child/infant prices when present; rating chip from `rating` (hidden when `count` is 0);
   Reviews section: `count = 0` → MSG128, `count > 0` → aggregate only with a plain note that individual reviews
   are not listed yet (no fabricated review text); "Book Now" is driven by the schedule's `bookable` flag and
   the tour's `hasBookableSchedule` (BR-60) instead of local arithmetic; a short "slots as of {time}, not a
   reservation" note (BR-59). The default selected schedule is the first bookable one.
6. **Booking handoff:** unchanged URL (`/tours/{id}/book?scheduleId=`); a Guest goes to
   `/sign-in?returnUrl=<booking url>` (existing convention). `TourBookingView` additionally treats
   `bookable === false` as not selectable.
7. **BFF** (`app/api/tours/[id]/route.ts`): the id must be digits only (≤ 19 chars); otherwise respond with the same
   404 problem shape without calling the Backend. No query string is forwarded (already enforced by the sanitizer).
8. Accessibility: headings/landmarks kept; error and retry states are announced (`role="alert"`/`status`);
   schedule buttons keep names that include date and remaining slots; no new colour-only meaning.

## Acceptance criteria

1. A real Backend payload renders every section; a malformed payload shows the error state, never a partial page.
2. 404 → MSG65 state without a retry button; 5xx/network → MSG127 with Retry that re-requests.
3. `bookable=false` / `hasBookableSchedule=false` disables Book Now and shows the sold-out message (MSG65); Guest sees
   "Đăng nhập để đặt tour" and the link carries `returnUrl`.
4. Rating `count=0` shows MSG128; `count>0` shows the average and count, no invented reviews.
5. Search params are preserved by Back to results.
6. Production build contains no demo fixture path reachable without the explicit env flag (existing gate tests stay).
7. `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` pass.

## Risks / notes

- The sign-in page's handling of `returnUrl` is outside this UC (other screens already use the same parameter).
- Two published versions of the same tour can both be visible until the UC-35 publish flow supersedes the old one
  (reported separately); the page simply shows the id it was given.
