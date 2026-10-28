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
4. **Quy tắc demo/live** (thống nhất với spec):
   - Booking thật (có Backend ID, `isDemo === false`) → gọi `GET /api/v1/bookings/{id}/refund`,
     hiển thị trạng thái thật.
   - Booking demo (`isDemo === true`) → **không gọi API**, hiển thị `DemoRefundRecordCard`
     từ fixture, kèm nhãn "Demo data — not a live system status".
   - Không bao giờ diễn giải dữ liệu demo là tiến trình refund thật.
5. **Làm mới trạng thái**: nút "Refresh status" cho `Pending`, `Processing`, `RetryPending`.
   Không polling tự động (spec: "không polling tự động").
6. **Deletion**: `InitiateRefundDialog.tsx` + its test are removed in the same
   change (approved by developer), along with `isRefundable`, `onOpenRefundDialog`,
   `refundClarificationNotice`, and the now-dead `refundDialog.*` / `refundBtn` /
   `notRefundableTooltip` strings in `resources/en.ts`.
7. **Ngoài phạm vi plan này** (task dọn dẹp riêng, xem Ruling): `initiateBookingRefund`,
   `InitiateRefundPayload`, `InitiateRefundResult` vẫn còn trong service/types và đang được
   19 chỗ trong test gọi. Chỉ xóa sau khi cập nhật các test đó.

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

### Task 2: BFF proxy — ĐÃ CÓ SẴN, TÁI SỬ DỤNG (không tạo mới)
- [REUSE] `src/features/bookings/services/refundProgressProxy.ts`
  — `proxyGetBookingRefundProgress(request, bookingId)`, đã phục vụ cả Traveler lẫn
  TourOperator và đã có test `refundProgressProxy.test.ts`.
- Mã lỗi thực tế do proxy này trả: `FORBIDDEN` (403), `UNAUTHENTICATED` (401),
  `REFUND_NOT_FOUND` (404), `REFUND_UNAVAILABLE` (503).
- **Không được tạo `bookingRefundProxy.ts` hoặc bất kỳ proxy trùng nào.**

### Task 3: Route handler — ĐÃ CÓ SẴN, TÁI SỬ DỤNG (không tạo mới)
- [REUSE] `app/api/v1/bookings/[bookingId]/refund/route.ts`.
- **Không được tạo route `app/api/v1/bookings/[id]/refund/`**: Next.js không cho phép hai
  tên tham số động khác nhau tại cùng một vị trí URL (xem `tests/route-parameters.test.cjs`).

### Task 4: Client service function (test first)
- [NEW TEST] `src/features/operator/bookings/services/operatorBookingService.test.ts`
  — add cases for `getBookingRefundStatus`: 200 found, 404 not_applicable, 403, 401,
  network failure.
- [MODIFY] `src/features/operator/bookings/services/operatorBookingService.ts`
  - `getBookingRefundStatus(bookingId: string): Promise<GetBookingRefundStatusResult>`
  - Real `fetch('/api/v1/bookings/{id}/refund')` chỉ khi booking là booking thật
    (`isDemo === false`, có Backend ID). Không gọi API cho booking demo — xem
    "Quy tắc demo/live" ở đầu plan.
  - Validate payload `200 OK` trước khi dùng: kiểm tra `status` thuộc 7 giá trị cho phép,
    `refundAmount` là số hữu hạn, `bookingId`/`bookingCode`/`requestedAtUtc` đúng kiểu. Payload
    không hợp lệ trả `{ outcome: 'error', messageCode: 'MSG127' }`, không ép kiểu thẳng.

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

### Manual — lộ trình thật (không dùng nút hủy trên Operator UI)
Nút hủy trên Operator UI chỉ hoạt động với demo (`isCancellable` yêu cầu `isDemo`), nên
không dùng để tạo booking thật. Thay vào đó:
1. Start BE (`tools/run-local-api.ps1`) + FE (`npm run dev`).
2. Tạo booking thật đã thanh toán (Mock gateway) và hủy qua API
   `POST /api/v1/bookings/{id}/cancellation` (Idempotency-Key bắt buộc), hoặc dùng booking
   đã seed sẵn trong DB local.
3. Đăng nhập Operator sở hữu tour, mở booking thật đó (không dùng `?demo=1`): card hiển thị
   `Pending` → bấm "Refresh status" → `Processed` sau khi worker chạy (~vài giây, Mock).
4. Booking chưa thanh toán bị hủy (`PendingPayment`): card hiển thị
   "No refund record was found for this booking." (trung tính, không phải lỗi).
5. Mở `/partner/bookings?demo=1`, mở booking đã hủy có `refund` trong fixture: card hiển thị
   nhãn "Demo data", không gọi API (kiểm tra tab Network không có request
   `/api/v1/bookings/.../refund`).
6. Không có nút "Initiate Refund" ở bất kỳ đâu trong workspace.

Phương án thay thế nếu không có quyền truy cập tour thật: trang người dùng
`/bookings/{id}/refund` (Traveler), đăng nhập bằng traveler sở hữu booking đó.

---

## Ruling made during execution

**Task 2/3 (BFF proxy + route) were dropped and replaced.** `Capstone_FE/develop`
already contains a complete, tested implementation at the same URL —
`app/api/v1/bookings/[bookingId]/refund` + `src/features/bookings/services/
refundProgressProxy.ts` (Khánh, commits `18d0ee9`/`a592b8c`/`a11df61`), already
serving the Traveler-facing `/bookings/[id]/refund` page
(`RefundProgressPage.tsx`). This was missed during spec research. Discovered
only when the project's own `tests/route-parameters.test.cjs` failed on a
dynamic-segment name conflict (`[id]` vs `[bookingId]`) after Task 3 was
implemented.

**Ruling:** deleted the new duplicate route + proxy; `getBookingRefundStatus`
(Task 4) now calls the pre-existing endpoint instead (identical URL, already
authorizes both Traveler and TourOperator). Updated its error-code
expectations to match the existing proxy's actual codes (`FORBIDDEN`,
`REFUND_UNAVAILABLE`, `REFUND_NOT_FOUND`, `UNAUTHENTICATED`) rather than the
ones invented for the now-deleted proxy. Cost if this ruling is wrong: low —
the two proxies were functionally equivalent; the only risk was the error-code
string mapping, which is now verified against the existing proxy's own test
suite (`refundProgressProxy.test.ts`).

The Operator in-panel display (Tasks 5-7) is NOT redundant with the existing
`RefundProgressPage`: that page is a standalone, unauthenticated-redirect page
meant for direct navigation/sharing, not integrated into the Operator booking
workspace. This plan's value — seeing refund status inline while managing a
booking, without navigating away — stands unchanged.

## Final review (dispatched to a fresh Opus reviewer)

**Important #1 — fixed.** Demo mode (the only reachable path today, since UC-40
has no real list endpoint) showed "This cancellation did not produce a refund"
for every Cancelled booking, including the one with a demo refund record,
because demo `booking.id` values are non-numeric and always 404 against the
real endpoint. Fixed by skipping the live fetch entirely when `isDemo` and
rendering the fixture's own `booking.refund` via a new `DemoRefundRecordCard`.
Verified: `shows the demo fixture refund data for a Cancelled booking that has
one` RED→GREEN, suite 23/23 (component) and 2988/2988 (project).

**Important #2 — fixed.** AC8 test gaps (missing Pending/Processing cases,
under-asserting Processed/RetryPending tests, only one error code exercised)
closed in the same pass.

**Minors (deferred, not fixed):**
- Stale refund content can flash briefly on reopen/booking-switch before the
  effect clears it (cosmetic; `useLayoutEffect` or id-keyed state would close
  it).
- Any 404 — not just a Backend `REFUND_NOT_FOUND` — is treated as
  `not_applicable`; a malformed-route 404 would be mis-reported the same way.
- `bookingId` is not explicitly `encodeURIComponent`-wrapped in the client
  fetch (the shared proxy validates it server-side regardless).
- `initiateBookingRefund` / `InitiateRefundPayload` / `InitiateRefundResult`
  remain in `operatorBookingService.ts` / `bookingLifecycle.ts` with no UI
  caller — kept per the original plan's scope (it never asked for their
  removal), not because they're still needed.
- `REFUND_STATUS_STYLES` is `Record<string, string>` rather than
  `Record<RefundStatusValue, string>`.
- Loading state is text ("Loading refund status…"), not a spinner, despite
  spec Behavior §2 saying "small inline spinner".
- The spec's Component Architecture / Error Handling sections still describe
  the now-deleted duplicate proxy/route and its invented error codes; this
  plan's own "Ruling" section is the authoritative correction.
- Raw Backend error codes (e.g. `payment.refund.gateway_rejected`) are shown
  to operators verbatim, as the spec asked for.
- `BookingRefundStatusDto.bookingId` is `string` (matching `BookingDto.id`),
  while the Backend and spec use `number`; deliberate, but the doc comment
  overstates it as "field-for-field".

**Assessment after fix pass:** ready to merge.

## Second review (2026-10-29) — fixed

- Task 2/3 rewritten to say "reuse `refundProgressProxy.ts` / `[bookingId]` route",
  no longer instructing a new proxy/route to be created.
- Demo/live rule unified across spec and plan: demo never calls the API; real
  bookings always do.
- Manual verification rewritten: the Operator cancel button is demo-only
  (`isCancellable` requires `isDemo`), so the steps now cancel via the real API
  or use a seeded booking instead of the Operator UI's Cancel button.
- Point 7 (payload validation) implemented: `parseBookingRefundStatusDto()`
  validates every field of a 200 OK body before returning `'found'`; an
  unknown status, non-finite amount, or missing field now returns
  `{ outcome: 'error', messageCode: 'MSG127' }` instead of being cast through.
  Verified RED→GREEN with 4 new tests; full suite 136/136 (module),
  3047/3047 (project); build green.
- Point 5 (dead `initiateBookingRefund` code) remains deferred, as already
  scoped out of this plan in Technical Directive 7.

## Risks / Notes
- No automated test harness currently point at the real Backend from FE CI — manual
  verification step 3 above is the only end-to-end proof; this matches how UC-27
  (`tourBookingProxy.ts`) was verified per its own spec history.
- `ManualReview` display has no corresponding action anywhere yet (Admin
  completion screen is future work, flagged in the spec's Open Question).
