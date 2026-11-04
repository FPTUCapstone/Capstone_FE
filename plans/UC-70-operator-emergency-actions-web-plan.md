# UC-70 — Kế hoạch triển khai Web cho thao tác khẩn cấp của Tour Operator

> **SUPERSEDED:** Kế hoạch canonical gồm Weather Safety Review, realtime và manual emergency action
> nằm tại [`UC-70-weather-safety-review-web-plan.md`](./UC-70-weather-safety-review-web-plan.md).

**Trạng thái:** BLOCKED — chờ giải quyết SRS conflict và duyệt Web Screen Specification

**Spec:** [`../specs/UC-70-operator-emergency-web-spec.md`](../specs/UC-70-operator-emergency-web-spec.md)

**BE:** Contract đã freeze; Emergency integration `37 passed, 0 failed, 0 skipped`

## 1. Nguyên tắc thực hiện

- Chưa viết production code khi governance gate `FE0` chưa đóng.
- TDD theo từng vertical slice: red behavioral test → minimal implementation → refactor.
- Reuse auth, native fetch, ProblemDetails, form, dialog và route conventions hiện có.
- Route hoặc modal shape là quyết định của approved Web Screen Specification, không mặc định
  tạo route mới.
- Bảo toàn mọi thay đổi không thuộc UC-70 trong worktree.
- Không commit, push, tạo PR hoặc deploy khi chưa có yêu cầu riêng.

## 2. Dependency graph

```text
FE0 Governance approval
  → FE1 Baseline and seam confirmation
  → FE2 Domain/API boundary
  → FE3 Impact preview vertical slice
  → FE4 Pre-start cancellation vertical slice
  → FE5 Active emergency-stop vertical slice
  → FE6 Evidence lifecycle
  → FE7 Recovery, accessibility and responsive hardening
  → FE8 Full verification and two-pass review
```

Mỗi task chỉ hoàn thành khi test của chính task xanh và review spec/standards không còn finding
Critical.

## FE0 — Đóng governance gate

### Công việc

1. Product/BA sửa SRS hoặc tách manual Operator declaration thành UC riêng.
2. Cập nhật `docs/WEB_SCOPE_MATRIX.md`: bỏ `BLOCKED_BY_SRS_CONFLICT` khi có căn cứ.
3. Duyệt Web Screen Specification cho desktop/mobile-width:
   - entry point trong Tour workspace;
   - route, panel hoặc dialog shape;
   - impact/confirmation/success/error states;
   - copy và destructive hierarchy.
4. Duyệt `specs/UC-70-operator-emergency-web-spec.md`.

### Done

- Có link tới tài liệu phê duyệt và không còn mâu thuẫn với scope matrix.
- Interaction shape và entry point được chốt; agent không phải tự suy diễn.

## FE1 — Baseline và xác nhận seam

### Công việc

1. Đọc `AGENTS.md`, README, CONTRIBUTING, `docs/CODEBASE_RULES.md` và Next.js docs local liên quan.
2. Chụp `git status`; ghi nhận user changes cần bảo toàn.
3. Chạy baseline:

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

4. Inspect `app/partner/tours`, `src/features/operator/tours`, HTTP client, auth/error mapper,
   form/dialog primitives và test utilities.
5. Ghi exact file list sau khi Screen Specification chốt; ưu tiên capability folder:
   `src/features/operator/tours/emergency/`.

### Done

- Baseline kết quả được ghi; pre-existing failure được phân biệt với UC-70.
- Không có dependency mới; seam và file list được duyệt.

## FE2 — Domain model và typed API boundary

### Red tests

- Parse đúng impact/action/evidence responses.
- Reject response thiếu trường bắt buộc hoặc sai type theo convention repo.
- Gửi đúng method, URL, JSON body và `Idempotency-Key`.
- Map 401/403/404/409/validation ProblemDetails sang typed error.
- Evidence withdrawal không gửi evidence values.

### Minimal implementation

Dự kiến tạo:

- `src/features/operator/tours/emergency/types.ts`
- `src/features/operator/tours/emergency/parsers.ts` nếu codebase dùng runtime parser;
- `src/features/operator/tours/emergency/operatorEmergencyApi.ts`
- `src/features/operator/tours/emergency/operatorEmergencyService.ts`
- test colocated theo convention hiện có.

Cập nhật tour/departure status model để giữ nguyên `EmergencyStopped`; không collapse về
`Scheduled`.

### Done

- Bốn endpoint chạy qua HTTP/auth convention thật.
- Không có mock/demo fallback trong production path.
- API boundary tests xanh.

## FE3 — Impact preview vertical slice

### Red tests

- Entry point chỉ xuất hiện theo screen contract; BE vẫn quyết định eligibility cuối.
- Loading → impact summary.
- Paid/unpaid bookings, passengers, sessions và tickets render đúng.
- `hasUnverifiedSessions=true` disable confirm và hiển thị fail-closed warning.
- Forbidden/not-found/terminal/network retry có trạng thái riêng.

### Minimal implementation

- Thin App Router composition hoặc approved embedded surface.
- Impact loader/controller trong capability folder.
- Impact summary component, error state và reload action.
- `impactVersion` giữ trong state/data layer, không render.

### Done

- Không có local business calculation.
- Không có mutation khi preview chưa thành công hoặc link chưa xác minh.

## FE4 — Pre-start cancellation vertical slice

### Red tests

- Required reason/details; optional pre-start emergency contact/evidence.
- `AuthorityDirective` yêu cầu reference hoặc `addEvidenceLater`.
- Confirmation hiển thị departure + impact mới nhất.
- Double-click chỉ gọi một mutation.
- Same-payload retry giữ idempotency key; payload mới dùng key mới.
- Success invalidate/reload departure và preview.
- UI không hiển thị refund, payout hay settlement.

### Minimal implementation

- Pre-start form và validation.
- Confirmation dialog theo approved design.
- Intent-scoped idempotency coordinator dùng `crypto.randomUUID()`.
- Success summary chỉ dùng fields từ `EmergencyTourActionResponse`.

### Done

- Happy path và error path tests xanh.
- Request không invent `currentPassword`.

## FE5 — Active emergency-stop vertical slice

### Red tests

- Bắt buộc password, instructions, contact và future decision due time.
- Password không vào storage, URL, logs hoặc serialized retry state.
- Response bất kể success/failure đều clear password.
- Invalid password clear/focus password nhưng giữ operational fields.
- Stale preview reload và bắt xác nhận lại.

### Minimal implementation

- Active-stop form.
- Password field với safe autocomplete theo convention bảo mật của repo.
- Confirmation dialog và pending lock.
- Success summary dựa đúng action response.

### Done

- Password safety tests và behavioral tests xanh.
- Không có Admin, refund (UC-42) hay payout (UC-71) UI.

## FE6 — Evidence lifecycle

### Red tests

- Add/replace ít nhất một evidence value.
- HTTPS URL validation, không userinfo, max 1000.
- Withdraw gửi `withdrawEvidence=true` và fields rỗng.
- Response provenance hiển thị đúng, không gọi là system verified.
- FE không fetch evidence URL.

### Minimal implementation

- Evidence editor dưới approved operation/schedule surface.
- Add/replace/withdraw confirmation và result state.

### Done

- Evidence behavior tests xanh; không có outbound fetch ngoài API TripMate.

## FE7 — Recovery, accessibility và responsive hardening

### Công việc/test

- Map đủ stable BE error codes trong spec.
- Conflict bỏ preview cũ; idempotency mismatch không auto-retry.
- Dialog trap/restore focus; Escape/cancel; error summary liên kết field.
- Không chỉ dùng màu cho severity.
- Kiểm tra desktop và mobile-width; action không bị viewport/keyboard che.
- Kiểm tra loading, empty, pending, success, retry và terminal states.
- Kiểm tra reduced motion/contrast theo primitives hiện có.

### Done

- Accessibility/responsive behavioral checks không còn finding Critical.
- Không có raw stack trace hoặc sensitive payload trong UI/log.

## FE8 — Verification và review

### Two-pass review

1. **Spec review:** mọi user story/acceptance criterion được map tới code và test; không có
   refund/payout/Mobile/Admin scope creep.
2. **Standards review:** App Router boundary, auth/API convention, TypeScript, accessibility,
   security và YAGNI đều đạt.

### Commands

```powershell
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
git status --short
```

### Done

- Tất cả command bắt buộc pass; không có skipped test mới.
- Real API integration được xác minh; không claim DONE nếu chỉ chạy mock.
- Responsive và accessibility được kiểm tra.
- File debug/temp do task tạo đã dọn; evidence/report chính thức được giữ.
- Báo cáo PASS/FAIL/BLOCKED, exact test counts, changed files và risk còn lại.

## 3. YAGNI và ranh giới

Không thêm:

- Traveler Mobile hoặc FCM UI;
- refund (UC-42) và payout (UC-71);
- UC-28 installments;
- Admin approval;
- auto-cancel từ weather/UC-14;
- evidence verification/crawling;
- global state/UI framework/dependency mới khi code hiện tại đã đủ.

## 4. Trạng thái hiện tại

- BE contract: **READY**.
- FE spec: **READY FOR REVIEW**.
- SRS/Web ownership: **BLOCKED**.
- Web Screen Specification/UI: **BLOCKED/PENDING APPROVAL**.
- Production implementation: **NOT STARTED**.
