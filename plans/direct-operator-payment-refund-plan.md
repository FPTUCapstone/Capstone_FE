# Plan Web — Direct payment / refund / commission

Ngày 25/11/2026. **Đã ghi nhận duyệt nghiệp vụ ngày 25/11/2026; chưa triển khai.** Phụ thuộc BE spec/contract cùng tên và các policy còn mở. File mới bên dưới là đề xuất.

| Task | File/phạm vi cụ thể | Kiểm chứng và Done |
|---|---|---|
| W1. Khóa screen/API | `docs/WEB_SCOPE_MATRIX.md`, spec cùng tên; thêm `specs/direct-payment-web-screen-spec.md` với route mới được duyệt | Đối chiếu actor và screen ownership, UI review; không suy diễn scope từ route cũ |
| W2. DTO/BFF | `src/features/refunds/types/refundLifecycle.ts`, thêm `directRefundLifecycle.ts`; `src/features/payments` và `src/features/operator/payment-settings`; route handlers trong `app/api/` ánh xạ contract BE đã khóa | Contract tests error/version/allowedActions, auth/cookie proxy, secret server-only; không gửi key xuống browser |
| W3. Kết nối kênh | Mới `app/partner/payment-settings/page.tsx`, `src/features/operator/payment-settings/`; link từ shell/menu TO hiện có | Behavioral tests save/verify/error/read-only secrets; Ready từ BE; không tự unlock publish |
| W4. Payment | `app/bookings/[id]/pay/page.tsx`, `app/checkout/result/page.tsx`, `src/features/payments/`, booking services | Test callback giả, pending/expired/reconciliation, refresh khi quay lại và đúng TO; không mock production |
| W5. Traveler refund | `app/bookings/[id]/refund/page.tsx`, `src/features/bookings/services/refundProgressProxy.ts`, feature refund UI hiện có | Test recipient/accept/dispute/partial/409/auto method; success cập nhật detail ngay; không F5 |
| W6. TO report | `app/partner/refunds/page.tsx`, `app/partner/refunds/[refundId]/page.tsx`, `src/features/refunds/operator/` | Test thiếu evidence/reference, upload lỗi/retry, chỉ toast sau submit thành công; direct/legacy khác nội dung |
| W7. Staff theo dõi | `app/admin/(console)/refund-reconciliation/page.tsx`, `src/features/refunds/staff/` | Test Staff-only read access, private evidence; không có resolve/complete mutation hoặc nút quyết định; Admin không có quyền ngầm |
| W7a. Admin tranh chấp | Mới `app/admin/(console)/direct-refund-disputes/page.tsx`, `[id]/page.tsx`, `src/features/refunds/admin-disputes/`, BFF theo contract BE | Test quyền riêng, reason/evidence bắt buộc, đủ/chưa đủ/yêu cầu khắc phục, 409 và cập nhật UI; không lộ evidence ngoài phạm vi, không Staff resolve |
| W8. Commission | Mới `app/partner/commission-statements/{page.tsx,[id]/page.tsx}`, `app/admin/(console)/commission-statements/`; `src/features/operator/commission-statements/`, `src/features/admin/commission-statements/` | Test invoice/credit/paid vs owed và payOS người nhận TripMate; screen được duyệt trước code |
| W9. Report/cutover | `app/partner/revenue/page.tsx`, `src/features/operator/finance/`, `src/features/operator/payout-settlements/`, menu shells hiện có | Test dữ liệu mixed-flow và đơn cũ, không xóa entry xử lý legacy; không đổi kỳ UC-44 ngầm |
| W10. Tài liệu/E2E | `README.md`, `.env.example` nếu cấu hình đổi, cutover notes | Ghi rõ real payOS vs bank-transfer refund; không chứa secret, không đổi env thật chỉ để test |

Các task logic viết test hành vi trước; không tạo test cho thay đổi căn lề/format thuần vị trí theo yêu cầu người dùng. Task đầu tiên phải xác định tên component hiện hữu bằng source inventory, không tạo song song trang trùng chức năng.

## Kiểm tra tích hợp

1. Hai TO / hai kênh → đúng tên và tài khoản nhận khi booking; mất kết nối không fallback.
2. Sau submit report, Traveler thấy countdown 72h và cả hai lựa chọn; mock clock ở test không đổi giờ payOS thật.
3. Dispute trước hạn, response tại hạn, job thắng race, refresh tab/app: BE quyết định, client render đúng method.
4. Hủy booking vô hiệu ticket/ẩn in vé ngay; direct không hiện trả phần chia TripMate.
5. Staff xem tranh chấp, không quyết định; TO/Traveler xử lý thiếu tiền theo policy được chốt; remaining và timeline nhất quán; evidence không truy cập chéo tài khoản.
6. Trả commission invoice là payment purpose riêng; report/credit không cộng trùng legacy.

Sau implementation: chạy focused Vitest/Node tests mỗi task; full `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` theo repo. Khi chuẩn bị PR phải thực hiện đầy đủ cả thứ tự `npm install` theo AGENTS.md. Manual responsive/keyboard cho form mới và bằng chứng ảnh có che dữ liệu. Tiền thật E2E phải có cho phép riêng về tài khoản/số tiền. Không push/PR/deploy chỉ do plan này tồn tại.

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

### Task bổ sung bắt buộc trước nghiệm thu

- Khóa contract cho Admin complaint decision, Traveler/Admin late review, channel approval và credit final settlement; không gộp vào quyền Staff read-only.
- Test Admin complaint decision tạo refund idempotent, chưa đủ bằng chứng không chốt tiền; late-review trước/đúng/sau hạn 7 ngày và điều chỉnh không trùng.
- Test 72h ban đầu/bổ sung và 7 ngày invoice trên server, cuối tuần/lễ không kéo dài; booking gate vẫn cho xử lý nghĩa vụ cũ.
- Test rounding theo booking, refund nhiều lần, credit vượt nợ và đóng TO; ghi history/adjustment bất biến.
- FE bổ sung screen/actions Admin trên Web trong task screen contract; Mobile chỉ TO/Traveler xem kết quả, bổ sung bằng chứng và gửi late review, không làm Admin Flutter.
