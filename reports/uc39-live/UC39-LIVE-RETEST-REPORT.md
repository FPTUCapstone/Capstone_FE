# UC-39 Live Retest Report

**Kết luận:** PASS cho phạm vi UC-39 Web đã triển khai.

**Thời điểm:** 2026-10-26, Asia/Ho_Chi_Minh  
**Trình duyệt:** Google Chrome headed  
**Viewport:** Desktop `1920x1080`, responsive `390x844`  
**Môi trường:** FE `http://localhost:3001`, API Docker `http://localhost:5000`, SQL Server Docker  
**Chế độ:** đăng nhập thật, Bearer token thật, API coupon thật, không dùng `?demo=1` hoặc token giả.

## Tổng hợp

- Bộ chính: 17/19 PASS; hai case harness được sửa locator/assertion và rerun PASS.
- Kết quả cuối của 19 case chính: **19/19 PASS**.
- Exception flow bổ sung: **2/2 PASS** (`409 conflict`, `401 session expired`).
- Tổng kết quả cuối: **21/21 PASS**.
- Không phát hiện defect UC-39 mới.
- Coupon bị deactivate để test đã được activate lại thành công.
- Cleanup đã hoàn tất trong transaction có guard: `UC39E2EACTIVE` được trả về Name `UC39-E2E Active Coupon`, Usage Limit `10`, trạng thái `Active`; `UC39E2EEXPIRED` được trả về ngày hết hạn ban đầu và trạng thái `Expired`.

## Kết quả chi tiết

| ID | Nhóm | Kết quả cuối | Nội dung xác minh |
|---|---|---:|---|
| UC39-RETEST-001 | Happy | PASS | Login thật; list API 200 có Bearer; URL không demo |
| UC39-RETEST-002 | Happy | PASS | Coupon code và discount type chỉ đọc |
| UC39-RETEST-003 | Edge | PASS | Valid From theo Asia/Ho_Chi_Minh; khóa khi đã bắt đầu |
| UC39-RETEST-004 | Bad | PASS | Name rỗng bị chặn và lỗi gắn đúng field |
| UC39-RETEST-005 | Boundary | PASS | Chrome giới hạn Name ở 120 ký tự; không gửi giá trị 121 |
| UC39-RETEST-006 | Boundary | PASS | Discount 0 và Percentage 101 bị chặn |
| UC39-RETEST-007 | Boundary | PASS | Usage limit nhỏ hơn `usedCount` bị chặn |
| UC39-RETEST-008 | Bad | PASS | Valid To trong quá khứ bị chặn |
| UC39-RETEST-009 | Bad | PASS | 0 tour được chọn bị chặn tại field scope; vẫn có correction path |
| UC39-RETEST-010 | Happy | PASS | PUT 200; limit bằng `usedCount`; dữ liệu persist sau reload |
| UC39-RETEST-011 | Edge | PASS | Unlimited gửi `null` và round-trip đúng |
| UC39-RETEST-012 | Resilience | PASS | Network failure giữ draft; double-click chỉ phát một PUT |
| UC39-RETEST-013 | Security | PASS | Coupon API không Bearer trả 401 |
| UC39-RETEST-014 | Security | PASS | ID ngoài danh sách operator không làm lộ dữ liệu |
| UC39-RETEST-015 | Bad | PASS | Coupon không tồn tại hiển thị trạng thái an toàn |
| UC39-RETEST-016 | State | PASS | Save coupon Disabled vẫn giữ Disabled |
| UC39-RETEST-017 | State | PASS | Gia hạn Expired không tự activate; Reactivate tách riêng |
| UC39-RETEST-018 | Responsive | PASS | 390x844 không tràn ngang; Save vẫn hiển thị |
| UC39-RETEST-019 | State | PASS | Deactivate qua dialog và API thật; sau test đã restore Activate |
| UC39-RETEST-020 | Conflict | PASS | Response 409 hiển thị conflict, giữ draft, reload latest sau xác nhận |
| UC39-RETEST-021 | Session | PASS | Response 401 khi save hiển thị session expired và giữ draft |

## Phân loại evidence

- Case 001–019 chạy trên UI thật; các thao tác lưu/trạng thái dùng API và database thật.
- Case 020–021 chạy trên UI thật, nhưng `409` và `401` được điều khiển tại network boundary để tái tạo deterministically. Không có fake login, fake success hoặc fixture mutation.
- Invariant “booking cũ giữ nguyên discount” được hỗ trợ bởi cột snapshot `Bookings.discount_amount`, nhưng chưa có booking fixture phù hợp để so sánh before/after trong live browser lần này. Đây là kiểm tra liên module Booking/Payment, không phải defect quan sát được của UC-39.

## Quality gates liên quan

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test`: PASS — 93 Node tests và 2871 Vitest tests.
- `npm run build`: PASS.

## Evidence

- `retest-20261026/results.json`
- `retest-20261026/focused-rerun-results.json`
- `retest-20261026/exception-rerun-results.json`
- `retest-20261026/01-list-production.png`
- `retest-20261026/02-happy-persisted.png`
- `retest-20261026/03-mobile-390.png`
- `retest-20261026/04-final-state.png`
- `retest-20261026/05-tour-scope-validation.png`
- `retest-20261026/06-conflict-reload.png`

## Quyết định

UC-39 Web đạt điều kiện chức năng và quality gate trong phạm vi triển khai. Kiểm tra booking/payment snapshot nên được theo dõi trong cross-module regression suite, không chặn việc xác nhận chức năng Update Coupon.
