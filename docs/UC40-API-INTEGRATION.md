# UC-40 View Customer Bookings — real API integration

## Scope

The Tour Operator Customer Bookings screen (`SHARED_WEB_MOBILE`; the SRS documents the Next.js screen, Report 3
§3.8.4.1) reads the Backend UC-40 API instead of the old demo-only data and the `PENDING_BE_INTEGRATION` stub.
Spec: `specs/UC-40-view-customer-bookings-web-spec.md`. Plan: `plans/UC-40-view-customer-bookings-web-plan.md`.
Backend contract: `Capstone_BE/docs/UC-40-api-contract.md` (BE branch `feature/uc40-view-customer-bookings`,
not merged when this was written).

Only **UC-40 (list and detail, read-only)** is integrated. The Cancel (UC-41) and Refund (UC-42) buttons stay
disabled outside demo mode with the "locked pending Backend API integration" tooltip. Check-in is recorded by
UC-43 (mobile, not built), so every booking reports `NotCheckedIn` until it ships.

## Route

| Page | Reads |
| --- | --- |
| `/partner/bookings` | `GET /api/v1/operator/bookings` (list, filters, summary, paging), `GET /api/v1/operator/bookings/{bookingId}` (drawer), `GET /api/v1/operator/revenue/tours` (tour filter options) |

## Data path

```text
Browser (OperatorBookingListView / BookingDetailPanel)
  -> operatorBookingService.ts      GET /api/operator/bookings?...
                                    GET /api/operator/bookings/{id}
                                    GET /api/operator/revenue/tours        (existing UC-44 route)
  -> Next route handlers            app/api/operator/bookings/route.ts
                                    app/api/operator/bookings/[bookingId]/route.ts
  -> operatorBookingProxy.ts        refresh cookie -> operator access token -> Backend
  -> Backend                        /api/v1/operator/bookings[...]
```

- The browser never sees the access token or the Backend URL. Every BFF answer is `Cache-Control: no-store`.
- The BFF is GET-only. It refuses a session that is not a Tour Operator (`401 UNAUTHENTICATED`).
- The list route forwards only `tourId`, `scheduleId`, `status`, `paymentStatus`, `departureFrom`, `departureTo`,
  `keyword`, `pageNumber`, `pageSize`; every other query key is dropped and empty values are removed.
- The detail route accepts only a digit-only `bookingId`; anything else is `400 INVALID_BOOKING_ID` without
  calling the Backend.
- A Backend body that is not JSON is never passed through (`502 MSG127`); an unreachable Backend is `503 MSG127`.
- `bookingApiParsers.ts` validates every live body against the contract (ids as digit strings, enums, money,
  ISO timestamps) and rebuilds it field by field, so participant ID documents, gateway payloads and any other
  field the contract does not return can never reach the UI. A body that does not match is a system failure
  (MSG127).

## Filters (browser → BFF)

| Screen filter | Query |
| --- | --- |
| Tour package (`ALL` omitted) | `tourId` |
| Booking status (`ALL` omitted) | `status` (`PendingPayment`, `Confirmed`, `Cancelled`, `Completed`, `Expired`) |
| Departure from / to (`YYYY-MM-DD`) | `departureFrom` / `departureTo` (Vietnam-time days, inclusive) |
| Search | `keyword` (booking code, booker name or booker e-mail) |
| Page | `pageNumber`, `pageSize` (20, CR-01) |

Filters are drafts until [Apply Filter] (CR-02); applying them returns to page 1.

## Screen behaviour

| Area | Behaviour |
| --- | --- |
| List | Booking code, tour, departure `dd/MM/yyyy` (Asia/Ho_Chi_Minh), booker name and e-mail, participants, total, status (incl. `Expired`), check-in. Summary cards show the BE `summary` as returned: `totalBookings` counts every status, participants and amount count `Confirmed` + `Completed` only. |
| Tour filter | Options come from the owned-tour list. If that call fails the select is disabled with only "All Tour Packages" and the list keeps working. |
| Drawer | Opens at once with the list-row basics and a skeleton, then shows the detail: participants (name and type), booker contact incl. phone, tour and meeting point, e-ticket and check-in time, payment (gateway, transaction reference, amount, time; read-only), paid amount, subtotal, coupon, cancellation info. `ticket`, `payment` and `coupon` being `null` hides their blocks. Only the latest request updates the drawer (a slow answer for a previous row, or for a closed drawer, is ignored). |
| Cancel / Refund | Disabled in live mode (locked tooltip). In demo mode Cancel follows `canCancel`; the tooltip says why when `cancelBlockedReason` is `CheckedIn` or `InvalidStatus`. |

## Messages

| Situation | Message |
| --- | --- |
| 401, 403 (`operator_tour.access_required`, `operator_booking.forbidden`), detail 404 (`operator_booking.not_found`) | MSG126 |
| `departureFrom` after `departureTo` (checked in the browser first, then by the BE `operator_booking.invalid_date_range`) | MSG31 ("End date must be on or after the start date.") |
| Empty result | MSG128 |
| Network error, 5xx, `operator_booking.invalid_filter`, unparseable or non-contract body | MSG127, with [Retry] for the list and the drawer |

MSG31 is used for the date range because MSG29 in the SRS catalogue is the geographic-coordinate message (the
UC-44 spec made the same choice). Strings live in `src/features/operator/bookings/resources/en.ts` and
`types/bookingLifecycle.ts`.

## Demo mode

`NODE_ENV !== 'production'` and `NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true`, plus `?demo=1`, serves the fixtures in
`data/operatorBookingDemoFixtures.ts` (reshaped to the BE contract) and the UC-41/UC-42 demo flows. Outside demo
mode no fixture is ever used. The old "cancellation deadline passed" demo case was removed: UC-41 as built has no
operator time window.

## Verification status

- Covered by automated tests: the parsers (contract examples and malformed bodies), the BFF proxy and both route
  handlers (auth, role, query whitelist, id validation, status passthrough, failures), the live service (query
  mapping and every error row), and the list view and drawer behaviour with `fetch` mocked to the BFF routes.
- **Not verified against a running Backend.** The BE UC-40 branch was not merged or deployed when this was
  written, so no end-to-end run was made.

## Local check against the Backend

Run the BE branch `feature/uc40-view-customer-bookings` with `TRIPMATE_API_BASE_URL` pointing at it, sign in as an
approved Tour Operator that owns tours with bookings, and open `/partner/bookings`:

1. The list shows only your own bookings; the summary matches the filters; `Expired` appears in the status filter.
2. Search by booking code, booker name and booker e-mail; set a departure range; page through (20 per page).
3. An inverted range shows MSG31 and sends no request.
4. Open a booking: the drawer shows the participants without ID document data, the payment gateway and reference,
   and the cancellation state; the Cancel and Refund buttons stay disabled.
5. Sign in as a Traveler or an unapproved operator: the route guard redirects, and a direct BFF call answers 401.
