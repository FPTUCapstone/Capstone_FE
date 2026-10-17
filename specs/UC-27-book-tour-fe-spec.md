# UC-27 Web Specification — Book Tour

**Platform:** Next.js / React
**Status:** Draft — UI-first delivery allowed; quote/create API exists, while the live entry remains blocked by UC-26 tour detail and cross-platform OpenAPI/error-map approval
**Sources:** SRS §3.5.4 and `UC-27-book-tour-be-spec.md`

## 1. Scope

UC-27 lets an authenticated Traveler select a departure, provide participant information, obtain a server quote and create a `PendingPayment` booking. It ends after showing the created booking and its server-issued expiry.

UC-28 starts only when the user selects **Pay now**. UC-27 does not initialize payment, display a payment gateway, issue a ticket, calculate price, reserve capacity locally, or persist a booking draft in browser storage.

## 2. Entry, route and identifiers

The route is:

```text
/tours/[tourId]/book?scheduleId=[tourScheduleId]
```

`tourId` identifies the tour; route query `scheduleId` identifies its dated departure and becomes JSON field `tourScheduleId` in quote/create DTOs. Both are string IDs in browser DTOs. The page rejects a missing or inconsistent departure and returns to tour detail.

The entry comes from UC-26’s public tour-detail/departure selection. Until UC-26 is live, a development-only fixture may render a labelled **Demo** departure; it must not call create booking or payment.

## 3. Form and data boundary

The form contains a participant list, optional voucher code and lead-contact fields represented by the first participant. Required participant fields are only those approved in the Backend contract:

- `fullName` and required `participantType` (`Adult`, `Child`, or `Infant`)
- optional `phoneNumber`, `email`, `idDocumentType`, `idDocumentNumber`, `nationality`

DOB, an age rule, a separate contact table/form contract and arbitrary participant limits are out of scope until product and BE approve them. Client validation is UX-only and mirrors the approved request shape.

## 4. Quote and create flow

1. The page receives the selected tour/departure.
2. A participant-type count or voucher change calls `POST /api/v1/traveler/tour-bookings/quote` through the existing authenticated API/proxy layer.
3. The UI displays each per-type `priceBreakdown` line, subtotal, discount, total, currency and remaining slots **exactly as returned**. It performs no arithmetic.
4. The Traveler reviews a confirmation dialog and confirms once.
5. The client generates a UUID, sends it as `Idempotency-Key`, and calls `POST /api/v1/traveler/tour-bookings`.
6. On `201` or idempotent `200`, show booking code, `PendingPayment` and `paymentExpiresAt`. Clear sensitive document input from form state.
7. The user may select **Pay now**, which navigates to the UC-28 entry point. UC-27 does not fetch booking status after expiry because no approved authenticated booking-detail/status endpoint exists yet; it displays the server-issued expiry and never assigns a final status locally. UC-28 or Booking Details owns that future endpoint.

A quote never promises capacity. Create may return a changed quote or a capacity/voucher failure and the page must let the user adjust and request a fresh quote.

## 5. Development fixture policy

A fixture is permitted only when all are true:

- non-production environment;
- `NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true'`;
- an explicit demo route/query switch accepted by the project’s existing guard.

The fixture must be isolated behind a repository interface and visibly labelled Demo. It provides a static Tour Detail/departure and read-only `BookingQuote`; it must not calculate totals, mutate browser storage, create a booking, reserve a seat, or start payment. Production always uses the real API and never falls back to fixtures.

## 6. Failures and accessibility

Use the Backend’s existing error envelope and error-code mapping after it is approved. The client treats 401 through the existing refresh/session flow and shows a role-safe 403 message. It provides inline recoverable errors for quote/create failures, disables duplicate submit while a request is active, and announces errors/status with `aria-live`.

The confirmation dialog must retain keyboard focus, expose an accessible title/description and return focus to the initiating button when dismissed.

## 7. Acceptance criteria

- One route and one booking feature implementation exist; the older `/tours/[id]/book` flow is refactored or explicitly replaced, never run in parallel.
- IDs, request fields, response fields, idempotency behaviour and error handling match approved OpenAPI.
- Amounts and expiry come only from Backend responses.
- Success stops at `PendingPayment`; payment is user-initiated in UC-28.
- Demo is visibly labelled, explicitly gated, and unavailable in production.
