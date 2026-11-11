# BÁO CÁO KIỂM KÊ VÀ ĐÁNH GIÁ MÀN HÌNH QUẢN TRỊ (ADMIN & STAFF SCREEN AUDIT)
## TRIPMATE — WORKSPACE QUẢN TRỊ HỆ THỐNG
**Mã đợt thực hiện:** BATCH E0 — GIAI ĐOẠN NGHIÊN CỨU & QUY HOẠCH MASTER PLAN  
**Ngày kiểm định:** 23/10/2026  
**Môi trường kiểm tra:** Kho mã nguồn `FPTUCapstone/Capstone_FE`, nhánh `develop` (Baseline SHA: `f5d71c991e2c26ce008766f12698df9d8eeb9cb4`)  
**Tài liệu tham chiếu gốc:** `Report3_Software-Requirement-Specification.docx` (Bản SRS gốc của Dự án TripMate)  

---

## 1. TỔNG QUAN HIỆN TRẠNG TRIỂN KHAI

Hệ thống Quản trị Web của TripMate (`app/admin/` và `src/features/admin/`) hiện tại phục vụ 2 vai trò nội bộ: **Administrator (Quản trị viên)** và **Staff (Nhân viên vận hành)**.

Qua đợt kiểm kê toàn diện mã nguồn thực tế tại commit `f5d71c9`, cấu trúc hiện tại bao gồm:
1. **Khung giao diện (Layout):** Sử dụng `app/admin/(console)/layout.tsx` bao bọc hầu hết các tuyến đường quản trị, ngoại trừ `/admin/catalogue/points-of-interest/new` bị đặt lệch bên ngoài nhóm route `(console)`.
2. **Thanh điều hướng (Navigation):** `AdminNavigation.tsx` hiện là một thanh ngang cố định (`sticky top-0`) với bảng màu tối cổ điển (`#00152a`, `#102a43`, `#71f8e4`), chưa áp dụng bảng màu đã duyệt **Forest & Warm Ivory**. Thanh điều hướng hiện đang chứa các điều kiện phân quyền cứng gây nghịch đảo vai trò nghiệp vụ so với SRS gốc.
3. **Mô hình phiên làm việc (BFF Session):** Xác thực quản trị thông qua cookie `tripmate_admin_access_token` và chữ ký niêm phong HMAC-SHA256 `tripmate_admin_session_seal` do Next.js BFF cấp phát độc lập tại `/api/admin/session`. Phiên làm việc này tách biệt hoàn toàn với phiên làm việc công khai của Traveler / Tour Operator.

---

## 2. PHÂN LOẠI TRẠNG THÁI KIỂM KÊ (AUDIT CLASSIFICATION)

Mỗi màn hình/chức năng được đánh giá theo 5 tiêu chí chuẩn hóa:
- **COMPLIANT:** Đã triển khai tuyến đường, giao diện, bảo vệ quyền đúng với SRS gốc và có kết nối API/Proxy an toàn.
- **MISMATCH:** Có sự sai lệch giữa triển khai thực tế với SRS gốc (nghịch đảo vai trò phân quyền, sai lệch hành vi, hoặc đặt sai vị trí cấu trúc).
- **MISSING_IMPLEMENTATION:** Chức năng có trong SRS gốc nhưng chưa có route hoặc chỉ là giao diện giữ chỗ trống (`UnavailableView`).
- **AMBIGUOUS_REQUIREMENT:** Có sự mâu thuẫn ngay trong nội bộ tài liệu SRS giữa Bảng danh mục UC, Bảng ma trận phân quyền Table 5, và phần mô tả chi tiết Mục 3.9.
- **NOT_VERIFIED:** Chưa thể kiểm chứng đầy đủ do phụ thuộc API Backend chưa sẵn sàng trong môi trường thử nghiệm.

---

## 3. BẢNG KIỂM KÊ CHI TIẾT CÁC TUYẾN ĐƯỜNG VÀ MÀN HÌNH QUẢN TRỊ

| Tuyến đường (Route) | Màn hình theo SRS (Table 4.1) | Vai trò SRS gốc | FE Guard thực tế | Backend / Proxy Auth | Tình trạng API / Dữ liệu | Trạng thái hiển thị Menu | Phân loại | Ghi chú & Rủi ro |
|---|---|---|---|---|---|---|---|---|
| `/admin/login` | Screen #2: Administration Login | Admin / Staff | Công khai (Public Form) | Gọi `/api/v1/auth/web/admin/login` qua BFF | Real API Backend | Không có trong thanh menu | **COMPLIANT** | Xác thực tập trung cho cả Admin và Staff, cấp cookie bảo mật niêm phong. |
| `/admin/forgot-password` | Screen #3: Administration Reset Password | Admin / Staff | Công khai (Public Form) | Client proxy sang API recovery | Prototype / Stub | Không có trong thanh menu | **COMPLIANT** | Luồng quên mật khẩu quản trị tách biệt. |
| `/admin/account/security` | Screen #4: Administration Change Password | Admin / Staff | Kiểm tra session Admin/Staff | Proxy `/api/admin/account/security/change-password` | Real API Backend | Có (Nút Khóa bảo mật) | **COMPLIANT** | Cho phép đổi mật khẩu tài khoản quản trị hiện tại. |
| `/admin` | Screen #5: Admin Dashboard | Administrator | Chặn Staff (`redirect /admin/staff`) | Kiểm tra session role Administrator | Static Hub / Khối trạng thái trung thực | Có (System Overview) | **COMPLIANT** | Dashboard quản trị hệ thống, hiển thị các khối chức năng và ghi chú trạng thái trung thực. |
| `/admin/staff` | Screen #35: Staff Dashboard | Staff | Cho phép cả Staff & Admin truy cập | Không có proxy riêng | Static Hub / Khối trạng thái trung thực | Có (Staff Workspace) | **MISMATCH** | `/admin/staff` không chặn Administrator, trong khi `AdminNavigation` lại hiển thị link Staff Workspace cho cả Admin. |
| `/admin/users` | Screen #6: User Accounts List (UC-47) | Admin / Staff | Chặn Staff (`if Staff return AccessDenied`) | Chưa có backend proxy | `UserAccountDirectoryUnavailableView` | **Không có trong menu** | **MISMATCH** | **Lỗi nghiêm trọng:** SRS cho phép Staff xem tài khoản Traveler/Operator, nhưng FE code hiện tại chặn toàn bộ Staff! Chưa có route trong menu. |
| `/admin/users/[userId]` | Screen #7: User Account Details (UC-48, 49) | Admin / Staff | Chặn Staff (`if Staff return AccessDenied`) | Chưa có backend proxy | `UserAccountDetailUnavailableView` | Không có trong menu | **MISMATCH** | Chặn Staff xem chi tiết tài khoản. Chưa có chức năng Khóa/Mở khóa hoạt động. |
| `/admin/tour-operator-applications` | Screen #10: Pending Operator Applications List (UC-50, 51) | Staff | **Chưa có route!** (404) | Không có | Không có | **Không có trong menu** | **MISSING_IMPLEMENTATION** | **Thiếu route danh sách:** Chỉ có route chi tiết `[userId]`, không có trang danh sách hàng đợi duyệt hồ sơ Tour Operator! |
| `/admin/tour-operator-applications/[userId]` | Screen #11, 12: Operator Application Details & Rejection Reason | Staff | Chặn Staff (`if Staff return AccessDenied`) | Proxy `/api/admin/tour-operator-applications/[userId]` | Real API Backend (Approve / Reject) | Không có trong menu | **MISMATCH** | **Nghịch đảo quyền nghiêm trọng:** SRS quy định Staff là người duyệt/từ chối hồ sơ đối tác (UC-50, 51), nhưng FE lại chặn Staff và chỉ cho Admin truy cập! |
| `/admin/tours/reviews` | Screen #13: Pending Tour Posts List (UC-60, 61) | Staff | Chặn Staff (`if Staff return AccessDenied`) | `NO_BACKEND` (Hỗ trợ chế độ Demo qua query `?demo=1`) | Chế độ Demo Fixtures / Trả về `NO_BACKEND` ở production | Có (Tour Reviews - chỉ Admin thấy) | **MISMATCH** | **Nghịch đảo quyền:** SRS quy định Staff duyệt tour (UC-60, 61), nhưng FE chặn Staff và đưa vào menu Admin! Chưa có API Backend thực tế. |
| `/admin/tours/reviews/[id]` | Screen #14, 15: Tour Content Details & Rejection Reason | Staff | Chặn Staff (`if Staff return AccessDenied`) | `NO_BACKEND` (Demo mode) | Chế độ Demo Fixtures | Không có trong menu | **MISMATCH** | Cùng rủi ro nghịch đảo vai trò với màn hình danh sách. |
| `/admin/catalogue/points-of-interest/new` | Screen #17: Create POI (UC-52) | Admin / Staff | Chặn Admin (`if session.role !== 'Staff' return AccessDenied`) | Proxy `/api/admin/pois` gọi Backend POST `/api/v1/admin/pois` | Real API Backend (Flat DTO) | Có (POI Catalog - chỉ Staff thấy) | **MISMATCH** | **Bị cô lập ngoài Layout:** Nằm ngoài `(console)` nên mất thanh điều hướng. Chặn Admin tạo POI trong khi SRS Table 1, 2, 4.1 và Table 5 đều cho phép Admin tạo POI. |
| `/admin/catalogue/points-of-interest` | Screen #16: POIs & Master Data List | Admin / Staff | **Chưa có route!** | Không có | Không có | **Không có trong menu** | **MISSING_IMPLEMENTATION** | Thiếu màn hình danh sách POI master data. Hiện chỉ có màn hình tạo mới `/new`. |
| `/admin/routes` | Screen #20: Routes List (UC-55, 56) | Staff | Chặn Staff (`if Staff return AccessDenied`) | Không có | `RouteDirectoryUnavailableView` | **Không có trong menu** | **MISMATCH** | SRS quy định Staff quản lý tuyến đường, nhưng FE chặn Staff và giao diện là `UnavailableView`. |
| `/admin/routes/create` | Screen #21: Create Route (UC-55) | Staff | Chặn Staff (`if Staff return AccessDenied`) | Không có | `CreateRouteUnavailableView` | **Không có trong menu** | **MISMATCH** | Nghịch đảo quyền và thiếu triển khai chức năng. |
| `/admin/settings/algorithm-parameters` | Screen #23: Algorithm Parameters Configuration (UC-57) | Administrator | Chặn Staff (`if Staff return AccessDenied`) | Proxy `/api/admin/system-configs/algorithm-parameters` | Real API Backend (GET / PUT) | Có (Algorithm Settings - chỉ Admin thấy) | **COMPLIANT** | Triển khai hoàn chỉnh, đúng thẩm quyền Admin, có xác thực dữ liệu chặt chẽ và proxy BFF an toàn. |
| `/admin/trips/active` | Screen #24: Active Trips Monitor (UC-58) | Staff | Không kiểm tra role trong page (cho phép cả 2) | Proxy `/api/admin/trips/active` | Real API Backend | Có (Active Trips - **chỉ hiển thị cho Admin**) | **MISMATCH** | SRS quy định Staff giám sát chuyến đi (Table 2, 4.1, 5). Tuy nhiên trên thanh điều hướng lại chỉ hiển thị cho Admin (`!isStaffUser`)! |
| `/admin/trips/active/[id]` | Screen #25: Active Trip Details (UC-59) | Staff | Không kiểm tra role trong page | Proxy `/api/admin/trips/active/[id]` | Real API Backend | Không có trong menu | **COMPLIANT** | Có proxy và màn hình chi tiết, tuy nhiên cần đồng bộ quyền truy cập chính thức cho Staff. |
| `/admin/payouts` | Screen #28: Payout Records List (UC-63) | Staff / Admin | Chặn Admin (`if session.role !== 'Staff' return AccessDenied`) | Proxy `/api/admin/payouts` (chặn Admin ở cấp độ proxy BFF) | Real API Backend | Có (Payout Records - chỉ Staff thấy) | **MISMATCH** | **Rủi ro vận hành nghiêm trọng:** Table 5 SRS cho phép cả Admin và Staff xem danh sách Payout. Việc chặn Admin khiến Admin không thể xem để thực hiện quyết toán (UC-65). |
| `/admin/payouts/[payoutId]` | Screen #39, 40, 41: Payout Request Review (UC-64, 73, 74) | Staff | Chặn Admin (`if session.role !== 'Staff' return AccessDenied`) | Proxy `/api/admin/payouts/[payoutId]` | Real API Backend (Duyệt / Từ chối) | Không có trong menu | **COMPLIANT** | Đúng vai trò Staff xem xét và phê duyệt/từ chối theo quy trình 2 bước. |
| *(Chưa có route)* | Screen #30: Confirm Payout Settlement (UC-65) | Administrator | Chưa có UI riêng | Chưa có endpoint quyết toán cuối | Chưa có | Không có | **MISSING_IMPLEMENTATION** | Chưa có màn hình hoặc hộp thoại xác nhận quyết toán ngân hàng dành cho Administrator sau khi Staff đã duyệt. |
| `/admin/landing-content` | Screen #31: Landing Page Content Management (UC-66) | Staff | Cho phép cả Admin & Staff | Proxy `/api/admin/landing-content` | Real API Backend | **Không có trong menu** | **COMPLIANT** | Triển khai tốt việc quản lý banner, điểm đến nổi bật, bài viết; tuy nhiên chưa được đưa vào thanh điều hướng. |
| `/admin/reports` | Screen #32, 37, 38: Statistical Reports (UC-67) & Revenue Reports | Administrator | Chặn Staff (`if Staff return AccessDenied`) | Chạy client-side mock / Fixture demo mode | Demo Mode / Client generator | Có (Statistical Reports - chỉ Admin thấy) | **COMPLIANT** (về mặt phân quyền UI) | Đúng quyền Admin. Có hỗ trợ xem báo cáo doanh thu và xuất CSV. Cần tích hợp endpoint API tổng hợp thực tế từ Backend. |
| `/admin/audit-logs` | Screen #33, 34: System Audit Logs List & Details (UC-68, 69) | Administrator | Chặn Staff (`if Staff return AccessDenied`) | Proxy `/api/admin/audit-logs` | Real API Backend | Có (Audit Logs - chỉ Admin thấy) | **COMPLIANT** | Triển khai hoàn chỉnh bảng nhật ký, bộ lọc, phân trang và drawer xem chi tiết log kỹ thuật. |
| *(Chưa có route)* | Screen #26, 27: Platform Bookings List & Details (UC-62) | Staff | Chưa có route | Chưa có endpoint | Chưa có | Không có | **MISSING_IMPLEMENTATION** | Chưa triển khai màn hình giám sát toàn bộ đơn đặt chỗ trên nền tảng dành cho Staff. |
| *(Chưa có route)* | Screen #36: Create Staff Account | Administrator | Chưa có route | Chưa có endpoint | Chưa có | Không có | **MISSING_IMPLEMENTATION** | Chưa triển khai màn hình tạo tài khoản Staff dành cho Administrator. |

---

## 4. ĐÁNH GIÁ THIẾT KẾ GIAO DIỆN HIỆN TẠI (DESIGN AUDIT)

### 4.1. Màu sắc và Token
- Các màn hình hiện tại đang sử dụng các mã màu hardcode từ giao diện dùng chung: `#00152a` (Navy đậm), `#102a43` (Navy container), `#71f8e4` (Cyan neon), `#314863` (Viền xám xanh).
- Cách phối màu này khiến giao diện trông giống một bảng điều khiển công nghệ viễn tưởng (Sci-fi dashboard) hơn là một không gian điều hành nghiệp vụ du lịch chuyên nghiệp.
- **Yêu cầu chuyển đổi:** Cần thay thế toàn bộ lớp hiển thị sang bảng màu **Forest & Warm Ivory** đã được duyệt:
  - Sidebar: Forest Charcoal (`#1C2923`)
  - Nút tác vụ chính: Deep Forest Green (`#245747`)
  - Nhấn phụ & Trạng thái: Sage Green (`#758B74`), Muted Copper (`#B87558`)
  - Nền không gian làm việc: Warm Ivory (`#F7F6F2`)

### 4.2. Bố cục và Tính công thái học (Ergonomics)
- Thanh điều hướng ngang hiện tại (`AdminNavigation.tsx`) quá chật chội khi thêm nhiều tính năng, gây tràn chữ trên màn hình máy tính bảng và màn hình laptop tiêu chuẩn (1366x768).
- Không có cấu trúc Breadcrumbs (Đường dẫn phân cấp) chuẩn, khiến người dùng khó định vị khi đi sâu vào các trang chi tiết (`/admin/tours/reviews/[id]`, `/admin/payouts/[payoutId]`).
- Thiếu bố cục Sidebar dọc chuyên dụng — chuẩn mực của các ứng dụng quản trị doanh nghiệp (Enterprise SaaS / Internal Operations) giúp phân nhóm tác vụ rõ ràng.

### 4.3. Đánh giá Khả năng Tiếp cận (Accessibility — WCAG 2.2 AA)
- Độ tương phản của một số thẻ trạng thái nền cyan `#71f8e4` với chữ trắng hoặc xám nhạt không đạt tỷ lệ tương phản tối thiểu 4.5:1.
- Màn hình `/admin/catalogue/points-of-interest/new` bị mất thanh điều hướng chung do nằm ngoài layout `(console)`, khiến người dùng không có cách quay lại trang chủ quản trị ngoài việc ấn nút Back của trình duyệt.
- Chưa có trạng thái `focus-visible` đồng nhất trên toàn bộ các bảng dữ liệu và nút bấm hành động.

---

## 5. KẾT LUẬN VÀ KIẾN NGHỊ BẮT BUỘC CHO BATCH E

1. **Chuẩn hóa khung Layout duy nhất:** Đưa `/admin/catalogue/points-of-interest/new` vào chung cấu trúc Layout quản trị thống nhất.
2. **Khắc phục triệt để nghịch đảo phân quyền:** Sửa đổi các Page Guard và Proxy BFF để Staff thực hiện đúng nhiệm vụ vận hành (Duyệt tour, Duyệt đối tác, Giám sát chuyến đi, Xem tài khoản) và Administrator thực hiện đúng nhiệm vụ quản trị cấp cao (Quyết toán tài chính, Cấu hình thuật toán, Kiểm toán log, Quản trị tài khoản nội bộ).
3. **Nâng cấp thành Sidebar Điều hướng:** Thay thế thanh header ngang bằng Sidebar dọc linh hoạt hỗ trợ thu gọn/mở rộng, tích hợp cấu trúc menu theo vai trò người dùng (Role-aware menu).
4. **Áp dụng bộ Token Độc lập:** Thiết lập bộ biến CSS cục bộ dành riêng cho Workspace Quản trị theo bảng màu **Forest & Warm Ivory** mà không làm ảnh hưởng đến các màn hình công khai khác.
