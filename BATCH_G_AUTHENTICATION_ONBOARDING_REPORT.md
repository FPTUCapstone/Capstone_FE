# BÁO CÁO THẨM ĐỊNH & BÀN GIAO: BATCH G — AUTHENTICATION & ONBOARDING

## 1. THÔNG TIN TỔNG QUAN

- **Dự án:** TripMate — Intelligent Travel Atlas
- **Repository:** `FPTUCapstone/Capstone_FE`
- **Nhánh cơ sở (Target branch):** `develop`
- **Nhánh tính năng (Feature branch):** `feature/batch-g-authentication-onboarding`
- **Batch trước đó:** Batch F (Traveler Account, History & Review — PR #125)
- **Commit cơ sở đã xác minh từ Batch F:** `04622958960b91dfe384eb6d3126700887825c43`
- **Nguồn tài liệu đặc tả thẩm quyền:** `Report3_Software-Requirement-Specification.docx` (Bản gốc Report 3, không dùng bản V2 lỗi thời).
- **Trạng thái bàn giao:** `BATCH_G_PR_OPEN_READY_FOR_REVIEW` (Không tự ý merge hoặc deploy).

---

## 2. PHẠM VI NGHIỆP VỤ & DANH MỤC TUYẾN ĐƯỜNG (USE CASES & SCREENS)

| STT | Mã Use Case | Tên Use Case / Chức năng | Tuyến đường Web (Routes) | Mã màn hình SRS | Vai trò truy cập (Role) | Trạng thái triển khai |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **UC-04** | Đăng nhập tài khoản (Sign In) | `/sign-in` | Screen #36 & #37 | Guest | **Hoàn thành 100%** |
| 2 | **UC-01** | Đăng ký tài khoản Traveler | `/register` | Screen #38 | Guest | **Hoàn thành 100%** |
| 3 | **UC-01 / UC-04** | Hướng dẫn & kích hoạt Email xác thực | `/verify-account`, `/verify-email` | Screen #39 | Guest / Pending Verification | **Hoàn thành 100%** |
| 4 | **UC-02** | Đăng ký tài khoản Tour Operator | `/partner/register` | Screen #40 | Guest | **Hoàn thành 100%** |
| 5 | **UC-02 / UC-03** | Xem trạng thái hồ sơ Tour Operator | `/partner/application` | Screen #41 | TourOperator (Pending/Rejected) | **Hoàn thành 100%** |
| 6 | **UC-03** | Bổ sung & nộp lại hồ sơ Tour Operator | `/partner/application/resubmit` | — | TourOperator (Rejected) | **Hoàn thành 100%** |
| 7 | **UC-06** | Khôi phục & đặt lại mật khẩu | `/forgot-password` | Screen #42 | Guest | **Hoàn thành 100%** |
| 8 | **UC-05** | Đăng xuất phiên làm việc (Sign Out) | Global Menu / `LogoutDialog` | Screen #43 (modal) | Traveler / TourOperator | **Hoàn thành 100%** |
| 9 | **Bảo mật Admin** | Cách ly đăng nhập & khôi phục Admin/Staff | `/admin/login`, `/admin/forgot-password` | Screen #2 & #3 | Admin / Staff | **Hoàn thành 100%** |
| 10 | **UC-07** | Đổi mật khẩu trong phiên (Kiểm tra tương thích) | `/account/security` | — | Authenticated | **Đã hoàn thành ở Batch F, tương thích hoàn toàn** |

---

## 3. ĐỐI CHIẾU QUY TẮC NGHIỆP VỤ (BUSINESS RULES & MESSAGES)

### 3.1. Các quy tắc nghiệp vụ cốt lõi (Business Rules)
- **BR-01 (Duy nhất Email):** Một địa chỉ email chỉ được đăng ký cho tối đa một tài khoản TripMate. Khi cố tình đăng ký trùng, hệ thống báo lỗi `MSG03` và không tạo tài khoản.
- **BR-02 (Chính sách mật khẩu):** Mật khẩu bắt buộc tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt (`validatePassword`).
- **BR-03 (Bảo vệ thông tin mật):** Mật khẩu thuần (plain password) không bao giờ được lưu trữ, ghi nhật ký hoặc trả về phía client.
- **BR-04 (Gán vai trò tự động):** Người dùng đăng ký qua `/register` được hệ thống tự động gán vai trò `Traveler`, không cho phép tự chọn vai trò.
- **BR-05 (Chờ xác minh email):** Tài khoản mới tạo ở trạng thái `Pending Verification`, không thể truy cập các chức năng được bảo vệ cho đến khi email được kích hoạt qua mã/liên kết OTP.
- **BR-06 (Google Social Login):** Đăng ký/đăng nhập qua Google tự động xác minh email, tài khoản chuyển trực tiếp sang trạng thái `Active`.
- **BR-07 (Khóa Tour Operator chờ duyệt):** Tài khoản Tour Operator tạo qua `/partner/register` luôn ở trạng thái `Pending Approval`, không gian làm việc của đối tác bị khóa cho đến khi Staff xét duyệt hợp lệ.
- **BR-08 (Duy nhất Mã số thuế & Giấy phép):** Số giấy phép lữ hành và mã số thuế chỉ được gắn với tối đa một tài khoản Tour Operator.
- **BR-09 (Điều kiện nộp lại hồ sơ):** Chỉ những hồ sơ ở trạng thái `Rejected` mới được phép nộp lại qua `/partner/application/resubmit`; hồ sơ đang chờ (`PendingApproval`) hoặc đã duyệt (`Approved`) bị từ chối truy cập.
- **BR-10 & BR-11 (Khóa tài khoản tạm thời):** Khi đăng nhập sai liên tiếp 5 lần, tài khoản bị tạm khóa 15 phút.
- **BR-12 & BR-13 (Đăng xuất an toàn):** Đăng xuất gọi `POST /auth/web/logout` hủy refresh token và đưa access token vào blacklist. Dữ liệu phiên ở client (`AuthStorage`, cookies) luôn được dọn sạch ngay cả khi kết nối mạng gặp sự cố.
- **BR-14 & BR-15 (Quy trình khôi phục mật khẩu):** Mã xác nhận OTP có hiệu lực tối đa 15 phút và chỉ sử dụng 1 lần. Đặt lại mật khẩu thành công sẽ tự động hủy toàn bộ phiên làm việc cũ.

### 3.2. Ánh xạ thông báo ứng dụng (Application Messages Mapping)
- **MSG01:** `This field is required.` — Hiển thị dưới trường nhập liệu bắt buộc còn trống.
- **MSG02:** `Invalid email format. Please enter a valid email address (e.g., user@example.com).` — Hiển thị khi sai định dạng email.
- **MSG03:** `An account with this email already exists. Please sign in or use another email.` — Báo lỗi khi email đã tồn tại.
- **MSG04:** `Invalid phone number. Phone number must be 10 digits starting with 0.` — Kiểm tra số điện thoại 10 chữ số bắt đầu bằng 0.
- **MSG05:** `Password must be at least 8 characters, containing uppercase, lowercase, number, and special character.` — Cảnh báo độ phức tạp mật khẩu.
- **MSG06:** `Passwords do not match. Please re-enter.` — Cảnh báo xác nhận mật khẩu không khớp.
- **MSG07:** `Account registered successfully! Please verify your email/OTP to activate your account.` — Thông báo đăng ký Traveler thành công.
- **MSG08:** `Your business profile has been submitted for verification. Admin review takes 1-2 business days.` — Thông báo nộp hồ sơ đối tác thành công.
- **MSG09:** `Incorrect email or password. Please try again.` — Thông báo đăng nhập sai thông tin (không phân biệt rõ email hay mật khẩu sai để đảm bảo an toàn).
- **MSG10:** `Your Tour Operator account is pending verification. You will be notified once approved.` — Cảnh báo khi đối tác chưa được duyệt.
- **MSG11:** `Your account has been locked due to policy violations. Please contact support@tripmate.com.` — Cảnh báo tài khoản bị khóa.
- **MSG12:** `Welcome back to TripMate! Signed in successfully.` — Toast chào mừng khi đăng nhập thành công.
- **MSG13:** `Signed out successfully.` — Toast khi đăng xuất thành công.
- **MSG14:** `Invalid or expired verification code. Please request a new OTP.` — Báo mã OTP không hợp lệ hoặc hết hạn.
- **MSG15:** `A new 6-digit verification code has been sent to your email/phone.` — Toast khi gửi lại mã OTP thành công.
- **MSG16:** `Your password has been reset successfully. Please sign in with your new password.` — Toast khi đặt lại mật khẩu thành công.
- **MSG125 - MSG127:** Xử lý phiên hết hạn, phân quyền không hợp lệ, và lỗi mạng hệ thống dùng chung.
- **MSG157 - MSG162:** Xử lý tải lên giấy phép lữ hành, giới hạn tệp 5MB, trùng mã số thuế, và nộp lại hồ sơ đối tác thành công.

---

## 4. PHÂN LẬP BẢO MẬT & ĐIỀU HƯỚNG VAI TRÒ (ROLE ROUTING)

Hệ thống phân tách bảo mật nghiêm ngặt 3 cấp độ:
1. **Public / Guest:** Truy cập `/sign-in`, `/register`, `/verify-account`, `/verify-email`, `/forgot-password`, `/partner/register`.
2. **Traveler & Tour Operator:**
   - Đăng nhập qua `/sign-in` công cộng.
   - Khi hoàn tất đăng nhập, `signInDestination` tự động phân tuyến:
     - `Traveler` -> chuyển hướng về `/` (hoặc `returnUrl`).
     - `TourOperator` (đã duyệt) -> chuyển hướng về `/partner`.
     - `TourOperator` (chờ duyệt/từ chối) -> chuyển hướng về `/partner/application`.
3. **Administrator & Staff:**
   - Được bảo vệ bởi cổng đăng nhập riêng biệt `/admin/login` và khôi phục riêng `/admin/forgot-password`.
   - Sử dụng cookie `tripmate_admin_session` có cờ `HttpOnly`, `SameSite=Strict`.
   - Giao diện được định hình theo chủ đề độc quyền **Forest & Warm Ivory** (`#00152a`, `#007d6e`) và tách biệt hoàn toàn khỏi session của người dùng thông thường.

---

## 5. KẾT QUẢ KIỂM ĐỊNH CHẤT LƯỢNG (QUALITY GATES)

Tất cả 4 cổng kiểm định bắt buộc theo quy định của repository đều vượt qua 100%:

### 5.1. Automated Test Suite (`npm test`)
- **Kết quả:** **281 test files passed (100%)**, tổng cộng **2,972 tests passed (0 fail, 0 skipped)**.
  - 93 Node native tests (bao gồm kiến trúc, bảo mật cookie HttpOnly, proxy BFF).
  - 2,879 Vitest frontend tests.
- **Thời gian chạy:** 96.12 giây.

### 5.2. Linter (`npm run lint`)
- **Kết quả:** **0 lỗi, 0 cảnh báo** (`eslint .` exited with code 0).

### 5.3. TypeScript Compilation (`npm run typecheck`)
- **Kết quả:** **0 lỗi cú pháp và kiểu dữ liệu** (`tsc --noEmit` exited with code 0).

### 5.4. Production Build (`npm run build`)
- **Kết quả:** Biên dịch thành công Turbopack production build trong 6.7 giây.
- **Số trang tĩnh (Static):** 66/66 trang được tối ưu hóa thành công.
- Không phát sinh bất kỳ lỗi bundle, hydration hay missing dynamic routes.

---

## 6. DANH MỤC BẰNG CHỨNG GIAO DIỆN ĐA THIẾT BỊ (SCREENSHOT EVIDENCE)

Toàn bộ 36 ảnh chụp màn hình kiểm thử giao diện thực tế (9 màn hình × 4 kích thước khung nhìn) đã được lưu trữ tại `reports/evidence/batch-g/` và thư mục artifact:

| Màn hình | Desktop (1440 × 900) | Laptop (1024 × 768) | Tablet (768 × 1024) | Mobile (375 × 812) |
| :--- | :--- | :--- | :--- | :--- |
| **Sign In** (`/sign-in`) | `sign-in-1440x900.png` | `sign-in-1024x768.png` | `sign-in-768x1024.png` | `sign-in-375x812.png` |
| **Traveler Register** (`/register`) | `register-1440x900.png` | `register-1024x768.png` | `register-768x1024.png` | `register-375x812.png` |
| **Verify Account** (`/verify-account`) | `verify-account-1440x900.png` | `verify-account-1024x768.png` | `verify-account-768x1024.png` | `verify-account-375x812.png` |
| **Partner Register** (`/partner/register`) | `partner-register-1440x900.png` | `partner-register-1024x768.png` | `partner-register-768x1024.png` | `partner-register-375x812.png` |
| **Password Recovery** (`/forgot-password`) | `forgot-password-1440x900.png` | `forgot-password-1024x768.png` | `forgot-password-768x1024.png` | `forgot-password-375x812.png` |
| **Partner Application** (`/partner/application`) | `partner-application-1440x900.png` | `partner-application-1024x768.png` | `partner-application-768x1024.png` | `partner-application-375x812.png` |
| **Application Resubmit** (`/partner/application/resubmit`) | `partner-application-resubmit-1440x900.png` | `partner-application-resubmit-1024x768.png` | `partner-application-resubmit-768x1024.png` | `partner-application-resubmit-375x812.png` |
| **Admin Login** (`/admin/login`) | `admin-login-1440x900.png` | `admin-login-1024x768.png` | `admin-login-768x1024.png` | `admin-login-375x812.png` |
| **Admin Forgot Password** (`/admin/forgot-password`) | `admin-forgot-password-1440x900.png` | `admin-forgot-password-1024x768.png` | `admin-forgot-password-768x1024.png` | `admin-forgot-password-375x812.png` |

Chi tiết showcase trình diễn tương tác trực quan xem tại artifact: [BATCH_G_UIUX_SHOWCASE.md](file:///C:/Users/asus/.gemini/antigravity/brain/b95f04a2-0b7b-4f8e-93c1-30e8c7ccc056/BATCH_G_UIUX_SHOWCASE.md).

---

## 7. HƯỚNG DẪN KIỂM THỬ THỦ CÔNG (MANUAL TESTING & VERIFICATION GUIDE)

1. **Kiểm tra luồng Đăng nhập (`/sign-in`):**
   - Mở trình duyệt truy cập `http://localhost:3000/sign-in`.
   - Nhập thông tin tài khoản hợp lệ -> Kiểm tra toast thông báo `MSG12` và điều hướng đúng theo vai trò.
   - Thử nhập sai mật khẩu -> Xác nhận hiển thị thông báo lỗi `MSG09`.
   - Bấm "Tiếp tục với Google" -> Xác nhận modal `GoogleConsentModal` hiển thị rõ ràng thông tin quyền riêng tư trước khi tiến hành OAuth.
2. **Kiểm tra luồng Đăng ký Traveler (`/register`):**
   - Thử để trống các trường hoặc nhập mật khẩu không đủ tiêu chuẩn -> Xác minh các thông báo lỗi `MSG01`, `MSG02`, `MSG05`, `MSG06`.
   - Nhập dữ liệu hợp lệ -> Xác nhận tài khoản được tạo và chuyển hướng đến trang hướng dẫn xác minh email `/verify-account`.
3. **Kiểm tra luồng Xác thực Email (`/verify-account`):**
   - Bấm nút "Gửi lại email xác minh" -> Xác nhận kích hoạt bộ đếm ngược 60 giây và hiển thị thông báo `MSG15`.
4. **Kiểm tra luồng Đăng ký Đối tác (`/partner/register`):**
   - Điền thông tin doanh nghiệp, tải lên tệp giấy phép lữ hành định dạng PDF/JPG -> Bấm nộp hồ sơ.
   - Xác nhận nhận toast thông báo `MSG08` và chuyển hướng an toàn.
5. **Kiểm tra luồng Khôi phục mật khẩu (`/forgot-password`):**
   - Nhập email -> Bấm "Gửi mã" -> Xác nhận chuyển sang bước nhập mã OTP 6 số mà không tiết lộ tài khoản có tồn tại hay không.
   - Nhập mã và mật khẩu mới -> Xác nhận hoàn tất quy trình với thông báo `MSG16`.
6. **Kiểm tra Cách ly Quản trị (`/admin/login`):**
   - Đảm bảo giao diện Admin hiển thị đúng tông màu Forest & Warm Ivory và bảo vệ nghiêm ngặt các phiên làm việc của quản trị viên.

---

## 8. KẾT LUẬN & TRẠNG THÁI BÀN GIAO

- **Tình trạng:** Toàn bộ phạm vi Batch G (Authentication & Onboarding) đã hoàn tất xuất sắc, vượt qua toàn bộ các bài kiểm tra tự động và kiểm thử trực quan.
- **Trạng thái PR:** Đã sẵn sàng mở Pull Request vào nhánh `develop`.
- **Trạng thái:** `BATCH_G_PR_OPEN_READY_FOR_REVIEW`.
