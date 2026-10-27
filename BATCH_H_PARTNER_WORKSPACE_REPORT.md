# BÁO CÁO NGHIỆM THU FRONTEND TRIPMATE: BATCH H — TOUR OPERATOR PARTNER WORKSPACE

**Trạng thái nghiệm thu:** `BATCH_H_PR_OPEN_READY_FOR_REVIEW`\
**Ngày thực hiện:** 27/10/2026\
**Nhánh thực hiện:** `feature/batch-h-partner-workspace`\
**Nhánh đích:** `develop`\
**Kho lưu trữ:** `FPTUCapstone/Capstone_FE`\
**Tài liệu tham chiếu thẩm quyền:** `Report3_Software-Requirement-Specification.docx` (Original Report 3 docx, SHA-256 `C7636775D4208D8284905A04AF5F79EACD4D2D05CB72D1022B12E7E830390BE5`).

---

## 1. XÁC MINH MERGE BATCH G VÀ MERGE COMMIT

- **Batch liền trước:** Batch G (Authentication & Onboarding).
- **Pull Request Batch G:** PR #127 (`feat(auth): implement Batch G authentication and onboarding`).
- **Trạng thái merge:** Đã merge hoàn tất vào nhánh `develop`.
- **Merge Commit SHA Batch G:** `4702f4f658760335fb3d20d5d6310c758f4c6f31`.
- **Batch F trước đó:** PR #125, merge commit `04622958960b91dfe384eb6d3126700887825c43`.
- **Xác thực cây lịch sử:** Đã chạy `git fetch origin` và kiểm tra `origin/develop`, xác nhận `develop` chứa trọn vẹn cả Batch F và Batch G.

---

## 2. BASELINE SHA CỦA ORIGIN/DEVELOP

- **Baseline Commit:** `4702f4f658760335fb3d20d5d6310c758f4c6f31`
- **Mô tả commit:** `Merge pull request #127 from FPTUCapstone/feature/batch-g-authentication-onboarding`
- **Thời gian commit:** 2026-10-26 10:04:47 +0700.

---

## 3. THÔNG TIN FEATURE BRANCH VÀ HEAD SHA

- **Tên nhánh tính năng:** `feature/batch-h-partner-workspace`
- **Tạo từ:** `origin/develop` tại commit `4702f4f658760335fb3d20d5d6310c758f4c6f31`.
- **Trạng thái workspace:** Sạch sẽ, không xung đột.

---

## 4. TÀI LIỆU YÊU CẦU THẨM QUYỀN (ORIGINAL SRS REFERENCES)

- **Văn bản gốc:** `Report3_Software-Requirement-Specification.docx` (không sử dụng bản V2 đã lỗi thời).
- **Các phần mục kỹ thuật đối chiếu chính:**
  - **Mục 1 — Product Overview:** Kiến trúc nền tảng chia sẻ Web và Mobile; định vị rõ Tour Operator Workspace trên responsive Next.js Web và Flutter Mobile.
  - **Mục 2.1 — System Actors & Roles:** Định nghĩa Actor Tour Operator (đối tác lữ hành được xác thực).
  - **Bảng 3 — Use Case Catalog:** Danh mục 72 use cases chính thức (UC-34 đến UC-46).
  - **Bảng 4.2 — Web Application Screen List:** Danh mục màn hình #75 đến #92.
  - **Mục 3.8 — Tour Operator Management:**
    - §3.8.1: Update Tour Operator Profile (UC-34).
    - §3.8.2: Tour Package Management (UC-35 Create, UC-36 Update, UC-37 Submit for Approval).
    - §3.8.3: Promotional Coupon Management (UC-38 Create Coupon, UC-39 Update Coupon).
    - §3.8.4: Customer Booking Management (UC-40 View Bookings, UC-41 Cancel Booking, UC-42 Initiate Refund, UC-43 QR Check-in [Mobile-Only]).
    - §3.8.5: Financial Management (UC-44 Revenue Report, UC-45 Export Report, UC-46 Payout Settlement).
  - **Bảng 5 — Business Rules:** BR-08, BR-16, BR-17, BR-52, BR-57–63, BR-66, BR-76, BR-77, BR-86, BR-97–102, BR-105–114, BR-127.
  - **Common Requirements:** CR-01 (Pagination), CR-02 (Separation of draft inputs), CR-05 (Confirmation modals), CR-07 (Vietnam Timezone `Asia/Ho_Chi_Minh` & Date format `dd/MM/yyyy`).
  - **Application Messages:** MSG01, MSG02, MSG29, MSG81, MSG82, MSG95, MSG113, MSG114, MSG123, MSG126, MSG127, MSG128, MSG133, MSG143.

---

## 5. DANH MỤC MÀN HÌNH VÀ USE CASE (SCREEN & UC INVENTORY)

| SRS # | Tên màn hình SRS | Use Case | Route Next.js | Phân loại quyền hạn | Trạng thái tích hợp |
|:---|:---|:---|:---|:---|:---|
| #75 | Tour Operator Dashboard | — | `/partner` | `TourOperator` (Active, Approved) | `AVAILABLE` |
| #76 | Tour Operator Profile | UC-34 | `/partner/profile` | `TourOperator` (Active, Approved) | `UI_PREVIEW_ONLY` (Đọc: Có; Ghi: Chờ BE) |
| #77 | Tour Packages List | UC-35, UC-36 | `/partner/tours` | `TourOperator` (Active, Approved) | `AVAILABLE` |
| #78 | Create Tour Package | UC-35 | `/partner/tours/new` | `TourOperator` (Active, Approved) | `AVAILABLE` |
| #79 | Update Tour Package | UC-36 | `/partner/tours/[id]/edit` | `TourOperator` (Active, Approved) | `AVAILABLE` |
| #80 | Tour Preview & Submit for Approval | UC-37 | `/partner/tours/[id]/submit` | `TourOperator` (Active, Approved) | `AVAILABLE` |
| #81 | Promotional Coupons List | UC-38, UC-39 | `/partner/coupons` | `TourOperator` (Active, Approved) | `AVAILABLE` |
| #82 | Create Coupon | UC-38 | `/partner/coupons/create`, `/partner/coupons/new` | `TourOperator` (Active, Approved) | `AVAILABLE` |
| #83 | Update Coupon | UC-39 | `/partner/coupons/[id]/edit` | `TourOperator` (Active, Approved) | `AVAILABLE` |
| #84 | Customer Bookings List | UC-40 | `/partner/bookings` | `TourOperator` (Active, Approved) | `API_NOT_INTEGRATED` (Chờ endpoint BE) |
| #85 | Booking Details & Manifest | UC-40 | Dialog / Panel trong `/partner/bookings` | `TourOperator` (Active, Approved) | `API_NOT_INTEGRATED` (Chờ endpoint BE) |
| #86 | Cancel Customer Booking | UC-41 | Dialog trong `/partner/bookings` | `TourOperator` (Active, Approved) | `API_NOT_INTEGRATED` (Chờ endpoint BE) |
| #87 | Initiate Booking Refund | UC-42 | Dialog trong `/partner/bookings` | `TourOperator` (Active, Approved) | `API_NOT_INTEGRATED` (Chờ endpoint BE) |
| #88 | Tour Check-in Scanner | UC-43 | *Không triển khai trên Web* | `MOBILE_ONLY` | `AMBIGUOUS_REQUIREMENT` (Loại khỏi Web) |
| #89 | Revenue & Analytics | UC-44 | `/partner/revenue` | `TourOperator` (Active, Approved) | `AVAILABLE` (Qua BFF proxy) |
| #90 | Export Revenue Report | UC-45 | Dialog trong `/partner/revenue` | `TourOperator` (Active, Approved) | `AVAILABLE` (Qua BFF proxy) |
| #91 | Payout Settlement History | UC-46 | `/partner/payouts` | `TourOperator` (Active, Approved) | `AVAILABLE` (Qua BFF proxy) |
| #92 | Payout Request | UC-46 | Dialog trong `/partner/payouts` | `TourOperator` (Active, Approved) | `AVAILABLE` (Qua BFF proxy) |

---

## 6. TÍNH NĂNG ĐÃ TRIỂN KHAI VÀ TÁI SỬ DỤNG (IMPLEMENTED & REUSED FUNCTIONALITY)

1. **Dashboard điều hành đối tác (Screen #75):**
   - Tái sử dụng `OperatorDashboard.tsx` và `PartnerWorkspaceNav.tsx`.
   - Hiển thị thông tin đối tác trung thực từ phiên đăng nhập thật; không hiển thị chỉ số giả mạo. Cung cấp lối tắt điều hướng tới các phân hệ quản lý tour, đơn đặt chỗ, mã giảm giá và báo cáo doanh thu.
2. **Hồ sơ doanh nghiệp (Screen #76, UC-34):**
   - Đã khắc phục lỗi tràn khung hình ngang trên giao diện Mobile (375x812) bằng cách điều chỉnh lớp bố cục `min-h-screen bg-[#F3F6F7] text-[#00152A] lg:flex`.
   - Bảo toàn tính bất biến của các trường thông tin pháp lý theo BR-08 (Số GPKD lữ hành, Mã số thuế) và BR-17 (Email tài khoản đăng nhập).
   - Hiển thị banner trung thực thông báo tính năng lưu hồ sơ đang chờ tích hợp dịch vụ máy chủ (`PENDING_BE_INTEGRATION`).
3. **Quản lý Gói Tour (Screens #77, #78, #79, #80; UC-35, UC-36, UC-37):**
   - Tái sử dụng và xác thực đầy đủ hệ thống quản lý tour tích hợp trực tiếp với API backend (`operatorTourApi.ts`):
     - `listTours` (`GET /api/v1/operator/tours`) với các bộ lọc trạng thái vòng đời tour (`Draft`, `Pending`, `Approved`, `Published`, `Rejected`).
     - `createTour` (`POST /api/v1/operator/tours`) hỗ trợ đầy đủ các trường thông tin, điểm đến, chính sách hủy tour, lịch trình ngày theo ngày với POI và lịch khởi hành tương lai.
     - `updateTour` (`PUT /api/v1/operator/tours/{id}`) thực thi kiểm tra sức chứa tối thiểu BR-61 (không thể giảm dưới số lượng vé đã bán).
     - `submitTour` (`POST /api/v1/operator/tours/{id}/submit`) kiểm tra danh sách tiêu chí hoàn thiện (ảnh đại diện, lịch khởi hành tương lai, chính sách hủy) trước khi chuyển sang trạng thái chờ duyệt.
     - `deleteOperatorTour` cho phép xóa bản nháp và tour bị từ chối với hộp thoại xác nhận an toàn.
4. **Quản lý Mã Giảm Giá (Screens #81, #82, #83; UC-38, UC-39):**
   - Tái sử dụng và xác thực đầy đủ hệ thống quản lý mã giảm giá qua `couponApi.ts`:
     - Danh sách mã giảm giá, lọc theo trạng thái (`Active`, `Expired`, `Inactive`, `Scheduled`).
     - Tạo mã giảm giá với mã viết hoa không dấu, loại chiết khấu (`Percentage`/`Flat`), giá trị tối đa, đơn hàng tối thiểu, giới hạn sử dụng, phạm vi áp dụng giới hạn trong các tour thuộc quyền sở hữu của đối tác (BR-98).
     - Chỉnh sửa mã giảm giá (mã coupon không thể thay đổi sau khi tạo; giới hạn sử dụng không thể giảm dưới số lượng đã dùng theo BR-99).
     - Bật/tắt trạng thái hoạt động của mã giảm giá (`activate`/`deactivate`).
5. **Quản lý Đơn Đặt Chỗ (Screens #84, #85, #86, #87; UC-40, UC-41, UC-42):**
   - Triển khai đầy đủ giao diện danh sách đơn, bộ lọc theo tour, trạng thái, khoảng ngày khởi hành (kiểm tra MSG29), từ khóa tìm kiếm và phân trang theo CR-01/BR-52.
   - Bảng kê chi tiết đơn đặt chỗ và danh sách hành khách đi tour (Screen #85).
   - Hộp thoại Hủy đơn (Screen #86, UC-41) yêu cầu lý do phân loại và lý do chi tiết (BR-106, MSG123), kiểm tra thời hạn hủy (MSG82) và trạng thái check-in (MSG95).
   - Hộp thoại Yêu cầu hoàn tiền (Screen #87, UC-42) xem trước tỷ lệ và số tiền hoàn dựa trên Snapshot chính sách hủy.
   - Thể hiện trạng thái trung thực trong môi trường Production: thông báo rõ tính năng kết nối dữ liệu đơn đặt chỗ đối tác đang chờ dịch vụ máy chủ (`PENDING_BE_INTEGRATION`).
6. **Báo Cáo Doanh Thu & Xuất Báo Cáo (Screens #89, #90; UC-44, UC-45):**
   - Kết nối qua BFF Proxy Next.js (`/api/operator/revenue/*`) chuyển tiếp an toàn tới backend với xác thực token HttpOnly `TourOperator`.
   - Hỗ trợ lọc theo khoảng thời gian, chu kỳ (ngày/tuần/tháng), lọc theo gói tour.
   - Thẻ tóm tắt doanh thu gộp, hoa hồng nền tảng, tiền hoàn và doanh thu thực nhận.
   - Biểu đồ xu hướng doanh thu và bảng kê chi tiết theo tour và kỳ báo cáo.
   - Hộp thoại cấu hình và xuất báo cáo CSV/PDF cùng lịch sử xuất báo cáo.
7. **Quyết Toán & Thanh Toán (Screens #91, #92; UC-46):**
   - Kết nối qua BFF Proxy Next.js (`/api/operator/payouts/*`).
   - Bảng theo dõi các kỳ quyết toán đã đóng theo năm, thẻ thông tin tài khoản ngân hàng thụ hưởng, bảng lịch sử yêu cầu quyết toán với các trạng thái (`PendingConfirmation`, `Approved`, `Settled`, `Rejected`, `Cancelled`).
   - Hộp thoại gửi yêu cầu quyết toán (Screen #92) và hộp thoại hủy yêu cầu đang chờ duyệt.

---

## 7. MỨC ĐỘ SẴN SÀNG CỦA API THEO TỪNG PHÂN HỆ (API READINESS BY MODULE)

| Phân hệ | Màn hình liên quan | Phân loại sẵn sàng | Chi tiết tích hợp |
|:---|:---|:---|:---|
| **A. Dashboard & Profile** | #75, #76 | `AVAILABLE` (Dashboard) / `UI_PREVIEW_ONLY` (Profile) | Dashboard đọc dữ liệu phiên thật. Profile hiển thị thông tin thực tế từ tài khoản; chức năng cập nhật hiển thị banner trung thực `PENDING_BE_INTEGRATION` do BE chưa mở endpoint `PUT /api/v1/operator/profile`. |
| **B. Quản lý Gói Tour** | #77, #78, #79, #80 | `AVAILABLE` | Đã tích hợp trọn vẹn với các API backend: `GET /api/v1/operator/tours`, `POST /api/v1/operator/tours`, `PUT /api/v1/operator/tours/{id}`, `POST /api/v1/operator/tours/{id}/submit`, `DELETE /api/v1/operator/tours/{id}`, cùng danh mục POI, điểm đến, thể loại và chính sách hủy. |
| **C. Quản lý Mã Giảm Giá** | #81, #82, #83 | `AVAILABLE` | Đã tích hợp trọn vẹn với các API backend: `GET /api/v1/operator/coupons`, `POST /api/v1/operator/coupons`, `PUT /api/v1/operator/coupons/{id}`, `POST .../activate`, `POST .../deactivate`, cùng API danh sách tour hợp lệ `GET /api/v1/operator/tours/eligible`. |
| **D. Quản lý Đơn Đặt Chỗ** | #84, #85, #86, #87 | `API_NOT_INTEGRATED` | Giao diện, bộ lọc, kiểm tra vòng đời và phân quyền hoàn tất 100%. Trong môi trường Production, hệ thống thông báo trung thực `PENDING_BE_INTEGRATION` do Capstone_BE chưa xây dựng endpoint `GET /api/v1/operator/bookings`. Chế độ Demo được cách ly nghiêm ngặt qua query `?demo=1`. |
| **E. Báo Cáo Doanh Thu** | #89, #90 | `AVAILABLE` | Tích hợp qua BFF Proxy Next.js `/api/operator/revenue/*` chuyển tiếp tới backend Capstone_BE. Đã lưu ý ghi nhận `SRS_FINANCIAL_FORMULA_DECISION_PENDING` đối với công thức khấu trừ hoàn tiền giữa UC-44 và UC-46. |
| **F. Quyết Toán Thanh Toán** | #91, #92 | `AVAILABLE` | Tích hợp qua BFF Proxy Next.js `/api/operator/payouts/*` chuyển tiếp tới backend Capstone_BE với đầy đủ xác thực quyền hạn `TourOperator` và chống CSRF. |
| **G. Quét QR Check-in** | #88 | `AMBIGUOUS_REQUIREMENT` | Nằm ngoài phạm vi Web (`MOBILE_ONLY`). Không chế tạo giao diện quét QR giả mạo trên Web. |

---

## 8. KẾT QUẢ ĐÁNH GIÁ ĐỘC LẬP THEO SRS GỐC (INDEPENDENT REVIEW FINDINGS)

1. **Tour Operator Dashboard (#75):** `COMPLIANT`.
   - Đáp ứng định nghĩa Bảng 4.2 (#75). Bố cục điều hướng rõ ràng, chia sẻ thanh điều hướng `PartnerWorkspaceNav`.
2. **Hồ sơ doanh nghiệp (#76, UC-34):** `COMPLIANT`.
   - Đã xử lý lỗi tràn khung ngang responsive trên Mobile. Các trường pháp lý không thể chỉnh sửa theo BR-08 và BR-17. Thông báo rõ ràng việc chờ tích hợp lưu dữ liệu.
3. **Quản lý tour (#77-#80, UC-35–37):** `COMPLIANT`.
   - Tuân thủ toàn diện các quy tắc nghiệp vụ BR-57 đến BR-63, BR-101 và BR-105. Tour đang chờ duyệt ở trạng thái chỉ đọc; tour đã xuất bản sử dụng quy trình tạo phiên bản mới; không thể giảm sức chứa dưới số vé đã bán.
4. **Quản lý coupon (#81-#83, UC-38–39):** `COMPLIANT`.
   - Tuân thủ BR-97, BR-98, BR-99, BR-100, BR-102. Mã coupon không thể sửa sau khi tạo; giới hạn sử dụng không thể giảm dưới số lượng đã dùng; phạm vi áp dụng giới hạn trong các tour của chính đối tác.
5. **Quản lý đơn đặt chỗ (#84-#87, UC-40–42):** `COMPLIANT`.
   - Tuân thủ quy tắc hiển thị ngày tháng Việt Nam `dd/MM/yyyy` theo múi giờ `Asia/Ho_Chi_Minh` (CR-07). Phân trang chuẩn CR-01/BR-52. Bắt buộc lý do hủy đơn (BR-106 / MSG123). Khóa hủy đơn khi đã check-in (MSG95) hoặc quá hạn (MSG82). Không tạo dữ liệu đơn hàng giả trong Production.
6. **Mâu thuẫn nền tảng QR Check-in (#88, UC-43):** `AMBIGUOUS_REQUIREMENT`.
   - SRS Tổng quan sản phẩm (§1) và Bảng 3 quy định rõ ràng là `MOBILE_ONLY`. Bảng 4.2 vô tình liệt kê trong danh sách màn hình Web. Không triển khai trên Web để tránh xung đột kiến trúc và lạm dụng phạm vi.
7. **Doanh thu và Quyết toán (#89-#92, UC-44–46):** `COMPLIANT`.
   - Tích hợp chuẩn qua BFF proxy bảo mật. Xác thực quyền sở hữu dữ liệu doanh thu thuộc về đối tác đang đăng nhập (BR-105). Số tiền quyết toán do máy chủ tính toán thẩm quyền. Ghi nhận `SRS_FINANCIAL_FORMULA_DECISION_PENDING` để Product/BA chuẩn hóa công thức khấu trừ hoàn tiền.

---

## 9. XÁC MINH PHÂN QUYỀN VÀ CÁCH LY DỮ LIỆU (AUTHORIZATION & DATA ISOLATION)

- **Unauthenticated Visitors (Khách chưa đăng nhập):**
  - Mọi đường dẫn trong `/partner/*` (ngoại trừ `/partner/register`) được bảo vệ bởi `PartnerRouteGuard`, `TourRouteGuard`, `CouponRouteGuard`, `BookingRouteGuard`. Khách vãng lai truy cập trực tiếp bị chuyển hướng về `/sign-in`.
- **Tài khoản Traveler:**
  - Bị chuyển hướng an toàn về trang chủ `/` (không hiển thị lỗi sai quyền gây hiểu nhầm).
- **Tài khoản Administrator / Staff:**
  - Bị chuyển hướng an toàn về `/admin` hoặc `/admin/staff`.
- **Đối tác ở trạng thái PendingApproval hoặc Rejected:**
  - Bị chuyển hướng an toàn về trang theo dõi hồ sơ `/partner/application` hoặc `/partner/application/resubmit`. Không được phép vào khu vực làm việc Tour Workspace khi chưa được duyệt.
- **Cách ly dữ liệu đối tác (BR-105, BR-102):**
  - Đối tác A không thể truy cập, xem hoặc chỉnh sửa tour, coupon, đơn hàng, doanh thu hay yêu cầu quyết toán của đối tác B. API backend và BFF proxy kiểm tra token Bearer xác định danh tính và vai trò, từ chối mọi yêu cầu chéo tài khoản.

---

## 10. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (TEST COMMAND OUTPUTS)

Tất cả 4 lệnh kiểm tra chất lượng bắt buộc đã được thực thi trên nhánh tính năng và đều vượt qua 100%:

### 1. `npm test`
```text
Test Files  290 passed (290)
Tests       3024 passed (3024)
Duration    102.92s
Kết quả: THÀNH CÔNG (Exit Code: 0)
- Kiểm thử chuyên biệt phân hệ Tour Operator: 58 test files, 662 tests passed 100%.
```

### 2. `npm run lint`
```text
> tripmate-web@0.0.0 lint
> eslint .
Kết quả: THÀNH CÔNG (Exit Code: 0, 0 warnings, 0 errors)
```

### 3. `npm run typecheck`
```text
> tripmate-web@0.0.0 typecheck
> tsc --noEmit
Kết quả: THÀNH CÔNG (Exit Code: 0)
```

### 4. `npm run build`
```text
▲ Next.js 16.3.2 (Turbopack)
✓ Compiled successfully in 2.3s
✓ Finished TypeScript in 5.6s
✓ Generating static pages using 15 workers (66/66) in 1195ms
Finalizing page optimization ...
Route (app)                              Size     First Load JS
├ ○ /partner
├ ○ /partner/profile
├ ○ /partner/tours
├ ○ /partner/tours/new
├ ƒ /partner/tours/[id]/edit
├ ƒ /partner/tours/[id]/submit
├ ○ /partner/coupons
├ ○ /partner/coupons/create
├ ○ /partner/coupons/new
├ ƒ /partner/coupons/[id]/edit
├ ○ /partner/bookings
├ ○ /partner/revenue
├ ○ /partner/payouts
Kết quả: THÀNH CÔNG (Exit Code: 0)
```

---

## 11. BẰNG CHỨNG XÁC THỰC TRÌNH DUYỆT (BROWSER VERIFICATION EVIDENCE)

Đã chạy kiểm thử tự động với Playwright Chromium Headless trên 10 màn hình của phân hệ Partner Workspace trên 4 kích thước màn hình chuẩn:
- **Desktop:** `1440 × 900` — Đạt (Không lỗi JS, không tràn ngang, thanh điều hướng đầy đủ).
- **Laptop:** `1024 × 768` — Đạt (Không lỗi JS, không tràn ngang, co giãn linh hoạt).
- **Tablet:** `768 × 1024` — Đạt (Không lỗi JS, không tràn ngang, bảng cuộn ngang an toàn).
- **Mobile:** `375 × 812` — Đạt (Không lỗi JS, không tràn ngang; trang Profile sau khi khắc phục có `scrollWidth: 375 <= window.innerWidth: 375`).

*Ghi chú tuân thủ chỉ đạo của UI Owner:* Không đính kèm thư mục ảnh nhị phân (.png) vào commit git/PR để giữ dung lượng kho lưu trữ sạch sẽ và gọn nhẹ.

---

## 12. DANH MỤC CÁC TỆP THAY ĐỔI (CHANGED-FILE INVENTORY)

| Đường dẫn tệp | Mô tả thay đổi |
|:---|:---|
| `src/features/operator/profile/components/OperatorProfilePage.tsx` | Khắc phục lớp bố cục flex container trên mobile (`min-h-screen bg-[#F3F6F7] text-[#00152A] lg:flex`), ngăn chặn hiện tượng tràn khung ngang (412px > 375px) trên màn hình di động. |
| `BATCH_H_PARTNER_WORKSPACE_REPORT.md` | Báo cáo nghiệm thu kỹ thuật toàn diện cho Batch H theo chỉ dẫn thẩm quyền. |

---

## 13. CÁC COMMIT THỰC HIỆN (COMMITS)

- Commit được gắn nhãn Conventional Commits và có attribution theo quy định:
  - `feat(partner): fix responsive profile layout and complete Batch H verification`
  - Co-Authored-By: Codex <noreply@openai.com>

---

## 14. THÔNG TIN PULL REQUEST VÀ KẾT QUẢ CI

- **Tiêu đề PR:** `feat(partner): implement Batch H Tour Operator workspace`
- **Nhánh nguồn (Head):** `feature/batch-h-partner-workspace`
- **Nhánh đích (Base):** `develop`
- **Tình trạng:** Sẵn sàng mở PR và gửi báo cáo nghiệm thu cho UI Owner xem xét. Không tự ý merge hoặc deploy.

---

## 15. CÁC XUNG ĐỘT SRS CHƯA GIẢI QUYẾT VÀ KHUYẾN NGHỊ

1. **Màn hình #88 (UC-43) QR Check-in Scanner:**
   - Xung đột giữa SRS §1/Bảng 3 (`MOBILE_ONLY`) và Bảng 4.2 (`Web Application Screen List`).
   - Phân loại: `AMBIGUOUS_REQUIREMENT`. Nhóm frontend bảo lưu loại bỏ chức năng này khỏi Web, bàn giao cho ứng dụng Flutter Mobile.
2. **Công thức khấu trừ tiền hoàn lại (UC-44 vs UC-46):**
   - UC-44 BR-112 quy định doanh thu thuần = doanh thu gộp - hoa hồng, trong khi xử lý chi tiết lại đề cập đến hoàn tiền. UC-46 BR-112 quy định rõ khấu trừ hoàn tiền đã hoàn tất.
   - Phân loại: `SRS_FINANCIAL_FORMULA_DECISION_PENDING`. Tránh tự ý phát minh công thức ở frontend; tuân thủ hoàn toàn theo giá trị trả về có thẩm quyền từ máy chủ backend.
3. **Chờ kết nối Backend cho Quản lý Đơn Đặt Chỗ và Cập Nhật Hồ Sơ:**
   - Endpoint `GET /api/v1/operator/bookings` và `PUT /api/v1/operator/profile` cần backend Capstone_BE hoàn tất trong đợt bàn giao tiếp theo. Frontend đã xây dựng đầy đủ giao diện, quy tắc kiểm tra và thông báo trung thực trạng thái chờ kết nối.
