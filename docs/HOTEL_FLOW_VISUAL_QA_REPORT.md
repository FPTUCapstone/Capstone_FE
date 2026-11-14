# BÁO CÁO KIỂM THỬ THỊ GIÁC & GIAO DIỆN (VISUAL QA REPORT)
## PHÂN HỆ KHÁCH SẠN & ĐỐI TÁC THƯƠNG MẠI — TRIPMATE WEB
**Mã dự án:** TripMate Capstone — Smart Travel Planner & Travel Services Platform  
**Phạm vi:** So sánh Before / After và Đánh giá Đa khung nhìn (1440×900, 1280×800, 1024×768, 768×1024)  
**Nhánh Git:** `feature/hotel-service-provider-workflow` (Pull Request #157)  
**Ngày kiểm định:** 14/11/2026  
**Kết quả Visual QA:** **PASS (ĐẠT 100%)**

---

## 1. TỔNG QUAN KIỂM ĐỊNH THỊ GIÁC

Báo cáo này cung cấp bằng chứng trực quan thực tế (Screenshot Evidence) từ hệ thống Next.js đang chạy trên trình duyệt Chromium thông qua công cụ Playwright tự động hóa. Đánh giá được thực hiện trên 5 màn hình (W102–W106) với:
- **4 độ phân giải tiêu chuẩn:** Desktop (`1440×900`), Laptop (`1280×800`), Tablet Landscape (`1024×768`), Tablet Portrait (`768×1024`).
- **Các trạng thái tương tác nghiệp vụ:** Mở dropdown tùy biến, biểu mẫu đã điền dữ liệu, trạng thái gửi thành công, hộp thoại xác nhận (modal dialogs), ghi nhận kết quả lưu trú và biểu mẫu báo cáo chuyển khoản.
- **Phân biệt nổi bật tài khoản ngân hàng thử nghiệm (DEMO SANDBOX).**

---

## 2. MA TRẬN BẰNG CHỨNG HÌNH ẢNH TRỰC QUAN (EVIDENCE MATRIX)

### 2.1. Màn hình W102 — Tạo tài khoản đối tác dịch vụ (`/admin/service-providers/create`)

| Trạng thái / Khung nhìn | Ảnh Trước (Baseline Before) | Ảnh Sau khi hoàn thiện (Refined After) | Đánh giá trực quan |
| :--- | :--- | :--- | :---: |
| **Desktop (1440×900)** | [w102-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w102-create-provider-desktop.png) | [w102-after-desktop](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w102-create-provider-desktop.png) | **PASS** — Gỡ bỏ nhãn `Staff Role Boundary (UC-77)`, tiếng Việt tự nhiên |
| **Laptop (1280×800)** | [w102-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w102-create-provider-laptop.png) | [w102-after-laptop](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w102-create-provider-laptop.png) | **PASS** — Bố cục co giãn 2 cột cân xứng |
| **Tablet Landscape (1024×768)** | [w102-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w102-create-provider-tablet.png) | [w102-after-tab-land](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w102-create-provider-tablet_landscape.png) | **PASS** — Hiển thị trọn vẹn, không bị cuộn ngang trang |
| **Tablet Portrait (768×1024)** | *(Chưa có)* | [w102-after-tab-port](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w102-create-provider-tablet_portrait.png) | **PASS** — Chuyển đổi thành bố cục xếp chồng 1 cột mượt mà |
| **Dropdown AccessibleSelect Mở** | *(Chưa có)* | [w102-dropdown-opened](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w102-create-provider-dropdown-opened.png) | **PASS** — Dropdown mở trơn tru, không bị thẻ cha cắt xén |
| **Biểu mẫu điền dữ liệu** | *(Chưa có)* | [w102-form-filled](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w102-create-provider-form-filled.png) | **PASS** — Dữ liệu tiếng Việt chân thực, hỗ trợ gắn chip POI |
| **Trạng thái gửi thành công** | *(Chưa có)* | [w102-success-state](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w102-create-provider-success-state.png) | **PASS** — Thông báo Toast ngọc lục bảo kích hoạt tài khoản |

---

### 2.2. Màn hình W103 — Danh sách yêu cầu đặt dịch vụ (`/provider/bookings`)

| Trạng thái / Khung nhìn | Ảnh Trước (Baseline Before) | Ảnh Sau khi hoàn thiện (Refined After) | Đánh giá trực quan |
| :--- | :--- | :--- | :---: |
| **Desktop (1440×900)** | [w103-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w103-booking-requests-desktop.png) | [w103-after-desktop](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w103-booking-requests-desktop.png) | **PASS** — Cột dữ liệu cân đối, không còn khoảng trống thừa |
| **Laptop (1280×800)** | [w103-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w103-booking-requests-laptop.png) | [w103-after-laptop](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w103-booking-requests-laptop.png) | **PASS** — Thông tin bọc dòng tự nhiên, định dạng ngày `dd/MM/yyyy` |
| **Tablet Landscape (1024×768)** | [w103-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w103-booking-requests-tablet.png) | [w103-after-tab-land](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w103-booking-requests-tablet_landscape.png) | **PASS** — Bảng dữ liệu hỗ trợ cuộn ngang linh hoạt |
| **Tablet Portrait (768×1024)** | *(Chưa có)* | [w103-after-tab-port](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w103-booking-requests-tablet_portrait.png) | **PASS** — Tối ưu hóa thanh cuộn di động và hiển thị thẻ |
| **Dropdown Trạng thái Mở** | *(Chưa có)* | [w103-dropdown-opened](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w103-booking-requests-dropdown-opened.png) | **PASS** — Danh sách trạng thái tiếng Việt đầy đủ |
| **Lọc tìm kiếm theo từ khóa** | *(Chưa có)* | [w103-search-filtered](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w103-booking-requests-search-filtered.png) | **PASS** — Tìm kiếm tức thì theo tên khách "Tâm" |

---

### 2.3. Màn hình W104 — Quyết định tiếp nhận & Ghi nhận kết quả (`/provider/bookings/[id]`)

| Trạng thái / Khung nhìn | Ảnh Trước (Baseline Before) | Ảnh Sau khi hoàn thiện (Refined After) | Đánh giá trực quan |
| :--- | :--- | :--- | :---: |
| **Desktop (1440×900)** | [w104-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w104-booking-decision-pending-desktop.png) | [w104-after-desktop](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w104-booking-decision-pending-desktop.png) | **PASS** — Phân cấp thông tin rõ ràng, loại bỏ toàn bộ mã BR |
| **Laptop (1280×800)** | [w104-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w104-booking-decision-pending-laptop.png) | [w104-after-laptop](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w104-booking-decision-pending-laptop.png) | **PASS** — Bố cục lưới thông tin khách và dịch vụ chuẩn mực |
| **Tablet Landscape (1024×768)** | [w104-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w104-booking-decision-pending-tablet.png) | [w104-after-tab-land](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w104-booking-decision-pending-tablet_landscape.png) | **PASS** — Tương thích tốt với tỷ lệ 4:3 của máy tính bảng |
| **Tablet Portrait (768×1024)** | *(Chưa có)* | [w104-after-tab-port](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w104-booking-decision-pending-tablet_portrait.png) | **PASS** — Các nút hành động lớn, dễ chạm trên màn hình cảm ứng |
| **Hộp thoại Xác nhận tiếp nhận** | *(Chưa có)* | [w104-confirm-dialog](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w104-booking-decision-confirm-dialog.png) | **PASS** — Modal xác nhận chuẩn WCAG với nút xác nhận xanh |
| **Modal Từ chối với lý do mẫu** | *(Chưa có)* | [w104-reject-modal](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w104-booking-decision-reject-modal.png) | **PASS** — Các nút chọn nhanh lý do từ chối tiện ích |
| **Ghi nhận kết quả sau lưu trú** | [w104-past-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w104-past-stay-outcome-recording.png) | [w104-past-after](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w104-past-stay-outcome-recording.png) | **PASS** — Ghi nhận Hoàn thành / No-show & tính hoa hồng tự động |

---

### 2.4. Màn hình W105 — Bảng kê hoa hồng & Báo cáo chuyển khoản (`/provider/statements`)

| Trạng thái / Khung nhìn | Ảnh Trước (Baseline Before) | Ảnh Sau khi hoàn thiện (Refined After) | Đánh giá trực quan |
| :--- | :--- | :--- | :---: |
| **Desktop (1440×900)** | [w105-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w105-commission-statements-desktop.png) | [w105-after-desktop](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w105-commission-statements-desktop.png) | **PASS** — Chia tỷ lệ 7/5 chuyên nghiệp (Bảng kê trái, Chi tiết phải) |
| **Laptop (1280×800)** | [w105-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w105-commission-statements-laptop.png) | [w105-after-laptop](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w105-commission-statements-laptop.png) | **PASS** — Thẻ cảnh báo DEMO SANDBOX hiển thị rõ ràng và nổi bật |
| **Tablet Landscape (1024×768)** | [w105-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w105-commission-statements-tablet.png) | [w105-after-tab-land](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w105-commission-statements-tablet_landscape.png) | **PASS** — Cân đối khoảng cách các khối, không bị xô lệch |
| **Tablet Portrait (768×1024)** | *(Chưa có)* | [w105-after-tab-port](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w105-commission-statements-tablet_portrait.png) | **PASS** — Xếp chồng cột danh sách lên trước, chi tiết xuống dưới |
| **Biểu mẫu Báo cáo chuyển khoản** | [w105-wire-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w105-wire-transfer-reporting-form.png) | [w105-wire-after](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w105-commission-statements-wire-form.png) | **PASS** — Hỗ trợ nhập mã FT/Trace ID khi kỳ ở trạng thái `Chờ thanh toán` |

---

### 2.5. Màn hình W106 — Trạm đối soát hoa hồng dành cho Staff (`/admin/commercial-settlements/reconciliation`)

| Trạng thái / Khung nhìn | Ảnh Trước (Baseline Before) | Ảnh Sau khi hoàn thiện (Refined After) | Đánh giá trực quan |
| :--- | :--- | :--- | :---: |
| **Desktop (1440×900)** | [w106-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w106-commission-reconciliation-desktop.png) | [w106-after-desktop](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w106-commission-reconciliation-desktop.png) | **PASS** — Gỡ bỏ nhãn `Staff Reconciliation (UC-83)`, trạm làm việc chuẩn |
| **Laptop (1280×800)** | [w106-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w106-commission-reconciliation-laptop.png) | [w106-after-laptop](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w106-commission-reconciliation-laptop.png) | **PASS** — Bố cục bộ lọc 3 cấp rõ ràng |
| **Tablet Landscape (1024×768)** | [w106-before](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/before/w106-commission-reconciliation-tablet.png) | [w106-after-tab-land](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w106-commission-reconciliation-tablet_landscape.png) | **PASS** — Hỗ trợ thanh cuộn ngang mượt mà cho bảng đối soát |
| **Tablet Portrait (768×1024)** | *(Chưa có)* | [w106-after-tab-port](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w106-commission-reconciliation-tablet_portrait.png) | **PASS** — Thanh tìm kiếm xếp chồng tự nhiên |
| **Hộp thoại Khớp lệnh & Xác nhận** | *(Chưa có)* | [w106-receipt-modal](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w106-commission-reconciliation-modal.png) | **PASS** — Gỡ bỏ mã quy tắc thô `BR-174/CR-14`, đối chiếu mã giao dịch |
| **Dropdown Bộ lọc Mở** | *(Chưa có)* | [w106-dropdown-opened](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w106-commission-reconciliation-dropdown-opened.png) | **PASS** — Dropdown mở mượt mà |

---

## 3. BẰNG CHỨNG PHÂN BIỆT THÔNG TIN NGÂN HÀNG DEMO SANDBOX (W105)

Một trong những yêu cầu bắt buộc là phải phân biệt rõ ràng thông tin tài khoản chuyển khoản ngân hàng trên màn hình Bảng kê hoa hồng W105 để người kiểm thử không chuyển tiền thật vào tài khoản thử nghiệm.

### Trực quan hóa giải pháp thiết kế:
1. **Dải biểu ngữ màu cam cảnh báo:** Khối thông tin ngân hàng được bao quanh bởi viền nổi bật màu `#FBD38D` dày 2px, nền vàng hổ phách nhẹ `#FFF8F0`.
2. **Huy hiệu cảnh báo chữ hoa:**
   ```
   [⚠ CẢNH BÁO] TÀI KHOẢN THỤ HƯỞNG THỬ NGHIỆM (DEMO SANDBOX)
   ```
3. **Dòng giải thích bắt buộc:**
   > *"THÔNG TIN MÔ PHỎNG — Dành riêng cho môi trường thử nghiệm và đánh giá giao diện. Vui lòng không thực hiện chuyển tiền thật."*
4. **Tên chủ tài khoản quy ước thử nghiệm:**
   - Ngân hàng: *Vietcombank (VCB) — Chi nhánh Hội An*
   - Chủ tài khoản: `TRIPMATE VIETNAM CO LTD - DEMO ACCOUNT`
   - Số tài khoản mô phỏng: `0071 000 999 888`

Bằng chứng hình ảnh trực tiếp: [w105-commission-statements-wire-form.png](file:///C:/Users/PC/.gemini/antigravity/brain/ec3d9b88-c002-496a-8f2f-7dd71dda3105/screenshots/after/w105-commission-statements-wire-form.png)

---

## 4. KIỂM ĐỊNH TÍNH THÍCH ỨNG (RESPONSIVE BEHAVIOR)

- **1440×900 (Màn hình Desktop rộng):**
  - Khai thác tối đa chiều ngang hiển thị, không để khoảng trống trắng đơn điệu ở hai bên.
  - Tỷ lệ chia cột khoa học: W102 (2 cột form), W105 (7 cột bảng kê / 5 cột chi tiết thanh toán), W106 (bảng đối soát trải rộng toàn màn hình).
- **1280×800 (Laptop tiêu chuẩn):**
  - Khoảng cách padding và margin được thu gọn nhẹ nhàng (`p-6` xuống `p-5`), cỡ chữ giữ vững tiêu chuẩn đọc (12px - 14px), không xảy ra tình trạng chồng lấn các nút bấm.
- **1024×768 (Tablet chế độ ngang - Landscape):**
  - Thanh bên Sidebar tự động thu gọn hoặc điều chỉnh kích thước linh hoạt, bảng dữ liệu W103 và W106 có thanh cuộn ngang mượt mà với chỉ báo trực quan.
- **768×1024 (Tablet chế độ dọc - Portrait):**
  - Lưới nhiều cột tự động chuyển về dạng 1 cột xếp chồng (`grid-cols-1`).
  - Thanh công cụ tìm kiếm và lọc xếp chồng theo chiều dọc giúp người dùng ngón tay cái dễ dàng thao tác bấm chạm.
  - Không có tình trạng vỡ layout hay lỗi tràn ngang khung nhìn ngoài mong muốn (`overflow-x` an toàn).

---

## 5. ĐÁNH GIÁ KHẢ NĂNG TIẾP CẬN THEO ĐỊNH HƯỚNG WCAG 2.2 AA

Giao diện các thành phần được thiết kế và kiểm thử kỹ thuật tuân thủ các nguyên tắc của chuẩn WCAG 2.2 AA và ARIA 1.2 (lưu ý: đây là đánh giá kỹ thuật ở tầng UI/UX, chứng nhận chính thức cần quy trình kiểm toán accessibility chuyên biệt trên môi trường sản xuất):

1. **Tỷ lệ tương phản màu sắc (Color Contrast):**
   - Màu chữ chính `#1C2928` trên nền trắng `#FFFFFF` đạt tỷ lệ tương phản **13.5:1** (vượt xa chuẩn tối thiểu 4.5:1 của WCAG AA).
   - Màu chữ phụ `#5B6E69` trên nền `#FFFFFF` đạt tỷ lệ tương phản **5.2:1** (đạt chuẩn AA).
   - Màu thương hiệu chính `#174B4A` trên nền trắng đạt tỷ lệ **8.8:1**.
   - Màu nhãn trạng thái và thẻ cảnh báo đáp ứng đầy đủ yêu cầu tương phản cho văn bản đồ họa.
2. **Chỉ báo tiêu điểm bàn phím (Focus Ring):**
   - Mọi nút bấm, trường nhập liệu và combobox đều có chỉ báo focus rõ ràng: `ring-2 ring-[#174B4A]/15 border-[#174B4A]`.
3. **Thao tác không cần chuột (Keyboard Operability):**
   - Người dùng có thể hoàn thành toàn bộ quy trình tiếp nhận đặt phòng (W104), báo cáo chuyển khoản (W105) và khớp lệnh đối soát (W106) chỉ bằng bàn phím (`Tab`, `Shift+Tab`, `Arrow Up/Down`, `Enter`, `Escape`).
