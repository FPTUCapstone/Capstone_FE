# BÁO CÁO HOÀN THIỆN GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX)
## PHÂN HỆ QUẢN LÝ DỊCH VỤ KHÁCH SẠN & ĐỐI TÁC THƯƠNG MẠI — TRIPMATE WEB
**Mã dự án:** TripMate Capstone — Smart Travel Planner & Travel Services Platform  
**Phạm vi:** Giao diện Web Quản trị & Đối tác Dịch vụ (Màn hình W102, W103, W104, W105, W106)  
**Nhánh Git:** `feature/hotel-service-provider-workflow` (Pull Request dự thảo #157)  
**Tài liệu yêu cầu chuẩn:** `Report3_Software-Requirement-Specification.docx` (Bản gốc Report 3, không dùng V2)  
**Ngày hoàn thiện:** 14/11/2026  
**Trạng thái kiểm định UI/UX:** **PASS (ĐẠT 100% TIÊU CHÍ GIAO DIỆN & MOCK FLOW)**  
*(Lưu ý: Báo cáo này xác nhận hoàn thiện tầng Frontend UI/UX và luồng tương tác mô phỏng đã được Owner phê duyệt; toàn bộ ranh giới Backend, cơ sở dữ liệu thật và các quy tắc nghiệp vụ chờ duyệt được tách bạch tại tài liệu Engineering Handoff)*

---

## 1. TỔNG QUAN NHIỆM VỤ & ĐỊNH HƯỚNG THỰC HIỆN

Nhiệm vụ trọng tâm là hoàn thiện toàn diện giao diện người dùng (UI) và trải nghiệm tương tác (UX) của phân hệ Đối tác Khách sạn & Dịch vụ Thương mại (W102–W106) đạt tiêu chuẩn chất lượng sản phẩm thực tế, sẵn sàng trình diễn và bàn giao kỹ thuật, dựa trên thiết kế đã được Owner duyệt.

### Các nguyên tắc thực hiện bắt buộc:
1. **Bảo toàn kiến trúc & thiết kế đã duyệt:** Không đập đi làm lại từ đầu. Kế thừa và tinh chỉnh giao diện thực tế dựa trên hệ thống thiết kế TripMate (TripMate Design System).
2. **Loại bỏ toàn bộ nhãn quy cách thử nghiệm:** Loại bỏ triệt để các mã kỹ thuật như `UC-77`, `UC-83`, `BR-195`, `BR-196`, `BR-198`, `Screen W102`, `W106`... khỏi giao diện người dùng. Người dùng cuối và đối tác chỉ thấy giao diện nghiệp vụ trực quan, không thấy các thẻ quy cách đặc tả.
3. **Bản địa hóa tiếng Việt tự nhiên (Vietnamese-First):** Toàn bộ nhãn, thông điệp, hướng dẫn, trạng thái, modal và thông báo được viết bằng tiếng Việt nghiệp vụ chuẩn mực. Định dạng ngày giờ thống nhất (`dd/MM/yyyy`, `HH:mm`), tiền tệ Việt Nam Đồng rõ ràng (`X.XXX.XXX ₫`).
4. **Phân biệt rõ ràng dữ liệu ngân hàng thử nghiệm (DEMO SANDBOX):** Cảnh báo nổi bật và nhãn nhận diện mô phỏng tại màn hình bảng kê (W105) để tránh mọi hiểu lầm về tài khoản chuyển tiền thật.
5. **Khả năng tiếp cận & Tương tác chuyên nghiệp:** Hoàn thiện 2 component lựa chọn tùy biến (`AccessibleSelect` và `SearchableMultiSelect`) tuân thủ chuẩn WAI-ARIA 1.2 combobox và định hướng WCAG 2.2 AA, hỗ trợ bàn phím đầy đủ, chống tràn khung nhìn (viewport boundary auto-flip) và không bị cắt khuất (overflow clipping).
6. **Tuân thủ tuyệt đối ranh giới quyền & kỹ thuật:** Không sửa đổi `Capstone_BE` hay `Capstone_Mobile`; không chuyển trạng thái Draft PR #157 thành Ready for Review. Tách riêng các vấn đề Backend/cơ sở dữ liệu sang tài liệu Engineering Handoff.

---

## 2. MA TRẬN PHỦ MÀN HÌNH & TRUY VẾT YÊU CẦU (SRS MATRIX)

Ma trận truy vết yêu cầu đối chiếu trực tiếp với tài liệu `Report3_Software-Requirement-Specification.docx`:

| Mã màn hình | Use Case SRS | Tác nhân (Actor) | Tuyến đường Web (Route) | Tên màn hình nghiệp vụ | Trạng thái UI/UX |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **W102** | `UC-77` (§3.9.1.5) | Staff (Nhân viên Vận hành) | `/admin/service-providers/create` | Tạo tài khoản đối tác dịch vụ & liên kết cơ sở | **PASS** |
| **W103** | `UC-78` (§3.6.3) | Service Provider (Đối tác lưu trú) | `/provider/bookings` | Danh sách yêu cầu đặt dịch vụ | **PASS** |
| **W104** | `UC-79`, `UC-80` (§3.6.4, §3.6.5) | Service Provider (Đối tác lưu trú) | `/provider/bookings/[id]` | Chi tiết yêu cầu, Tiếp nhận & Ghi nhận kết quả | **PASS** |
| **W105** | `UC-82` (§3.6.6) | Service Provider (Đối tác lưu trú) | `/provider/statements` | Bảng kê hoa hồng & Báo cáo chuyển khoản | **PASS** |
| **W106** | `UC-83` (§3.6.7) | Staff (Nhân viên Tài chính) | `/admin/commercial-settlements/reconciliation` | Trạm đối soát hoa hồng & Khớp lệnh chuyển khoản | **PASS** |
| *Ghi chú* | `UC-81` (§3.10.7) | System (Tự động) | *(Chức năng ngầm định kỳ)* | *Tính toán hoa hồng tự động cuối tháng — Không có màn hình riêng* | **N/A** |

---

## 3. CHI TIẾT CẢI TIẾN THIẾT KẾ & TRẢI NGHIỆM TỪNG MÀN HÌNH

### 3.1. Thành phần Dropdown Tùy biến (`AccessibleSelect` & `SearchableMultiSelect`)
- **Khả năng tiếp cận WAI-ARIA 1.2 & WCAG 2.2 AA:**
  - Hỗ trợ đầy đủ các thuộc tính `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`, `aria-controls`, `aria-activedescendant`.
  - Điều hướng bàn phím mượt mà: `ArrowDown` / `ArrowUp` duyệt tùy chọn, `Enter` / `Space` kích hoạt/chọn, `Home` / `End` về đầu/cuối danh sách, `Escape` đóng menu và hoàn trả focus về nút kích hoạt.
- **Xử lý chống cắt khuất & tràn khung nhìn (Viewport Boundary Check):**
  - Tự động tính toán vị trí hiển thị: khi menu mở gần mép dưới màn hình (dưới 260px trống), dropdown tự động lật lên phía trên (`dropdownPosition: 'top'`) thay vì rơi xuống dưới.
  - Loại bỏ hoàn toàn `overflow: hidden` tại thẻ card chứa dropdown trên màn hình W102, giúp danh sách mở tràn tự nhiên mà không bị xén mất nội dung.
- **Thẩm mỹ thị giác:**
  - Viền màu `#DCE2DD`, hiệu ứng focus ring `#174B4A/15`, màu nền tương tác nhẹ `#F0FDF4`.
  - Biểu tượng mũi tên chevron xoay 180 độ chuyển động êm ái khi đóng/mở.

---

### 3.2. Màn hình W102 — Tạo tài khoản đối tác dịch vụ (`/admin/service-providers/create`)
- **Tác nhân:** Staff (Nhân viên Vận hành TripMate).
- **Cải tiến trực quan:**
  - **Loại bỏ nhãn đặc tả:** Gỡ bỏ thẻ `Staff Role Boundary (UC-77)`, thay bằng thanh tiêu đề trang nghiêm túc `Khu vực Nhân viên Vận hành`.
  - **Làm sạch lưu ý bảo mật:** Loại bỏ văn bản tham chiếu thô `SRS §3.9.1.5`, thay bằng hướng dẫn nghiệp vụ mạch lạc về tạo mật khẩu một lần và mã hóa gửi qua email đăng ký.
  - **Bố cục biểu mẫu nhóm rõ ràng:** Chia thành 2 khối lớn: *Thông tin cơ sở & Người đại diện* (Tên cơ sở, Loại hình dịch vụ, Người đại diện, Email, Số điện thoại) và *Liên kết Điểm lưu trú thương mại*.
  - **Tìm kiếm & gắn thẻ POI (`SearchableMultiSelect`):** Cho phép gõ tìm kiếm điểm POI theo tên hoặc mã, hiển thị các chip gắn thẻ tiện lợi với nút bấm xóa nhanh `✕`, cùng nhãn trạng thái trực quan (`Hoạt động`, `Đã liên kết đối tác khác`).
  - **Xử lý lỗi & Trạng thái gửi thành công:** Hiển thị thông báo lỗi trường cụ thể với biểu tượng cảnh báo màu đỏ và thông báo Toast thành công màu ngọc lục bảo khi tài khoản được kích hoạt thành công.

---

### 3.3. Màn hình W103 — Danh sách yêu cầu đặt dịch vụ (`/provider/bookings`)
- **Tác nhân:** Service Provider (Đối tác lưu trú / Khách sạn).
- **Cải tiến trực quan:**
  - **Bố cục bảng dữ liệu cân đối:** Điều chỉnh độ rộng các cột tối ưu (`Mã yêu cầu`: 140px, `Dịch vụ & Phòng`: 240px, `Khách lưu trú`: 180px, `Ngày & Giờ`: 140px, `Doanh thu dự kiến`: 130px, `Trạng thái`: 150px, `Thao tác`: 90px).
  - **Thanh lọc và tìm kiếm:** Bộ lọc trạng thái bằng `AccessibleSelect` (Tất cả, Chờ xác nhận, Đã xác nhận, Đã hoàn thành, Vắng mặt, Đã từ chối, Đã hủy, Hết hạn) kết hợp ô tìm kiếm tức thì theo mã yêu cầu hoặc tên khách hàng.
  - **Chỉ báo trạng thái trực quan (`StatusBadge`):** Dùng màu sắc và biểu tượng ngữ nghĩa đồng bộ (Vàng cho Chờ xác nhận, Xanh lá cho Đã xác nhận/Đã hoàn thành, Đỏ cho Từ chối, Xám cho Đã hủy/Hết hạn).
  - **Thích ứng màn hình nhỏ (Responsive):** Cho phép cuộn ngang bảng mượt mà trên tablet và mobile mà không làm vỡ bố cục tổng thể.

---

### 3.4. Màn hình W104 — Quyết định tiếp nhận & Ghi nhận kết quả (`/provider/bookings/[id]`)
- **Tác nhân:** Service Provider (Đối tác lưu trú / Khách sạn).
- **Cải tiến trực quan:**
  - **Phân cấp thông tin rõ ràng:** Phân tách thành 3 khối chính: *Chi tiết yêu cầu lưu trú*, *Khu vực quyết định của đối tác (Tiếp nhận / Từ chối)*, và *Khu vực ghi nhận kết quả sau lưu trú (Dành cho đặt phòng đã qua ngày)*.
  - **Loại bỏ hoàn toàn quy cách thô:**
    - Thay thế `Direct Hotel Payment Policy (BR-196)` bằng văn bản nghiệp vụ lịch sự: `Chính sách thanh toán trực tiếp: Khách hàng thanh toán toàn bộ chi phí tại quầy lễ tân khi nhận/trả phòng. TripMate không thu tiền trước qua ứng dụng.`
    - Gỡ bỏ dòng chữ thô `(Mandatory per BR-195)` trong modal từ chối.
    - Gỡ bỏ dòng chữ `Proposal BR-198` trong phần tính toán hoa hồng.
  - **Modal tiếp nhận & từ chối chuyên nghiệp:**
    - Hộp thoại `ConfirmationDialog` hỏi xác nhận trước khi tiếp nhận.
    - Hộp thoại từ chối cung cấp sẵn các lý do mẫu thông dụng (`Khách sạn đã hết phòng trong ngày được chọn`, `Không thể đáp ứng yêu cầu đặc biệt của khách`, `Giá phòng hoặc thông tin dịch vụ có sự thay đổi`) giúp lễ tân thao tác nhanh bằng một cú nhấp chuột.
  - **Ghi nhận kết quả sau lưu trú:** Với các yêu cầu đã xác nhận và ngày lưu trú đã trôi qua (ví dụ `req-004` ngày 11/11/2026), giao diện tự động mở bảng biểu ghi nhận kết quả: chọn `Đã hoàn thành (Check-out)` hoặc `Vắng mặt (No-show)`, nhập doanh thu thực tế và xem trước mức hoa hồng 10% được tính tức thì.

---

### 3.5. Màn hình W105 — Bảng kê hoa hồng & Báo cáo chuyển khoản (`/provider/statements`)
- **Tác nhân:** Service Provider (Đối tác lưu trú / Khách sạn).
- **Cải tiến trực quan:**
  - **PHÂN BIỆT RÕ RÀNG THÔNG TIN NGÂN HÀNG THỬ NGHIỆM (DEMO SANDBOX):**
    - Thiết kế khối thông tin chuyển khoản nổi bật với viền màu cam hổ phách `#FBD38D`, dải biểu ngữ cảnh báo màu nâu ấm `#9C4221`:
      > **TÀI KHOẢN THỤ HƯỞNG THỬ NGHIỆM (DEMO SANDBOX)**  
      > *THÔNG TIN MÔ PHỎNG — Dành riêng cho môi trường thử nghiệm và đánh giá giao diện. Vui lòng không thực hiện chuyển tiền thật.*
    - Cung cấp đầy đủ thông tin ngân hàng mô phỏng (Vietcombank - CN Hội An, Số tài khoản mô phỏng, Chủ tài khoản `TRIPMATE VIETNAM CO LTD - DEMO ACCOUNT`), cùng mã cú pháp chuyển khoản rõ ràng.
  - **Biểu mẫu báo cáo chuyển khoản:** Khi đối tác chọn kỳ bảng kê đang có trạng thái `Chờ thanh toán` (`Issued`), biểu mẫu bên phải mở ra cho phép nhập Mã giao dịch ngân hàng / Mã tham chiếu ủy nhiệm chi (`Mã tham chiếu ngân hàng (FT/Trace ID)`), xác nhận gửi báo cáo thanh toán lên hệ thống.
  - **Bảng đối soát chi tiết từng lượt đặt phòng:** Hiển thị danh sách các mã đặt phòng hợp lệ đóng góp vào doanh thu của kỳ bảng kê được chọn, bao gồm tên khách, ngày trả phòng, số tiền thực tế và phần hoa hồng tương ứng.

---

### 3.6. Màn hình W106 — Trạm đối soát hoa hồng dành cho Staff (`/admin/commercial-settlements/reconciliation`)
- **Tác nhân:** Staff (Nhân viên Đối soát Tài chính TripMate).
- **Cải tiến trực quan:**
  - **Định danh nghiệp vụ chuẩn:** Gỡ bỏ thẻ `Staff Reconciliation (UC-83)`, hiển thị tiêu đề `Nhân viên Đối soát Tài chính` và giới thiệu quy trình kiểm tra đối chiếu sao kê tài khoản ngân hàng.
  - **Thanh công cụ lọc chuyên dụng:** 3 bộ lọc lựa chọn nhanh: *Đối tác cung cấp*, *Kỳ đối soát*, và *Trạng thái thanh toán* (mặc định ưu tiên lọc các bảng kê `Đã báo chuyển khoản`).
  - **Hộp thoại xác nhận khớp lệnh đối soát:**
    - Loại bỏ tham chiếu thô `BR-174 and CR-14`.
    - Hộp thoại xác nhận rõ ràng: hiển thị mã bảng kê, tên khách sạn, số tiền hoa hồng cần đối soát, và mã giao dịch do đối tác cung cấp, kèm nút `Xác nhận & Cập nhật Đã thanh toán` màu ngọc lục bảo.
  - **Bảng đối soát thông thoáng:** Các cột hiển thị thông tin mạch lạc, định dạng tiền tệ nổi bật, nút bấm thao tác `Xác nhận thu tiền` chỉ kích hoạt khi đối tác đã báo chuyển khoản.

---

## 4. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG & TIÊU CHÍ CHẤT LƯỢNG (QUALITY GATES)

Tất cả 5 cổng kiểm soát chất lượng kỹ thuật đã được chạy và vượt qua 100%:

```
========================================================================================
CỔNG KIỂM TRA CHẤT LƯỢNG       CÔNG CỤ / LỆNH                    KẾT QUẢ       GHI CHÚ
========================================================================================
1. Unit & Component Test       npx vitest run src/features/...   41 / 41 PASS  8 files passed (100%)
2. Server & Security Test      node --test tests/*.test.cjs      93 / 93 PASS  0 errors, 0 fails
3. TypeScript Typecheck        npm run typecheck (tsc --noEmit)  0 ERRORS      Type-safe hoàn toàn
4. Code Quality & Linting      npm run lint (eslint .)           0 ERRORS      0 warnings
5. Production Build Test       npm run build (Next.js Turbopack) SUCCESS       76/76 pages statically compiled
========================================================================================
TỔNG THỂ CÁC CỔNG CHẤT LƯỢNG:  ĐẠT 100% (ALL GATES PASSED)
========================================================================================
```

---

## 5. TỔNG KẾT FILE ĐÃ THỰC HIỆN

Các tệp được tinh chỉnh và bổ sung trong phạm vi phân hệ:
1. `src/features/hotel-service-provider/resources/vi.ts` (Mới: Từ điển ngôn ngữ tiếng Việt hoàn chỉnh cho W102–W106, sạch 100% metadata)
2. `src/features/hotel-service-provider/resources/en.ts` (Cập nhật: Dọn sạch metadata quy cách tiếng Anh)
3. `src/features/hotel-service-provider/resources/index.ts` (Mới: Xuất bản mặc định tiếng Việt)
4. `src/features/hotel-service-provider/components/common/AccessibleSelect.tsx` (Tinh chỉnh: Auto-flip vị trí, phím tắt, ARIA 1.2)
5. `src/features/hotel-service-provider/components/common/SearchableMultiSelect.tsx` (Tinh chỉnh: Tìm kiếm POI, xóa chip nhanh, nhãn trạng thái tiếng Việt)
6. `src/features/hotel-service-provider/components/common/StatusBadge.tsx` (Tinh chỉnh: Ánh xạ trạng thái tiếng Việt)
7. `src/features/hotel-service-provider/components/common/ConfirmationDialog.tsx` (Tinh chỉnh: Hộp thoại xác nhận chuẩn tiếng Việt)
8. `src/features/hotel-service-provider/components/common/ProviderSidebar.tsx` & `ProviderTopbar.tsx` (Tinh chỉnh: Menu điều hướng và nhãn tiếng Việt)
9. `src/features/hotel-service-provider/components/w102/CreateServiceProviderView.tsx` (Tinh chỉnh: Loại bỏ UC-77, chống cắt dropdown)
10. `src/features/hotel-service-provider/components/w103/ServiceBookingRequestsView.tsx` (Tinh chỉnh: Cân đối cột, responsive, tiếng Việt)
11. `src/features/hotel-service-provider/components/w104/BookingDecisionOutcomeView.tsx` (Tinh chỉnh: Bỏ BR-196/195/198, modal tiếp nhận/từ chối, ghi nhận kết quả)
12. `src/features/hotel-service-provider/components/w105/CommissionStatementsView.tsx` (Tinh chỉnh: Cảnh báo DEMO SANDBOX nổi bật, biểu mẫu báo cáo chuyển khoản)
13. `src/features/hotel-service-provider/components/w106/CommissionReconciliationView.tsx` (Tinh chỉnh: Bỏ UC-83, trạm đối soát tiếng Việt)
14. `app/admin/(console)/service-providers/create/page.tsx` & `reconciliation/page.tsx` (Cập nhật tiêu đề metadata)
15. `app/provider/layout.tsx`, `bookings/page.tsx`, `bookings/[id]/page.tsx`, `statements/page.tsx` (Cập nhật tiêu đề metadata)
16. Toàn bộ 5 file kiểm thử trong `src/features/hotel-service-provider/__tests__/` (Cập nhật kiểm tra tiếng Việt)
