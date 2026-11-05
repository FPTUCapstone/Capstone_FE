# UC-70 — Đặc tả Web cho thao tác khẩn cấp của Tour Operator

> **SUPERSEDED:** Tài liệu này chỉ bao phủ manual emergency action. Đặc tả canonical đã mở rộng
> Weather Safety Review và realtime tại
> [`UC-70-weather-safety-review-web-spec.md`](./UC-70-weather-safety-review-web-spec.md).

**Trạng thái:** Đề xuất — chưa được phép triển khai UI

**Repository:** `Capstone_FE`

**Nguồn nghiệp vụ BE:** [`../../.scratch/uc70/be-worktree/specs/UC-70-spec.md`](../../.scratch/uc70/be-worktree/specs/UC-70-spec.md)

**Nguồn phạm vi Web:** [`../docs/WEB_SCOPE_MATRIX.md`](../docs/WEB_SCOPE_MATRIX.md)

## 1. Quyết định phạm vi còn thiếu

`WEB_SCOPE_MATRIX.md` hiện xếp UC-70 là `NON_SCREEN` và đánh dấu
`SRS_CONFLICT/BLOCKED_BY_SRS_CONFLICT`: catalog mô tả workflow tự động, trong khi phần chi
tiết lại mô tả Operator/Admin declaration screens. Vì vậy tài liệu này là đặc tả đề xuất,
không phải quyền tạo route hoặc màn hình.

Trước khi implementation, Product/BA phải phê duyệt một trong hai hướng:

1. Sửa SRS để UC-70 có thao tác Web cho Tour Operator; hoặc
2. Tách thao tác Operator thành một UC riêng và liên kết nó với workflow UC-70.

Ngoài ra phải có Web Screen Specification được duyệt, xác định entry point, layout responsive,
copy và destructive-action hierarchy. BE contract đã freeze và release-ready; đây không còn là
dependency mở.

## 2. Mục tiêu

Sau khi governance gate được gỡ, Tour Operator đã đăng nhập có thể xem tác động của đúng một
departure thuộc quyền sở hữu, rồi:

- hủy departure trước khởi hành; hoặc
- dừng khẩn cấp departure đang hoạt động;
- thêm, thay thế hoặc rút evidence của operation đã tạo.

Luồng phải dùng được trên desktop và trình duyệt điện thoại, ngăn thao tác nhầm departure,
double-submit và xác nhận bằng dữ liệu preview đã cũ.

## 3. Actor và tiền điều kiện

- Actor: tài khoản có role `TourOperator`.
- Operator chỉ thao tác tour/departure thuộc organization của mình.
- BE là nguồn quyết định cuối về action window và quyền sở hữu.
- FE phải lấy impact preview trước mỗi lần xác nhận.
- `hasUnverifiedSessions = true` là fail-closed: không cho xác nhận.

## 4. User stories và acceptance criteria

### US-70-FE-01 — Xem impact preview

Là Tour Operator, tôi muốn xem tác động được Backend tính cho một departure để hiểu hậu quả
trước khi thực hiện thao tác không thể hoàn tác trực tiếp.

Acceptance criteria:

1. FE gọi `GET .../emergency-impact`, không tự tính số booking, hành khách, session hay ticket.
2. Hiển thị action, trạng thái departure, paid/unpaid booking count, passenger count, active
   session count và unused ticket count, cùng nội dung: “Việc thanh toán và hoàn tiền được xử lý riêng theo chính sách hủy booking áp dụng.”
3. `impactVersion` chỉ được giữ trong data layer, không hiển thị dưới dạng kỹ thuật.
4. Preview loading, retry, forbidden, not-found, terminal và conflict có trạng thái riêng.
5. Khi có unverified sessions, hiển thị cảnh báo an toàn và disable confirm.

### US-70-FE-02 — Hủy trước khởi hành

Là Tour Operator, tôi muốn hủy một departure chưa khởi hành để Backend khóa departure, cập nhật
booking/ticket nguyên tử.

Acceptance criteria:

1. Form gửi đúng `impactVersion`, reason và các trường optional theo contract.
2. Không yêu cầu `currentPassword` vì contract pre-start hiện không có trường này.
3. Confirmation tóm tắt departure và impact mới nhất.
4. Một intent chỉ gửi một mutation; network retry cùng payload dùng lại idempotency key.
5. Success chỉ mô tả trạng thái và số booking bị ảnh hưởng; không hiển thị refund hay settlement.

### US-70-FE-03 — Dừng tour đang hoạt động

Là Tour Operator, tôi muốn dừng khẩn cấp departure đang chạy để các booking/session liên quan
được đánh dấu `Interrupted` và Traveler nhận trạng thái an toàn mới.

Acceptance criteria:

1. Bắt buộc current password, reason, reason details, immediate instructions và emergency contact.
2. Password chỉ tồn tại trong component memory đủ để gửi request; không vào URL, storage,
   telemetry hoặc log và được clear sau response.
3. Evidence là optional; riêng `AuthorityDirective` phải có authority/evidence reference hoặc
   chọn `addEvidenceLater`.
4. Confirmation hiển thị số booking, passenger và session bị ảnh hưởng.
5. Success không hiển thị refund, payout hay settlement.

### US-70-FE-04 — Quản lý evidence

Là Tour Operator, tôi muốn bổ sung, thay thế hoặc rút evidence sau operation để hồ sơ phản ánh
đúng thông tin hiện có.

Acceptance criteria:

1. Add/replace gửi ít nhất một evidence value.
2. Withdraw gửi `withdrawEvidence = true` và không gửi evidence values.
3. Evidence URL phải là HTTPS tuyệt đối, không chứa userinfo và tối đa 1000 ký tự.
4. FE không fetch evidence URL để xác minh.
5. Provenance được trình bày là `Operator-provided`, không phải `Verified`.

### US-70-FE-05 — Phục hồi sau conflict và lỗi

Là Tour Operator, tôi muốn nhận lỗi có thể hành động để tránh lặp mutation hoặc xác nhận bằng
dữ liệu cũ.

Acceptance criteria:

1. `concurrent_state_changed`: bỏ preview cũ, reload và yêu cầu xác nhận lại.
2. `idempotency_payload_mismatch`: không retry tự động; tạo intent mới sau khi user review.
3. `user.password_invalid`: clear và focus password; không clear các trường vận hành khác.
4. `trip_session.link_unverified`: fail-closed và không có nút bypass.
5. 401/403/404 dùng auth/error convention hiện có và không làm lộ tài nguyên organization khác.

## 5. API contract

Base route: `/api/v1/operator/tours` với role `TourOperator`.

| Chức năng | Method và path |
| --- | --- |
| Preview | `GET /{tourId}/schedules/{scheduleId}/emergency-impact` |
| Hủy trước start | `POST /{tourId}/schedules/{scheduleId}/cancel-before-departure` |
| Dừng tour active | `POST /{tourId}/schedules/{scheduleId}/emergency-stop` |
| Add/replace/withdraw evidence | `PUT /{tourId}/schedules/{scheduleId}/emergency-evidence` |

Hai POST mutation phải gửi header `Idempotency-Key` là UUID không rỗng.

### Impact response

`tourId`, `scheduleId`, `action`, `scheduleStatus`, `paidBookingCount`,
`unpaidBookingCount`, `totalPassengerCount`, `activeSessionCount`, `unusedTicketCount`,
`hasUnverifiedSessions`, `impactVersion`.

### Action response

`operationId`, `tourScheduleId`, `action`, `scheduleStatus`, `affectedBookingCount`,
`committedAtUtc`.

Response hiện không có delivery status hoặc contact roster; FE không được invent hai dữ liệu này.

## 6. Field specifications

| Trường | UI type | Bắt buộc | Validation/ghi chú |
| --- | --- | --- | --- |
| Reason | Select/radio | Có | `WeatherEmergency`, `AuthorityDirective`, `DestinationUnavailable`, `TransportFailure`, `SafetyIncident`, `Other` |
| Reason details | Textarea | Có | Trim; 1–1000 ký tự; UI nói rõ Traveler sẽ đọc nội dung này |
| Immediate instructions | Textarea | Active stop | Trim; 1–1000 ký tự |
| Emergency contact | Text | Active stop; optional pre-start | Tối đa 100 ký tự |
| Current password | Password | Active stop | 1–200 ký tự; không persist; clear sau response |
| Evidence reference | Textarea/text | Không | Tối đa 500 ký tự |
| Evidence URL | URL | Không | HTTPS tuyệt đối, không userinfo, tối đa 1000 ký tự |
| Authority reference | Text | Có điều kiện | Tối đa 200 ký tự |
| Add evidence later | Checkbox | Không | Thỏa điều kiện `AuthorityDirective` khi chưa có reference |
| Withdraw evidence | Checkbox/action | Evidence update | Khi true, toàn bộ evidence fields phải rỗng |

Form Cancel thu gọn ba evidence field theo mặc định và tự mở khi chọn `AuthorityDirective`. `addEvidenceLater` được gửi tự động khi `AuthorityDirective` chưa có authority reference hoặc evidence reference; chỉ có Evidence URL vẫn tính là chưa có reference theo validator Backend.

Client validation nhằm phản hồi sớm; Backend validation vẫn là nguồn sự thật.

## 7. Idempotency và submission state

- Sinh một UUID bằng Web Crypto khi user bắt đầu confirm một intent.
- Double-click bị khóa trong lúc pending.
- Retry cùng payload giữ nguyên key.
- User thay payload sau failure tạo intent/key mới.
- Refresh trang không tự replay mutation.
- Không optimistic-update Booking, Refund, Session hoặc TourSchedule.

## 8. Error mapping

| Backend code | Hành vi FE |
| --- | --- |
| `tour_schedule.not_found` | Not-found state, không lộ ownership detail |
| `tour_schedule.cancellation_forbidden` | Forbidden state |
| `tour_schedule.already_terminal` / `already_completed` | Reload departure, khóa action |
| `tour_schedule.emergency_reason_required` | Form error summary |
| `tour_schedule.concurrent_state_changed` | Bỏ preview cũ, reload, confirm lại |
| `tour_schedule.emergency_action_window_invalid` | Reload trạng thái và khóa action sai cửa sổ |
| `tour_schedule.idempotency_payload_mismatch` | Không retry; yêu cầu review intent |
| `user.password_invalid` | Clear/focus password |
| `trip_session.link_unverified` | Fail-closed, không bypass |
| `tour_schedule.emergency_evidence_not_pending` | Reload operation/evidence state |

Raw stack trace hoặc payload nội bộ không được hiển thị.

## 9. UX, responsive và accessibility

- Entry point và route/modal shape phải theo Web Screen Specification được duyệt.
- Confirmation là destructive dialog có tên departure và impact summary.
- Mobile-width giữ action chính nhìn thấy, không che bởi viewport/keyboard.
- Có loading, empty, validation, pending, success, error và stale-preview states.
- Dialog quản lý focus, Escape/cancel và trả focus về trigger.
- Tất cả field có label; error summary liên kết tới field; không chỉ dùng màu cho severity.
- Dùng formatter tiền/thời gian hiện có; UTC ở data layer.

## 10. Non-functional requirements

- Reuse native fetch/auth/ProblemDetails/form/dialog conventions hiện có.
- Server Component mặc định; client boundary nhỏ nhất cần thiết.
- Không thêm global state, UI framework hoặc UUID package.
- Không log password, token, full ProblemDetails hoặc sensitive payload.
- Behavioral tests bao phủ API boundary, idempotency, conflict, password safety, responsive
  layout và keyboard flow.

## 11. Ngoài phạm vi

- Traveler Mobile UI và FCM delivery.
- Refund (UC-42), payout (UC-71), gateway execution và reconciliation.
- UC-28 installment/payment plan.
- Admin approval/interface.
- Auto-cancel từ UC-14/weather.
- Evidence crawling hoặc verification.
- Commit, push, PR và deploy.

## 12. Điều kiện chuyển sang implementation

- [ ] SRS conflict được Product/BA giải quyết bằng tài liệu được duyệt.
- [ ] `WEB_SCOPE_MATRIX.md` được cập nhật tương ứng.
- [ ] Web Screen Specification/UI được duyệt.
- [ ] Entry point và interaction shape được chốt.
- [ ] Tài liệu này được người dùng phê duyệt.

Khi còn bất kỳ checkbox nào chưa đạt, implementation giữ trạng thái **BLOCKED**.
