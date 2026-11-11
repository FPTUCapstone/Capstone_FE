# ACTIVE-TRIP-STAFF-ACCESS — FE Spec (draft, chờ duyệt)

Nhánh: `fix/linhnv-view-active-trip` (từ `develop`)
Nguồn: SRS mới §3.9.6.1/§3.9.6.2 (UC-58/UC-59). Đi kèm BE spec `ACTIVE-TRIP-STAFF-ACCESS-spec.md`.

## 1. Bối cảnh

BE đang sửa để Staff gọi được `/api/v1/admin/trips/active*` (xem BE spec). Phía FE không cần sửa logic truy cập — sidebar Staff đã có sẵn mục "Active Trips" trỏ đúng route (`AdminSidebar.tsx:77`, comment "Navigation schema based on Table 3"). Chỉ còn một chỗ lệch: tiêu đề trang.

## 2. Hiện trạng code (đã kiểm tra)

| Hạng mục | Vị trí | Trạng thái |
|---|---|---|
| Route cho Staff trong sidebar | `src/features/admin/shared/components/AdminSidebar.tsx:77` | Đã đúng (Staff section → `ROUTES.admin.activeTrips`, label "Active Trips") |
| Route cho Administrator trong sidebar | `src/features/admin/shared/components/AdminSidebar.tsx:104` | Đã đúng (Admin section → cùng route, label "Live Monitoring") |
| Tiêu đề eyebrow trên trang | `src/features/admin/active-trips/ActiveTripsScreen.tsx:89` | Cứng chữ "Administrator monitoring" — không đổi theo role, gây hiểu lầm khi Staff mở trang |
| Proxy BFF | `src/features/admin/active-trips/activeTripsProxy.ts` | Không đổi gì — chỉ forward Bearer token của session admin-console (dùng chung cho cả Staff/Administrator), không tự giới hạn role ở tầng này |

## 3. Phạm vi

Trong phạm vi:
- Đổi text eyebrow tĩnh "Administrator monitoring" → **"Active Trip Monitoring"** (khớp đúng tên mục 3.9.6 trong SRS, trung lập theo role, không cần thêm state/props mới).

Ngoài phạm vi:
- Không đổi `AdminSidebar.tsx` (đã đúng).
- Không thêm logic hiển thị khác nhau theo role cho trang này (over-engineering cho một fix nhỏ — `ActiveTripsScreen` hiện không nhận prop role, không cần thêm).
- Không đổi `activeTripsProxy.ts` / `activeTripsService.ts` (không có logic role ở FE, toàn bộ enforcement nằm ở BE — đúng thiết kế hiện tại, giữ nguyên).

## 4. Việc cần làm (Task 1 trong plan)

- `ActiveTripsScreen.tsx:89`: đổi `<p className="...">Administrator monitoring</p>` → `Active Trip Monitoring`.
- Cập nhật `ActiveTripsScreen.test.tsx` nếu có assertion trên text cũ.

## 5. Kiểm tra thủ công sau khi sửa (không tự động hoá)

- Đăng nhập Staff → mở Active Trips → không còn "Access denied" (phụ thuộc BE đã deploy fix) → tiêu đề hiển thị "Active Trip Monitoring".
- Đăng nhập Administrator → vẫn truy cập được bình thường, tiêu đề cũng là "Active Trip Monitoring" (không còn phân biệt).
