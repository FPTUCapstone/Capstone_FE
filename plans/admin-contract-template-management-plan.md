# Plan — Admin quản lý mẫu hợp đồng — FE
ĐÃ ĐƯỢC NGƯỜI DÙNG DUYỆT. Ngày23/11/2026.
Spec: ../specs/admin-contract-template-management-spec.md.
Kế hoạch liên repo: ../../Capstone_BE-confirm-booking-refund/plans/admin-contract-template-management-plan.md.

1. Bảo toàn các sửa UI/date/alignment hiện có; xác minh baseline và contract API với BE.
2. Theo P7 của plan BE: danh sách -> tạo Draft/upload -> validation/revision -> preview job -> confirm publish -> history/download.
3. Files dự kiến: app/admin/(console)/contract-templates; src/features/admin/contract-templates; app/api/admin/contract-templates; routes/AdminSidebar/breadcrumb. Xác minh layout thực trước code, dùng shared components hiện có.
4. Test hành vi trước: BFF authorization, upload lỗi, preview cũ, conflict, duplicate publish, Published read-only. Không viết test chỉ cho CSS/vị trí theo lựa chọn người dùng.
5. Kiểm tra trực quan responsive/bàn phím/tên file dài/PDF fallback. Chạy lint/typecheck/test logic/build, ghi rõ lỗi baseline hoặc môi trường.
6. E2E Admin tạo -> preview -> publish v1 -> version v2, v1 vẫn giữ nguyên; Staff/TO không có quyền. Review hai lượt theo AGENTS.
Không sửa activation/signing/OTP hoặc Mobile. Không triển khai code/commit/push chỉ vì tạo tài liệu.

## Ghi nhận triển khai — 23/11/2026
- Đã thêm danh sách, tạo/sửa Draft, validation DOCX, preview bất đồng bộ, xác nhận publish, tạo phiên bản và tải tài liệu; thêm menu/breadcrumb và BFF chỉ dành Administrator.
- 21 test tính năng đạt; lint phạm vi thay đổi và `npm run typecheck` đạt. Không thêm test riêng cho vị trí/CSS.
- HTTP `/admin/contract-templates` chuyển người chưa đăng nhập tới `/admin/login` (200). Bản mới chạy cổng 3002, dùng BE cổng 5022.
- DB local đã backup trước migration; API create Draft -> worker Ready -> private PDF 200 đã kiểm chứng bằng mẫu giả, chưa publish.
- Kiểm tra tương tác bàn phím/responsive trực tiếp và hai phiên Admin publish đồng thời còn cần thực hiện; không ghi nhận là đã pass.
- Phát hiện node_modules Next 16.4.3 khác lockfile 16.4.5; cài lại đúng lockfile trước lần build bàn giao.
- Đã chạy `npm ci`, giữ nguyên package.json/package-lock.json; Next 16.4.5 production build thành công và 21 test tính năng chạy lại đạt. FE dev được khởi động lại tại cổng 3002.
