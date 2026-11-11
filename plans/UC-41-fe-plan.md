# UC-41 Cancel Tour Booking — FE Implementation Plan (v2, sau rà soát)

Spec: `specs/UC-41-fe-spec.md`
Nhánh: `feature/linhnv-uc41-cancel-booking-72h` (worktree `Capstone_FE-uc41`)

Hợp đồng BE đã đối chiếu với code:
- Preview `GET /api/v1/bookings/{id}/cancellation-preview` trả: `canCancel`, `blockingReasonCode`, `blockingReason`, `estimatedRefundAmount`, `refundStatus`, `bookingStatus`, `paymentStatus`, `tourTitle`, `departureAtUtc`, `quantity`, `totalAmount`.
- Hủy `POST /api/v1/bookings/{id}/cancellation`: header `Idempotency-Key` (GUID), body `reasonCategory` (tối đa 64 ký tự), `reasonDetail` (tối đa 300), `confirmed`. BE không giới hạn giá trị của `reasonCategory`, chỉ giới hạn độ dài.

Mỗi task: viết test trước (đỏ), triển khai (xanh), refactor. Chạy test của task đó trước khi sang task kế tiếp.

## Các task

1. **T1 — Proxy và route BFF.**
   - Thêm hàm proxy trong `src/features/bookings/services/cancellationProxy.ts` (cùng mẫu `refundProgressProxy.ts`): `proxyPostBookingCancellation` và `proxyGetBookingCancellationPreview`. Chuyển tiếp `Idempotency-Key` và body.
   - Thêm route mỏng: `app/api/v1/bookings/[bookingId]/cancellation/route.ts` (POST) và `.../cancellation-preview/route.ts` (GET), có `export const dynamic = "force-dynamic"`, như route `refund`.
   - Test: chuyển tiếp đúng header và body; không lộ lỗi thô của BE; từ chối khi thiếu hoặc sai `Idempotency-Key`.

2. **T2 — Client gọi BFF và Operator.**
   - Thêm hàm gọi BFF (preview và hủy) trong `src/features/bookings/services/`, dùng chung cho Traveler và Operator.
   - Sửa `cancelCustomerBooking` trong `operatorBookingService.ts`: bỏ nhánh demo, ánh xạ `reasonType → reasonCategory`, giữ kiểm tra `reasonDetail` không rỗng (BR-106).
   - Test: ánh xạ đúng; lý do rỗng bị chặn phía client; lỗi BE được chuyển thành thông báo tạm.

3. **T3 — Dialog hủy của Traveler.**
   - Component mới trong `src/features/bookings/components/`: hiển thị preview (mức hoàn, trạng thái Pending), nút xác nhận.
   - Khi `blockingReasonCode = booking.cancellation.confirmation_required`: checkbox xác nhận bắt buộc, gửi `confirmed = true`.
   - Idempotency-Key là GUID mới khi mở dialog, giữ nguyên khi bấm lại cùng một lần hủy.
   - Test: mức >0 không cần checkbox; mức 0% nút bị khóa cho đến khi tick; sau khi hủy hiển thị Cancelled và Pending.

4. **T4 — Gắn nút vào trang ticket.**
   - Thêm nút "Hủy booking" vào `app/bookings/[id]/ticket/page.tsx` (qua component `BookingTicketPage.tsx`), chỉ hiện khi booking còn hủy được.
   - Test: nút ẩn với booking đã hủy hoặc đã hoàn tất; hiện với booking Confirmed.

5. **T5 — Thông báo tạm.**
   - Chuỗi hiển thị tạm khai báo trong file resources của feature, không viết cứng trong component.
   - Ghi chú rõ là chuỗi tạm, chờ Lead/PO gán MSG chính thức.

6. **T6 — Xác minh.**
   - `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
   - Chạy dev server với BE nhánh UC-41, hủy thử cả hai luồng (mức >0 và mức 0% có xác nhận), chụp kết quả.

## Ngoài phạm vi

- Refund (UC-42, UC-67) và trang `app/bookings/[id]/refund`.
- Mobile.
- Thay đổi quy tắc BE.

## Rủi ro

- `operatorBookingService.ts` có dữ liệu demo dùng chung với các hàm khác. Chỉ bỏ nhánh demo của `cancelCustomerBooking`, không đụng dữ liệu demo của hàm khác.
- Operator dialog gửi `reasonType` với bốn giá trị (`CUSTOMER_REQUEST`, `TOUR_ITINERARY_CHANGE`, `FORCE_MAJEURE`, `OTHER`). BE chấp nhận chuỗi bất kỳ không quá 64 ký tự, nên ánh xạ là đủ; không cần kiểm tra danh sách phía BE.

## Cần người duyệt

Duyệt plan v2 để bắt đầu T1.
