# ACTIVE-TRIP-STAFF-ACCESS — Implementation Plan (FE)

Spec: `specs/ACTIVE-TRIP-STAFF-ACCESS-fe-spec.md` (đã duyệt)
Branch: `fix/linhnv-view-active-trip` (base `develop`)

## Task duy nhất (TDD: đỏ → xanh → refactor)

**T1 — Đổi tiêu đề eyebrow trang Active Trips.**

1. Đỏ:
   - Rà soát `ActiveTripsScreen.test.tsx`: nếu có assertion trên text "Administrator monitoring", đổi kỳ vọng sang "Active Trip Monitoring"; nếu chưa có assertion nào trên eyebrow, thêm một test nhỏ khẳng định text mới xuất hiện.
   - Chạy test, xác nhận đỏ.
2. Xanh:
   - `ActiveTripsScreen.tsx:89`: đổi nội dung `<p>` từ `Administrator monitoring` → `Active Trip Monitoring`.
   - Chạy lại test, xác nhận xanh.
3. Refactor: không cần — đổi một chuỗi tĩnh.

## Không làm trong plan này

- Không đụng `AdminSidebar.tsx`, `activeTripsProxy.ts`, `activeTripsService.ts` (đã đúng, xem spec mục 2–3).

## Xác minh cuối

- `npm run lint`
- `npm run typecheck`
- `npm test -- ActiveTripsScreen` (hoặc toàn bộ suite active-trips)
- `npm run build`

## Cần người duyệt

- Plan này chỉ có 1 task, phạm vi rất nhỏ — xin duyệt để triển khai thẳng.
