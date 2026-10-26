# Implementation Plan — UC-42 Frontend: View Booking Refund Status

## Overview
Wires the existing "Refund Record" panel in the Operator Booking workspace to the
real Backend (`GET /api/v1/bookings/{bookingId}/refund`), replacing the demo-only
"Initiate Refund" action with a read-only status tracker, per
[`specs/UC-42-view-booking-refund-status-web-spec.md`](specs/UC-42-view-booking-refund-status-web-spec.md).

---

## Technical Directives

1. **BFF proxy pattern**: mirror `tourBookingProxy.ts` exactly — server-only file,
   `tripmate_refresh` cookie -> `POST /api/v1/auth/web/refresh` -> Bearer token ->
   `fetchBackend(...)`. The one deviation: accept role `Traveler` **or**
   `TourOperator` (the existing proxy only accepts `Traveler`).
2. **Type separation**: new `BookingRefundStatusDto` type, mirroring
   `BookingRefundProgressResponse` field-for-field. The existing demo-only
   `BookingRefundDto` is untouched (still backs UC-40/41 demo fixtures/tests).
3. **404 is not an error**: the client service returns a discriminated result
   (`{ found: false }` vs `{ found: true, data }`), never throws/rejects on 404.
4. **No polling**: fetch once per panel-open when `booking.status === 'Cancelled'`.
5. **Deletion**: `InitiateRefundDialog.tsx` + its test are removed in the same
   change (approved by developer), along with `isRefundable`, `onOpenRefundDialog`,
   `refundClarificationNotice`, and the now-dead `refundDialog.*` / `refundBtn` /
   `notRefundableTooltip` strings in `resources/en.ts`.

---

## Proposed Component Changes (atomic tasks, TDD: test first, then implement)

### Task 1: Types
- [MODIFY] `src/features/operator/bookings/types/bookingLifecycle.ts`
  - Add `BookingRefundStatusDto` (bookingId, bookingCode, refundAmount, status,
    gatewayReference, attemptCount, requestedAtUtc, processedAtUtc,
    nextAttemptAtUtc, lastErrorCode) and `RefundStatusValue` union of the 7 real
    statuses.
  - Add `GetBookingRefundStatusResult` discriminated union:
    `{ outcome: 'found'; data: BookingRefundStatusDto }
     | { outcome: 'not_applicable' }
     | { outcome: 'error'; messageCode: string }`.

### Task 2: Server-only BFF proxy (no test file — mirrors untested `tourBookingProxy.ts`)
- [NEW] `src/features/bookings/services/bookingRefundProxy.ts`
  - `proxyGetBookingRefundStatus(request: Request, bookingId: string): Promise<Response>`
  - Role check accepts `Traveler` or `TourOperator`.
  - Maps Backend `booking.cancellation.not_found` -> `404` passthrough (route/client
    treats this as "not_applicable", not a thrown error).
  - Maps `booking.cancellation.forbidden` -> `403` `{ errorCode: 'REFUND_STATUS_FORBIDDEN' }`.
  - No session / expired -> `401` `{ errorCode: 'UNAUTHENTICATED' }`.
  - Anything else -> `503` `{ errorCode: 'MSG127' }`.

### Task 3: Route handler
- [NEW] `app/api/v1/bookings/[id]/refund/route.ts`
  - `GET` delegates to `proxyGetBookingRefundStatus`, same shape as
    `app/api/v1/bookings/[id]/review/route.ts`.

### Task 4: Client service function (test first)
- [NEW TEST] `src/features/operator/bookings/services/operatorBookingService.test.ts`
  — add cases for `getBookingRefundStatus`: 200 found, 404 not_applicable, 403, 401,
  network failure.
- [MODIFY] `src/features/operator/bookings/services/operatorBookingService.ts`
  - `getBookingRefundStatus(bookingId: string): Promise<GetBookingRefundStatusResult>`
  - Real `fetch('/api/v1/bookings/{id}/refund')`, always real (not gated by
    `isDemo` — this call is independent of the UC-40 demo problem).

### Task 5: UI — remove dead Initiate-Refund code (test first: update, then delete)
- [MODIFY TEST] `src/features/operator/bookings/components/BookingDetailPanel.test.tsx`
  — remove/replace assertions referencing the old "Initiate Refund" button,
  `isRefundable`, `onOpenRefundDialog`.
- [DELETE] `src/features/operator/bookings/components/InitiateRefundDialog.tsx`
- [DELETE] `src/features/operator/bookings/components/InitiateRefundDialog.test.tsx`
- [MODIFY] `src/features/operator/bookings/components/OperatorBookingListView.tsx`
  — remove `InitiateRefundDialog` render + its open/close state + the
  `onOpenRefundDialog` prop passed to `BookingDetailPanel`.

### Task 6: UI — live refund status (test first)
- [MODIFY TEST] `src/features/operator/bookings/components/BookingDetailPanel.test.tsx`
  — add cases: loading spinner, each of the 7 statuses rendered with correct
  label/fields, `not_applicable` neutral note, 403/401/5xx error note.
- [MODIFY] `src/features/operator/bookings/components/BookingDetailPanel.tsx`
  - Remove `isRefundable`, `onOpenRefundDialog` prop, the Initiate-Refund button,
    the static `booking.refund` block, and the `refundClarificationNotice` block.
  - Add `useEffect` (on open + `booking.status === 'Cancelled'`) calling
    `getBookingRefundStatus(booking.id)`; local `loading` / result state.
  - Render: spinner while loading; status-pill card (7 states, see spec §Behavior
    4) on `found`; neutral note on `not_applicable`; generic error note on `error`.

### Task 7: Strings
- [MODIFY] `src/features/operator/bookings/resources/en.ts`
  - Remove: `refundDialog.*`, `refundBtn`, `notRefundableTooltip`,
    `refundClarificationNotice`.
  - Add: 7 status labels + `refundNotApplicableNote` + `refundStatusErrorNote`.

---

## Verification Plan

### Automated
- `npm run lint`
- `npm run typecheck`
- `npm test` (Vitest — all new/modified suites above, plus confirm
  `OperatorBookingListView.test.tsx` and the demo-mode assertions in
  `operatorBookingService.test.ts` still pass unmodified)
- `npm run build`

### Manual (against the running local Backend, Mock payment gateway)
1. Start BE (`tools/run-local-api.ps1`) + FE (`npm run dev`).
2. Cancel a `Confirmed` booking as Tour Operator via the existing Cancel dialog
   (real API, UC-41 — already wired by teammate).
3. Reopen the booking's detail panel: confirm refund status shows `Pending`
   immediately, then `Processed` after the background sweep runs (~seconds,
   Mock gateway) on a re-open.
4. Cancel a `PendingPayment` booking (no payment yet): confirm detail panel shows
   the "not applicable" note, not an error.
5. Confirm no "Initiate Refund" button/dialog exists anywhere in the workspace.

---

## Risks / Notes
- No automated test harness currently point at the real Backend from FE CI — manual
  verification step 3 above is the only end-to-end proof; this matches how UC-27
  (`tourBookingProxy.ts`) was verified per its own spec history.
- `ManualReview` display has no corresponding action anywhere yet (Admin
  completion screen is future work, flagged in the spec's Open Question).
