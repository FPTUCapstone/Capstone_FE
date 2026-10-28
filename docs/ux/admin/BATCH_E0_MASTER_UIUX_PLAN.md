# BẢN QUY HOẠCH TỔNG THỂ UI/UX WORKSPACE QUẢN TRỊ (MASTER UI/UX PLAN)
## VAI TRÒ STAFF & ADMINISTRATOR — TRIPMATE WEB
**Mã tài liệu:** BATCH E0 — MASTER UI/UX ARCHITECTURAL SPECIFICATION  
**Trạng thái:** ĐỊNH HƯỚNG THỊ GIÁC ĐÃ ĐƯỢC PHÊ DUYỆT (FOREST & WARM IVORY)  
**Ngày lập báo cáo:** 23/10/2026  
**Chủ trì đồ án:** Nhóm Kiến trúc sư UI/UX, Frontend & Bảo mật Hệ thống TripMate  
**Đối tượng thụ hưởng:** UI Owner, Lead Engineer, Product Owner và Đội ngũ Phát triển Frontend  

---

## 1. TỔNG QUAN VÀ BỐI CẢNH DỰ ÁN (EXECUTIVE SUMMARY)

TripMate là Nền tảng Bản đồ Du lịch Thông minh và Cổng dịch vụ Đa người dùng dành cho khu vực Miền Trung Việt Nam (Đà Nẵng, Hội An, Cố Đô Huế). Phân hệ Quản trị Web (Administration Workspace) là đầu não điều hành tập trung phục vụ hai vai trò nội bộ:
1. **Staff (Nhân viên Vận hành):** Điều phối các hoạt động tác nghiệp hàng ngày, thẩm định hồ sơ đối tác Tour Operator, kiểm duyệt tour, trực ban giám sát chuyến đi thời gian thực, đối soát rút tiền và quản lý nội dung.
2. **Administrator (Quản trị viên Hệ thống):** Chịu trách nhiệm bảo mật cấp cao, quyết toán tài chính cuối cùng, cấu hình thuật toán lõi, kiểm toán nhật ký an ninh và quản trị tài khoản nội bộ.

**Đợt thực hiện BATCH E0** là giai đoạn khảo sát, đánh giá nguồn sự thật, kiểm toán phân quyền, kiến trúc thông tin, định hình thư viện component dùng chung và lập kế hoạch tổng thể. **Giai đoạn này không can thiệp sửa đổi mã nguồn sản xuất, không merge, không push và không deploy.**

---

## 2. NGUỒN SỰ THẬT VÀ KIỂM CHỨNG BASELINE (BASELINE & SOURCE OF TRUTH)

### 2.1. Nguồn sự thật thẩm quyền tối cao
- **Tài liệu SRS Thẩm quyền:** Bản đặc tả yêu cầu phần mềm gốc `Report3_Software-Requirement-Specification.docx` (Bản gốc Report 3, không dùng bản V2 lỗi thời).
- **Thứ bậc ưu tiên tài liệu:**
  1. Các quyết định thay đổi mới nhất được phê duyệt bằng văn bản có bằng chứng truy xuất.
  2. Bản SRS gốc `Report3_Software-Requirement-Specification.docx`.
  3. Báo cáo Report 1 và Report 2.
  4. Các tài liệu đặc tả phụ trợ được phê duyệt phù hợp với SRS.
  5. Mã nguồn và các cam kết kiểm thử thực tế trên Git/Jira.
  6. Các giả định cũ từ tài liệu V2 lỗi thời.

### 2.2. Kiểm chứng Baseline Git
- **Kho lưu trữ:** `FPTUCapstone/Capstone_FE`
- **Nhánh tích hợp mục tiêu:** `origin/develop`
- **Baseline SHA xác thực:** `f5d71c991e2c26ce008766f12698df9d8eeb9cb4`
- **Nhánh làm việc cách ly:** `design/batch-e-administration-ux-master-plan`
- **Worktree cách ly:** `D:/FPT_University_các kì/CapStone_TripMate_DoAn/Capstone_FE-batch-e0`
- **Tình trạng nhánh:** Sạch hoàn toàn (Clean), đã chạy kiểm tra xác nhận 253 test files (2806 tests) đều pass, 0 lỗi TypeScript, 0 lỗi ESLint, build production thành công.

---

## 3. CÁC PHÁT HIỆN KIỂM TOÁN TRỌNG YẾU (KEY AUDIT FINDINGS)

Qua quá trình rà soát toàn diện giữa mã nguồn hiện tại và SRS gốc, phát hiện 5 vấn đề cốt lõi cần giải quyết:

1. **Nghịch đảo Vai trò Kiểm duyệt & Thẩm định (Critical Role Inversions):**
   - **Duyệt hồ sơ Tour Operator (UC-50, 51):** SRS quy định Staff duyệt, nhưng mã nguồn FE (`/admin/tour-operator-applications/[userId]`) lại chặn Staff và chỉ cho Admin truy cập.
   - **Kiểm duyệt bài đăng Tour (UC-60, 61):** SRS quy định Staff kiểm duyệt, nhưng mã nguồn FE (`/admin/tours/reviews`) lại chặn Staff và chỉ cho Admin truy cập.
   - **Tạo mới Điểm tham quan (UC-52):** SRS cho phép cả Admin và Staff, nhưng FE code (`/admin/catalogue/points-of-interest/new`) lại chặn Admin.
2. **Tắc nghẽn Quy trình Quyết toán Tài chính (Payout Settlement Deadlock):**
   - Tuyến đường `/admin/payouts` và proxy BFF hiện tại chặn toàn bộ Administrator (`if (session.role !== 'Staff') return AccessDenied`).
   - Do đó, Administrator không thể xem danh sách các yêu cầu rút tiền đã được Staff thẩm định (`ApprovedForSettlement`) để thực hiện thao tác Xác nhận quyết toán giải ngân cuối cùng (UC-65).
3. **Màn hình Tạo POI Bị Lệch Khung Giao diện:**
   - Màn hình `/admin/catalogue/points-of-interest/new` bị đặt nhầm bên ngoài thư mục `app/admin/(console)/`, dẫn đến việc không có thanh điều hướng chung và bị cô lập trải nghiệm.
4. **Hạn chế Cứng các Tuyến đường của Staff:**
   - Trong `AdminSignInForm.tsx`, tập hợp `STAFF_ALLOWED_EXACT_ROUTES` chỉ khai báo 4 route cho Staff. Mọi route khác đều bị coi là Admin-only, tước đoạt quyền xem danh bạ tài khoản, giám sát chuyến đi hoặc chỉnh sửa nội dung của Staff khi đăng nhập qua `returnUrl`.
5. **Mâu thuẫn Nội bộ trong Tài liệu SRS:**
   - Tại Bảng 5 (Screen Authorization Matrix) của SRS gốc, hai dòng số 98 và 99 (Approve/Reject Payout Request Confirmation) đánh dấu 'X' nhầm vào cột Administrator, trong khi Bảng 1, Bảng 2 (UC-73, UC-74), Bảng 4.1 (Dòng 40, 41) đều khẳng định đây là thẩm quyền của Staff. Cần được UI Owner và PO phê duyệt chuẩn hóa.

---

## 4. HỆ THỐNG MÀU SẮC ĐÃ DUYỆT: FOREST & WARM IVORY

### 4.1. Bảng màu Cốt lõi (Approved Palette)
Định hướng thị giác: **Ấm áp, Tối giản, Đậm chất Nghiệp vụ Tự nhiên (Warm Minimal Enterprise - Nature-inspired Operations)**.

| Token | Tên Màu | Mã Hex | Ứng Dụng Trong Giao Diện |
|---|---|---|---|
| `--admin-forest-charcoal` | Than gỗ rừng | `#1C2923` | Nền thanh Sidebar điều hướng, tiêu đề cấp cao |
| `--admin-forest-accent` | Xanh rừng đậm | `#245747` | Nút hành động chính (Primary CTA), trạng thái menu Active |
| `--admin-sage` | Xanh ngải cứu | `#758B74` | Viền thứ cấp, biểu tượng phụ, nhãn trạng thái nhẹ |
| `--admin-ivory` | Trắng ngà ấm | `#F7F6F2` | Nền toàn bộ không gian làm việc (Workspace Canvas) |
| `--admin-copper` | Đồng đất trầm | `#B87558` | Huy hiệu Administrator, cảnh báo tài chính, nút kiểm toán |

### 4.2. Nguyên tắc Cách ly Giao diện (Theme Isolation)
- Toàn bộ các biến CSS mới được đóng gói trong phạm vi lớp `.admin-theme` bên trong `app/admin/(console)/layout.tsx`.
- Tuyệt đối không thay thế, không xóa hoặc ghi đè bất kỳ token thương hiệu toàn cục nào (`brand-teal`, `brand-navy`, `primary`, etc.).
- Giao diện của Trang chủ, Khách du lịch, Tour Operator và Xác thực công khai hoàn toàn không bị ảnh hưởng.

### 4.3. Đảm bảo Khả năng Tiếp cận (WCAG 2.2 AA)
- Tỷ lệ tương phản chữ Than gỗ (`#1C2923`) trên nền Trắng ngà (`#F7F6F2`) đạt **12.65:1** (vượt xa chuẩn AAA 7.0:1).
- Chữ trắng trên nút Xanh rừng (`#245747`) đạt **6.81:1** (đạt chuẩn AA cho văn bản thường).
- Màu Đồng Muted Copper khi sử dụng làm chữ được hiệu chỉnh tối ưu sang `#9E593D` (tỷ lệ 4.75:1 đạt chuẩn AA).
- Trạng thái phản hồi luôn kết hợp **Màu sắc + Biểu tượng Material Symbol + Văn bản rõ nghĩa**, không dựa đơn thuần vào màu sắc.

---

## 5. BỘ THƯ VIỆN COMPONENT QUẢN TRỊ DÙNG CHUNG (SHARED COMPONENT LIBRARY)

Để đảm bảo tính nhất quán và tối ưu hóa tái sử dụng, đề xuất 17 thành phần giao diện chuẩn hóa:

1. **Administration Sidebar (`AdminSidebar`):**
   - *Mục đích:* Thanh điều hướng dọc cố định bên trái, hỗ trợ thu gọn (72px) và mở rộng (260px).
   - *Đặc điểm:* Phân nhóm menu theo vai trò (`Role-Aware`), làm nổi bật mục đang chọn với thanh viền Sage Green và nền Deep Forest.
2. **Administration Topbar (`AdminTopbar`):**
   - *Mục đích:* Thanh công cụ phía trên cùng chứa nút bật/tắt Sidebar, đường dẫn Breadcrumbs, thông tin tài khoản và nút Đăng xuất.
3. **Breadcrumbs (`AdminBreadcrumbs`):**
   - *Mục đích:* Định vị vị trí hiện tại trong cây điều hướng phân cấp (hỗ trợ điều hướng ngược nhanh).
4. **Page Header (`AdminPageHeader`):**
   - *Mục đích:* Tiêu đề trang H1, dòng mô tả nhiệm vụ công thái học và cụm nút tác vụ chính.
5. **Role Badge (`AdminRoleBadge`):**
   - *Mục đích:* Nhận diện vai trò người dùng (Administrator viền Đồng Muted Copper, Staff viền Sage Green).
6. **Status Badge (`AdminStatusBadge`):**
   - *Mục đích:* Thể hiện trạng thái (Chờ duyệt, Đã duyệt, Từ chối, Đã khóa) kết hợp Icon + Màu nền + Màu chữ.
7. **Data Table (`AdminDataTable`):**
   - *Mục đích:* Hiển thị danh sách dữ liệu dày đặc, hỗ trợ sắp xếp cột, chọn hàng, trạng thái hover và cuộn ngang an toàn.
8. **Search & Filter Bar (`AdminFilterBar`):**
   - *Mục đích:* Thanh tìm kiếm từ khóa kèm các dropdown lọc trạng thái, lọc khoảng ngày tháng.
9. **Pagination (`AdminPagination`):**
   - *Mục đích:* Điều hướng phân trang chuẩn (Trang trước/sau, danh sách số trang, số dòng trên mỗi trang).
10. **Empty State (`AdminEmptyState`):**
    - *Mục đích:* Hiển thị khi danh sách hoặc hàng đợi không có dữ liệu, kèm icon minh họa nhẹ và nút hành động khôi phục/tạo mới.
11. **Loading Skeleton (`AdminTableSkeleton`, `AdminCardSkeleton`):**
    - *Mục đích:* Trạng thái chờ nạp dữ liệu với hiệu ứng xung nhịp êm dịu tông màu ngà ấm, không giật màn hình.
12. **Error / Permission Denied State (`AdminAccessDeniedView`):**
    - *Mục đích:* Thông báo trung thực khi người dùng không đủ quyền truy cập kèm nút điều hướng quay về Dashboard tương ứng.
13. **Confirmation Dialog (`AdminConfirmDialog`):**
    - *Mục đích:* Hộp thoại xác nhận các hành động nguy hiểm (Khóa tài khoản, Từ chối hồ sơ, Xóa dữ liệu), hỗ trợ bẫy tiêu điểm (Focus Trap) và phím `Escape`.
14. **Decision Panel (`AdminDecisionPanel`):**
    - *Mục đích:* Khối tổng kết đối soát và 2 nút hành động quyết định (Phê duyệt màu Deep Forest / Từ chối màu Viền Đỏ).
15. **Form Field Control (`AdminFormField`):**
    - *Mục đích:* Ô nhập liệu, textarea, select box với nhãn nổi, chỉ báo bắt buộc và thông báo lỗi ngữ nghĩa tức thì.
16. **Notification / Feedback Alert (`AdminFeedbackAlert`):**
    - *Mục đích:* Thanh thông báo kết quả tác vụ (Thành công, Thất bại, Cảnh báo nghiệp vụ) có nút đóng.
17. **Summary KPI Card (`AdminSummaryCard`):**
    - *Mục đích:* Thẻ tóm tắt chỉ số hàng đợi tác vụ hoặc dữ liệu tổng quan với icon nổi bật.

---

## 6. THIẾT KẾ HAI MÀN HÌNH DASHBOARD ĐẶC THÙ

### 6.1. Staff Dashboard (`/admin/staff`) — Bàn Làm Việc Vận Hành
- **Định hướng:** **Task-First & Operational Queues**.
- **Cấu trúc màn hình:**
  1. *Thanh định danh ca trực:* Tên nhân viên, thời điểm đăng nhập, huy hiệu `STAFF OPERATOR`.
  2. *Thẻ Thông báo Tính sẵn sàng Trung thực:* Giải thích rõ ràng các phân hệ đã kết nối và các phân hệ đang chờ Backend.
  3. *Lưới Thẻ Hàng đợi Tác vụ (Operational Queues):*
     - Hàng đợi Duyệt Tour Operator (Lối tắt vào thẩm định giấy phép).
     - Hàng đợi Kiểm duyệt Tour (Lối tắt kiểm tra lịch trình, giá bán).
     - Hàng đợi Thẩm định Rút tiền (Lối tắt đối soát doanh thu).
  4. *Lối tắt Tác nghiệp Trực quan:* Bản đồ Giám sát Chuyến đi (Active Trips), Form Khởi tạo POI, Quản lý Nội dung Trang chủ.
  5. *Cam kết trung thực:* Không hiển thị biểu đồ hay con số thống kê giả mạo nếu Backend chưa cung cấp endpoint tổng hợp.

### 6.2. Administrator Dashboard (`/admin`) — Trung Tâm Quản Trị Chiến Lược
- **Định hướng:** **Governance-First & System Security**.
- **Cấu trúc màn hình:**
  1. *Thanh tiêu đề Quản trị cấp cao:* Huy hiệu `ADMINISTRATOR` viền Đồng Muted Copper.
  2. *Khối Hành động Đặc quyền Cần xử lý:*
     - Thẻ Xác nhận Quyết toán Tài chính (UC-65): Hiển thị khi có các yêu cầu rút tiền đã được Staff phê duyệt bước 1.
     - Thẻ Cảnh báo An ninh & Kiểm toán (UC-68): Cập nhật sự kiện quản trị mới nhất.
  3. *Lưới Phân hệ Quản trị Hệ thống:*
     - Cấu hình Tham số Thuật toán Lõi (UC-57).
     - Khai thác Báo cáo Doanh thu & Thống kê Toàn sàn (UC-67).
     - Quản lý Toàn bộ Tài khoản & Tạo Tài khoản Staff (UC-47, Screen #36).
     - Quản lý Master Data POI & Xóa đặc quyền (UC-52, UC-54).
     - Giám sát Vĩ mô Chuyến đi Hoạt động (UC-58).

---

## 7. LỘ TRÌNH TRIỂN KHAI PHÂN KỲ (IMPLEMENTATION ROADMAP)

Quá trình hiện thực hóa Master Plan được chia thành 5 đợt (Batches E1 -> E5):

- **BATCH E1 — Shared Administration Shell & Additive Theme:**
  - Triển khai file CSS theme quản trị riêng biệt (`admin-theme.css`).
  - Xây dựng component `AdminSidebar`, `AdminTopbar`, `AdminBreadcrumbs`, `AdminRoleBadge`.
  - Đưa `/admin/catalogue/points-of-interest/new` vào chung Layout.
- **BATCH E2 — Staff Dashboard UX & Operational Queues:**
  - Tái cấu trúc `/admin/staff` theo mô hình Task-First.
  - Triển khai các thẻ hàng đợi tác vụ và trạng thái kết nối trung thực.
- **BATCH E3 — Administrator Dashboard UX & Governance Workspace:**
  - Tái cấu trúc `/admin` theo mô hình Governance-First.
  - Xây dựng khối tác vụ giải ngân đặc quyền (UC-65) và liên kết an ninh kiểm toán.
- **BATCH E4 — Functional Screen UX Normalization:**
  - Chuẩn hóa toàn bộ bảng biểu, bộ lọc, form nhập liệu và hộp thoại quyết định của các màn hình chức năng (POI, Tuyến đường, Rút tiền, Kiểm toán, Báo cáo, Duyệt tour, Duyệt đối tác).
- **BATCH E5 — Cross-Role QA, Regression & Accessibility Audit:**
  - Sửa đổi hoàn chỉnh các rào cản phân quyền ngược (RBAC fixes).
  - Khắc phục sự tương thích giữa đăng nhập công khai và phiên làm việc quản trị.
  - Kiểm thử hồi quy toàn bộ hệ thống (`npm test`, `typecheck`, `lint`, `build`).
  - Kiểm định khả năng tiếp cận WCAG 2.2 AA và tính tương thích trên máy tính bảng/di động.

---

## 8. CÁC QUYẾT ĐỊNH CẦN UI OWNER VÀ PRODUCT OWNER PHÊ DUYỆT

Để đảm bảo tính nhất quán tuyệt đối trước khi bước vào triển khai Batch E1, xin trình xin ý kiến phê duyệt của UI Owner và Product Owner về 4 điểm mấu chốt sau:

1. **Phê duyệt chuẩn hóa phân quyền thẩm định rút tiền 2 bước:**
   - Xác nhận quy trình: **Staff thẩm định và duyệt bước 1 (UC-63, 64, 73, 74)** -> **Administrator xác nhận giải ngân cuối cùng (UC-65)**.
   - Cho phép điều chỉnh lỗi in ấn tại dòng 98, 99 Bảng 5 của SRS gốc để đưa quyền duyệt/từ chối bước 1 về đúng cho Staff.
2. **Phê duyệt việc trao lại quyền kiểm duyệt cho Staff:**
   - Phê duyệt việc sửa đổi phân quyền trên FE để Staff có thể truy cập Hàng đợi duyệt Tour Operator (UC-50, 51) và Hàng đợi duyệt bài đăng Tour (UC-60, 61), đồng thời Administrator có quyền xem giám sát.
3. **Phê duyệt kiến trúc chuyển đổi sang Sidebar dọc:**
   - Phê duyệt việc thay thế thanh điều hướng ngang chật hẹp bằng Sidebar dọc thu gọn/mở rộng kết hợp Topbar tinh gọn.
4. **Phê duyệt việc mở quyền tạo POI cho Administrator:**
   - Phê duyệt việc bỏ chặn Administrator tại `/admin/catalogue/points-of-interest/new` để cả Admin và Staff đều có quyền tạo POI mới theo đúng quy định tại Bảng 1, Bảng 2 và Bảng 5 của SRS.

---

## 9. CAM KẾT AN TOÀN MÃ NGUỒN VÀ TRẠNG THÁI CUỐI CÙNG (GIT SAFETY CONFIRMATION)

Đội ngũ kiến trúc sư xin khẳng định:
- **Không có bất kỳ tập tin mã nguồn sản xuất nào bị chỉnh sửa** trong suốt quá trình thực hiện Batch E0.
- **Không có token màu toàn cục nào bị thay đổi** trong `app/globals.css` hay `DESIGN.md`.
- **Không có commit, push, tạo Pull Request, merge hay deploy nào được thực hiện.**
- Toàn bộ hồ sơ tài liệu quy hoạch đã được lưu trữ an toàn trong thư mục `docs/ux/admin/` của worktree cách ly `Capstone_FE-batch-e0`.

**TRẠNG THÁI BÁO CÁO:**  
`BATCH_E0_MASTER_PLAN_READY_FOR_APPROVAL`  
*(ĐÃ SẴN SÀNG ĐỂ UI OWNER & PRODUCT OWNER RÀ SOÁT VÀ PHÊ DUYỆT)*
