# Báo cáo migration Frontend Convention

Trạng thái: đang thực thi; tài liệu này được cập nhật ở bước reassessment cuối.

Baseline sau fetch: `9fe58b2e7cb8a81fb5b79a667b54e18b72c13692`. Nhánh: `refactor/frontend-convention-migration`.

Phase 0: inventory giữ 64 pages, 45 Route Handlers, 256 tệp test, 11 feature roots và 1.250 cạnh import static; generic `src/components/ui` không import feature. C05–C07 audit cũ không phải vi phạm chỉ vì composite auth/navigation import feature (convention §3 rule 2).

Nguồn yêu cầu: original Report3, hash `22371e92506b098a9a546069038b58b75003371b3b7f85d5cfd6dd913f0d295a`; V2 là lịch sử. Conflict UC-52, Staff/Admin, route master, active trips và payout vẫn chờ BA; chưa đổi classification/quyền/business rules. S1 bị chặn vì UC-01 vẫn yêu cầu lưu token, UC-04 hoãn migration verification-link. A2 phụ thuộc session/refresh contract. D3 cần approved payout schema; D4 cần approved storage destination policy.

Baseline tuần tự: npm ci pass; Node 63 pass, Vitest 246 files/2.570 assertions pass nhưng npm test exit 1 do unhandled timer sau teardown ở AuditLogDetailDrawer. Lint pass exit 0; typecheck pass exit 0; production build chuẩn pass exit 0. Không đổi bundler/font/config để build qua. CI baseline: https://github.com/FPTUCapstone/Capstone_FE/actions/runs/39828056005 (success), không phải check của commit local.

Kế hoạch stabilization trước refactor: chỉ drawer và test hiện có; test trước cho Copy lặp/close/unmount, cleanup timer và late clipboard resolution, focused tests rồi full npm test. Đây là lỗi vòng đời theo convention §14, không sửa harness để giấu lỗi. Chỉ commit implementation khi xác minh qua.

PR #112 đã merged; #110/#108/#103/#91/#73/#63 còn mở tại lần kiểm tra. Tạm chặn S4/coupon/trips chồng chéo. Không push/tạo PR/merge.
