# Admin quản lý mẫu hợp đồng — FE
ĐÃ ĐƯỢC NGƯỜI DÙNG DUYỆT. Ngày23/11/2026; nhánh fix/linhnv-operator-sign-up.

Spec chuẩn: ../../Capstone_BE-confirm-booking-refund/specs/admin-contract-template-management-spec.md.

Phạm vi: màn hình Administrator tải mẫu DOCX, kiểm tra biến, xem PDF, lưu Draft, công bố và quản lý phiên bản. Không có màn hình Admin trên Mobile.
Published/Archived bất biến; sửa bằng Draft phiên bản mới. Không tự kích hoạt TO hoặc triển khai chữ ký/OTP trong bước này.
Route dự kiến /admin/contract-templates và /admin/contract-templates/{id}; BFF kiểm tra quyền và stream file private.
UI có trạng thái upload/render/error/conflict; ngày dd/MM/yyyy, giữ API ISO. Preview phải khớp revision hiện tại và đánh dấu dữ liệu mẫu.
Chi tiết biến, role, lỗi, concurrency và tiêu chí nghiệm thu theo spec BE; không tự sao chép thành quy tắc khác.
Cần duyệt DOCX chính thức, biến bắt buộc, giới hạn xử lý, engine/vùng ký và xóa Draft trước code.
