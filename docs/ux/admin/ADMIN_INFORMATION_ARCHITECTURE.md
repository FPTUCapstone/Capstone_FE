# KIẾN TRÚC THÔNG TIN VÀ ĐIỀU HƯỚNG QUẢN TRỊ (ADMIN INFORMATION ARCHITECTURE)
## TRIPMATE — WORKSPACE QUẢN TRỊ HỆ THỐNG
**Mã tài liệu:** BATCH E0 — BẢN THIẾT KẾ KIẾN TRÚC ĐIỀU HƯỚNG & SITEMAP  
**Ngày lập:** 23/10/2026  
**Cơ sở thẩm quyền:** `Report3_Software-Requirement-Specification.docx` (Bản SRS gốc của Dự án TripMate)  

---

## 1. KHUNG GIAO DIỆN QUẢN TRỊ CHUNG (SHARED ADMINISTRATION SHELL)

### 1.1. Chuyển đổi từ Thanh Header Ngang sang Sidebar Dọc Chuyên dụng
Thanh điều hướng ngang hiện tại (`AdminNavigation.tsx`) bộc lộ các nhược điểm nghiêm trọng trong môi trường vận hành:
- **Quá tải không gian:** Không thể chứa đủ danh mục hơn 15 màn hình quản trị mà không bị tràn chữ hoặc xuống dòng gây vỡ giao diện.
- **Thiếu phân cấp nghiệp vụ:** Tất cả các tính năng bị dàn hàng ngang cạnh nhau, không phân biệt được đâu là Hàng đợi tác vụ cần duyệt gấp, đâu là Báo cáo, đâu là Cấu hình hệ thống.
- **Nghịch đảo vai trò:** Các điều kiện phân quyền cứng khiến nhiều chức năng bị ẩn nhầm hoặc trao nhầm đối tượng.

**Giải pháp Kiến trúc đề xuất:** Chuyển đổi toàn diện sang mô hình **Collapsible Sidebar (Thanh điều hướng dọc thu gọn/mở rộng)** kết hợp với **Thanh Topbar ngữ cảnh tinh gọn**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ KHUNG GIAO DIỆN QUẢN TRỊ CHUNG (SHARED ADMINISTRATION SHELL)                           │
├──────────────────────┬─────────────────────────────────────────────────────────────────┤
│ SIDEBAR DỌC          │ THANH ĐIỀU HƯỚNG TRÊN (TOPBAR)                                  │
│ (Nền Forest Charcoal │ [Breadcrumb: Quản trị > Duyệt Tour > Chi tiết]  [Huy hiệu Role] │
│  #1C2923)            │ [Nút Thu gọn Sidebar]              [Tài khoản: Đổi mật khẩu/Out]│
│                      ├─────────────────────────────────────────────────────────────────┤
│ [Logo TripMate Admin]│ TIÊU ĐỀ TRANG VÀ THANH TÁC VỤ NGỮ CẢNH (PAGE HEADER)            │
│                      │ Tiêu đề màn hình • Mô tả ngắn gọn • [Nút Tác vụ Chính]          │
│ PHÂN NHÓM MENU       ├─────────────────────────────────────────────────────────────────┤
│ THEO VAI TRÒ         │ KHÔNG GIAN LÀM VIỆC CHÍNH (MAIN WORKSPACE CANVAS)               │
│ (Role-Aware Menu)    │ (Nền Warm Ivory #F7F6F2)                                        │
│                      │                                                                 │
│ • Nhóm Vận hành      │ ┌─────────────────────────────────────────────────────────────┐ │
│ • Nhóm Kiểm duyệt    │ │ Bảng dữ liệu / Bộ lọc / Form nhập liệu / Thẻ hàng đợi       │ │
│ • Nhóm Dữ liệu gốc   │ │ (Nền Surface Card Trắng #FFFFFF, Viền Subtle #E6E4DD)       │ │
│ • Nhóm Báo cáo/Log   │ └─────────────────────────────────────────────────────────────┘ │
│                      │                                                                 │
│ [Nút Thu gọn ◄►]     │                                                                 │
└──────────────────────┴─────────────────────────────────────────────────────────────────┘
```

---

### 1.2. Các Thành phần của Khung Giao diện Quản trị

1. **Thanh Sidebar (Cố định bên trái):**
   - Chiều rộng mở rộng: `260px` | Chiều rộng thu gọn (Icon-only): `72px`.
   - Nền màu Forest Charcoal (`#1C2923`).
   - Phía trên cùng: Logo TripMate Administration với huy hiệu phiên bản nội bộ.
   - Phần thân: Danh sách menu được phân nhóm rõ ràng theo nghiệp vụ (Operational Queues, Master Data, Governance, System Security).
   - Menu phản ứng theo vai trò (`Role-Aware`): Chỉ nạp và hiển thị các mục menu mà phiên đăng nhập (`session.role`) có quyền truy cập.
   - Mục đang kích hoạt (`Active Item`): Được làm nổi bật với nền xanh rừng Deep Forest Green (`#245747`), viền trái màu Sage Green (`#758B74`), chữ trắng ngà (`#F7F6F2`).
2. **Thanh Topbar (Phía trên cùng bên phải):**
   - Chiều cao cố định: `64px`, nền trắng ngà ấm nhẹ (`#FFFFFF` với viền dưới `#E6E4DD`).
   - Đường dẫn phân cấp (`Breadcrumbs`): Tự động hiển thị vị trí trang hiện tại theo thời gian thực (Ví dụ: `Không gian Vận hành / Duyệt Tour / Tour Đảo Cù Lao Chàm`).
   - Nút thu gọn Sidebar (`Sidebar Toggle`): Hỗ trợ phóng to không gian làm việc cho các bảng dữ liệu nhiều cột.
   - Huy hiệu định danh người dùng: Hiển thị rõ Vai trò (`ADMINISTRATOR` viền Đồng Copper hoặc `STAFF OPERATOR` viền Sage Green) cùng tên tài khoản đăng nhập.
   - Menu tài khoản: Lối tắt vào Đổi mật khẩu (`/admin/account/security`) và nút Đăng xuất an toàn.
3. **Thanh Tiêu đề Trang (Page Header):**
   - Nằm ngay dưới Topbar, chứa Tiêu đề H1 rõ ràng, mô tả ngắn về nhiệm vụ của màn hình, và cụm nút hành động chính (Primary Action, Lọc nâng cao, Xuất dữ liệu).
4. **Không gian làm việc chính (Canvas):**
   - Nền màu **Warm Ivory** (`#F7F6F2`), khoảng đệm (padding) chuẩn mực công thái học `24px` đến `32px`.
   - Giới hạn chiều rộng tối đa (Max-width): `1440px` (để tránh bảng bị kéo dãn quá mức trên màn hình siêu rộng).

---

## 2. KIẾN TRÚC THÔNG TIN DÀNH CHO VAI TRÒ STAFF (TASK-FIRST IA)

Giao diện của Staff được thiết kế theo triết lý **Ưu tiên Hàng đợi Tác vụ (Task-First & Queue-Driven)**. Khi một nhân viên đăng nhập vào ca trực, câu hỏi lớn nhất cần trả lời là: *"Hôm nay có việc gì cần xử lý ngay? Hồ sơ nào đang chờ duyệt? Có sự cố chuyến đi nào không?"*

```text
STAFF WORKSPACE NAVIGATION TREE
├── 1. TỔNG QUAN CA TRỰC (OVERVIEW)
│   └── Bàn làm việc Vận hành (/admin/staff)
│
├── 2. HÀNG ĐỢI KIỂM DUYỆT (OPERATIONAL QUEUES)
│   ├── Duyệt hồ sơ Tour Operator (/admin/tour-operator-applications) [UC-50, UC-51]
│   │   └── Chi tiết hồ sơ & Quyết định (/admin/tour-operator-applications/[userId])
│   ├── Duyệt bài đăng Tour (/admin/tours/reviews) [UC-60, UC-61]
│   │   └── Chi tiết tour, lịch trình & Quyết định (/admin/tours/reviews/[id])
│   └── Thẩm định Yêu cầu Rút tiền (/admin/payouts) [UC-63, UC-64, UC-73, UC-74]
│       └── Đối soát chi tiết & Duyệt/Từ chối (/admin/payouts/[payoutId])
│
├── 3. QUẢN LÝ DỮ LIỆU & LỘ TRÌNH (CATALOG & SPATIAL)
│   ├── Danh mục Điểm tham quan (POI Catalog) (/admin/catalogue/points-of-interest) [Screen #16]
│   │   ├── Tạo mới Điểm tham quan (/admin/catalogue/points-of-interest/new) [UC-52]
│   │   └── Cập nhật Điểm tham quan (/admin/catalogue/points-of-interest/[id]/edit) [UC-53]
│   └── Quản lý Tuyến đường & Đoạn nối (/admin/routes) [UC-55, UC-56]
│       └── Tạo tuyến đường mới (/admin/routes/create) [UC-55]
│
├── 4. GIÁM SÁT THỜI GIAN THỰC (LIVE OPERATIONS)
│   ├── Giám sát Chuyến đi Hoạt động (/admin/trips/active) [UC-58]
│   │   └── Chi tiết Chuyến đi & Cảnh báo Sự cố (/admin/trips/active/[id]) [UC-59]
│   └── Giám sát Đơn đặt tour Nền tảng (/admin/bookings) [UC-62]
│
├── 5. NGƯỜI DÙNG & NỘI DUNG (USERS & CONTENT)
│   ├── Danh bạ Tài khoản Khách & Đối tác (/admin/users) [UC-47, UC-48, UC-49]
│   │   └── Chi tiết tài khoản & Khóa/Mở khóa (/admin/users/[userId])
│   └── Quản lý Nội dung Trang chủ (/admin/landing-content) [UC-66]
│
└── 6. BẢO MẬT CÁ NHÂN (SECURITY)
    └── Đổi mật khẩu tài khoản (/admin/account/security) [UC-07]
```

---

## 3. KIẾN TRÚC THÔNG TIN DÀNH CHO VAI TRÒ ADMINISTRATOR (GOVERNANCE-FIRST IA)

Giao diện của Administrator được thiết kế theo triết lý **Quản trị Chiến lược & Kiểm soát An ninh (Governance-First & Auditability)**. Trọng tâm của Administrator là: *"Hệ thống có an toàn không? Có khoản tiền lớn nào cần giải ngân không? Báo cáo doanh thu tuần này thế nào? Ai vừa thay đổi cấu hình thuật toán?"*

```text
ADMINISTRATOR WORKSPACE NAVIGATION TREE
├── 1. TỔNG QUAN QUẢN TRỊ (SYSTEM OVERVIEW)
│   └── Bảng Điều hành Trung tâm (/admin) [Screen #5]
│
├── 2. TÀI KHOẢN NỘI BỘ & TOÀN SÀN (ACCOUNT GOVERNANCE)
│   ├── Quản lý Tài khoản Toàn hệ thống (/admin/users) [UC-47, UC-48, UC-49]
│   │   └── Chi tiết tài khoản, Phân quyền & Khóa (/admin/users/[userId])
│   └── Tạo Tài khoản Nhân viên (Staff) (/admin/staff-accounts/new) [Screen #36]
│
├── 3. QUẢN TRỊ TÀI CHÍNH & GIẢI NGÂN (FINANCIAL GOVERNANCE)
│   ├── Quyết toán Rút tiền Đối tác (/admin/payouts/settlement) [UC-65]
│   │   └── Xác nhận giải ngân ngân hàng (/admin/payouts/[payoutId]/settle)
│   ├── Báo cáo Doanh thu Nền tảng (/admin/reports/revenue) [Screen #37, #38]
│   └── Báo cáo Thống kê & Xuất dữ liệu (/admin/reports) [UC-67]
│
├── 4. DỮ LIỆU GỐC & CẤU HÌNH THUẬT TOÁN (MASTER DATA & CONFIG)
│   ├── Quản lý Master Data POI (/admin/catalogue/points-of-interest) [UC-52, 53, 54]
│   │   ├── Tạo mới Điểm tham quan (/admin/catalogue/points-of-interest/new) [UC-52]
│   │   └── Vô hiệu hóa / Xóa vĩnh viễn POI [UC-54 - Đặc quyền Admin]
│   └── Cấu hình Tham số Thuật toán Lõi (/admin/settings/algorithm-parameters) [UC-57]
│
├── 5. AN NINH & KIỂM TOÁN HỆ THỐNG (SECURITY & AUDIT)
│   ├── Nhật ký Kiểm toán Hệ thống (/admin/audit-logs) [UC-68]
│   │   └── Chi tiết Sự kiện & Dữ liệu Thay đổi (/admin/audit-logs/[id]) [UC-69]
│   └── Giám sát Toàn diện Chuyến đi (/admin/trips/active) [Chế độ Giám sát]
│
└── 6. BẢO MẬT CÁ NHÂN (SECURITY)
    └── Đổi mật khẩu Quản trị viên (/admin/account/security) [UC-07]
```

---

## 4. BẢNG ÁNH XẠ ĐIỀU HƯỚNG VÀ SITEMAP CHI TIẾT (NAVIGATION MAPPING TABLE)

| URL Tuyến đường | Nhóm Menu | Vai trò Hiển thị | Đích đến Mặc định | Hành vi Khi Đang Chọn (Active) | Thẩm quyền Yêu cầu | Tình trạng Sẵn sàng | Use Case Hỗ trợ |
|---|---|---|---|---|---|---|---|
| `/admin` | Tổng quan | Administrator | Trang chủ Admin | Nền Deep Forest, viền Sage | `session.role === 'Administrator'` | Hoàn chỉnh | Screen #5 |
| `/admin/staff` | Tổng quan | Staff | Bàn làm việc Staff | Nền Deep Forest, viền Sage | `session.role === 'Staff'` | Hoàn chỉnh | Screen #35 |
| `/admin/tour-operator-applications` | Hàng đợi Vận hành | Staff | Danh sách hồ sơ chờ | Nền Deep Forest | `session.role === 'Staff'` | **Cần bổ sung ở E2** | Screen #10, UC-50, 51 |
| `/admin/tour-operator-applications/[id]` | Hàng đợi Vận hành | Staff, Admin (View) | Chi tiết hồ sơ | Breadcrumbs kích hoạt | Staff (Duyệt/Từ chối), Admin (Xem) | Hoàn chỉnh UI | UC-50, UC-51 |
| `/admin/tours/reviews` | Hàng đợi Vận hành | Staff | Danh sách tour chờ duyệt | Nền Deep Forest | `session.role === 'Staff'` | Demo Mode / Cần API BE | UC-60, UC-61 |
| `/admin/tours/reviews/[id]` | Hàng đợi Vận hành | Staff, Admin (View) | Chi tiết nội dung tour | Breadcrumbs kích hoạt | Staff (Duyệt/Từ chối), Admin (Xem) | Demo Mode | UC-60, UC-61 |
| `/admin/payouts` | Quản lý Tài chính | Staff, Administrator | Danh sách yêu cầu rút tiền | Nền Deep Forest | Cả Staff và Admin đều xem được | Hoàn chỉnh UI | UC-63, Table 5 Dòng 30 |
| `/admin/payouts/[payoutId]` | Quản lý Tài chính | Staff, Administrator | Thẩm định chi tiết | Breadcrumbs kích hoạt | Staff (Duyệt/Từ chối Bước 1) | Hoàn chỉnh UI | UC-64, UC-73, 74 |
| `/admin/payouts/settlement` | Quản lý Tài chính | Administrator | Danh sách chờ giải ngân | Nền Deep Forest | `session.role === 'Administrator'` | **Cần bổ sung ở E3** | UC-65, Screen #30 |
| `/admin/catalogue/points-of-interest` | Dữ liệu gốc | Staff, Administrator | Danh mục POI | Nền Deep Forest | Staff, Administrator | **Cần bổ sung ở E4** | Screen #16 |
| `/admin/catalogue/points-of-interest/new` | Dữ liệu gốc | Staff, Administrator | Form tạo POI mới | Nền Deep Forest | Cả Staff và Admin | Hoàn chỉnh Form | UC-52 |
| `/admin/routes` | Dữ liệu gốc | Staff | Danh sách tuyến đường | Nền Deep Forest | `session.role === 'Staff'` | UnavailableView | UC-55, UC-56 |
| `/admin/trips/active` | Giám sát Trực ban | Staff, Administrator | Bản đồ/Bảng chuyến đi | Nền Deep Forest | Staff (Chính), Admin (Giám sát) | Hoàn chỉnh UI | UC-58 |
| `/admin/trips/active/[id]` | Giám sát Trực ban | Staff, Administrator | Chi tiết chuyến đi | Breadcrumbs kích hoạt | Staff, Administrator | Hoàn chỉnh UI | UC-59 |
| `/admin/users` | Quản trị Tài khoản | Staff, Administrator | Danh bạ người dùng | Nền Deep Forest | Staff (Khách/Đối tác), Admin (Toàn bộ) | UnavailableView | UC-47, UC-48, 49 |
| `/admin/users/[userId]` | Quản trị Tài khoản | Staff, Administrator | Chi tiết tài khoản | Breadcrumbs kích hoạt | Staff (Khách/Đối tác), Admin (Toàn bộ) | UnavailableView | UC-48, UC-49 |
| `/admin/landing-content` | Quản trị Nội dung | Staff | Trình quản lý nội dung | Nền Deep Forest | `session.role === 'Staff'` | Hoàn chỉnh UI | UC-66 |
| `/admin/settings/algorithm-parameters` | Cấu hình Hệ thống | Administrator | Form tham số thuật toán | Nền Deep Forest | `session.role === 'Administrator'` | Hoàn chỉnh Form | UC-57 |
| `/admin/audit-logs` | An ninh & Kiểm toán | Administrator | Bảng nhật ký kiểm toán | Nền Deep Forest | `session.role === 'Administrator'` | Hoàn chỉnh UI | UC-68, UC-69 |
| `/admin/reports` | Báo cáo | Administrator | Trình tạo & xuất báo cáo | Nền Deep Forest | `session.role === 'Administrator'` | Demo Mode / Hoàn chỉnh UI | UC-67, Screen #32 |
| `/admin/account/security` | Bảo mật Cá nhân | Staff, Administrator | Đổi mật khẩu tài khoản | Icon Khóa trên Topbar | Staff, Administrator | Hoàn chỉnh Form | UC-07, Screen #4 |
| `/admin/login` | Xác thực | Guest | Màn hình Đăng nhập Quản trị | Độc lập (Không có Shell) | Không có phiên | Hoàn chỉnh | Screen #2, UC-04 |
| `/admin/forgot-password` | Xác thực | Guest | Màn hình Quên mật khẩu | Độc lập (Không có Shell) | Không có phiên | Hoàn chỉnh | Screen #3, UC-06 |
