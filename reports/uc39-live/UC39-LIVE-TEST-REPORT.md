# UC-39 Live Chrome Test Report

> Báo cáo này là kết quả trước khi sửa lỗi. Kết quả chạy lại cuối cùng: [UC39-LIVE-RETEST-REPORT.md](./UC39-LIVE-RETEST-REPORT.md).

## Cập nhật sau khi sửa lỗi — 2026-10-26

D1–D5 đã được sửa ở FE:

- UC-39 edit/detail/update/activate/deactivate chỉ dùng API thật; `?demo=1` không còn bật fixture UC-39.
- Đã xóa fallback đăng nhập tạo role/token giả khi lỗi mạng.
- Name dài hơn 120 ký tự có lỗi gắn với `couponName-error`; lỗi validation từ Backend cũng được map về field tương ứng.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test`: PASS — 275 files, 2871 tests.
- `npm run build`: PASS.

Phần kết quả live Chrome bên dưới là bằng chứng lịch sử trước khi sửa. Các case live chưa chứng minh được vẫn cần chạy lại trước khi đổi kết luận E2E cuối cùng thành DONE. Demo còn lại trong module coupon chỉ phục vụ UC-38 Create Coupon tại `/partner/coupons/new`, không phục vụ UC-39.

**Kết luận:** NOT DONE / chưa đạt điều kiện merge hoặc release.

**Thời điểm chạy:** 2026-10-26, Asia/Ho_Chi_Minh  
**Trình duyệt:** Google Chrome, headed mode, desktop `1920x1080` và mobile `390x844`  
**Môi trường:** FE `http://localhost:3001`; API UC-39 Docker `http://localhost:5000`; SQL Server Docker  
**Chế độ:** Production path, đăng nhập thật, Bearer token thật, không dùng `?demo=1` hoặc token mock trong các case được tính kết quả.

## Kết quả tổng hợp

- Browser live: **17 PASS / 18 case**, **1 FAIL**.
- Coupon unit/component tests: **41/41 PASS**.
- Typecheck: **FAIL — 4 lỗi**.
- ESLint phạm vi UC-39/auth liên quan: **FAIL — 1 lỗi**.
- Production build: **FAIL tại TypeScript gate**.

Hai timeout `UC39-LIVE-016/017` trong lượt đầu là lỗi harness chờ response; rerun và API/DB evidence xác nhận Disabled update vẫn giữ `Disabled`, Expired update vẫn không tự activate và có nút Reactivate. `UC39-LIVE-012` cũng được rerun bằng locator duy nhất và PASS.

| ID | Nhóm | Kết quả cuối | Kiểm tra |
|---|---|---:|---|
| UC39-LIVE-001 | Happy | PASS | Login thật; list API 200 có Bearer; URL không demo |
| UC39-LIVE-002 | Happy | PASS | Code và discount type read-only |
| UC39-LIVE-003 | Edge | PASS | Valid From đã qua bị khóa; nhãn Asia/Ho_Chi_Minh |
| UC39-LIVE-004 | Bad | PASS | Name rỗng; field error và `aria-invalid` |
| UC39-LIVE-005 | Boundary | **FAIL** | Name 121 ký tự không có field error; backend trả 400 chung |
| UC39-LIVE-006 | Boundary | PASS | Percentage 0 và 101 bị chặn |
| UC39-LIVE-007 | Boundary | PASS | Usage limit 1 nhỏ hơn `usedCount=2` bị chặn |
| UC39-LIVE-008 | Bad | PASS | Valid To trong quá khứ bị chặn |
| UC39-LIVE-009 | Bad | PASS | Không chọn tour bị chặn, có correction path |
| UC39-LIVE-010 | Happy | PASS | PUT 200; limit bằng usedCount; refresh giữ dữ liệu và instant |
| UC39-LIVE-011 | Edge | PASS | Unlimited gửi `null` và round-trip đúng |
| UC39-LIVE-012 | Resilience | PASS | Network abort giữ draft; double-click chỉ phát một PUT |
| UC39-LIVE-013 | Security | PASS | API không Bearer trả 401 |
| UC39-LIVE-014 | Security | PASS | Coupon operator khác trả Not Found, không lộ dữ liệu |
| UC39-LIVE-015 | Bad | PASS | Coupon không tồn tại hiển thị Not Found an toàn |
| UC39-LIVE-016 | State | PASS | Update Disabled PUT 200; DB vẫn `Disabled` |
| UC39-LIVE-017 | State | PASS | Gia hạn Expired PUT 200; không tự activate; Reactivate khả dụng |
| UC39-LIVE-018 | Responsive | PASS | 390x844 không tràn ngang; Save vẫn hiển thị |

## Defects chặn Done

### D1 — P0: FE không typecheck/build

1. Edit route truyền prop `isDemo` không tồn tại vào `UpdateCouponView`.
2. Service dùng message key `COUPON_NOT_FOUND` không tồn tại tại hai vị trí.
3. Auth gọi `AuthStorage.getCurrentContext()` không tồn tại.

Hệ quả: `npm run typecheck` và `npm run build` đều fail; chưa thể merge/release.

### D2 — P0 Security: auth dev fallback tạo approved operator và token giả

Khi login lỗi mạng ở non-production, FE tự tạo Tour Operator Approved với `dev-mock-operator-token`. Đây là hardcoded role/token bypass, có thể làm UI báo đăng nhập thành công giả và trái convention fail-closed.

### D3 — P1: Name > 120 không map field validation

Chrome nhập 121 ký tự; FE không sinh `couponName-error`. API đã trả HTTP 400, nhưng UI chỉ có lỗi chung, không chỉ ra trường Name. Điều này không đạt field-error association và correction path trong spec.

### D4 — P1: UC-39 vẫn còn đường demo

Edit route vẫn đọc `?demo=1`, bật `allowDemo`, truyền `isDemo`; service vẫn có fixture mutation. UC-39 spec yêu cầu luôn dùng authenticated real API và không local fixture mutation.

### D5 — P1: quality gate lint fail

`src/lib/authApi.ts` dùng explicit `any`; ESLint trả 1 error.

## Chưa chứng minh bằng live browser

Các case sau cần thêm fixture/điều khiển backend riêng, nên không được coi là đã E2E đầy đủ trong lần chạy này:

- conflict thật do `usedCount` thay đổi đồng thời (`409`) và reload latest;
- token hết hạn giữa lúc đang sửa (`401`) với draft preservation;
- confirm deactivation và activate request hoàn chỉnh trên Chrome;
- booking cũ giữ nguyên discount và slot pending/cancel/expiry được hoàn đúng một lần — đây là cross-module booking/payment verification.

## Hạ tầng

`db-init` hiện fail ở migration UC-13 vì dữ liệu `TripSessions` còn completion reason đã retired. API UC-39 được khởi động riêng, không reset/xóa dữ liệu. Lỗi này không phải UC-39 nhưng chặn quy trình `docker compose up` sạch.

## Evidence

- `results.json`: lượt live đầu tiên, giữ nguyên raw result.
- `rerun-results.json`: xác nhận network/double-click.
- `expired-result.json`: xác nhận gia hạn Expired.
- `01-coupon-list-production.png`
- `02-active-edit-initial.png`
- `03-happy-update-persisted.png`
- `04-mobile-390.png`
- `05-network-draft-preserved.png`
- `08-expired-extended.png`

## Quyết định release

Không chấp nhận UC-39 là Done cho đến khi tối thiểu D1–D4 được sửa, các quality gate xanh, và chạy lại các case FAIL/chưa chứng minh ở trên.
