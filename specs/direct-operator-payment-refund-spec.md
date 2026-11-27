# Web spec — Thanh toán trực tiếp TO, refund và hoa hồng

Ngày 25/11/2026. Nhánh `fix/linhnv-payout-and-refund`. **Đã duyệt nghiệp vụ ngày 25/11/2026; chỉ tài liệu.**

## Nguồn và phạm vi

Nghiệp vụ/API canonical: BE `specs/direct-operator-payment-refund-spec.md` trong cùng nhánh. Không suy diễn tài liệu SRS cũ đã mô tả mô hình mới. Những quyết định còn mở trong BE vẫn là blocker cho phần tương ứng của FE.

Web hỗ trợ Traveler thanh toán/theo dõi refund; TO kết nối payOS, báo chuyển và trả hoa hồng; Staff chỉ xem/theo dõi refund; Admin quản lý đối soát tháng. Không đổi Staff thành Admin chỉ vì các route hiện nằm dưới `/admin`.

Hiện có `/partner/refunds`, `/partner/refunds/[refundId]`, `/bookings/[id]/refund`, `/bookings/[id]/pay`, `/partner/revenue`, `/admin/refund-reconciliation`; code dưới `src/features/refunds`, `bookings`, `payments`, `operator`. Các trang này phải phân nhánh theo flow server; không đổi nghĩa dữ liệu legacy.

## 1. Cấu hình kênh nhận tiền TO

Route mới đề xuất `/partner/payment-settings`, phải cập nhật Web scope matrix/screen spec khi được duyệt.

- Hiển thị trạng thái kết nối, tên đơn vị nhận, ngân hàng và tài khoản che một phần.
- Form nhập Client ID/API Key/Checksum Key qua BFF server; không localStorage, URL query, analytics hoặc `NEXT_PUBLIC_*`.
- API Key/Checksum Key không được đọc lại sau lưu. Sửa cấu hình cần nhập khóa mới; hiển thị cảnh báo link chờ giữ kênh cũ.
- Nút Lưu và Kiểm tra kết nối tách rõ. Chỉ server cho phép trạng thái Ready; gọi API thành công không đồng nghĩa đã xác minh chủ tài khoản.
- TO chưa Ready vẫn tạo nháp; mở bán bị chặn kèm đường dẫn cấu hình. Không gọi API đăng ký ngân hàng thay TO.

## 2. Booking/payment

- Trước chuyển sang payOS, hiển thị TO nhận tiền, số tiền phải trả và hạn giữ chỗ 15 phút từ server.
- Nút thanh toán tạo/reuse link server. Callback chỉ hiện Đang kiểm tra, đọc trạng thái backend; không dựa URL `success` để phát vé.
- Poll hữu hạn/có retry và refresh khi quay lại tab; quá hạn dùng response server. Mất mạng không khẳng định thất bại nếu giao dịch đang xử lý.
- Kênh lỗi: báo chưa thể thanh toán; không tự đổi sang TripMate. Late/mismatch payment có trạng thái Đang đối soát riêng.
- Production không hiển thị nút mock; không đưa khóa kênh ra client.

## 3. Traveler theo dõi refund

Tái dùng `/bookings/[id]/refund`; liên kết từ booking/ticket/complaint, không bắt nhớ refund ID.

Khối chính: số tiền phải hoàn, số đã ghi nhận nhận được, số còn thiếu, TO trả, lý do, status, timeline và allowedActions từ server.

| Trạng thái | Hiển thị / thao tác |
|---|---|
| AwaitingRecipient | Form ngân hàng, số tài khoản, chủ tài khoản; xác nhận thông tin và đã đọc quy tắc 72h |
| AwaitingTransfer | Chờ TO chuyển; deadline và quá hạn nếu có |
| AwaitingTravelerConfirmation | TO báo chuyển, số tiền/reference/time/evidence; hạn phản hồi tuyệt đối + đếm ngược; Đã nhận đủ / Chưa nhận / Nhận thiếu |
| Disputed | Đang đối soát; lý do và lịch sử; không còn đồng hồ tự hoàn |
| Completed | Amount, completedAt, cách hoàn tất: Traveler / tự hoàn sau 72h / Admin kết luận đối soát |

Thông báo bắt buộc: **Bạn có 72 giờ kể từ khi TO báo chuyển. Nếu không phản hồi, yêu cầu sẽ tự động được hoàn tất.** Không ghi ngân hàng đã xác minh khi method là auto-completion.

- Nhận đủ có confirmation dialog; chưa nhận/thiếu bắt buộc lý do, thiếu có số thực nhận. Các nút nằm cùng màn hình, không che lựa chọn phản đối.
- Khi deadline hết: tải trạng thái backend và xử lý 409; không tự ghi Completed ở client.
- Mutation thành công cập nhật detail và invalidate list/booking liên quan ngay; lỗi giữ nội dung nhập. Không cần F5 để thấy form/trạng thái mới.
- Canceled ticket không hiện QR/refresh/in vé; cancellation UI cập nhật ngay từ response, độc lập thời điểm refund hoàn tất.
- Nội dung khiếu nại giữ 3 lựa chọn TO, tối đa 2 đề xuất/1 counter-offer; không gộp hoàn thành thương lượng với hoàn thành chuyển tiền.

## 4. TO báo chuyển

Tái dùng `/partner/refunds/[refundId]` theo flow. Direct hiển thị **chuyển cho Traveler toàn bộ số phải hoàn**, không hiển thị trả phần chia về TripMate.

- Recipient đủ để chuyển tiền chỉ cấp cho TO có quyền trên refund; không lộ trong list/telemetry.
- Form amount còn thiếu theo server, mã giao dịch, thời gian thực chuyển và evidence private; không cho sửa amount đã thỏa thuận.
- Bấm xem/đọc detail không có toast success. Chỉ sau báo chuyển persist thành công hiện **Đã ghi nhận thông tin chuyển khoản**.
- Hiển thị thời điểm bắt đầu/kết thúc 72h. Không cho TO xóa/sửa báo chuyển hoặc reset hạn bằng upload thêm.
- Quá hạn chuyển hiển thị rõ nhưng không giả hoàn tất.

## 5. Staff và Admin

- Staff: tái dùng `/admin/refund-reconciliation` theo permission hiện có; bộ lọc flow, Disputed/Overdue, detail hai phía, evidence và lịch sử chỉ đọc; không có nút resolve/complete hoặc quyết định số tiền. API Staff chỉ đọc riêng, Admin không được quyền ngầm.
- Admin tranh chấp: route mới đề xuất `/admin/direct-refund-disputes` và `/admin/direct-refund-disputes/[id]`, quyền riêng; xem hai phía, yêu cầu bổ sung/tra soát, kết luận đủ căn cứ đã hoàn hoặc yêu cầu TO khắc phục. Bắt buộc lý do và căn cứ, confirmation dialog, xử lý version conflict; chưa đủ giữ Disputed. Không đổi số tiền đã chốt hoặc bắt TO trả lần hai chỉ vì khách phản đối. Hiển thị AdminResolved và lịch sử cho hai phía; quyền này không mở cho Staff.
- Admin: route đề xuất `/admin/commission-statements`; TO `/partner/commission-statements`. Các route mới cần screen spec/scope được duyệt.
- Invoice hiển thị kỳ, base, rate, credit điều chỉnh, due/paid/outstanding và hạn trả. TO tạo link payOS trả TripMate; phân biệt người nhận với thanh toán tour.
- `/partner/revenue` phân biệt tiền khách trả, đã hoàn, đang chờ hoàn, hoa hồng phải trả/đã trả. Không gọi tiền TO đã nhận là payout đang chờ.
- Đơn legacy vẫn có màn hình/nhãn nghiệp vụ cũ đến khi xong; không xóa menu cần để xử lý tồn đọng.

## 6. UI, bảo mật và acceptance

- Ngày hiển thị `dd/MM/yyyy`, giờ Việt Nam; payload ISO/UTC. Tiền VND căn phải trong bảng, dùng tabular numerals; không sửa số tiền để khớp format.
- Responsive, label/error cạnh trường, auto-scroll lỗi đầu, keyboard/focus dialog, status không chỉ dùng màu; evidence private không dùng link public.
- Loading/empty/error/retry có phân biệt; 401/403 không giả danh sách rỗng. Hạn client dựa serverNow/deadline và đồng bộ lại khi tab active.
- Không thêm state library/framework. App Router + feature boundary + BFF/auth hiện có; feature server modules giữ secret.
- AC: hai TO đúng beneficiary; callback không tự paid; report success đúng lúc; dispute trước hạn chặn auto; auto72h method rõ; mutation không cần F5; actor khác bị chặn; legacy nguyên vẹn.

Nghiệp vụ đã duyệt; chi tiết còn mở theo BE phải chốt trước phần code tương ứng. Spec này chưa phải xác nhận UI đã triển khai hoặc đã test. Không chạy full production build chỉ để viết tài liệu; gate pre-PR vẫn theo AGENTS.md nếu sau này yêu cầu tạo PR.

## Cập nhật duyệt cuối ngày 25/11/2026

Đã duyệt tám quyết định tại mục 13 spec BE cùng tên. Phần này ưu tiên hơn mọi câu “còn mở/chờ duyệt” cũ nói về tám quyết định đó; không mặc định đã viết hoặc kiểm chứng code.

- Hạn TO chuyển ban đầu và chuyển bổ sung sau quyết định Admin: **72 giờ liên tục**, gồm cuối tuần/lễ. Không còn dùng 3 ngày làm việc. Hạn Traveler phản hồi ban đầu là một cửa sổ 72h riêng.
- Hoa hồng decimal round half up theo booking, rate chụp tại booking, payment xác minh làm base; refund điều chỉnh chênh lệch commission mục tiêu.
- Evidence PDF/JPG/JPEG/PNG, tối đa 5 MB/file, 1–3 file/report, private; retention 24 tháng sau đóng, giữ hồ sơ đang tranh chấp. Admin xử lý hồ sơ có quyền xem; không public evidence.
- Hết lượt thương lượng khiếu nại: `AwaitingAdminReview`, Admin xét và quyết định kết quả/amount theo hợp đồng, chính sách snapshot và bằng chứng. Staff vẫn chỉ theo dõi. Chưa đủ dữ kiện thì yêu cầu bổ sung, không tạo amount giả.
- Sau tranh chấp nhận tiền, không reset 72h bằng báo chuyển bổ sung. Khách nhận đủ hoặc Admin xác minh đủ thì Complete; lưu AdminResolved khi phù hợp.
- Khách được gửi late-review trong 7 ngày sau auto-complete. Admin xem hồ sơ liên kết, không đảo lịch sử/ledger tự động; đây là hạn hỗ trợ nội bộ, không xóa quyền bên ngoài.
- Kênh TO: một kênh active/TO, không chung cho hai TO; Admin đối chiếu/duyệt khi API không đủ xác minh; thay kênh chỉ áp giao dịch mới, giữ kênh cũ cho giao dịch đang có.
- Hoa hồng hạn 7 ngày liên tục từ issuedAt; quá hạn dừng booking mới, vẫn xử lý đơn/refund cũ. Credit bù nợ, dư chuyển kỳ; đóng tài khoản phải đối soát và hoàn credit dư có chứng từ/xác nhận.

