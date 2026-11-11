# LỘ TRÌNH TRIỂN KHAI HỆ THỐNG QUẢN TRỊ (BATCH E IMPLEMENTATION ROADMAP)
## TRIPMATE — WORKSPACE QUẢN TRỊ HỆ THỐNG
**Mã tài liệu:** BATCH E0 — KẾ HOẠCH TRIỂN KHAI PHÂN KỲ (PHASED EXECUTION PLAN)  
**Ngày lập:** 23/10/2026  
**Mục tiêu:** Chuyển hóa toàn diện UI/UX Master Plan sang các đợt thực thi nguyên tử (Atomic Batches E1 -> E5)  

---

## 1. NGUYÊN TẮC PHÂN KỲ TRIỂN KHAI (GOVERNANCE PRINCIPLES)

1. **Tuân thủ Superpowers Protocol:** Mỗi phân kỳ thực hiện tuần tự: **Khám phá -> Làm rõ -> Đặc tả -> Kế hoạch -> TDD (Red-Green-Refactor) -> Kiểm tra chéo -> Bàn giao**.
2. **Tuyệt đối không phá vỡ Baseline:** Không bao giờ triển khai trên nền một nhánh đang lỗi kiểm thử. Luôn đảm bảo 100% test pass (`npm test`), 0 lỗi TypeScript (`npm run typecheck`), 0 cảnh báo lint (`npm run lint`), và build thành công (`npm run build`).
3. **Bảo tồn Phân quyền & Không phá hoại Token cũ:** Mọi thay đổi về CSS token đều ở dạng bổ sung cục bộ (additive scoped variables), không sửa đổi bảng màu toàn sàn.
4. **Không tự ý Merge/Push:** Sau khi hoàn tất mỗi batch, dừng lại trình bày kết quả cho nhà phát triển/UI Owner duyệt trước khi chuyển sang batch tiếp theo.

---

## 2. CHI TIẾT CÁC PHÂN KỲ TRIỂN KHAI (BATCH E1 ĐẾN BATCH E5)

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ LỘ TRÌNH THỰC THI CHUỖI BATCH E (BATCH E DELIVERY PIPELINE)                                      │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  ┌───────────────────────┐         ┌───────────────────────┐         ┌───────────────────────┐   │
│  │ BATCH E1              │         │ BATCH E2              │         │ BATCH E3              │   │
│  │ Khung Shell & Theme   │ ──────► │ Dashboard Vận hành    │ ──────► │ Dashboard Quản trị    │   │
│  │ Forest & Warm Ivory   │         │ (Staff Workspace UX)  │         │ (Admin Workspace UX)  │   │
│  └───────────────────────┘         └───────────────────────┘         └───────────────────────┘   │
│                                                                                  │               │
│                                                                                  ▼               │
│  ┌───────────────────────┐         ┌─────────────────────────────────────────────────────────┐   │
│  │ BATCH E5              │         │ BATCH E4                                                │   │
│  │ Kiểm thử Chéo Vai trò │ ◄────── │ Chuẩn hóa Giao diện Chức năng                           │   │
│  │ QA, Regression, a11y  │         │ (Tables, Filters, Forms, Modals & Detail Screens)       │   │
│  └───────────────────────┘         └─────────────────────────────────────────────────────────┘   │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### BATCH E1 — SHARED ADMINISTRATION SHELL & ADDITIVE THEME

- **Mục tiêu:** Xây dựng khung giao diện quản trị mới (Sidebar thu gọn/mở rộng, Topbar tinh gọn, Breadcrumbs, Role Badge) và tích hợp bộ token Forest & Warm Ivory với cơ chế cách ly tuyệt đối.
- **Tập tin dự kiến tác động:**
  - `src/features/admin/shared/styles/admin-theme.css` *(Tạo mới: chứa các biến CSS `--admin-*`)*.
  - `src/features/admin/shared/components/AdminSidebar.tsx` *(Tạo mới: Sidebar dọc phân nhóm menu theo vai trò)*.
  - `src/features/admin/shared/components/AdminTopbar.tsx` *(Tạo mới: Topbar chứa breadcrumb, nút thu gọn, menu tài khoản)*.
  - `src/features/admin/shared/components/AdminBreadcrumbs.tsx` *(Tạo mới)*.
  - `src/features/admin/shared/components/AdminRoleBadge.tsx` *(Tạo mới: Badge Admin viền đồng, Staff viền sage)*.
  - `app/admin/(console)/layout.tsx` *(Cập nhật: Bọc khung giao diện mới, nạp lớp `.admin-theme`)*.
  - `src/components/navigation/AdminNavigation.tsx` *(Refactor: Thay thế bằng vỏ bọc tương thích hoặc chuyển giao sang Sidebar mới)*.
  - `app/admin/catalogue/points-of-interest/new/page.tsx` *(Cập nhật: Đưa vào trong luồng layout thống nhất)*.
- **Thay đổi giao diện kỳ vọng:**
  - Sidebar dọc màu Forest Charcoal `#1C2923` hiển thị bên trái.
  - Nền không gian làm việc chuyển sang Warm Ivory `#F7F6F2`.
  - Giữ nguyên toàn bộ logic phiên và các page guard hiện có.
- **Chiến lược kiểm thử (Tests):**
  - Unit test cho `AdminSidebar`: Kiểm tra hiển thị đúng các menu mục tiêu theo vai trò `Staff` và `Administrator`.
  - Unit test cho `AdminTopbar` & `AdminBreadcrumbs`: Kiểm tra đường dẫn phân cấp động theo pathname.
  - Snapshot / Layout test: Đảm bảo giao diện công khai (`/`, `/about`, `/partner`) không bị dính bất kỳ style nào từ `.admin-theme`.
- **Rào cản SRS & Cổng phê duyệt (Gate):** UI Owner duyệt giao diện trực quan của Khung Shell và hoạt động thu gọn Sidebar trên desktop/tablet/mobile.

---

### BATCH E2 — STAFF DASHBOARD UX & OPERATIONAL QUEUES

- **Mục tiêu:** Hiện đại hóa Bàn làm việc của Nhân viên Vận hành (`/admin/staff`), thiết kế theo triết lý Task-First tập trung vào các hàng đợi kiểm duyệt thực tế.
- **Tập tin dự kiến tác động:**
  - `src/features/admin/staff/components/StaffDashboardView.tsx` *(Tái cấu trúc theo wireframe mới)*.
  - `src/features/admin/staff/components/OperationalQueueCard.tsx` *(Tạo mới: Thẻ hàng đợi tác vụ trực quan)*.
  - `src/features/admin/staff/resources/en.ts` *(Cập nhật văn bản mô tả hàng đợi và trạng thái trung thực)*.
  - `app/admin/(console)/staff/page.tsx` *(Cập nhật guard: Ngăn ngừa truy cập trái phép)*.
- **Thay đổi giao diện kỳ vọng:**
  - Giao diện dạng lưới (Grid) hiển thị nổi bật 3 hàng đợi kiểm duyệt nóng: Duyệt Tour Operator, Kiểm duyệt bài Tour, Thẩm định Rút tiền.
  - Khối giám sát chuyến đi đang hoạt động (Active Trips) và lối tắt tạo POI.
  - Thẻ thông báo sẵn sàng trung thực (Honest Readiness Banner), không hiển thị số liệu ảo.
- **Chiến lược kiểm thử (Tests):**
  - Kiểm tra tương tác bàn phím (keyboard navigation) trên các thẻ hàng đợi.
  - Đảm bảo các hàng đợi chưa có Backend API hiển thị nhãn trung thực và bị vô hiệu hóa an toàn, không sinh lỗi crash.
- **Rào cản SRS & Cổng phê duyệt (Gate):** Duyệt cấu trúc thẻ hàng đợi và nội dung hiển thị trước khi gắn kết luồng dữ liệu.

---

### BATCH E3 — ADMINISTRATOR DASHBOARD UX & GOVERNANCE WORKSPACE

- **Mục tiêu:** Nâng cấp Bảng Điều hành Trung tâm của Administrator (`/admin`), tập trung vào Quản trị chiến lược, Quyết toán giải ngân đặc quyền, Cấu hình thuật toán và Kiểm toán an ninh.
- **Tập tin dự kiến tác động:**
  - `src/features/admin/dashboard/AdminDashboard.tsx` *(Tái cấu trúc theo wireframe mới)*.
  - `src/features/admin/dashboard/components/GovernanceActionCard.tsx` *(Tạo mới)*.
  - `src/features/admin/dashboard/resources/en.ts` *(Cập nhật)*.
  - `app/admin/(console)/page.tsx` *(Giữ nguyên logic redirect Staff sang `/admin/staff`)*.
- **Thay đổi giao diện kỳ vọng:**
  - Khối nổi bật dành riêng cho Hành động Quyết toán Tài chính (UC-65).
  - Lối tắt trực tiếp vào Nhật ký Kiểm toán (Audit Logs), Cấu hình Thuật toán (Algorithm Config), Báo cáo Thống kê & Doanh thu.
  - Huy hiệu Administrator quyền uy viền Muted Copper `#B87558`.
- **Chiến lược kiểm thử (Tests):**
  - Kiểm tra việc điều hướng chính xác vào các phân hệ quản trị cấp cao.
  - Kiểm tra phản hồi hiển thị khi chưa có yêu cầu rút tiền cần xác nhận giải ngân.
- **Rào cản SRS & Cổng phê duyệt (Gate):** UI Owner xác nhận phân cấp thị giác giữa các tác vụ khẩn cấp và các phân hệ tra cứu.

---

### BATCH E4 — FUNCTIONAL SCREEN UX NORMALIZATION

- **Mục tiêu:** Chuẩn hóa toàn bộ các màn hình chức năng còn lại theo chuẩn token Forest & Warm Ivory và các component dùng chung (Bảng dữ liệu, Bộ lọc, Drawer chi tiết, Hộp thoại quyết định).
- **Tập tin dự kiến tác động:**
  - Nhóm Điểm tham quan: `src/features/admin/create-poi/*`.
  - Nhóm Kiểm toán: `src/features/admin/audit-logs/*` (Bảng, Drawer chi tiết).
  - Nhóm Rút tiền: `src/features/admin/payout-records/*`, `payout-review/*` (Hộp thoại Duyệt/Từ chối).
  - Nhóm Cấu hình: `src/features/admin/algorithm-config/*` (Form cấu hình tham số).
  - Nhóm Báo cáo: `src/features/admin/reports/*`.
  - Nhóm Nội dung: `src/features/admin/landing-content/*`.
  - Nhóm Kiểm duyệt Tour: `src/features/admin/tour-reviews/*`.
- **Thay đổi giao diện kỳ vọng:**
  - Toàn bộ nền bảng dữ liệu chuyển sang thẻ trắng (`#FFFFFF`) trên nền canvas Warm Ivory (`#F7F6F2`).
  - Toàn bộ nút hành động chính chuyển sang Deep Forest Green (`#245747`).
  - Chuẩn hóa toàn bộ trạng thái Loading (Skeleton ấm), Empty State (lời kêu gọi hành động rõ ràng) và Error Alert.
- **Chiến lược kiểm thử (Tests):**
  - Chạy toàn bộ regression test hiện có của các màn hình chức năng.
  - Kiểm tra khả năng mở/đóng và bẫy tiêu điểm (focus trap) của các hộp thoại quyết định (ApproveModal, RejectModal).
- **Rào cản SRS & Cổng phê duyệt (Gate):** Đảm bảo không làm thay đổi các hợp đồng API (DTO contracts) hiện có của Backend.

---

### BATCH E5 — CROSS-ROLE QA, REGRESSION & ACCESSIBILITY AUDIT

- **Mục tiêu:** Kiểm tra chéo toàn diện phân quyền RBAC giữa Staff và Administrator, kiểm tra tính tương thích phiên làm việc, chạy hồi quy toàn bộ hệ thống và kiểm định chuẩn tiếp cận WCAG 2.2 AA.
- **Nhiệm vụ kiểm tra chính:**
  1. **Khắc phục lỗi Phân quyền (RBAC Fix):**
     - Sửa đổi các Page Guard và Proxy BFF để Staff duyệt được Tour Operator và Tour Post; mở quyền xem danh sách Payouts cho Administrator; cho phép Administrator tạo POI.
     - Cập nhật danh sách cho phép `STAFF_ALLOWED_EXACT_ROUTES` trong `AdminSignInForm.tsx`.
  2. **Kiểm tra tương thích phiên làm việc:** Đảm bảo đăng nhập tại `/admin/login` hoạt động trơn tru với cả 2 vai trò và cơ chế chuyển hướng `returnUrl` an toàn.
  3. **Kiểm định Tiếp cận WCAG 2.2 AA:**
     - Kiểm tra độ tương phản màu sắc thực tế trên toàn bộ các thành phần điều khiển.
     - Kiểm tra điều hướng hoàn toàn bằng bàn phím (`Tab`, `Shift+Tab`, `Enter`, `Escape`).
     - Kiểm tra thuộc tính `aria-expanded`, `aria-controls`, `aria-modal` trên Sidebar và Modal.
     - Kiểm tra hỗ trợ chế độ giảm chuyển động (`prefers-reduced-motion`).
  4. **Kiểm tra Khả năng đáp ứng đa màn hình (Responsive Parity):**
     - Kiểm tra trên Desktop (1920x1080, 1440x900).
     - Kiểm tra trên Laptop / Màn hình chuẩn (1366x768).
     - Kiểm tra trên Tablet (iPad Pro, iPad Air - 1024x768, 768x1024).
     - Kiểm tra trên Mobile (iPhone 14/15, Pixel 7 - 390x844).
  5. **Chạy kiểm thử cổng chất lượng:**
     - `npm test`: Đạt 100% pass toàn bộ test suite.
     - `npm run typecheck`: 0 lỗi.
     - `npm run lint`: 0 lỗi/cảnh báo.
     - `npm run build`: Tạo bản build production tối ưu hoàn chỉnh.
- **Cổng phê duyệt cuối cùng:** Trình bày biên bản kiểm định QA trước khi mở Pull Request chính thức vào nhánh `develop`.
