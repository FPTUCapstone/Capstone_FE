# TÀI LIỆU BÀN GIAO KỸ THUẬT (ENGINEERING HANDOFF)
## PHÂN HỆ QUẢN LÝ KHÁCH SẠN & ĐỐI TÁC DỊCH VỤ — TRIPMATE FRONTEND
**Mã dự án:** TripMate Capstone — Smart Travel Planner & Travel Services Platform  
**Kho mã nguồn:** `FPTUCapstone/Capstone_FE`  
**Thư mục làm việc:** `D:\CapStone\Capstone_FE_hotel_flow`  
**Nhánh làm việc:** `feature/hotel-service-provider-workflow` (Pull Request dự thảo #157)  
**Tài liệu yêu cầu căn cứ tối cao:** `Report3_Software-Requirement-Specification.docx` (Bản gốc Report 3, không dùng V2)  
**Ngày cập nhật:** 14/11/2026  
**Phạm vi bàn giao:** Giao diện & Luồng tương tác Frontend Web (Màn hình W102, W103, W104, W105, W106)

---

## 1. MỤC TIÊU & RANH GIỚI BÀN GIAO KỸ THUẬT

Tài liệu này cung cấp toàn bộ thông tin kiến trúc, cấu trúc dịch vụ, ranh giới dữ liệu mẫu (mock data fixtures), quy chuẩn giao tiếp API dự thảo đề xuất cho Backend và danh mục các quyết định nghiệp vụ cần phê duyệt chính thức trước khi triển khai môi trường sản xuất (Production).

> [!IMPORTANT]
> **Ranh giới chuyển giao (Delivery Boundary):**  
> Phân hệ này hiện được hoàn thiện ở tầng **Giao diện & Trải nghiệm Người dùng (Frontend UI/UX)** cùng hệ thống dịch vụ mô phỏng có định kiểu nghiêm ngặt (Strictly Typed Client Services).  
> - **Chưa kết nối cơ sở dữ liệu thật hoặc logic xử lý Backend thật.**  
> - **Không đại diện cho việc toàn bộ phân hệ đã sẵn sàng sản xuất (production-ready).**  
> - **Chỉ thực hiện commit và push khi tất cả cổng kiểm tra chất lượng đều vượt qua, và PR #157 TIẾP TỤC ĐƯỢC GIỮ Ở TRẠNG THÁI DRAFT (DỰ THẢO).**

---

## 2. MA TRẬN TRUY VẾT YÊU CẦU & KIẾN TRÚC FRONTEND (CHUẨN SRS REPORT 3)

Bảng đối chiếu chuẩn xác theo bản gốc `Report3_Software-Requirement-Specification.docx`:

| Màn hình | Tác nhân (Actor) | Use Case SRS | Mục SRS quy chuẩn gốc | Tuyến đường Web (Route) | Thành phần React chính | Dịch vụ Frontend tương ứng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **W102** | Staff | `UC-77` | `§3.9.1.5 Create Service Provider Account` | `/admin/service-providers/create` | `CreateServiceProviderView.tsx` | `StaffProviderService.createProvider()` |
| **W103** | Service Provider | `UC-78` | `§3.6.3 View Service Booking Requests` | `/provider/bookings` | `ServiceBookingRequestsView.tsx` | `ProviderBookingService.fetchRequests()` |
| **W104** | Service Provider | `UC-79`<br>`UC-80` | `§3.6.4 Respond to Service Booking Request`<br>`§3.6.5 Record Service Outcome` | `/provider/bookings/[id]` | `BookingDecisionOutcomeView.tsx` | `ProviderBookingService.confirmBooking()`, `rejectBooking()`, `recordOutcome()` |
| **W105** | Service Provider | `UC-82` | `§3.6.6 Pay Commission Statement` | `/provider/statements` | `CommissionStatementsView.tsx` | `ProviderStatementService.fetchStatements()`, `reportPayment()` |
| **W106** | Staff | `UC-83` | `§3.6.7 Confirm Commission Receipt` | `/admin/commercial-settlements/reconciliation` | `CommissionReconciliationView.tsx` | `StaffReconciliationService.reconcileStatement()` |
| *Hệ thống* | System | `UC-81` | `§3.10.7 Generate Commission Statement`<br>*(Non-Screen Function 19)* | *(Chức năng ngầm ngày 01 hàng tháng)* | *(Backend Cron Job)* | *Tính toán hoa hồng tự động cuối tháng — BE phụ trách* |

*Lưu ý phân định phạm vi:* `UC-76` và `BR-191` thuộc chức năng tạo tài khoản Staff của Administrator tại màn hình Screen 35 (`§3.9.1.4 Create Staff Account`), không thuộc phạm vi màn hình W102 (`UC-77`).

---

## 3. DANH MỤC QUY TẮC NGHIỆP VỤ & TRẠNG THÁI PHÊ DUYỆT (BUSINESS RULES AUDIT)

Đối chiếu nguyên văn và trung thực từ bản gốc SRS Report 3 (§3.6, §3.9, §3.10) và Bảng lịch sử thay đổi (Document Change History):

| Mã BR | Tên quy tắc nghiệp vụ | Áp dụng tại | Nội dung quy chuẩn SRS gốc | Trạng thái phê duyệt SRS & Bàn giao Backend |
| :--- | :--- | :---: | :--- | :--- |
| **BR-192** | Tạo tài khoản Đối tác dịch vụ | W102 (§3.9.1.5) | Tài khoản Service Provider chỉ được tạo bởi Staff, với email duy nhất, và được liên kết với ít nhất một điểm POI thương mại đang hoạt động (`Active`) thuộc các danh mục Khách sạn, Thuê xe hoặc Nhà hàng. **Một điểm POI chỉ được liên kết với tối đa một tài khoản Service Provider.** Hệ thống gán vai trò Service Provider, gửi mật khẩu tạm thời đến email và yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên. | **PENDING APPROVAL** (Lịch sử thay đổi ghi nhận: Đề xuất nhóm đang chờ Owner xác nhận). Cần Backend cài đặt quan hệ `1 Provider : N POIs` và `1 POI : <=1 Provider` (không phải 1:1 hai chiều). |
| **BR-193** | Phạm vi truy cập yêu cầu đặt phòng | W103 (§3.6.3), W104 (§3.6.4) | Service Provider chỉ được xem và phản hồi các yêu cầu đặt dịch vụ của các điểm POI thương mại đã được liên kết với tài khoản của chính mình. | **CONFIRMED SRS**. Backend cần kiểm tra quyền sở hữu tài nguyên (Resource Ownership check) theo `providerId` trong session JWT trên mọi query/mutation. |
| **BR-194** | Ràng buộc trạng thái quyết định & Hết hạn 24h | W104 (§3.6.4) | Chỉ yêu cầu ở trạng thái `Pending Confirmation` mới được xác nhận hoặc từ chối; yêu cầu đã quyết định không được quyết định lại. **Yêu cầu không nhận được phản hồi trong vòng 24 giờ sau khi gửi sẽ tự động chuyển sang `Expired` và không giữ chỗ.** | **PENDING APPROVAL** (Thời hạn 24h đang chờ Owner phê duyệt). Backend cần lập trình background worker quét các yêu cầu `PendingConfirmation` quá 24h để chuyển `Expired`. *(Lưu ý: Quy tắc liên kết POI thuộc BR-192 / MSG202, không thuộc BR-194)*. |
| **BR-195** | Bắt buộc nhập lý do từ chối | W104 (§3.6.4) | Việc từ chối yêu cầu đặt dịch vụ bắt buộc phải có lý do, và lý do đó được hiển thị cho Traveler (`MSG204`). | **CONFIRMED SRS**. Giao diện đã cung cấp các lý do mẫu và ô nhập lý do. Không áp đặt điều kiện độ dài tùy tiện (như tối thiểu 5 ký tự) khi SRS gốc không yêu cầu. |
| **BR-196** | Chính sách thanh toán trực tiếp tại cơ sở lưu trú | W104 (§3.6.4), W105 (§3.6.6) | Khách du lịch (Traveler) thanh toán tiền dịch vụ thương mại trực tiếp cho Service Provider khi sử dụng dịch vụ. TripMate không thu tiền đặt dịch vụ thương mại, chỉ hiển thị số tiền dự tính để tham khảo và không xử lý hoàn tiền cho dịch vụ này. | **APPROVED DECISION** (Quyết định chính thức của Owner ngày 12/11/2026). Backend không tạo cổng thanh toán giữ tiền đặt phòng qua PayOS/VNPAY. |
| **BR-197** | Ghi nhận kết quả sau lưu trú & Tự động hoàn thành sau 3 ngày | W104 (§3.6.5) | Sau ngày yêu cầu dịch vụ, Service Provider ghi nhận kết quả của từng yêu cầu `Confirmed` là `Completed` (kèm số tiền thực tế tính cho khách) hoặc `No-show`. **Yêu cầu không được ghi nhận kết quả trong vòng 3 ngày sau ngày dịch vụ sẽ tự động chuyển thành `Completed` theo số tiền dự kiến.** | **PENDING APPROVAL** (Đề xuất nhóm đang chờ Owner xác nhận). Bản gốc SRS quy định thời hạn tự động chốt là **3 ngày** sau ngày dịch vụ (không phải 7 ngày). Backend cần background job xử lý sau 3 ngày. |
| **BR-198** | Công thức tính hoa hồng nền tảng | W104 (§3.6.5), W105 (§3.6.6), §3.10.7 | Hoa hồng dịch vụ TripMate thu là **10%** trên số tiền thực tế của mỗi yêu cầu `Completed`, làm tròn xuống số nguyên VND. Yêu cầu `Rejected`, `Expired` hoặc `No-show` không chịu hoa hồng. | **PENDING APPROVAL** (Đề xuất nhóm đang chờ Owner xác nhận). UI hiện mô phỏng mức 10% theo SRS. Không tự ý thay đổi công thức tài chính. |
| **BR-199** | Chu kỳ bảng kê ngày 01 & Hạn thanh toán 7 ngày | W105 (§3.6.6), W106 (§3.6.7), §3.10.7 | Vào ngày đầu tiên của mỗi tháng, hệ thống xuất một bảng kê hoa hồng cho mỗi Service Provider cho các yêu cầu hoàn thành trong tháng trước. **Bảng kê phải được thanh toán bằng chuyển khoản ngân hàng đến tài khoản TripMate trong vòng 7 ngày kể từ ngày phát hành;** Service Provider báo mã tham chiếu chuyển khoản và Staff ghi nhận sau đối soát. | **PENDING APPROVAL** (Đề xuất nhóm đang chờ Owner xác nhận). Thời hạn thanh toán là **7 ngày kể từ ngày phát hành** (không phải là một ngày cố định độc lập). |
| **BR-200** | Tự động khóa tài khoản nợ sau 15 ngày quá hạn | W106 (§3.6.7), §3.10.7 | Khi bảng kê hoa hồng chưa thanh toán quá **15 ngày sau ngày đến hạn**, hệ thống tự động khóa tài khoản Service Provider và các dịch vụ của đối tác không còn mở để đặt. Tài khoản chỉ được mở khóa bởi Staff sau khi tất cả bảng kê quá hạn đã được thanh toán. | **PENDING APPROVAL** (Đề xuất nhóm đang chờ Owner xác nhận). Hành vi đối soát và ghi nhận của Staff thuộc về `UC-83` (§3.6.7), không gộp vào BR-200. |
| **BR-174** | Ghi nhật ký kiểm toán bất biến (Audit Log) | W106 (§3.6.7) | Việc ghi nhận receipt đối soát của Staff phải được ghi vào nhật ký kiểm toán bất biến (immutable audit log) cùng tài khoản thực hiện và dấu thời gian. | **CONFIRMED SRS**. Frontend hiện chỉ hiển thị mock feedback, việc ghi nhật ký kiểm toán bất biến thực tế phải được Backend thực thi. |
| **BR-52** | Tìm kiếm danh sách khi submit hoặc áp dụng bộ lọc | W103 (§3.6.3) | Tìm kiếm danh sách chạy khi người dùng gửi từ khóa hoặc áp dụng bộ lọc, không chạy trên từng phím gõ, và kết quả được phân trang theo CR-01. | **CONFIRMED SRS**. Giao diện W103 tuân thủ: form tìm kiếm chỉ kích hoạt khi submit hoặc bấm nút tìm kiếm. |

---

## 4. TÁCH BẠCH PHẠM VI BÀN GIAO & PHÂN LOẠI CÔNG VIỆC CÒN LẠI

### 4.1. Hạng mục Frontend ĐÃ HOÀN TẤT & ĐƯỢC OWNER CHẤP THUẬN (UI/UX Delivered)
1. **5 màn hình nghiệp vụ W102–W106:** Đầy đủ giao diện, cấu trúc, thẩm mỹ TripMate và phân cấp thông tin.
2. **Bản địa hóa Tiếng Việt (Vietnamese-first):** Toàn bộ nhãn, thông báo, ngày tháng (`dd/MM/yyyy`), tiền tệ (`X.XXX.XXX ₫`).
3. **Làm sạch Metadata:** Không còn nhãn đặc tả kỹ thuật (`UC-`, `BR-`, `Screen W-`) hiển thị trên giao diện người dùng.
4. **Dropdown tùy biến (`AccessibleSelect` & `SearchableMultiSelect`):** Hỗ trợ ARIA 1.2 combobox, điều hướng bàn phím đầy đủ, chống tràn khung nhìn (viewport boundary auto-flip).
5. **Cảnh báo Sandbox / Demo Banking (W105):** Biểu ngữ viền cam và huy hiệu nổi bật cảnh báo thông tin tài khoản chuyển tiền thử nghiệm, tránh chuyển tiền thật.
6. **Bố cục Responsive & Bằng chứng Visual QA:** 32 ảnh chụp màn hình sau hoàn thiện và 20 ảnh đối chứng trên 4 viewports tiêu chuẩn.

---

### 4.2. Danh mục Hạng mục Kỹ thuật Còn lại (Remaining Engineering Work)

Các hạng mục này thuộc phạm vi tích hợp Backend / Production và **chưa được triển khai trong phạm vi Frontend UI/UX này**:

| STT | Hạng mục kỹ thuật còn lại | Phân loại trạng thái | Bằng chứng & Ghi chú kỹ thuật |
| :---: | :--- | :---: | :--- |
| 1 | **Xác thực & Phân quyền vai trò thực tế** | `MISSING_IMPLEMENTATION` | Hiện tại tuyến đường `/provider/*` và `/admin/*` sử dụng layout shell và mock context. Backend cần cấp JWT chứa role `Service Provider` và `Staff` thực tế. |
| 2 | **Kiểm tra quyền sở hữu tài nguyên (BR-193)** | `MISSING_IMPLEMENTATION` | Frontend lọc theo mock state. Backend cần kiểm tra `providerId` trong token phải khớp với `linkedCommercialPoiId` của booking request được truy vấn/cập nhật. |
| 3 | **Cơ sở dữ liệu & API Backend thực tế** | `MISSING_IMPLEMENTATION` | Các dịch vụ `StaffProviderService`, `ProviderBookingService`, `ProviderStatementService`, `StaffReconciliationService` hiện gọi mock data trong `fixtures/index.ts`. Backend cần xây dựng database schema và endpoint thực. |
| 4 | **Vòng đời mật khẩu tạm thời & Gửi email** | `MISSING_IMPLEMENTATION` | W102 hiển thị Toast mô phỏng gửi email thành công. Backend cần tích hợp dịch vụ gửi mail (SendGrid/SMTP), sinh mật khẩu tạm thời băm bảo mật (`BR-03`), và cờ bắt buộc đổi mật khẩu ở lần đăng nhập đầu (`BR-192`). |
| 5 | **Tự động hết hạn yêu cầu đặt phòng sau 24h (BR-194)** | `MISSING_IMPLEMENTATION` | Frontend chỉ hiển thị trạng thái `Expired` có sẵn trong mock data. Cần cron job phía Backend tự động chuyển trạng thái sau 24h. |
| 6 | **Tự động chốt Completed sau 3 ngày không báo cáo (BR-197)** | `MISSING_IMPLEMENTATION` | Cần background worker phía Backend quét các booking `Confirmed` sau 3 ngày kể từ `requestedDate` để tự động chốt `Completed` theo giá ước tính. |
| 7 | **Hàm tự động xuất bảng kê hoa hồng UC-81 (§3.10.7)** | `MISSING_IMPLEMENTATION` | Tác vụ ngầm chạy lúc 00:00 ngày 01 hàng tháng để tính tổng hoa hồng 10% các booking Completed tháng trước (`BR-198`, `BR-199`) và phát hành bảng kê. |
| 8 | **Tự động khóa tài khoản nợ sau 15 ngày quá hạn (BR-200)** | `MISSING_IMPLEMENTATION` | Cần scheduler kiểm tra bảng kê quá hạn 15 ngày để khóa tài khoản và gỡ dịch vụ trên catalogue. |
| 9 | **Ghi nhật ký kiểm toán bất biến (BR-174)** | `MISSING_IMPLEMENTATION` | Ghi log hành động đối soát của Staff vào bảng `AuditLogs` bảo mật, không thể chỉnh sửa. |
| 10 | **Hợp đồng API đề xuất phía dưới** | `NOT_VERIFIED` | Danh sách DTO và URL tại Mục 5 là quy chuẩn đề xuất từ phía Frontend, chưa được Backend xác nhận chính thức thành API contract cuối cùng. |
| 11 | **Chứng nhận Khả năng tiếp cận WCAG 2.2 AA toàn diện** | `NOT_VERIFIED` | Frontend được thiết kế và kiểm thử component theo hướng dẫn WCAG 2.2 AA / ARIA 1.2; chứng nhận chính thức cần quy trình kiểm toán accessibility chuyên biệt trên môi trường tích hợp. |

---

## 5. DỰ THẢO HỢP ĐỒNG API ĐỀ XUẤT CHO BACKEND (DRAFT CONTRACT EXPECTATIONS)

*(Lưu ý: Đây là đề xuất giao tiếp từ Frontend để Backend tham khảo xây dựng, không phải hợp đồng Backend đã phê duyệt)*

### 5.1. Nhóm API Đối tác (Service Provider Endpoints)
1. `GET /api/v1/provider/bookings?status={status}&keyword={kw}&startDate={sd}&endDate={ed}&page={p}&pageSize={ps}`
2. `POST /api/v1/provider/bookings/{id}/confirm`
3. `POST /api/v1/provider/bookings/{id}/reject` — Body: `{ rejectionReason: string }`
4. `POST /api/v1/provider/bookings/{id}/outcome` — Body: `{ status: 'Completed' | 'NoShow', actualAmount: number, notes?: string }`
5. `GET /api/v1/provider/statements?period={period}&status={status}`
6. `POST /api/v1/provider/statements/{id}/report-payment` — Body: `{ bankReference: string, notes?: string }`

### 5.2. Nhóm API Quản trị Staff (Staff Admin Endpoints)
1. `POST /api/v1/admin/service-providers` — Body: `{ businessName: string, serviceCategory: string, representativeName: string, email: string, phoneNumber: string, linkedPoiIds: number[] }`
2. `GET /api/v1/admin/commercial-settlements/reconciliation?status={status}&period={period}&providerId={id}`
3. `POST /api/v1/admin/commercial-settlements/reconciliation/{statementId}/reconcile` — Body: `{ confirmedBankReference?: string, notes?: string }`
