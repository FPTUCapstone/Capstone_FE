# UC-70 — Kế hoạch triển khai Operator Web

**Spec:** [`../specs/UC-70-weather-safety-review-web-spec.md`](../specs/UC-70-weather-safety-review-web-spec.md)

**Trạng thái:** COMPLETED — ALL GATES VERIFIED (FE1–FE8 implemented and verified, 61/61 focused tests pass, build pass, lint pass, typecheck pass)

**Phương pháp:** Explore → contract gates → TDD vertical slices → two-pass review → full verification

**Giới hạn:** Không commit, push, PR hoặc deploy nếu chưa có yêu cầu riêng

## 1. Kết quả đích

```text
Weather review realtime hint
  → Operator inbox/detail
  → Acknowledge (không đổi tour)
  → BE impact preview
  → Operator manual confirm
  → CancelBeforeDeparture hoặc EmergencyStopActive
  → Evidence lifecycle
```

FE không tự hủy, không tự dừng và không xử lý refund hay payout.

## 2. Dependency graph

```text
BE0 Review DTO + SignalR contracts
  → FE0 Baseline + approved wireframe
  → FE1 Types, parsers, API boundary
  → FE2 Inbox + navigation
  → FE3 Detail + acknowledge
  → FE4 SignalR + fallback polling
  → FE5 Impact preview
  → FE6 Manual cancel/stop
  → FE7 Evidence
  → FE8 Hardening + verification + review
```

## BE0 — Đóng contract BE bắt buộc

### Công việc BE phụ thuộc

1. Enrich `WeatherSafetyReviewDto` với schedule/event fields trong spec mục 7.3.
2. Query list/detail join đúng `WeatherEvents`; cross-operator vẫn trả safe 404.
3. Thêm authenticated SignalR hub `/hubs/operator-weather-safety`.
4. Chỉ gửi `WeatherSafetyReviewChanged` cho owning Operator.
5. Phát hint sau create/update/escalate/close đã commit thành công.
6. Giữ toàn bộ manual-only invariant: signal không gọi cancellation command.

### Test BE bắt buộc

- DTO trả đúng event/schedule data và xử lý event thiếu optional fields.
- Other Operator không đọc review và không nhận hub event.
- Reconnect không replay mutation; duplicate hint không tạo side effect.
- Review create/escalate phát hint sau commit.
- Tour/Booking/TripSession/Refund không đổi khi chỉ tạo/acknowledge review.

### Done

- OpenAPI/DTO và hub payload freeze.
- Integration tests xanh trên SQL Server.
- FE có local endpoint/hub để chạy integration; không cần production deploy.

## FE0 — Baseline, UI decision và workspace safety

1. Ghi `git status`, bảo toàn các thay đổi scheduling hiện có.
2. Đọc Next.js 16 local docs cho App Router, client boundary và dynamic route.
3. Chạy baseline:

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

4. Review wireframe desktop/mobile-width cho inbox, detail, preview và destructive confirmation.
5. Chốt copy theo spec: “Đã xem cảnh báo” không phải “Tiếp tục tour”.

### Done

- Baseline được ghi trung thực; lỗi sẵn có tách khỏi UC-70.
- Wireframe/copy được duyệt.
- Không sửa trên dirty files ngoài scope.

## FE1 — Typed REST boundary và validation

### Red tests

- Parse list/detail enriched DTO, reject missing required/invalid enum/date fields.
- Parse impact/action/evidence responses.
- Acknowledge gửi đúng body; destructive POST gửi đúng `Idempotency-Key`.
- Map ProblemDetails status/code; xử lý non-JSON, empty và malformed success.
- Evidence withdrawal không gửi evidence values.

### File dự kiến

- `src/features/operator/weather-safety/types.ts`
- `src/features/operator/weather-safety/parsers.ts`
- `src/features/operator/weather-safety/weatherSafetyApi.ts`
- `src/features/operator/weather-safety/weatherSafetyApi.test.ts`
- `src/features/operator/tours/emergency/types.ts`
- `src/features/operator/tours/emergency/parsers.ts`
- `src/features/operator/tours/emergency/operatorEmergencyApi.ts`
- tests colocated tương ứng

### Quy tắc

- Reuse `AuthStorage`, `getApiBase`, native fetch và ProblemDetails convention.
- Protected reads dùng `cache: 'no-store'`; hỗ trợ AbortSignal.
- Không demo/mock fallback trong production path.

## FE2 — Route, navigation và review inbox

### Red tests

- Owning Operator thấy list newest-first và filter đúng status.
- Loading/empty/error/retry/malformed states.
- Deadline/escalation có accessible text, không chỉ màu.
- Navigation badge dùng server result; direct navigation hoạt động.
- Route guard chặn sai role/session.

### File dự kiến

- `app/partner/weather-safety-reviews/layout.tsx`
- `app/partner/weather-safety-reviews/page.tsx`
- `src/features/operator/weather-safety/components/WeatherSafetyReviewListPage.tsx`
- `src/features/operator/weather-safety/components/WeatherSafetyReviewList.tsx`
- `src/features/operator/weather-safety/components/WeatherSafetyReviewStatusBadge.tsx`
- `src/features/operator/weather-safety/components/ReviewDeadline.tsx`
- `src/features/operator/tours/components/OperatorTourNav.tsx`
- `src/features/operator/common/resources/en.ts`
- `src/lib/routes.ts`
- component/route tests tương ứng

### Done

- List thật qua REST, không fixture success.
- Badge/list refresh sau mutation và realtime hint.

## FE3 — Detail và acknowledge

### Red tests

- Detail hiển thị event/schedule fields, optional/null và withdrawn state đúng.
- Không render raw GeoJSON/provider payload.
- Acknowledge gửi note tối đa 1000, disable double-submit.
- Idempotent replay render state hiện tại.
- Closed → read-only; cross-operator/not-found → safe 404.
- Acknowledge không thay đổi text/status tour ở client.

### File dự kiến

- `app/partner/weather-safety-reviews/[reviewId]/page.tsx`
- `src/features/operator/weather-safety/components/WeatherSafetyReviewDetailPage.tsx`
- `src/features/operator/weather-safety/components/WeatherEventSummary.tsx`
- `src/features/operator/weather-safety/components/AcknowledgeReviewForm.tsx`
- tests tương ứng

## FE4 — SignalR và polling fallback

### Dependency

Thêm `@microsoft/signalr` sau khi hub contract freeze. Đây là dependency mới duy nhất được duyệt vì
current bearer-token session không phù hợp native `EventSource` header và BE chọn SignalR.

### Red tests

- Connection dùng access token factory nhưng không log token.
- Event hợp lệ chỉ invalidate/refetch; không dùng event payload làm domain state.
- Duplicate/burst hints được coalesce, tối đa một refresh đang chạy.
- Reconnect có bounded backoff.
- Khi disconnected, polling 30 giây; khi connected thì dừng polling.
- Refresh khi tab visible/online; cleanup listeners/timers khi unmount/logout.
- Hint không bao giờ gọi acknowledge/cancel/stop/evidence mutation.

### File dự kiến

- `src/features/operator/weather-safety/realtime/weatherSafetyHub.ts`
- `src/features/operator/weather-safety/realtime/useWeatherSafetyRealtime.ts`
- tests tương ứng
- `package.json`, `package-lock.json`

## FE5 — Impact preview

### Red tests

- Từ detail review dùng đúng `tourId` + `tourScheduleId`.
- Render đúng counts và money từ BE; không local calculation.
- `impactVersion` không render/log.
- `hasUnverifiedSessions` khóa mọi destructive confirmation.
- Refresh preview ngay trước confirmation.
- Window/terminal/not-found/conflict states có hành động phục hồi rõ.

### File dự kiến

- `src/features/operator/tours/emergency/components/EmergencyImpactPanel.tsx`
- `src/features/operator/tours/emergency/components/EmergencyImpactSummary.tsx`
- tests tương ứng

## FE6 — Manual cancel và Emergency Stop

### Slice A: CancelBeforeDeparture

- Red tests cho validation reason/details, conditional authority evidence và confirmation summary.
- Sinh một UUID cho một intent; same-payload retry giữ key; payload đổi tạo key mới.
- Success refresh review, impact và tour/schedule; không hiển thị kết quả refund.

### Slice B: EmergencyStopActive

- Red tests cho password/instructions/contact/future due time.
- Password memory-only, clear trên success/failure/abort; invalid password clear/focus riêng field.
- Confirmation mô tả Booking/TripSession `Interrupted`.

### File dự kiến

- `src/features/operator/tours/emergency/components/CancelBeforeDepartureForm.tsx`
- `src/features/operator/tours/emergency/components/EmergencyStopForm.tsx`
- `src/features/operator/tours/emergency/components/EmergencyConfirmationDialog.tsx`
- `src/features/operator/tours/emergency/components/EmergencyActionResult.tsx`
- `src/features/operator/tours/emergency/validation.ts`
- tests tương ứng

## FE7 — Evidence lifecycle

### Red tests

- Add/replace cần ít nhất một value.
- HTTPS/no-userinfo/max-length validation.
- Withdraw gửi boolean và field rỗng.
- Không outbound fetch evidence URL.
- Provenance luôn là Operator-provided.

### File dự kiến

- `src/features/operator/tours/emergency/components/EmergencyEvidenceEditor.tsx`
- tests tương ứng

## FE8 — Hardening, integration và review

### Behavioral coverage

- Pending → acknowledge → no commercial mutation.
- Escalated → acknowledge → detail refresh.
- Review → impact → cancel pre-start.
- Review → impact → active stop với step-up password.
- Stale impact → refresh → confirm lại.
- Lost mutation response → same-key retry.
- Hub event → REST refresh; hub loss → polling fallback.
- 401/403/404/409/422/malformed/network/5xx.
- Keyboard, focus return, mobile-width, long text, timezone và countdown.

### Two-pass review

1. **Spec compliance:** manual-only; không refund/payout/Mobile/Admin/auto-cancel scope creep.
2. **Standards/security:** route ownership, runtime parsing, auth, tenant isolation, password safety,
   idempotency, accessibility, cleanup và YAGNI.

### Full verification

```powershell
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
git status --short
```

Chạy controlled local E2E với BE + SQL Server:

1. Inject signed weather payload vào local webhook.
2. Xác nhận list/detail nhận review qua REST và SignalR hint.
3. Acknowledge, kiểm tra tour/booking/session/refund không đổi.
4. Chạy riêng cancel pre-start và active stop trên fixtures phù hợp.
5. Kiểm tra cross-operator isolation và duplicate/reconnect behavior.

## 3. Definition of Done

- BE0 và FE0 gates đóng.
- Tất cả acceptance criteria có mapping tới test.
- Required commands pass; không có skipped test mới.
- Local real integration pass, không chỉ mock.
- Không secret/token/password/PII trong log hoặc artifact.
- Không auto-cancel/auto-stop; commercial mutation chỉ sau explicit confirmation.
- Không commit/push/PR/deploy ngoài chỉ đạo riêng.

## 4. YAGNI và đánh đổi

Không làm trong lượt này:

- map GeoJSON;
- file upload evidence;
- browser notification/FCM;
- UI refund (UC-42), payout (UC-71) hoặc payment gateway;
- Mobile/Admin surface;
- global state/query framework mới;
- production Tomorrow.io/Railway configuration.

Đánh đổi: SignalR thêm một client dependency và BE hub. REST vẫn là source of truth; polling chỉ là fallback
để giảm tải API và tránh phụ thuộc tuyệt đối vào kết nối realtime.
