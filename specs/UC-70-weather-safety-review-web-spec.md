# UC-70 — Đặc tả Web xử lý cảnh báo an toàn và hủy tour khẩn cấp

**Trạng thái:** APPROVED FOR IMPLEMENTATION sau khi đóng các BE contract gates tại mục 13

**Actor:** Tour Operator sở hữu tour

**Nền tảng:** Responsive Web (`Capstone_FE`)

**Quyết định sản phẩm:** 2026-11-02 — UC-70 chỉ cho phép Operator quyết định thủ công; không có auto-cancel/auto-stop

**Ngoài phạm vi:** refund (UC-42), payout (UC-71), Traveler Mobile, Administrator, cấu hình Tomorrow.io production

## 1. Mục tiêu

Cho phép Tour Operator:

1. Nhận và xem cảnh báo thời tiết ảnh hưởng đến một lịch khởi hành.
2. Xác nhận đã đọc cảnh báo trong thời hạn SLA.
3. Xem tác động thương mại do Backend tính trước khi hành động.
4. Chủ động hủy lịch chưa khởi hành hoặc dừng khẩn cấp lịch đang chạy.
5. Thêm, thay thế hoặc rút bằng chứng của thao tác đã tạo.

Weather Safety Review chỉ yêu cầu con người xem xét. Nó không tự thay đổi `TourSchedule`, `Booking`,
`TripSession`, `Ticket` hay `Refund`.

## 2. Phạm vi màn hình và điều hướng

| Route | Mục đích |
| --- | --- |
| `/partner/weather-safety-reviews` | Danh sách cảnh báo thuộc các tour của Operator |
| `/partner/weather-safety-reviews/[reviewId]` | Chi tiết cảnh báo, acknowledge và mở luồng quyết định thủ công |

Navigation Operator có mục **Cảnh báo an toàn** và badge số review cần xử lý. Badge là dữ liệu server,
không suy ra từ cache cũ hoặc notification đã nhận.

Không tạo route “automatic cancellation”. Hành động hủy/dừng nằm trong chi tiết review và có thể được
mở từ bề mặt lịch khởi hành nếu bề mặt đó được triển khai sau này.

## 3. Ubiquitous language

- **Weather Safety Review:** hồ sơ yêu cầu Operator xem xét một cảnh báo ảnh hưởng đến một departure.
- **Acknowledge / Đã xem cảnh báo:** xác nhận đã nhận và đọc; không phải phê duyệt tiếp tục tour.
- **Pre-Departure Emergency Cancellation:** Operator hủy một departure chưa bắt đầu.
- **Emergency Stop:** Operator dừng một departure đang chạy.
- **Impact Preview:** ảnh chụp tác động do BE tính, gắn với `impactVersion`.
- **Operator-Provided Evidence:** bằng chứng Operator cung cấp, không được gắn nhãn “đã xác minh”.

## 4. Luồng tổng thể

```text
Tomorrow.io webhook
  → BE xử lý và tạo WeatherSafetyReview
  → BE phát SignalR hint cho đúng owning Operator
  → FE nhận hint, gọi lại REST để lấy dữ liệu chuẩn
  → Operator mở review
  → Operator bấm “Đã xem cảnh báo”
  → Tour không đổi trạng thái
  → Operator có thể rời màn hình hoặc mở Impact Preview
  → Operator nhập lý do và xác nhận lần cuối
  → BE mới hủy trước khởi hành hoặc dừng tour đang chạy
```

## 5. User stories và acceptance criteria

### US-70-FE-01 — Nhận cập nhật realtime

1. Khi SignalR hoạt động, FE nhận một hint tối thiểu rồi gọi REST để refresh list/detail.
2. Hint không phải nguồn dữ liệu nghiệp vụ và không chứa mô tả nhạy cảm.
3. Khi hub mất kết nối, FE reconnect có backoff; trong thời gian disconnect dùng polling 30 giây.
4. Khi tab lấy lại focus hoặc mạng trở lại, FE refresh ngay một lần.
5. Không mở dialog phá hủy hoặc gọi endpoint hủy/dừng từ sự kiện realtime.

### US-70-FE-02 — Xem danh sách review

1. Danh sách newest-first và chỉ chứa tour thuộc Operator đăng nhập.
2. Có filter `PendingAcknowledgement`, `Escalated`, `Acknowledged`, `Closed` và tất cả.
3. Item hiển thị tour, departure time, loại/mức độ sự kiện, hiệu lực, deadline và status.
4. Review gần deadline và `Escalated` có text/icon rõ ràng, không chỉ dùng màu.
5. Có loading, empty, malformed-response, forbidden, network-error và retry states.

### US-70-FE-03 — Xem chi tiết cảnh báo

1. Hiển thị nguồn/cơ quan, loại sự kiện, severity/risk level, mô tả, hiệu lực và khu vực tóm tắt.
2. Nếu event withdrawn, hiển thị rõ và refresh; FE không tự đóng review.
3. Không render raw GeoJSON hoặc raw provider payload.
4. Không khẳng định tour chắc chắn nguy hiểm hoặc chắc chắn an toàn.
5. Cross-operator/not-found dùng safe 404, không tiết lộ ownership.

### US-70-FE-04 — Xác nhận đã đọc

1. Nút **Đã xem cảnh báo** gọi `POST .../{reviewId}/acknowledge`.
2. Operator có thể thêm ghi chú nội bộ tối đa 1000 ký tự; UI nói rõ ghi chú này không được gửi cho Traveler (field API vẫn là `immediateInstructions`).
3. Replay acknowledge idempotent và không tạo commercial mutation.
4. Review `Closed` không thể acknowledge; FE refresh và hiển thị trạng thái hiện tại.
5. Sau acknowledge, tour giữ nguyên; không dùng copy “đã cho phép tiếp tục tour”.

### US-70-FE-05 — Xem Impact Preview

1. FE gọi `GET .../emergency-impact`; không tự tính booking, passenger, session hay ticket.
2. Hiển thị action, schedule status, paid/unpaid bookings, passengers, active sessions, unused tickets
   và unverified-session warning.
3. `impactVersion` chỉ giữ trong state và gửi lại khi confirm.
4. `hasUnverifiedSessions=true` là fail-closed: disable mutation, không có bypass.
5. Preview được refresh ngay trước confirmation cuối.

### US-70-FE-06 — Hủy trước khởi hành

1. Chỉ hiển thị khi BE trả action `CancelBeforeDeparture`.
2. Form gửi `impactVersion`, reason, reason details và evidence/contact optional theo contract.
3. Confirmation nêu rõ một departure, số booking/passenger và “Việc thanh toán và hoàn tiền được xử lý riêng theo chính sách hủy booking áp dụng.”
4. Double-click chỉ tạo một mutation; retry cùng payload giữ cùng `Idempotency-Key`.
5. Success không hiển thị refund, payout hay settlement.

### US-70-FE-07 — Dừng khẩn cấp tour đang chạy

1. Chỉ hiển thị khi BE trả action `EmergencyStopActive`.
2. Bắt buộc current password, reason/details, immediate instructions và emergency contact.
3. Password chỉ ở component memory, không vào URL/storage/log/telemetry và luôn clear sau response.
4. Confirmation nêu rõ Booking và TripSession sẽ chuyển `Interrupted`.

### US-70-FE-08 — Quản lý evidence

1. Add/replace yêu cầu ít nhất một evidence value.
2. Withdraw gửi `withdrawEvidence=true` và không gửi evidence values.
3. URL phải là HTTPS tuyệt đối, không userinfo, tối đa 1000 ký tự.
4. FE không fetch URL ngoài để “xác minh”.
5. UI ghi **Operator cung cấp**, không ghi **TripMate xác minh**.

## 6. Trạng thái và hành động UI

| Review status | Hành vi |
| --- | --- |
| `PendingAcknowledgement` | Cho acknowledge; hiển thị deadline; cho mở impact preview |
| `Escalated` | Hiển thị quá SLA và escalation contact; vẫn cho acknowledge và mở preview |
| `Acknowledged` | Ẩn acknowledge; tour vẫn không đổi; cho mở preview nếu BE còn cho phép |
| `Closed` | Read-only; không acknowledge; không tự suy ra nguyên nhân đóng |

Không có API hoặc mutation **Tiếp tục tour**. Rời màn hình sau acknowledge đơn giản là không thực hiện
hủy/dừng; đây không phải safety clearance.

## 7. REST API contract

### 7.1 Weather Safety Review

| Chức năng | Method/path |
| --- | --- |
| List | `GET /api/v1/operator/weather-safety-reviews?status={status}` |
| Detail | `GET /api/v1/operator/weather-safety-reviews/{reviewId}` |
| Acknowledge | `POST /api/v1/operator/weather-safety-reviews/{reviewId}/acknowledge` |

Body acknowledge:

```json
{ "immediateInstructions": "string hoặc null" }
```

### 7.2 Manual emergency action

| Chức năng | Method/path |
| --- | --- |
| Impact preview | `GET /api/v1/operator/tours/{tourId}/schedules/{scheduleId}/emergency-impact` |
| Cancel pre-start | `POST .../cancel-before-departure` |
| Emergency stop | `POST .../emergency-stop` |
| Evidence | `PUT .../emergency-evidence` |

Hai POST destructive mutation bắt buộc có `Idempotency-Key` dạng UUID.

### 7.3 BE contract gate

`WeatherSafetyReviewDto` hiện có `tourId`, `tourScheduleId`, `tourTitle`, provider, event ID và SLA,
nhưng chưa đủ dữ liệu giúp Operator quyết định. List/detail DTO cần thêm:

- `scheduleStartAtUtc`, `scheduleEndAtUtc`, `scheduleStatus`;
- `eventType`, `severity`, `description`;
- `validFromUtc`, `validToUtc`;
- `originalAuthority`, `officialVietnamRiskLevel`, `verifiedDirective`;
- `affectedAreaSummary` nullable;
- `isWithdrawn`.

BE có dữ liệu gốc trong `trip.WeatherEvents`; query join bằng provider + provider event ID hoặc một FK
được xác định rõ. Không trả raw payload hash, raw payload hoặc GeoJSON nếu FE V1 không render map.

## 8. SignalR contract

Hub: `/hubs/operator-weather-safety`, authorization `TourOperator`.

Client event `WeatherSafetyReviewChanged`:

```json
{
  "reviewId": 123,
  "tourScheduleId": 456,
  "changeType": "Created|Updated|Escalated|Closed",
  "occurredAtUtc": "2026-11-02T10:00:00Z"
}
```

- Payload chỉ là invalidation hint; FE luôn GET lại REST.
- Hub authorize và group theo Operator server-side; không broadcast cross-tenant.
- Không gửi weather description, password, booking/person data hoặc token.
- FE không gửi mutation qua SignalR.

## 9. Field specifications

| Field | UI | Required | Validation |
| --- | --- | --- | --- |
| Acknowledge note | Textarea | Không | Trim, tối đa 1000 |
| Reason | Select/radio | Có | `WeatherEmergency`, `AuthorityDirective`, `DestinationUnavailable`, `TransportFailure`, `SafetyIncident`, `Other` |
| Reason details | Textarea | Có | Trim, 1–1000 |
| Immediate instructions | Textarea | Active stop | Trim, 1–1000 |
| Emergency contact | Text | Active stop | Trim, 1–100 |
| Current password | Password | Active stop | 1–200; memory only; clear sau response |
| Evidence reference | Text | Không | Tối đa 500 |
| Evidence URL | URL | Không | Absolute HTTPS, no userinfo, tối đa 1000 |
| Authority reference | Text | Có điều kiện | Tối đa 200 |
| Add evidence later | Checkbox | Không | Cho `AuthorityDirective` khi chưa có reference |
| Withdraw evidence | Checkbox/action | Evidence update | Khi true, evidence values phải rỗng |

Client validation phục vụ UX; Backend là nguồn quyết định cuối.

## 10. Error và recovery

| Backend code/status | Hành vi FE |
| --- | --- |
| 401 | Chuyển sign-in/session-expired flow |
| 403 | Access denied; không hiển thị cache nhạy cảm |
| 404 / `weather_safety_review.not_found` | Safe not-found, không tiết lộ tenant |
| `weather_safety_review.already_closed` | Refresh detail, chuyển read-only |
| `tour_schedule.concurrent_state_changed` | Bỏ preview cũ, GET preview mới, confirm lại |
| `tour_schedule.idempotency_payload_mismatch` | Không auto-retry; tạo intent mới sau user review |
| `tour_schedule.emergency_action_window_invalid` | Refresh preview, khóa action sai cửa sổ |
| `trip_session.link_unverified` | Fail-closed, không bypass |
| `user.password_invalid` | Clear/focus password, giữ field vận hành khác |
| Network/5xx | Giữ form không nhạy cảm; retry theo idempotency rules |

Không render raw stack trace, raw ProblemDetails hoặc payload nội bộ.

## 11. Realtime, tải và cache

- REST là source of truth, dùng `no-store` cho dữ liệu Operator/emergency.
- SignalR refresh theo hint; gộp hint trùng trong cửa sổ ngắn để tránh request storm.
- Hub connected: không polling liên tục.
- Hub disconnected: polling 30 giây, tối đa một request đang chạy.
- Refresh khi tab visible lại và browser phát `online`.
- Sau mutation: invalidate list, detail, impact và tour/schedule liên quan.
- Không optimistic-update commercial state.

## 12. UX, accessibility và bảo mật

- Responsive mobile-width đến desktop; destructive action không bị keyboard/viewport che.
- Dialog quản lý focus, Escape/cancel và trả focus về trigger.
- Error summary liên kết field; status không chỉ biểu đạt bằng màu.
- Countdown có thời gian tuyệt đối theo local timezone; data giữ UTC.
- Password không persist; không log token/password/PII/full request body.
- Không demo fallback trong production route.
- Không claim realtime khi hub chưa connected; hiển thị fallback status kín đáo.

## 13. Gates trước implementation

- [x] UC-70 manual-only, owning Operator quyết định.
- [x] Operator Web list/detail được phê duyệt.
- [x] Acknowledge không mang nghĩa continue/safety clearance.
- [x] Realtime dùng SignalR hint + REST + polling fallback.
- [x] BE enrich `WeatherSafetyReviewDto` theo mục 7.3 và có integration tests.
- [x] BE có authenticated, tenant-isolated SignalR hub và integration tests.
- [x] UI wireframe/copy destructive flow được review.
- [x] Spec này được duyệt lần cuối trước production code.

## 14. Ngoài phạm vi và YAGNI

- Không auto-cancel/auto-stop.
- Không refund (UC-42), payout (UC-71), gateway hoặc reconciliation.
- Không Traveler/Admin/Mobile UI.
- Không bản đồ GeoJSON trong V1.
- Không upload file evidence; chỉ URL/reference hiện có.
- Không global state/UI framework mới.
- Không production webhook/deploy/secret configuration.
