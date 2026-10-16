# UC-35 release checklist

Không đánh dấu hoàn tất UC-35 hoặc mở PR merge nếu một mục bắt buộc dưới đây chưa được kiểm chứng trên môi trường chạy thật.

## 1. Contract và migration

- [ ] API create, detail, list, update, submit-review, approve, publish, unpublish và delete có contract đã thống nhất giữa FE/BE.
- [ ] Migration chạy được trên database trống và database đang có dữ liệu; chạy lại không lỗi.
- [ ] FE không tự gán các giá trị nghiệp vụ như trạng thái, phiên bản hoặc quyền thao tác khi API chưa trả về.
- [ ] Các lỗi API được hiển thị bằng thông điệp người dùng hiểu được; không lộ mã nội bộ hoặc nội dung SRS.

## 2. Vòng đời và phiên bản

- [ ] Draft → Pending → Approved → Published chạy hoàn chỉnh.
- [ ] Admin là vai trò duy nhất publish/unpublish.
- [ ] Chỉnh sửa Approved/Published tạo phiên bản draft kế tiếp được BE lưu (`parent/root tour` và `versionNo`), không phải tour v1 độc lập.
- [ ] List, detail và lịch sử phiên bản cùng hiển thị một `versionNo` do API trả về.
- [ ] Bản cũ vẫn giữ được để audit và booking cũ không bị thay đổi.

## 3. Xóa tour

- [ ] Nút xóa chỉ xuất hiện với Draft hoặc Rejected.
- [ ] Có hộp xác nhận, trạng thái loading và thông báo thành công/thất bại.
- [ ] BE kiểm tra ownership và trạng thái; không tin điều kiện ẩn/hiện của FE.
- [ ] Pending, Approved, Published và Inactive bị BE từ chối xóa.
- [ ] Hành động xóa có audit trail hoặc soft-delete theo chính sách dữ liệu của hệ thống.

## 4. Media

- [ ] Upload ảnh JPEG/PNG/WebP hợp lệ dưới giới hạn dung lượng thành công trên môi trường local.
- [ ] Cấu hình media storage có credential hợp lệ; API không trả 503.
- [ ] Ảnh đầu tiên tự thành ảnh đại diện; người dùng có thể đổi ảnh đại diện và xóa ảnh khi tour còn editable.
- [ ] Submit review bị chặn rõ ràng nếu thiếu ảnh đại diện.
- [ ] Có test provider giả lập cho success, provider unavailable và provider rejected.

## 5. Lịch trình và form

- [ ] Số ngày và số phần lịch trình luôn đồng bộ, kể cả dữ liệu tour cũ thiếu ngày.
- [ ] Giảm số ngày xử lý rõ dữ liệu ngày bị bỏ trước khi lưu.
- [ ] Giờ chọn theo định dạng 24 giờ; điểm dừng không trùng giờ hoặc chồng khoảng lưu lại.
- [ ] Có thể thêm/xóa/sắp xếp điểm dừng trong từng ngày và kéo thả giữa các ngày.
- [ ] Mọi validation chặn thao tác đều có thông báo ngắn, tự tắt và chỉ rõ trường/điểm dừng cần sửa.

## 6. Bằng chứng trước merge

- [ ] Lint, type-check, unit test và integration test pass.
- [ ] Chạy E2E trên FE + API + SQL + media storage local.
- [ ] Reviewer chạy lại flow: create → media → submit → admin approve → publish → edit creates next version → delete an eligible draft.
- [ ] Đính kèm link/log kết quả kiểm thử vào PR; không chỉ dựa vào screenshot hoặc test component.
