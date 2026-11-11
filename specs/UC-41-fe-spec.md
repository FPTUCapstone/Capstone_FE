# UC-41 Cancel Tour Booking — FE Spec (v2, sau rà soát, chờ duyệt)

Nhánh: `feature/linhnv-uc41-cancel-booking-72h` (worktree `Capstone_FE-uc41`, base `develop`)
Nguồn: SRS v12 mục 3.8.4.2 (UC-41). Đối chiếu với code BE nhánh UC-41.

## 1. Hợp đồng BE (đã kiểm tra trong code)

| Thành phần | Giá trị |
|---|---|
| Hủy | `POST /api/v1/bookings/{bookingId}/cancellation` |
| Header | `Idempotency-Key`: bắt buộc, là GUID hợp lệ (thiếu hoặc sai → 400) |
| Body | `{ reasonCategory?, reasonDetail?, confirmed? }` (camelCase). Tour Operator bắt buộc `reasonCategory` và `reasonDetail` |
| Preview | `GET /api/v1/bookings/{bookingId}/cancellation-preview` |
| Preview trả | `canCancel`, `blockingReasonCode`, `message`, `estimatedRefundAmount`, `refundStatus`, và thông tin booking |
| Mức 0% chưa xác nhận | Preview: `canCancel = true`, `blockingReasonCode = booking.cancellation.confirmation_required`. Hủy: HTTP 422 cùng mã |
| Lỗi khác | 403 không sở hữu, 404 không tồn tại, 409 trạng thái/idempotency, 422 thiếu lý do |

## 2. Hiện trạng FE (develop)

| Hạng mục | Vị trí | Trạng thái |
|---|---|---|
| Traveler hủy booking | — | Chưa có |
| Operator dialog | `src/features/operator/bookings/components/CancelBookingDialog.tsx` | Có UI |
| Operator service | `src/features/operator/bookings/services/operatorBookingService.ts` (`cancelCustomerBooking`) | Chỉ chạy demo; ngoài demo trả `PENDING_BE_INTEGRATION` |
| Payload operator | `CancelBookingPayload { reasonType, reasonDetail }` | BE cần `reasonCategory` → phải ánh xạ `reasonType → reasonCategory` |
| BFF hiện có | `app/api/v1/bookings/[bookingId]/{refund,review}/route.ts` | Mẫu route: giữ nguyên đường dẫn BE dưới `app/api/v1/` |
| Trang Traveler | `app/bookings/[id]/ticket/page.tsx` | Có, chưa có nút hủy |

## 3. Quyết định đã chốt

1. Nút "Hủy booking" của Traveler đặt trên trang `app/bookings/[id]/ticket`.
2. Operator dialog nối BE thật trong UC-41, bỏ nhánh demo của `cancelCustomerBooking`.
3. Thông báo hiển thị dùng chuỗi tạm, đồng bộ với mã BE tạm (MSG131–137, MSG170).

## 4. Phạm vi

BFF (route mới, mẫu `app/api/v1/`):
- `app/api/v1/bookings/[bookingId]/cancellation/route.ts`: POST, chuyển tiếp `Idempotency-Key`, body (`reasonCategory`, `reasonDetail`, `confirmed`).
- `app/api/v1/bookings/[bookingId]/cancellation-preview/route.ts`: GET.

Traveler:
- Nút hủy trên trang ticket, mở dialog: hiển thị booking, mức hoàn từ preview.
- Khi preview trả `confirmation_required`: dialog bắt buộc tick xác nhận rồi mới gửi `confirmed = true`.
- Sau khi hủy: trạng thái Cancelled, số tiền hoàn Pending.

Tour Operator:
- Giữ giao diện dialog. Lý do và mô tả bắt buộc (BR-106).
- `cancelCustomerBooking` gọi BE thật qua BFF; ánh xạ `reasonType` → `reasonCategory`; bỏ nhánh demo.
- Cùng endpoint với Traveler; BE quyết định quyền sở hữu (BR-105), FE không thay thế kiểm tra đó.

Chung:
- Idempotency-Key là GUID mới mỗi lần mở dialog; giữ nguyên khi người dùng bấm lại cùng một lần hủy.

Ngoài phạm vi:
- Xử lý refund (UC-42, UC-67): trang `app/bookings/[id]/refund` thuộc luồng khác.
- Mobile.

## 5. Kiểm thử dự kiến (TDD, khi được duyệt)

- Unit: dialog Traveler với mức hoàn >0 và mức 0% (bắt buộc tick xác nhận).
- Unit: route BFF chuyển tiếp đúng `Idempotency-Key` và body; không lộ lỗi thô của BE.
- Unit: `cancelCustomerBooking` ánh xạ `reasonType → reasonCategory`, giữ kiểm tra lý do bắt buộc.
- Browser: chạy dev server với BE local, hủy booking thử cả hai luồng.


## Known limitation (đã chấp nhận)

- Refund Pending của booking đã có settlement chuyển cho Tour Operator vẫn được `RefundProcessingBackgroundService` xử lý ngay, vì `RefundProcessor` chưa kiểm tra trạng thái settlement (BR-143).
- Sẽ xử lý trong UC-42 (xác nhận hoàn tiền của Tour Operator) và UC-67.
- Khi test UC-41, chỉ dùng booking chưa có settlement.
