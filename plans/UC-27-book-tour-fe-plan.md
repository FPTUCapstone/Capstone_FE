# UC-27 Web Implementation Plan — Book Tour

**Platform:** Next.js / React
**Status:** Phase A may begin; Phase B is blocked until Backend contract approval

## Phase A — UI-first, development only

1. Audit the existing `app/tours/[id]/book` and `src/features/bookings` implementation. Refactor it into the single approved route rather than creating a second booking module.
2. Define shared browser DTOs using string `tourId`, `tourScheduleId` and `bookingId`.
3. Add `TourDetailSource` and `BookingQuoteSource` interfaces. Implement a demo source with a selected departure and read-only quote under the existing explicit fixture guard.
4. Build accessible participant/voucher/summary/confirmation components using the approved field set, including required `participantType` selection.
5. Show Demo mode clearly. Keep confirm disabled or show an explicit “Live booking unavailable” state in demo; do not create fixture bookings, local reservations or payment links.

**Tests:** guard is false in production; no mutation endpoint is called in demo; form labels, focus and loading/error states work.

## Phase B — contract-first live integration

1. Add an authenticated service client for quote and create. It must use the project proxy/auth layer instead of direct unauthenticated `fetch` calls.
2. Send `Idempotency-Key` on create; retain the generated UUID only for the in-flight retry, never in persistent browser storage.
3. Derive participant-type counts for the quote request and render the server `BookingQuote.priceBreakdown` without computing amounts. Debounce quote requests and cancel stale requests.
4. Handle first `201`, duplicate-retry `200`, validation, capacity/voucher conflict, 401 refresh/session outcome and 403 through the approved error map.
5. Replace/remove the legacy `bookingApi.ts` behaviour that posts to `/api/bookings`, computes demo amounts, or treats unsupported API responses as a successful booking path.

**Tests:** request header/body, no client arithmetic, quote race cancellation, idempotent retry, each approved error map and no fixture fallback on API failure.

## Phase C — created booking handoff

1. Render booking code, `PendingPayment`, total and `paymentExpiresAt` from create response.
2. Provide **Pay now** as an explicit navigation handoff to UC-28; do not initialize a gateway from UC-27.
3. When the displayed expiry has passed, refresh status rather than setting final status locally.

**Tests:** no automatic payment redirect; expired screen refreshes state; navigation preserves the created booking ID.

## Backend dependencies

- UC-26 supplies public tour detail and departure selection.
- UC-27 BE supplies approved OpenAPI for quote/create and the common error envelope.
- UC-28 supplies the payment entry route/contract.

## Definition of done

- Only one Traveler booking route remains.
- UI-first fixtures meet the explicit demo policy.
- Live UI uses approved BE contract, sends idempotency key and trusts server price/expiry.
- Accessibility, responsive behavior and API/error tests pass.
- A manual UAT covers quote, create, idempotent retry, capacity conflict, voucher rejection and handoff to UC-28.
