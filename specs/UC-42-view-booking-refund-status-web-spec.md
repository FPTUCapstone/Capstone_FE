# UC-42 View Booking Refund Status — Frontend Spec

## Status

Approved — 2026-10-29. Chấp thuận bởi chủ phụ trách task (xác nhận trong phiên làm việc). Đã được cập nhật theo review ngày 2026-10-29: đổi tên file/route thành code thực tế, sửa tiêu chí demo/live, đổi cách hiển thị 404, và bổ sung nút làm mới trạng thái.

## Background / Why this spec exists

The original SRS describes **UC-42 "Initiate Booking Refund"** as a Tour Operator
action: Operator explicitly triggers a refund for an eligible cancelled booking.
An existing demo-mode implementation (`InitiateRefundDialog.tsx`,
`initiateBookingRefund()` in `operatorBookingService.ts`) was built against that
literal reading, gated behind `SRS_INTERNAL_CONFLICT_UC41_REFUND_TRIGGER` comments
because the team flagged a conflict with the Backend's actual behavior.

That conflict is now resolved against the real Backend (`Capstone_BE`, `develop`):
- `CancelBookingCommandHandler` (UC-41) creates the `Refund` record **automatically**
  in the same transaction as cancellation, whenever a verified payment exists.
- `RefundProcessor` + `RefundProcessingBackgroundService` automatically submit the
  refund to the payment gateway and update its status — no human action required.
- This automatic behavior matches SRS **UC-71 "Process Automatic Refund"**, not
  UC-42. Verified by manual testing against the running Backend (see conversation
  history): cancelling a Confirmed booking immediately produces a `Pending` refund
  that becomes `Processed` within seconds, with no operator action in between.

**Decision (confirmed by the developer):** there is no "Initiate Refund" action to
build. This spec repurposes the UC-42 slot in the Operator Booking workspace into a
**read-only refund status tracker** reflecting UC-71's automatic result. The
existing "Initiate Refund" demo UI is removed as dead code.

## Scope

**In scope:**
- Wire the already-built "Refund Record" panel inside `BookingDetailPanel.tsx` to
  the real Backend via a new authenticated BFF route, given a `bookingId` is
  already available on the `booking` object passed into the panel.
- Cover the full real refund status lifecycle: `Pending`, `Processing`,
  `Processed`, `RetryPending`, `Failed`, `ManualReview`, `Rejected`.
- Remove the "Initiate Refund (UC-42)" button, `InitiateRefundDialog.tsx`, and the
  `refundClarificationNotice` block — all dead weight once refund is automatic.

**Out of scope (explicitly deferred):**
- UC-40 "View Customer Bookings" (the Operator booking **list**) stays on demo
  fixtures. The Backend has no `GET /operator/bookings`-style endpoint yet,
  so there is no real source of `bookingId`s for Operators outside demo mode.
  This spec assumes a `bookingId` is already present on the `booking` object,
  however it got there.
- UC-41 "Cancel Customer Booking" (the Cancel dialog/action) — being built by
  another engineer on the team; not touched here beyond removing the
  now-obsolete `refundFollowUpRequired` / clarification-notice wiring that
  only existed to bridge to the old manual-refund design.
- Any change to the Traveler-side `TripCard.tsx` refund display (already
  functioning, not part of this task).

## Actor

- **Tour Operator** (viewing refund status for a booking on their own tour).
  The Backend endpoint also allows **Traveler**, but the Traveler UI already has
  its own refund display (`TripCard.tsx`) and is not touched by this spec.

---

## API Contract

### Endpoint (existing, already implemented and manually verified on `develop`)

```http
GET /api/v1/bookings/{bookingId}/refund
Authorization: Bearer <JWT> (role Traveler or TourOperator; ownership enforced server-side)
```

Responses:
- `200 OK` — refund record found and visible to the caller.
- `404 Not Found` (`booking.cancellation.not_found`) — no refund record exists for
  this booking (e.g. it was a `PendingPayment` cancellation with 0% refund, so no
  `Refund` entity was ever created). This is a **normal, non-error** state for the
  UI: it means "not applicable", not a failure.
- `403 Forbidden` (`booking.cancellation.forbidden`) — caller is not the booking's
  traveler or the tour's operator.
- `401 Unauthorized` — session expired.

Backend response shape (`BookingRefundProgressResponse`):

```ts
{
  bookingId: number;
  bookingCode: string;
  refundAmount: number;
  status: 'Pending' | 'Processing' | 'Processed' | 'RetryPending' | 'Failed' | 'ManualReview' | 'Rejected';
  gatewayReference: string | null;
  attemptCount: number;
  requestedAtUtc: string;
  processedAtUtc: string | null;
  nextAttemptAtUtc: string | null;
  lastErrorCode: string | null;
}
```

---

## Component Architecture

```text
Capstone_FE/
├── app/api/v1/bookings/[bookingId]/refund/
│   └── route.ts                                  <-- REUSED (đã có sẵn từ Khánh, không tạo mới)
├── src/features/bookings/services/
│   └── refundProgressProxy.ts                     <-- REUSED (đã có sẵn, không tạo mới)
│       - accepts role Traveler OR TourOperator
│       - reads tripmate_refresh cookie -> POST /api/v1/auth/web/refresh -> accessToken
│       - calls fetchBackend(`/api/v1/bookings/${bookingId}/refund`, { Authorization })
│       - maps Backend errors to a safe allowlist (never leaks raw Backend messages)
│       - Mã lỗi thực tế: FORBIDDEN, UNAUTHENTICATED, REFUND_NOT_FOUND, REFUND_UNAVAILABLE
├── src/features/operator/bookings/
│   ├── services/operatorBookingService.ts
│   │   └── getBookingRefundStatus(bookingId): Promise<BookingRefundStatusResult>   <-- NEW client function
│   │       - real fetch('/api/v1/bookings/{id}/refund') — always real, not demo-gated
│   │         (this call has nothing to do with the UC-40 list/demo problem)
│   ├── types/bookingLifecycle.ts
│   │   └── BookingRefundStatusDto                 <-- NEW type, mirrors Backend response exactly
│   │       (existing demo-only `BookingRefundDto` is left untouched — still used by
│   │        the UC-40/41 demo fixtures and tests; the two types are NOT merged)
│   ├── components/
│   │   ├── BookingDetailPanel.tsx                 <-- MODIFIED: live refund fetch + new display block
│   │   ├── BookingDetailPanel.test.tsx            <-- MODIFIED: new tests for the live states
│   │   ├── InitiateRefundDialog.tsx               <-- DELETED (dead code, see Decision above)
│   │   └── InitiateRefundDialog.test.tsx          <-- DELETED
│   └── resources/en.ts                            <-- MODIFIED: remove refundDialog/refundBtn/
│                                                       refundClarificationNotice strings, add
│                                                       status-label strings for the 7 real statuses
```

---

## Behavior

1. `BookingDetailPanel` fetches refund status **only when** `booking.status === 'Cancelled'`,
   the panel is open, and the booking is **not demo** (`isDemo === false`), via
   `getBookingRefundStatus(booking.id)`, on open. Khi trạng thái là `Pending`, `Processing`
   hoặc `RetryPending`, card hiển thị nút **"Làm mới trạng thái"** (Refresh) để Operator gọi lại
   API mà không cần đóng–mở drawer. Không polling tự động.
2. While loading: show a small inline spinner in place of the current static
   "Refund Record" block.
3. On `404` (no refund record): render a neutral note — "No refund record was found
   for this booking." — không khẳng định lý do. 404 có thể do booking đã hủy mà không phát
   sinh hoàn tiền, hoặc do booking ID không tồn tại ở Backend; UI không phân biệt được hai
   trường hợp này nên không được ghi "không áp dụng". Không dùng style lỗi/đỏ.
4. **Demo booking** (`isDemo === true`): không gọi API. Hiển thị `DemoRefundRecordCard` từ
   `booking.refund` của fixture, kèm dòng chú thích rõ ràng: "Dữ liệu demo — không phải trạng
   thái từ hệ thống." Không được hiển thị như thể đây là trạng thái thật của Backend.
5. On success (booking thật), render the "Refund Record" card (reusing existing visual style) with:
   - Status pill — one of 7 states, each with a distinct label/color:
     - `Pending` / `RetryPending` — amber, "Queued for processing"
     - `Processing` — blue, "Processing"
     - `Processed` — teal/green, "Refunded" + `gatewayReference` + `processedAtUtc`
     - `Failed` — rose, "Refund failed" + `lastErrorCode`
     - `ManualReview` — purple/amber, "Awaiting manual settlement". Admin UI chưa có;
       BE endpoint `complete-manual` đã tồn tại. Màn Admin nằm ngoài phạm vi spec này.
     - `Rejected` — rose, "Refund rejected" + `lastErrorCode`
   - `refundAmount`, `attemptCount`, `requestedAtUtc`, and (if present)
     `nextAttemptAtUtc` for `RetryPending`.
6. On `403`/`401`/5xx: render the existing generic error pattern already used
   elsewhere in this feature (`MSG127`-style), not a crash.
7. The "Initiate Refund (UC-42)" button and its dialog are removed entirely —
   there is nothing left to trigger.
8. `BookingDetailPanel`'s `isRefundable` eligibility flag and the
   `onOpenRefundDialog` prop are removed; `OperatorBookingListView.tsx` no longer
   renders `InitiateRefundDialog`.

---

## Error Handling (new BFF-level safe codes)

| Backend errorCode | Mapped client code | Notes |
|---|---|---|
| `booking.cancellation.not_found` | treated as "no refund" (not an error) | 404 is expected/normal here |
| Backend 403 | `FORBIDDEN` | 403 (tên mã thực tế trong `refundProgressProxy.ts`) |
| Backend 404 | `REFUND_NOT_FOUND` | Hiển thị trung tính, không phải lỗi (xem Behavior §3) |
| Backend 5xx / lỗi mạng | `REFUND_UNAVAILABLE` | Coi như lỗi tạm thời |
| (no auth / expired session) | `UNAUTHENTICATED` | 401, same pattern as `tourBookingProxy.ts` |
| anything else | `MSG127` | generic failure, matches existing convention |

---

## Acceptance Criteria

1. **Booking thật** (`isDemo === false`): mở panel một booking `Cancelled` gọi
   `GET /api/v1/bookings/{bookingId}/refund` và hiển thị trạng thái thật từ Backend.
2. **Booking demo** (`isDemo === true`): không gọi API; hiển thị fixture với nhãn
   "Dữ liệu demo". Không có trường hợp nào hiển thị dữ liệu demo như trạng thái thật.
3. All 7 real Backend statuses render with a distinct, correctly-labeled pill and
   the fields relevant to that status (see Behavior §5).
4. A `Cancelled` booking with **no** refund record (404) shows the neutral
   "No refund record was found" note, not an error state.
5. Khi trạng thái là `Pending`, `Processing` hoặc `RetryPending`, nút "Làm mới trạng thái"
   gọi lại API và cập nhật card.
6. There is no "Initiate Refund" button, dialog, or clarification-notice banner
   anywhere in the Operator Booking workspace after this change.
7. `isRefundable` logic, `onOpenRefundDialog` prop, and `InitiateRefundDialog`
   component + test file no longer exist in the codebase.
8. UC-40 (list) and UC-41 (cancel dialog) demo-mode behavior is unchanged —
   verified by the existing `OperatorBookingListView.test.tsx` /
   `operatorBookingService.test.ts` suites continuing to pass without modification
   to their demo-mode assertions.
7. `npm run lint && npm run typecheck && npm run build` pass.
8. New unit tests cover: loading, each of the 7 statuses, the 404-not-applicable
   case, and the 403/401/5xx error paths.

---

## Open Question Carried Forward (not blocking this spec)

Admin UI chưa có; BE endpoint `POST /api/v1/admin/refunds/{refundId}/complete-manual` đã
tồn tại. `ManualReview` chỉ được xử lý bởi Administrator qua endpoint này. Spec này chỉ
**hiển thị** trạng thái đó; màn Admin là công việc riêng, nằm ngoài spec.
