# Spec: Dialog Lock Account theo SRS (UC-47) — v1.2, ĐÃ DUYỆT (dev duyệt 2026-11-28, kèm 3 lưu ý nhỏ đã áp dụng)

Repo: Capstone_FE, base `origin/develop` (đã cập nhật local `develop` @ f007421).
Branch dự kiến: `feature/uc47-lock-user-account-dialog` (cắt từ `develop` sau khi spec được duyệt). Mã ticket Jira: chưa có — cần bổ sung.
Không đụng BE/Mobile.

## 1. Hiện trạng (đã đọc trên develop)
- BE `POST /api/v1/admin/users/{id}/lock` đã có và đã test (PR #178, TM-93): kiểm tra phạm vi role (BR-168), bắt buộc lý do (≤200 ký tự ở handler), đặt `Locked`, thu hồi refresh token, audit log, notification in-app.
- FE `AccountModerationForm` (`src/features/admin/user-accounts/components/`) xử lý cả lock và unlock bằng một ô text + dialog xác nhận (MSG130). Gọi `/api/admin/users/[userId]/[action]` (proxy `app/api/admin/users/[userId]/[action]/route.ts`).
- Trang `app/admin/(console)/users/[userId]/page.tsx` đã có `detail.account` (userId, fullName, email, role, status).
- Nhánh `origin/feature/khanhpq-lock-user-account` có `UserAccountStatusDialog` kiểu SRS nhưng dùng đánh số UC cũ, chưa nối BE, chưa merge → chỉ tham khảo, không cherry-pick.

## 2. Khoảng lệch so với SRS §3.9.1.2 / Figure 75
1. Dialog thiếu thẻ tóm tắt tài khoản (Full Name, Email, Role, Current Status).
2. Chỉ có ô text tự do; SRS yêu cầu lý do định sẵn + text tự do.
3. Thiếu ghi chú tác động (không đăng nhập được, phiên bị hủy).
4. Thông báo lỗi chung chung; SRS quy định MSG123 (lý do trống), MSG126 (sai quyền), MSG133 (đã Locked / sai trạng thái), MSG127 (lỗi hệ thống/mạng).

## 3. Phạm vi
IN: dialog lock (FE), ánh xạ lỗi lock theo MSG, test.
OUT: toàn bộ luồng unlock (UC-48, giữ nguyên hành vi và test hiện có), BE (không sửa API/handler), email thông báo, quy tắc về trạng thái được phép khóa, Service Provider trong phạm vi Staff, thay đổi trang danh sách.

## 4. Thiết kế
**4.1 Cách gửi lý do (đã chọn: cách 1 — FE ghép chuỗi).** Giữ hợp đồng API `{ reason: string }`.
- Chọn danh mục thường: `reason = "<Danh mục>: <ghi chú>"`; nếu ghi chú trống: `reason = "<Danh mục>"`.
- Chọn "Other": `reason = "<ghi chú>"` (ghi chú bắt buộc).
- Ghi chú được `.trim()` trước khi ghép; chuỗi chỉ gồm khoảng trắng coi như trống.
- Tổng độ dài sau khi ghép ≤ 200 (giới hạn BE/proxy hiện tại). Ô ghi chú có `maxLength` = 200 − độ dài tiền tố và bộ đếm ký tự.
- Khi đổi danh mục làm chuỗi ghép vượt 200: **không tự cắt ghi chú** (tránh mất chữ người dùng đã nhập). Bộ đếm báo vượt giới hạn, hiện thông báo inline "Reason must be at most 200 characters." và vô hiệu nút `Confirm lock` cho đến khi người dùng rút gọn. Không bao giờ gửi request khi chuỗi ghép >200.

**4.2 Danh mục (SRS §3.9.1.2 chỉ nói "predefined reasons", không liệt kê nhãn → bản chốt tạm, lấy từ nhánh khanhpq, chờ PO/Staff lead xác nhận):**
`Violation of tour safety & travel regulations`, `Payment fraud or irregular chargebacks`, `Unresolved severe traveler complaints`, `Other`.
Đặt trong `resources/en.ts` (không hard-code trong component).

**4.3 Component.** `AccountModerationForm` (client) nhận thêm prop `account: { fullName: string; email: string | null; role: string; statusLabel: string }`. Trang chi tiết (server component) truyền `detail.account` kèm `statusLabel = accountStatusLabel(status)` đã format; component client **không** import `server/accounts.ts` (file `server-only`) và không hiển thị status thô như `PendingContractSignature`. `email === null` hiển thị `—`. Chế độ lock (khi `locked=false`) hiển thị: nút "Lock account" mở dialog gồm thẻ tóm tắt, select danh mục, textarea ghi chú, ghi chú tác động, nút `Cancel` / `Confirm lock`. Chế độ unlock giữ nguyên. Dialog dùng `ModerationDialog` sẵn có (focus trap, Escape, CR-05). MSG130 vẫn hiển thị làm mô tả xác nhận (CR-05).

**4.4 Lỗi (chỉ đường lock).**
- Chưa chọn danh mục, hoặc chọn "Other" mà ghi chú trống → MSG123 "Please enter a reason." (in red, dưới ô; không gửi request). Điều kiện này chỉ hiện khi người dùng bấm `Confirm lock`: nút **không** bị disable ở trạng thái trống; nút chỉ disable khi đang gửi (busy) hoặc chuỗi ghép >200 ký tự.
- Proxy trả 409 → MSG133 "This action is not available for the current status of the record."; 403 → MSG126 "You do not have permission to access this function."; 503/mạng → MSG127 "TripMate is temporarily unable to process your request. Please check your connection and try again."
- 400 / 401 / 404 → giữ nguyên `problem.title` do proxy trả về (như hiện tại).
- Lỗi hiển thị **bên trong dialog** (vùng `role="alert"`), dialog và nhập liệu được giữ, không có thông báo thành công. Hiện `AccountModerationForm` đóng dialog trong `finally`; ở đường lock phải đổi thành chỉ đóng khi `response.ok`. Thành công: đóng dialog, MSG189 như hiện tại, xóa nhập liệu.
- Hủy / Escape / nút đóng rồi mở lại: **giữ bản nháp** (danh mục + ghi chú, khớp hành vi và test hiện có) nhưng **xóa thông báo lỗi cũ**.

## 5. Tiêu chí chấp nhận
1. Dialog lock hiển thị đúng Full Name, Email, Role, Status của tài khoản và ghi chú tác động.
2. Không gửi request khi chưa chọn danh mục / "Other" thiếu ghi chú; hiển thị MSG123.
3. Request gửi đúng `reason` theo 4.1, tổng ≤200 ký tự, một request duy nhất khi bấm xác nhận đúp.
4. 409/403/503 hiển thị đúng MSG133/MSG126/MSG127.
5. Hủy/Escape/đóng không gửi request; focus trap hoạt động; trả focus về nút mở.
6. Luồng unlock và test unlock hiện có không đổi.
7. Đổi danh mục làm chuỗi ghép >200 thì không gửi request, ghi chú không bị cắt; ghi chú toàn khoảng trắng bị coi là trống.
8. Lỗi trả về hiển thị trong dialog, dialog chỉ đóng khi thành công; mở lại sau khi hủy thì lỗi cũ biến mất, bản nháp còn.
9. Gate theo AGENTS.md đều xanh: `npm test && npm run lint && npm run typecheck && npm run build` (chạy đủ `npm test`, không chỉ các file liên quan). Mọi bước bị skip hoặc giới hạn môi trường phải báo cáo.

## 6. Các quyết định của tôi cần bạn kiểm tra
- Danh mục bắt buộc; ghi chú tự do chỉ bắt buộc với "Other" (SRS chỉ nói "selects or enters").
- Không sửa BE; lệch giới hạn lý do (handler 200 vs controller 1000) ghi nhận là việc tồn đọng.
- Chỉ đổi thông báo lỗi của đường lock, không đổi chuỗi của unlock.
- Không tự thêm kiểm tra trạng thái nào được phép khóa (SRS chưa quy định); giữ hành vi BE hiện tại.
