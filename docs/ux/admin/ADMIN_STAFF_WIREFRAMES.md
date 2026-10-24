# BẢN VẼ WIREFRAME VÀ QUY CÁCH GIAO DIỆN QUẢN TRỊ (ADMIN & STAFF WIREFRAMES)
## TRIPMATE — WORKSPACE QUẢN TRỊ HỆ THỐNG
**Mã tài liệu:** BATCH E0 — BẢN THIẾT KẾ CẤU TRÚC GIAO DIỆN & CÔNG THÁI HỌC  
**Ngày lập:** 23/10/2026  
**Định hướng thị giác:** Forest & Warm Ivory (Warm Minimal Enterprise)  
**Tiêu chuẩn chất lượng:** Dựa trên Claude Frontend Design Skill & WCAG 2.2 AA  

---

## 1. THIẾT KẾ KHUNG GIAO DIỆN QUẢN TRỊ CHUNG (SHARED ADMINISTRATION SHELL)

### 1.1. Bản vẽ Wireframe Cấu trúc Tổng thể (Desktop Viewport ≥ 1280px)

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [TRIPMATE ADMIN]          │ ◄► [Trang chủ / Quản lý Chuyến đi / Chi tiết]            (Huy hiệu) [ADMIN] [Tài khoản ▼] │
├───────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
│ ❖ TỔNG QUAN               │ TIÊU ĐỀ MÀN HÌNH CHÍNH (H1)                                                          │
│   • Bàn làm việc Vận hành │ Mô tả ngắn gọn về nhiệm vụ tác nghiệp của màn hình hiện tại.                         │
│                           ├──────────────────────────────────────────────────────────────────────────────────────┤
│ 📋 HÀNG ĐỢI KIỂM DUYỆT    │                                                                                      │
│   • Duyệt Tour Operator   │ ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│   • Kiểm duyệt Tour       │ │ KHU VỰC BỘ LỌC VÀ TÌM KIẾM (FILTER & ACTION BAR)                                 │ │
│   • Thẩm định Rút tiền    │ │ [🔍 Tìm kiếm từ khóa...]  [Trạng thái: Tất cả ▼]  [Ngày: Hôm nay ▼]  [Nút Lọc]   │ │
│                           │ └──────────────────────────────────────────────────────────────────────────────────┘ │
│ 📍 DỮ LIỆU & LỘ TRÌNH     │                                                                                      │
│   • Điểm tham quan (POI)  │ ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│   • Quản lý Tuyến đường   │ │ BẢNG DỮ LIỆU TÁC NGHIỆP (DATA TABLE CONTAINER - Surface Card Trắng #FFFFFF)      │ │
│                           │ │ ┌────────┬──────────────────────┬───────────────┬────────────────┬─────────────┐ │ │
│ 🛰️ GIÁM SÁT THỜI GIAN THỰC│ │ │ MÃ ĐƠN │ TÊN ĐỐI TÁC / KHÁCH  │ THỜI ĐIỂM     │ TRẠNG THÁI     │ THAO TÁC    │ │ │
│   • Chuyến đi Hoạt động   │ │ ├────────┼──────────────────────┼───────────────┼────────────────┼─────────────┤ │ │
│   • Đơn Đặt tour Toàn sàn │ │ │ #PO-101│ Cty Du lịch Miền Trung│ 23/10/26 09:15│ [⏳ Chờ thẩm định]│ [Xem xét ➔] │ │ │
│                           │ │ │ #PO-102│ Danang Eco Tour Corp │ 23/10/26 10:30│ [✓ Đã phê duyệt]│ [Chi tiết]  │ │ │
│ 👥 NGƯỜI DÙNG & NỘI DUNG  │ │ │ #PO-103│ Hội An Heritage Ltd  │ 23/10/26 11:00│ [✕ Từ chối]    │ [Chi tiết]  │ │ │
│   • Danh bạ Tài khoản     │ │ └────────┴──────────────────────┴───────────────┴────────────────┴─────────────┘ │ │
│   • Nội dung Trang chủ    │ │ ◄ Trang 1 / 5 ►                    Hiển thị 1 - 20 trong tổng số 85 bản ghi       │ │
│                           │ └──────────────────────────────────────────────────────────────────────────────────┘ │
│ ⚙️ HỆ THỐNG & BẢO MẬT     │                                                                                      │
│   • Cấu hình Thuật toán   │                                                                                      │
│   • Nhật ký Kiểm toán     │                                                                                      │
│                           │                                                                                      │
│ [◄ Thu gọn Sidebar]       │                                                                                      │
└───────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2. Quy cách Kỹ thuật & Công thái học (Ergonomics Specification)
- **Chiều rộng Sidebar:** Cố định `260px` khi mở rộng; thu gọn còn `72px` (chỉ hiển thị icon với tooltip nổi).
- **Màu nền Sidebar:** Forest Charcoal `#1C2923` (Than gỗ rừng).
- **Mục menu được chọn (Active Nav Item):** Nền xanh rừng đậm Deep Forest Green `#245747`, gờ viền trái màu Sage Green `#758B74` dày `3px`, chữ màu Warm Ivory `#F7F6F2`.
- **Thanh Topbar:** Chiều cao cố định `64px`, nền trắng ngà viền Subtle `#E6E4DD`, gắn cố định phía trên (`sticky top-0 z-40`).
- **Khoảng cách nhịp nhàng (Spacing Rhythm):** Hệ thống lưới cơ sở 4px/8px:
  - Khoảng đệm Canvas: `px-6 py-6` (24px) trên Laptop; `px-8 py-8` (32px) trên Desktop lớn.
  - Khoảng cách giữa các thẻ: `gap-6` (24px).
  - Bo góc (Border Radius): Thẻ container bo `12px` (`rounded-xl`), nút bấm bo `8px` (`rounded-lg`), huy hiệu bo tròn hoàn toàn `9999px` (`rounded-full`).

---

## 2. WIREFRAME BÀN LÀM VIỆC NHÂN VIÊN VẬN HÀNH (STAFF DASHBOARD — `/admin/staff`)

Triết lý thiết kế: **Task-First Workspace** — Tập trung vào các hàng đợi cần xử lý trong ca trực, không hiển thị số liệu thống kê giả mạo nếu chưa có API tổng hợp thực tế.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ BÀN LÀM VIỆC VẬN HÀNH (STAFF OPERATIONS WORKSPACE)                                                               │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Huy hiệu: 🟢 CA TRỰC ĐANG HOẠT ĐỘNG]                                                [Vai trò: STAFF OPERATOR]   │
│ TIÊU ĐỀ: BÀN LÀM VIỆC VẬN HÀNH & KIỂM DUYỆT HỆ THỐNG                                                            │
│ Xin chào, Nguyễn Văn A. Bạn đang trong ca trực điều hành TripMate. Dưới đây là các tác vụ cần thẩm định.         │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 📢 THÔNG BÁO TÌNH TRẠNG KẾT NỐI HỆ THỐNG (HONEST READINESS BANNER)                                               │
│ ℹ️ Không gian làm việc phản ánh các luồng nghiệp vụ chuẩn của TripMate. Hàng đợi nào đã kết nối API Backend sẽ   │
│    có nút "Vào xử lý ngay". Các tác vụ đang chờ hoàn thiện hợp đồng API được gắn nhãn trung thực, không số ảo.   │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ CÁC HÀNG ĐỢI TÁC NGHIỆP CẦN XỬ LÝ (OPERATIONAL ACTION QUEUES)                                                    │
│                                                                                                                  │
│ ┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐            │
│ │ 📋 DUYỆT HỒ SƠ TOUR OPERATOR  │ │ 🎫 KIỂM DUYỆT GÓI TOUR        │ │ 💰 THẨM ĐỊNH RÚT TIỀN         │            │
│ │ Thẩm định giấy phép lữ hành,  │ │ Kiểm tra lịch trình, nội dung,│ │ Đối soát doanh thu, khấu trừ  │            │
│ │ mã số thuế, hồ sơ pháp lý.    │ │ dịch vụ và giá bán tour.      │ │ hoa hồng, duyệt chuyển Admin. │            │
│ │ [Trạng thái: Sẵn sàng API]    │ │ [Trạng thái: Chế độ Demo]     │ │ [Trạng thái: Sẵn sàng API]    │            │
│ │ ➔ [VÀO HÀNG ĐỢI DUYỆT]        │ │ ➔ [VÀO HÀNG ĐỢI KIỂM DUYỆT]   │ │ ➔ [VÀO HÀNG ĐỢI ĐỐI SOÁT]     │            │
│ └───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘            │
│                                                                                                                  │
│ ┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐            │
│ │ 🛰️ GIÁM SÁT CHUYẾN ĐI (LIVE)  │ │ 📍 KHỞI TẠO ĐIỂM THAM QUAN    │ │ 📰 BIÊN TẬP TRANG CHỦ         │            │
│ │ Theo dõi du khách theo GPS,   │ │ Thêm mới POI vào danh mục gốc │ │ Cập nhật banner, điểm đến     │            │
│ │ tiếp nhận cảnh báo sự cố.     │ │ với tọa độ, giờ mở cửa.       │ │ nổi bật, bài viết trang chủ.  │            │
│ │ [Trạng thái: Sẵn sàng API]    │ │ [Trạng thái: Sẵn sàng API]    │ │ [Trạng thái: Sẵn sàng API]    │            │
│ │ ➔ [MỞ BẢN ĐỒ GIÁM SÁT]        │ │ ➔ [MỞ FORM TẠO POI]           │ │ ➔ [QUẢN LÝ NỘI DUNG]          │            │
│ └───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘            │
│                                                                                                                  │
│ ┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐            │
│ │ 👥 QUẢN TRỊ TÀI KHOẢN NGƯỜI DÙNG│ │ 🗺️ TUYẾN ĐƯỜNG KẾT NỐI       │ │ 📑 GIÁM SÁT ĐƠN ĐẶT CHỖ       │            │
│ │ Tra cứu danh bạ, khóa/mở khóa │ │ Quản lý các đoạn đường lộ     │ │ Theo dõi booking toàn sàn,    │            │
│ │ tài khoản Traveler, Operator. │ │ trình giữa các điểm tham quan.│ │ hỗ trợ tra cứu thanh toán.    │            │
│ │ [Chờ tích hợp Backend API]    │ │ [Chờ tích hợp Backend API]    │ │ [Chờ tích hợp Backend API]    │            │
│ │ [Tạm thời chưa khả dụng]      │ │ [Tạm thời chưa khả dụng]      │ │ [Tạm thời chưa khả dụng]      │            │
│ └───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘            │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. WIREFRAME BẢNG ĐIỀU HÀNH QUẢN TRỊ VIÊN (ADMINISTRATOR DASHBOARD — `/admin`)

Triết lý thiết kế: **Governance & Strategic Control** — Tập trung vào các tác vụ phê duyệt đặc quyền, tình trạng an ninh hệ thống và giám sát tài chính.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TRUNG TÂM QUẢN TRỊ HỆ THỐNG (ADMINISTRATION GOVERNANCE WORKSPACE)                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Huy hiệu: 🛡️ QUẢN TRỊ VIÊN HỆ THỐNG]                                                [Vai trò: ADMINISTRATOR]    │
│ TIÊU ĐỀ: TỔNG QUAN QUẢN TRỊ & GIÁM SÁT CHIẾN LƯỢC                                                                │
│ Không gian quản trị tối cao: Quản trị tài khoản nội bộ, quyết toán tài chính, cấu hình thuật toán và an ninh.    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ KHỐI TÁC VỤ ĐẶC QUYỀN CẦN CHÚ Ý (HIGH-PRIORITY GOVERNANCE ACTIONS)                                               │
│                                                                                                                  │
│ ┌─────────────────────────────────────────────────────────┐ ┌──────────────────────────────────────────────────┐ │
│ │ 💳 PHÊ DUYỆT QUYẾT TOÁN TÀI CHÍNH (UC-65)               │ │ 🔐 AN NINH & NHẬT KÝ KIỂM TOÁN (UC-68, 69)        │ │
│ │ Yêu cầu rút tiền đối tác đã được Staff thẩm định hợp lệ │ │ Theo dõi các sự kiện cấu hình, đăng nhập bất     │ │
│ │ đang chờ Administrator xác nhận giải ngân qua ngân hàng.│ │ thường và các thay đổi dữ liệu trọng yếu.        │ │
│ │ [Tác vụ sẵn sàng khi có yêu cầu ApprovedForSettlement]  │ │ [Trạng thái: Đã kết nối API kiểm toán]           │ │
│ │ ➔ [XEM DANH SÁCH CHỜ GIẢI NGÂN]                        │ │ ➔ [TRA CỨU NHẬT KÝ KIỂM TOÁN]                   │ │
│ └─────────────────────────────────────────────────────────┘ └──────────────────────────────────────────────────┘ │
│                                                                                                                  │
│ CÁC PHÂN HỆ QUẢN TRỊ HỆ THỐNG (SYSTEM GOVERNANCE MODULES)                                                        │
│                                                                                                                  │
│ ┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐            │
│ │ ⚙️ THAM SỐ THUẬT TOÁN LÕI     │ │ 📊 BÁO CÁO THỐNG KÊ TOÀN SÀN  │ │ 👥 QUẢN TRỊ TÀI KHOẢN NỘI BỘ  │            │
│ │ Tinh chỉnh thời gian đệm, tốc │ │ Phân tích xu hướng đặt tour,  │ │ Quản lý nhân viên Staff, phân │            │
│ │ độ di chuyển, ngưỡng thời tiết│ │ doanh thu nền tảng, xuất CSV. │ │ quyền truy cập, tạo tài khoản.│            │
│ │ [Đã kết nối API Cấu hình]     │ │ [Chế độ Demo / Cần API tổng]  │ │ [Chờ tích hợp Backend API]    │            │
│ │ ➔ [MỞ CẤU HÌNH THUẬT TOÁN]    │ │ ➔ [KHAI THÁC BÁO CÁO]         │ │ [Tạm thời chưa khả dụng]      │            │
│ └───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘            │
│                                                                                                                  │
│ ┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐            │
│ │ 📍 QUẢN LÝ MASTER DATA POI    │ │ 🛰️ GIÁM SÁT CHUYẾN ĐI VĨ MÔ  │ │ 🔒 BẢO MẬT TÀI KHOẢN ADMIN    │            │
│ │ Xem toàn bộ danh mục điểm tham│ │ Theo dõi toàn bộ du khách đang│ │ Đổi mật khẩu tài khoản quản   │            │
│ │ quan, xóa/vô hiệu hóa đặc quyền│ di chuyển trên toàn hệ thống.   │ trị viên cấp cao hiện tại.      │            │
│ │ [Đã kết nối API Tạo mới]      │ │ [Đã kết nối API Giám sát]     │ │ [Đã kết nối API Đổi pass]     │            │
│ │ ➔ [MỞ DANH MỤC POI]           │ │ ➔ [XEM GIÁM SÁT TOÀN SÀN]     │ │ ➔ [CÀI ĐẶT BẢO MẬT]           │            │
│ └───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘            │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. WIREFRAME MÀN HÌNH DANH SÁCH & BẢNG BIỂU ĐẠI DIỆN (REPRESENTATIVE LIST/TABLE SCREEN)
*Ví dụ: Màn hình Danh sách Yêu cầu Rút tiền (`/admin/payouts`) hoặc Nhật ký Kiểm toán (`/admin/audit-logs`)*

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Đường dẫn: Quản trị Tài chính / Yêu cầu Rút tiền Đối tác]                                                      │
│ TIÊU ĐỀ: DANH SÁCH YÊU CẦU RÚT TIỀN (PAYOUT RECORDS)                                                            │
│ Quản lý, đối soát và thẩm định các yêu cầu thanh toán doanh thu từ đối tác Tour Operator.                       │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC ĐA TIÊU CHÍ (SEARCH & FILTER TOOLBAR)                                            │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [🔍 Tìm kiếm theo Mã yêu cầu, Tên công ty lữ hành, Mã số thuế...]                        [Nút Tìm kiếm]     │ │
│ │                                                                                                              │ │
│ │ Bộ lọc nhanh:                                                                                                │ │
│ │ Trạng thái: [Tất cả trạng thái ▼] | Kỳ đối soát từ: [01/10/2026 📅] đến: [23/10/2026 📅] | [↺ Đặt lại bộ lọc]│ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ BẢNG DỮ LIỆU CHÍNH (SURFACE CARD CONTAINER - TRẮNG #FFFFFF)                                                     │
│ ┌──────┬──────────────┬────────────────────────┬──────────────┬───────────────┬──────────────┬─────────────────┐ │
│ │ STT  │ MÃ YÊU CẦU   │ TÊN TOUR OPERATOR      │ KỲ DOANH THU │ SỐ TIỀN THỰC  │ TRẠNG THÁI   │ HÀNH ĐỘNG       │ │
│ ├──────┼──────────────┼────────────────────────┼──────────────┼───────────────┼──────────────┼─────────────────┤ │
│ │ 01   │ #PAY-2026-089│ Cty Du lịch Đà Nẵng Xanh │ T10/2026     │ 45.200.000 đ  │ [⏳ Chờ thẩm định]│ [Thẩm định ➔]   │ │
│ │ 02   │ #PAY-2026-088│ Danang Heritage Travel │ T10/2026     │ 18.500.000 đ  │ [⏳ Chờ thẩm định]│ [Thẩm định ➔]   │ │
│ │ 03   │ #PAY-2026-087│ Cố Đô Huế Discovery    │ T09/2026     │ 32.100.000 đ  │ [✓ Đã duyệt bước 1]│ [Xem chi tiết] │ │
│ │ 04   │ #PAY-2026-086│ Biển Xanh Cù Lao Chàm  │ T09/2026     │ 12.800.000 đ  │ [🏦 Đã giải ngân] │ [Xem biên lai]  │ │
│ │ 05   │ #PAY-2026-085│ Hội An Eco Tour Co.    │ T09/2026     │ 8.400.000 đ   │ [✕ Đã từ chối] │ [Xem lý do]     │ │
│ └──────┴──────────────┴────────────────────────┴──────────────┴───────────────┴──────────────┴─────────────────┘ │
│                                                                                                                  │
│ THANH PHÂN TRANG (PAGINATION BAR)                                                                                │
│ Hiển thị 1 đến 5 trên tổng số 42 yêu cầu            [Số dòng/trang: 20 ▼]            [◄ Trước] [1] [2] [3] [Sau ►]│
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. WIREFRAME MÀN HÌNH CHI TIẾT & HỘP THOẠI QUYẾT ĐỊNH (DETAIL & DECISION PANEL)
*Ví dụ: Màn hình Thẩm định Yêu cầu Rút tiền (`/admin/payouts/[id]`) hoặc Thẩm định Hồ sơ Tour Operator*

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [◄ Quay lại Hàng đợi]    [Đường dẫn: Rút tiền / Thẩm định yêu cầu #PAY-2026-089]                                 │
│ THẨM ĐỊNH YÊU CẦU RÚT TIỀN: #PAY-2026-089                                            [Trạng thái: ⏳ CHỜ THẨM ĐỊNH]│
│ Thời điểm gửi: 23/10/2026 08:30:15 • Người gửi: Nguyễn Văn B (Kế toán trưởng - Cty Du lịch Đà Nẵng Xanh)        │
├──────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────┤
│ KHỐI THÔNG TIN ĐỐI SOÁT CHI TIẾT (70% CHIỀU RỘNG)    │ KHỐI TÓM TẮT & BẢNG QUYẾT ĐỊNH (30% CHIỀU RỘNG)           │
│                                                      │                                                           │
│ 🏢 1. THÔNG TIN PHÁP LÝ & TÀI KHOẢN NGÂN HÀNG        │ 💰 TỔNG HỢP NGHĨA VỤ THANH TOÁN                           │
│ • Tên công ty: Cty TNHH Du lịch Đà Nẵng Xanh         │ ┌───────────────────────────────────────────────────────┐ │
│ • Mã số thuế: 0401892831                             │ │ Tổng giá trị đặt tour (Gross):         50.000.000 đ   │ │
│ • Ngân hàng: Vietcombank - CN Đà Nẵng                │ │ Khấu trừ hoa hồng sàn (10%):           -4.800.000 đ   │ │
│ • Số tài khoản: 0041000289123                        │ │ Giảm trừ hoàn tiền / khiếu nại:                0 đ   │ │
│ • Chủ tài khoản: CTY TNHH DU LICH DA NANG XANH       │ ├───────────────────────────────────────────────────────┤ │
│                                                      │ │ SỐ TIỀN THỰC NHẬN (NET):               45.200.000 đ   │ │
│ 📊 2. DANH SÁCH 18 ĐƠN ĐẶT TOUR ĐÓNG GÓP DOANH THU   │ └───────────────────────────────────────────────────────┘ │
│ ┌──────┬──────────────┬──────────────┬─────────────┐ │                                                           │
│ │ MÃ ĐƠN│ NGÀY TOUR   │ SỐ DU KHÁCH  │ TỔNG TIỀN   │ │ ⚖️ BẢNG QUYẾT ĐỊNH THẨM ĐỊNH (DECISION PANEL)             │
│ ├──────┼──────────────┼──────────────┼─────────────┤ │ Nhân viên vận hành chịu trách nhiệm đối soát tính hợp lệ│
│ │ #B-101│ 02/10/2026   │ 04 khách     │ 6.000.000 đ │ │ của các giao dịch trước khi chuyển tiếp cho Admin duyệt.│
│ │ #B-102│ 05/10/2026   │ 02 khách     │ 3.200.000 đ │ │                                                           │
│ │ #B-103│ 08/10/2026   │ 08 khách     │ 14.000.000 đ│ │ [✓ PHÊ DUYỆT YÊU CẦU (CHUYỂN ADMIN)] (Nút Deep Forest)  │
│ │ ...  │ ...          │ ...          │ ...         │ │                                                           │
│ └──────┴──────────────┴──────────────┴─────────────┘ │ [✕ TỪ CHỐI YÊU CẦU (YÊU CẦU SỬA)]     (Nút Viền Đỏ)       │
└──────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────┘

HỘP THOẠI XÁC NHẬN TỪ CHỐI (MODAL - FOCUS-TRAPPED & ACCESSIBLE)
┌─────────────────────────────────────────────────────────────────────────┐
│ ✕ TỪ CHỐI YÊU CẦU RÚT TIỀN #PAY-2026-089                                │
├─────────────────────────────────────────────────────────────────────────┤
│ Vui lòng cung cấp lý do từ chối rõ ràng và cụ thể. Lý do này sẽ được    │
│ gửi đến đối tác Tour Operator để họ kiểm tra lại số liệu hoặc hóa đơn. │
│                                                                         │
│ Lý do từ chối (Bắt buộc, tối thiểu 20 ký tự):                           │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Đơn tour #B-103 đang có khiếu nại hoàn tiền từ du khách chưa giải   │ │
│ │ quyết xong. Đề nghị đối tác rà soát lại trước khi yêu cầu rút tiền. │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ [Ký tự: 125 / 500]                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                      [Hủy bỏ]   [XÁC NHẬN TỪ CHỐI]      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. WIREFRAME TRẢI NGHIỆM ĐIỀU KHIỂN TRÊN THIẾT BỊ DI ĐỘNG (MOBILE RESPONSIVE SHELL)
*Áp dụng khi nhân viên hoặc quản trị viên mở ứng dụng trên màn hình di động (< 640px)*

```text
┌──────────────────────────────────────┐
│ [☰ Menu] [TRIPMATE ADMIN]  [Tài khoản]│ <--- Topbar thu gọn (h=56px)
├──────────────────────────────────────┤
│ BÀN LÀM VIỆC VẬN HÀNH                │
│ [🟢 Ca trực hoạt động] [STAFF]        │
├──────────────────────────────────────┤
│ HÀNG ĐỢI CẦN DUYỆT GẤP               │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 📋 DUYỆT TOUR OPERATOR           │ │ Thẻ dạng Card dọc tự co giãn
│ │ Có 3 hồ sơ đối tác đang chờ      │ │
│ │ [VÀO XỬ LÝ ➔]                    │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ 💰 THẨM ĐỊNH RÚT TIỀN            │ │
│ │ Có 2 yêu cầu rút tiền mới        │ │
│ │ [VÀO XỬ LÝ ➔]                    │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ 🛰️ GIÁM SÁT CHUYẾN ĐI            │ │
│ │ 5 chuyến đi đang trên lộ trình   │ │
│ │ [MỞ BẢN ĐỒ ➔]                    │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘

KHI NHẤN NÚT [☰ MENU] TRÊN MOBILE:
DRAWER TRƯỢT TỪ BÊN TRÁI SANG (OVERLAY DRAWER w=80%)
┌───────────────────────────────┬──────┐
│ [TRIPMATE ADMIN]          [✕] │ Mờ   │
├───────────────────────────────┤ nền  │
│ ❖ Tổng quan ca trực           │ đen  │
│ 📋 Hàng đợi kiểm duyệt:       │      │
│   • Duyệt Tour Operator       │      │
│   • Duyệt bài đăng Tour       │      │
│   • Thẩm định Rút tiền        │      │
│ 📍 Dữ liệu & Lộ trình:        │      │
│   • Điểm tham quan (POI)      │      │
│   • Tuyến đường               │      │
│ 🛰️ Giám sát trực ban          │      │
│ 👥 Quản lý người dùng         │      │
│ 🔒 Đổi mật khẩu cá nhân       │      │
│ 🚪 Đăng xuất                  │      │
└───────────────────────────────┴──────┘
```
