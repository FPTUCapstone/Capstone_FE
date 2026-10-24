# MA TRẬN PHÂN QUYỀN VÀ TRUY CẬP VAI TRÒ (RBAC & AUTHORIZATION MATRIX)
## TRIPMATE — WORKSPACE QUẢN TRỊ HỆ THỐNG
**Mã tài liệu:** BATCH E0 — BẢN THIẾT KẾ KIẾẾN TRÚC BẢO MẬT & PHÂN QUYỀN  
**Ngày lập:** 23/10/2026  
**Cơ sở thẩm quyền cao nhất:** `Report3_Software-Requirement-Specification.docx` (Bản SRS gốc của Dự án TripMate)  

---

## 1. NGUYÊN TẮC PHÂN ĐỊNH VAI TRÒ THEO SRS GỐC

Theo Định nghĩa Tác tử tại **Bảng 1 (Table 1 — Actors)** và **Bảng Danh mục Use Case (Table 2 — Use Case Catalogue)** của SRS gốc:

### 1.1. Vai trò Administrator (Quản trị viên Hệ thống)
- **Bản chất vai trò:** Quản trị chiến lược, bảo mật hệ thống, giám sát tài chính và quản lý tài khoản nhân viên.
- **Quyền hạn cốt lõi:**
  - Quản lý tài khoản nội bộ (Staff) và xem xét toàn bộ tài khoản người dùng (Traveler, Tour Operator) (UC-47, UC-48, UC-49, Screen #36).
  - Phê duyệt và xác nhận quyết toán rút tiền cuối cùng cho Tour Operator sau khi Staff đã thẩm định (UC-65 — Confirm Payout Settlement).
  - Cấu hình các tham số thuật toán quan trọng của hệ thống: thời gian đệm, tốc độ di chuyển, bán kính định tuyến lại, ngưỡng thời tiết (UC-57).
  - Truy cập, tra cứu và điều tra nhật ký kiểm toán hệ thống (Audit Logs) (UC-68, UC-69).
  - Khai thác và xuất các báo cáo tài chính nền tảng và báo cáo thống kê toàn diện (UC-67, Screen #37, #38).
  - Thực hiện các thao tác master-data đặc quyền như Vô hiệu hóa hoặc Xóa điểm tham quan (UC-54 — Remove POI).

### 1.2. Vai trò Staff (Nhân viên Vận hành)
- **Bản chất vai trò:** Nhân viên điều hành tác nghiệp hàng ngày trên nền tảng Web Quản trị.
- **Quyền hạn cốt lõi:**
  - Thẩm định hồ sơ đăng ký kinh doanh và giấy phép lữ hành của Tour Operator (UC-50, UC-51).
  - Kiểm duyệt chất lượng nội dung, lịch trình và giá bán các gói tour do Tour Operator đề xuất (UC-60, UC-61).
  - Giám sát các chuyến đi đang diễn ra theo thời gian thực (Active Trips Monitoring) và xử lý sự cố lộ trình (UC-58, UC-59).
  - Giám sát các đơn đặt tour trên toàn hệ thống (Platform Bookings Oversight) (UC-62).
  - Khởi tạo, cập nhật dữ liệu điểm tham quan (POI) và dữ liệu các đoạn tuyến đường kết nối (UC-52, UC-53, UC-55, UC-56).
  - Tiếp nhận, thẩm định chi tiết và phê duyệt/từ chối các yêu cầu rút tiền của Tour Operator (UC-63, UC-64, UC-73, UC-74).
  - Quản lý và biên tập nội dung hiển thị trên trang chủ công khai (Landing Page Content) (UC-66).
  - Quản lý trạng thái khóa/mở khóa các tài khoản người dùng thông thường (Traveler, Tour Operator) (UC-47, UC-48, UC-49).
- **Giới hạn nghiêm ngặt:** Staff **KHÔNG ĐƯỢC PHÉP** xác nhận giải ngân tài chính cuối cùng, không được chỉnh sửa tham số thuật toán cốt lõi, không được xóa vĩnh viễn POI, và không có quyền truy cập nhật ký kiểm toán cấp cao (Audit Logs).

---

## 2. MA TRẬN PHÂN QUYỀN VÀ TRUY CẬP CHI TIẾT (RBAC SCREEN ACCESS MATRIX)

Bảng ma trận đối chiếu toàn bộ các chức năng quản trị với 5 vai trò người dùng trong hệ thống:
- **ADM:** Administrator
- **STF:** Staff
- **GST:** Guest (Khách vãng lai)
- **TRV:** Traveler (Khách du lịch)
- **TOP:** Tour Operator (Công ty lữ hành)

| UC ID | Chức năng (Function) | Tác tử SRS gốc (Table 1, 2) | Ma trận SRS (Table 5) | Thẩm quyền thực tế Mục 3.9 | Route đề xuất / Hiện tại | FE Guard hiện tại | Backend / BFF Auth | UI Readiness | Đánh giá & Phát hiện (Findings) |
|---|---|---|---|---|---|---|---|---|---|
| **UC-04** | Đăng nhập Quản trị (Admin Sign In) | Admin / Staff | ADM: X<br>STF: X | ADM, STF | `/admin/login` | Công khai | `/api/v1/auth/web/admin/login` | COMPLIANT | Cấp phiên làm việc bảo mật riêng cho Admin và Staff. Đã có cơ chế kiểm tra `status === 'Active'`. |
| **UC-05** | Đăng xuất Quản trị (Admin Sign Out) | Admin / Staff | ADM: X<br>STF: X | ADM, STF | Action (Topbar/Menu) | Kiểm tra session | Xóa cookie phiên qua DELETE `/api/admin/session` | COMPLIANT | Đăng xuất xóa bỏ hoàn toàn token và chữ ký niêm phong. |
| **UC-06** | Khôi phục mật khẩu (Reset Password) | Admin / Staff | ADM: X<br>STF: X | ADM, STF | `/admin/forgot-password` | Công khai | Client-side stub | COMPLIANT | Luồng khôi phục riêng biệt cho tài khoản quản trị. |
| **UC-07** | Đổi mật khẩu tài khoản (Change Password) | Admin / Staff | ADM: X<br>STF: X | ADM, STF | `/admin/account/security` | ADM, STF | Proxy `/api/admin/account/security/change-password` | COMPLIANT | Hoạt động tốt cho cả 2 vai trò. |
| **N/A** | Dashboard Quản trị (Admin Dashboard) | Administrator | ADM: X<br>STF: - | ADM | `/admin` | Chặn Staff (`redirect /admin/staff`) | Kiểm tra role session | COMPLIANT | Cổng thông tin trung tâm cho Administrator. |
| **N/A** | Dashboard Vận hành (Staff Dashboard) | Staff | ADM: -<br>STF: X | STF | `/admin/staff` | Cho phép cả 2 vai trò | Không có | **MISMATCH** | Cần cập nhật để Administrator chỉ có thể truy cập ở chế độ giám sát, tránh hiển thị liên kết thừa. |
| **UC-47** | Xem danh sách tài khoản (View User Accounts) | Staff / Administrator | ADM: X<br>STF: X | ADM (§3.9.1.1) | `/admin/users` | **Chặn Staff hoàn toàn** | Chưa có backend proxy | **MISMATCH (P1)** | **Mâu thuẫn:** SRS trao quyền cho Staff xem tài khoản Traveler/Operator, nhưng FE đang chặn Staff! Cần mở quyền cho Staff xem và chỉ ẩn tài khoản Staff đối với Staff. |
| **UC-48** | Khóa tài khoản người dùng (Lock User Account) | Staff / Administrator | ADM: X<br>STF: X | ADM (§3.9.1.2) | `/admin/users/[userId]` | **Chặn Staff** | Chưa có backend proxy | **MISMATCH (P1)** | Staff được phép khóa Traveler/Operator vi phạm; Administrator có thêm quyền khóa tài khoản Staff. |
| **UC-49** | Mở khóa tài khoản (Unlock User Account) | Staff / Administrator | ADM: X<br>STF: X | ADM (§3.9.1.3) | `/admin/users/[userId]` | **Chặn Staff** | Chưa có backend proxy | **MISMATCH (P1)** | Tương tự UC-48, cần mở quyền cho Staff trong phạm vi tài khoản đối tác và khách du lịch. |
| **Screen #36** | Tạo tài khoản Nhân viên (Create Staff Account) | Administrator | ADM: X<br>STF: - | ADM | *(Chưa có route)* | Chưa có | Chưa có | **MISSING_IMPLEMENTATION** | Tính năng đặc quyền của Administrator để mở rộng đội ngũ vận hành. Cần bổ sung vào roadmap tương lai. |
| **UC-50** | Duyệt hồ sơ Tour Operator (Approve Operator App) | **Staff** | ADM: -<br>STF: X | ADM (§3.9.2.1) | `/admin/tour-operator-applications/[userId]` | **Chặn Staff, cho phép Admin** | Proxy duyệt hồ sơ | **MISMATCH (P0)** | **Nghịch đảo quyền nghiêm trọng:** Table 1, 2 và Table 5 chỉ định rõ vai trò Staff duyệt hồ sơ đối tác. FE code hiện tại lại chặn Staff và chỉ cho Admin duyệt! Cần đảo ngược lại đúng chuẩn SRS. |
| **UC-51** | Từ chối hồ sơ Tour Operator (Reject Operator App) | **Staff** | ADM: -<br>STF: X | ADM (§3.9.2.2) | `/admin/tour-operator-applications/[userId]` | **Chặn Staff, cho phép Admin** | Proxy từ chối hồ sơ | **MISMATCH (P0)** | Tương tự UC-50, Staff là người nhập lý do từ chối để đối tác bổ sung giấy phép. |
| **Screen #10** | Hàng đợi hồ sơ chờ duyệt (Pending Operator Apps) | **Staff** | ADM: -<br>STF: X | STF | `/admin/tour-operator-applications` | **Chưa có route!** (404) | Chưa có | **MISSING_IMPLEMENTATION (P0)** | Thiếu hẳn màn hình danh sách hàng đợi hồ sơ chờ duyệt! Hiện chỉ có trang chi tiết `[userId]`. |
| **UC-52** | Tạo mới Điểm tham quan (Create POI) | Staff / Administrator | ADM: X<br>STF: X | ADM (§3.9.3.1) | `/admin/catalogue/points-of-interest/new` | **Chặn Admin, chỉ cho Staff** | Proxy `/api/admin/pois` gọi POST `/api/v1/admin/pois` | **MISMATCH (P1)** | **Lỗi phân quyền & Bố cục:** Chặn Administrator tạo POI là sai quy định SRS. Màn hình này còn bị đặt ngoài layout `(console)`. Cần cho phép cả Admin và Staff tạo POI. |
| **UC-53** | Cập nhật Điểm tham quan (Update POI) | Staff / Administrator | ADM: X<br>STF: X | ADM (§3.9.3.2) | *(Chưa có route chi tiết)* | Chưa có | Chưa có | **MISSING_IMPLEMENTATION** | Chưa triển khai form chỉnh sửa POI hiện hữu. |
| **UC-54** | Vô hiệu hóa / Xóa POI (Remove POI) | **Administrator** | ADM: X<br>STF: - | ADM (§3.9.3.3) | *(Chưa có route)* | Chưa có | Chưa có | **MISSING_IMPLEMENTATION** | Hành động phá hủy/nguy cơ cao, chỉ dành riêng cho Administrator. |
| **Screen #16** | Danh mục POI Master Data | Staff / Administrator | ADM: X<br>STF: X | ADM, STF | *(Chưa có route)* | Chưa có | Chưa có | **MISSING_IMPLEMENTATION** | Cần có trang danh sách POI tra cứu cho cả 2 vai trò. |
| **UC-55** | Tạo mới Tuyến đường (Create Route) | **Staff** | ADM: -<br>STF: X | ADM (§3.9.4.1) | `/admin/routes/create` | **Chặn Staff** | Chưa có | **MISMATCH (P2)** | SRS trao quyền cho Staff xây dựng lộ trình, nhưng FE chặn Staff và UI hiện tại là UnavailableView. |
| **UC-56** | Cập nhật Tuyến đường (Update Route) | **Staff** | ADM: -<br>STF: X | ADM (§3.9.4.2) | `/admin/routes` | **Chặn Staff** | Chưa có | **MISMATCH (P2)** | Tương tự UC-55. |
| **UC-57** | Cấu hình tham số thuật toán (Algorithm Config) | **Administrator** | ADM: X<br>STF: - | ADM (§3.9.5) | `/admin/settings/algorithm-parameters` | Chặn Staff (`AccessDenied`) | Proxy `/api/admin/system-configs/algorithm-parameters` | **COMPLIANT** | Đúng đặc quyền Admin. Triển khai chuẩn chỉ, đầy đủ validation. |
| **UC-58** | Giám sát chuyến đi hoạt động (Active Trips) | **Staff** | ADM: -<br>STF: X | Staff (§3.9.6.1) | `/admin/trips/active` | Không chặn trong code, nhưng **ẩn khỏi menu Staff** | Proxy `/api/admin/trips/active` | **MISMATCH (P1)** | SRS quy định đây là công việc trực ban của Staff, nhưng menu lại chỉ hiển thị cho Admin. Cần hiển thị trên menu Staff. |
| **UC-59** | Xem chi tiết chuyến đi (Active Trip Details) | **Staff** | ADM: -<br>STF: X | ADM (§3.9.6.2) | `/admin/trips/active/[id]` | Không chặn trong code | Proxy `/api/admin/trips/active/[id]` | **COMPLIANT** (Cần gán đúng vào luồng điều hướng của Staff). |
| **UC-60** | Phê duyệt bài đăng Tour (Approve Tour Post) | **Staff** | ADM: -<br>STF: X | ADM (§3.9.7.1) | `/admin/tours/reviews` & `[id]` | **Chặn Staff, hiển thị cho Admin** | `NO_BACKEND` (Hỗ trợ demo) | **MISMATCH (P0)** | **Nghịch đảo vai trò:** Table 1, 2 và Table 5 phân công Staff kiểm duyệt bài tour. FE hiện tại lại chặn Staff và mở cho Admin. Cần đưa về cho Staff. |
| **UC-61** | Từ chối bài đăng Tour (Reject Tour Post) | **Staff** | ADM: -<br>STF: X | ADM (§3.9.7.2) | `/admin/tours/reviews/[id]` | **Chặn Staff, hiển thị cho Admin** | `NO_BACKEND` (Hỗ trợ demo) | **MISMATCH (P0)** | Tương tự UC-60, quyền kiểm duyệt tour thuộc về Staff. |
| **UC-62** | Giám sát đơn đặt chỗ nền tảng (Platform Bookings) | **Staff** | ADM: -<br>STF: X | ADM (§3.9.8) | *(Chưa có route)* | Chưa có | Chưa có | **MISSING_IMPLEMENTATION** | Chưa triển khai giao diện giám sát đặt tour toàn sàn cho Staff. |
| **UC-63** | Xem danh sách yêu cầu rút tiền (Payout Records) | **Staff / Admin** | ADM: X<br>STF: X | ADM (§3.9.9.1) | `/admin/payouts` | **Chặn Admin ở FE & BFF Proxy** | Proxy `/api/admin/payouts` chỉ cho Staff | **MISMATCH (P0)** | **Tắc nghẽn quy trình tài chính:** Table 5 cho phép cả Admin và Staff xem danh sách Payout. Việc FE và Proxy chặn hoàn toàn Admin khiến Admin không thể xem để thực hiện quyền xác nhận quyết toán (UC-65)! |
| **UC-64** | Thẩm định yêu cầu rút tiền (Review Payout Request) | **Staff** | ADM: -<br>STF: X | ADM (§3.9.9.2) | `/admin/payouts/[payoutId]` | Chặn Admin | Proxy `/api/admin/payouts/[payoutId]` | **COMPLIANT** | Đúng chức năng Staff kiểm tra đối soát số liệu trước khi duyệt. |
| **UC-73** | Chấp thuận yêu cầu rút tiền (Approve Payout Request) | **Staff** | ADM: X*(Lỗi T5)*<br>STF: X | STF | Dialog trên `/admin/payouts/[payoutId]` | Chặn Admin | Proxy `/api/admin/payouts/[payoutId]/approve` | **COMPLIANT** (Về mặt triển khai nghiệp vụ Staff). *(Lưu ý lỗi đánh dấu cột Admin tại dòng 98 Table 5 của SRS)*. |
| **UC-74** | Từ chối yêu cầu rút tiền (Reject Payout Request) | **Staff** | ADM: X*(Lỗi T5)*<br>STF: X | STF | Dialog trên `/admin/payouts/[payoutId]` | Chặn Admin | Proxy `/api/admin/payouts/[payoutId]/reject` | **COMPLIANT** (Về mặt triển khai nghiệp vụ Staff). *(Lưu ý lỗi đánh dấu cột Admin tại dòng 99 Table 5 của SRS)*. |
| **UC-65** | Xác nhận quyết toán rút tiền (Confirm Settlement) | **Administrator** | ADM: X<br>STF: - | ADM (§3.9.9.3) | *(Chưa có UI chuyên biệt)* | Chưa có | Chưa có | **MISSING_IMPLEMENTATION (P0)** | **Khoảng trống nghiệp vụ:** Sau khi Staff duyệt chuyển sang `ApprovedForSettlement`, Administrator phải có giao diện xác nhận giải ngân qua cổng thanh toán/ngân hàng. Hiện FE chưa có màn hình hoặc action này! |
| **UC-66** | Quản lý nội dung trang chủ (Landing Content) | **Staff** | ADM: -<br>STF: X | ADM (§3.9.10) | `/admin/landing-content` | Cho phép cả Admin & Staff | Proxy `/api/admin/landing-content` | **COMPLIANT** | Có proxy và màn hình quản lý đầy đủ. Cần đưa vào menu của Staff. |
| **UC-67** | Xuất báo cáo thống kê (Export Statistical Reports) | **Administrator** | ADM: X<br>STF: - | ADM (§3.9.11) | `/admin/reports` | Chặn Staff (`AccessDenied`) | Client-side mock / Fixture demo mode | **COMPLIANT** | Đúng phân quyền Admin. Cần kết nối API tổng hợp thực tế. |
| **Screen #37, 38** | Báo cáo Doanh thu Nền tảng (Platform Revenue) | **Administrator** | ADM: X<br>STF: - | ADM | Tích hợp trong `/admin/reports` | Chặn Staff | Client-side mock | **COMPLIANT** | Báo cáo tài chính cấp cao của Admin. |
| **UC-68** | Xem nhật ký kiểm toán (View Audit Logs) | **Administrator** | ADM: X<br>STF: - | ADM (§3.9.12.1) | `/admin/audit-logs` | Chặn Staff (`AccessDenied`) | Proxy `/api/admin/audit-logs` | **COMPLIANT** | Đúng đặc quyền Admin. Triển khai hoàn chỉnh, bảng dữ liệu tốt. |
| **UC-69** | Xem chi tiết nhật ký kiểm toán (Audit Log Details) | **Administrator** | ADM: X<br>STF: - | ADM (§3.9.12.2) | Drawer trên `/admin/audit-logs` | Chặn Staff | Proxy `/api/admin/audit-logs/[id]` | **COMPLIANT** | Đúng đặc quyền Admin. |

---

## 3. CÁC PHÁT HIỆN KIỂM TOÁN BẢO MẬT TRỌNG YẾU (SECURITY & RBAC AUDIT FINDINGS)

### 3.1. [SEC-01] Xung đột Mô hình Phiên làm việc (Public Sign-In vs Admin BFF Session)
- **Mô tả:** Hệ thống hiện có 2 luồng đăng nhập:
  1. `/sign-in` (Công khai): Sử dụng `useWebSession`, lưu trữ token trong bộ nhớ và cookie công khai, giải mã JWT cho các vai trò `Traveler`, `TourOperator`, `Administrator`, `Staff`. Trong `signInDestination.ts`, nếu vai trò là `Administrator`, hàm điều hướng về `/admin`, nếu là `Staff`, điều hướng về `/admin/staff`.
  2. `/admin/login` (Dành riêng cho Quản trị): Gọi API `/api/admin/session` (POST), yêu cầu Backend trả về token và Next.js BFF tạo một chữ ký niêm phong HMAC-SHA256 (`tripmate_admin_session_seal`) cùng cookie HttpOnly `tripmate_admin_access_token`.
- **Hậu quả bảo mật / Trải nghiệm:** Nếu Administrator hoặc Staff đăng nhập qua trang `/sign-in` công khai, họ được chuyển hướng đến `/admin` hoặc `/admin/staff`. Tuy nhiên, `AdminConsoleLayout` (`app/admin/(console)/layout.tsx`) gọi hàm `verifyAdminSessionFromCookies` để kiểm tra chữ ký niêm phong `tripmate_admin_session_seal`. Vì đăng nhập công khai không tạo ra seal này, kiểm tra thất bại và người dùng lập tức bị văng ngược về `/admin/login`!
- **Khuyến nghị:** Cần tách biệt rõ ràng ranh giới: Mọi tài khoản nội bộ muốn vào Workspace Quản trị phải bắt buộc đăng nhập qua `/admin/login` có niêm phong mật mã; hoặc `/sign-in` phải chuyển hướng trực tiếp sang `/admin/login` nếu phát hiện tài khoản nội bộ.

### 3.2. [SEC-02] Nghịch đảo Phân quyền trong Quy trình Quyết toán Rút tiền (Payouts)
- **Mô tả:** Theo quy trình 2 bước của TripMate:
  - **Bước 1 (Staff):** Staff xem danh sách (UC-63), kiểm tra đối soát chi tiết (UC-64), duyệt (UC-73) hoặc từ chối (UC-74). Khi Staff duyệt, trạng thái chuyển thành `ApprovedForSettlement`.
  - **Bước 2 (Administrator):** Administrator kiểm tra danh sách các yêu cầu đã được Staff duyệt và bấm xác nhận giải ngân qua ngân hàng/cổng thanh toán (UC-65 — Confirm Payout Settlement).
- **Thực trạng triển khai:** Tuyến đường `/admin/payouts` và proxy `/api/admin/payouts` hiện tại kiểm tra cứng: `if (session.role !== 'Staff') return AccessDenied`.
- **Hậu quả:** Administrator bị chặn hoàn toàn khỏi màn hình Payouts! Do đó Administrator không thể nhìn thấy các khoản đã duyệt để thực hiện UC-65. Quy trình giải ngân tài chính bị tắc nghẽn 100%.

### 3.3. [SEC-03] Nghịch đảo Phân quyền trong Kiểm duyệt Tour và Duyệt Đối tác
- **Mô tả:** Table 1, 2 và Table 5 của SRS gốc giao việc duyệt hồ sơ Tour Operator (UC-50, 51) và duyệt bài đăng Tour (UC-60, 61) cho **Staff**. Đây là công việc tác nghiệp vận hành hàng ngày.
- **Thực trạng triển khai:**
  - `/admin/tour-operator-applications/[userId]`: Code kiểm tra `if (session.role === 'Staff') return <AdminAccessDeniedView />` -> Chặn Staff, chỉ mở cho Admin!
  - `/admin/tours/reviews`: Code kiểm tra `if (session.role === 'Staff') return <AdminAccessDeniedView />` -> Chặn Staff, chỉ mở cho Admin!
- **Hậu quả:** Staff không thể làm công việc kiểm duyệt của mình, trong khi Administrator lại phải gánh vác các thao tác kiểm duyệt vi mô thay vì tập trung vào quản trị vĩ mô.

### 3.4. [SEC-04] Cấu hình Cứng `STAFF_ALLOWED_EXACT_ROUTES` tại Form Đăng nhập
- **Mô tả:** Trong file `src/features/admin/auth/AdminSignInForm.tsx` (dòng 19-24), danh sách các route Staff được phép truy cập bị gán cứng chỉ gồm 4 route:
  ```ts
  const STAFF_ALLOWED_EXACT_ROUTES = new Set<string>([
    ROUTES.admin.staffDashboard,
    ROUTES.admin.accountSecurity,
    ROUTES.admin.payouts,
    ROUTES.admin.createPoi,
  ]);
  ```
  Tất cả các route quản trị còn lại đều bị hàm `isAdministratorOnlyPathname()` quy kết là dành riêng cho Administrator!
- **Hậu quả:** Khi Staff đăng nhập thành công với một `returnUrl` hợp lệ (như xem chi tiết chuyến đi, chỉnh sửa nội dung trang chủ, danh bạ tài khoản), hệ thống tự ý tước đoạt `returnUrl` và ép Staff về trang chủ `/admin/staff`.

### 3.5. [SEC-05] Màn hình Tạo POI Bị Lệch Khỏi Khung Giao diện Quản trị
- **Mô tả:** Màn hình tạo POI nằm tại `app/admin/catalogue/points-of-interest/new/page.tsx`, nằm ngoài thư mục `app/admin/(console)`.
- **Hậu quả:** Màn hình này không kế thừa layout chung, không có thanh điều hướng `AdminNavigation`, và chặn Administrator truy cập (`if (session.role !== 'Staff') return AccessDenied`).

---

## 4. KẾ HOẠCH ĐIỀU CHỈNH MA TRẬN PHÂN QUYỀN MỤC TIÊU CHO BATCH E

| Khu vực chức năng | Phân quyền đề xuất cho Staff | Phân quyền đề xuất cho Administrator | Cơ sở SRS |
|---|---|---|---|
| **Duyệt hồ sơ Tour Operator** | **Thẩm quyền chính:** Xem danh sách hàng đợi, thẩm định chi tiết hồ sơ, Phê duyệt (Active) hoặc Từ chối (nhập lý do). | **Quyền giám sát:** Xem danh sách và chi tiết hồ sơ ở chế độ chỉ đọc. | Table 1, Table 2 (UC-50, 51), Table 5 (Dòng 13, 14, 15). |
| **Kiểm duyệt bài đăng Tour** | **Thẩm quyền chính:** Xem danh sách tour chờ duyệt, kiểm tra lịch trình/giá vé, Phê duyệt hoặc Yêu cầu chỉnh sửa. | **Quyền giám sát:** Xem danh sách và chi tiết ở chế độ chỉ đọc. | Table 1, Table 2 (UC-60, 61), Table 5 (Dòng 16, 17, 18). |
| **Quản lý Yêu cầu Rút tiền** | **Bước 1 (Thẩm định):** Xem danh sách, đối soát số liệu, Phê duyệt (chuyển sang `ApprovedForSettlement`) hoặc Từ chối. | **Bước 2 (Giải ngân):** Xem danh sách các khoản đã duyệt và bấm Xác nhận Quyết toán cuối cùng (UC-65). | Table 1, Table 2 (UC-63, 64, 65, 73, 74), Table 5 (Dòng 30, 31, 32, 33). |
| **Quản lý Điểm tham quan (POI)** | Xem danh sách, Tạo mới POI, Chỉnh sửa thông tin POI. | Xem danh sách, Tạo mới POI, Chỉnh sửa thông tin POI, **Vô hiệu hóa / Xóa POI (Đặc quyền riêng)**. | Table 1, Table 2 (UC-52, 53, 54), Table 5 (Dòng 19, 20, 21, 22). |
| **Quản lý Tuyến đường (Routes)** | Xem danh sách tuyến đường, Tạo mới tuyến, Cập nhật tuyến kết nối. | Quyền xem giám sát. | Table 1, Table 2 (UC-55, 56), Table 5 (Dòng 23, 24, 25). |
| **Giám sát Chuyến đi (Active Trips)** | **Thẩm quyền chính:** Trực ban giám sát các chuyến đi thời gian thực, xem lộ trình, cảnh báo sự cố, định tuyến lại. | Quyền xem giám sát toàn cục. | Table 1, Table 2 (UC-58, 59), Table 5 (Dòng 27, 28). |
| **Quản lý Đơn đặt chỗ (Bookings)** | Xem danh sách đơn đặt tour toàn sàn, tra cứu trạng thái thanh toán, hỗ trợ thông tin khách hàng. | Quyền xem báo cáo thống kê đơn đặt. | Table 1, Table 2 (UC-62), Table 5 (Dòng 29). |
| **Quản trị Tài khoản Người dùng** | Tra cứu danh bạ, xem chi tiết tài khoản Traveler & Tour Operator, Khóa / Mở khóa tài khoản thông thường. | Xem toàn bộ tài khoản (bao gồm cả Staff), Khóa / Mở khóa toàn bộ, **Tạo mới tài khoản Staff**. | Table 1, Table 2 (UC-47, 48, 49), Table 5 (Dòng 7, 8, 9, 10, 11). |
| **Nội dung Trang chủ (Landing)** | Quản lý banner, biên tập địa điểm nổi bật, quản lý bài viết trên trang chủ công khai. | Quyền xem và kiểm duyệt nội dung. | Table 1, Table 2 (UC-66), Table 5 (Dòng 34). |
| **Cấu hình Tham số Thuật toán** | **Không có quyền truy cập.** | **Đặc quyền riêng:** Chỉnh sửa thời gian đệm, tốc độ di chuyển, bán kính định tuyến, ngưỡng thời tiết. | Table 1, Table 2 (UC-57), Table 5 (Dòng 26). |
| **Nhật ký Kiểm toán (Audit Logs)** | **Không có quyền truy cập.** | **Đặc quyền riêng:** Tra cứu toàn bộ lịch sử thao tác hệ thống, xem log chi tiết sự kiện bảo mật. | Table 1, Table 2 (UC-68, 69), Table 5 (Dòng 36, 37). |
| **Báo cáo Thống kê & Doanh thu** | Xem các chỉ số KPI vận hành hàng ngày (số lượng đơn, số tour chờ duyệt). | Khai thác Báo cáo Doanh thu nền tảng, Báo cáo Thống kê tổng hợp và Xuất dữ liệu CSV/Excel/PDF. | Table 1, Table 2 (UC-67), Table 5 (Dòng 35, 96, 97). |
