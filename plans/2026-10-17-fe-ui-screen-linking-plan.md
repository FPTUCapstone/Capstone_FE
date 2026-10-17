# Kế hoạch sửa giao diện FE và nối các màn hình hiện có

Trạng thái: **Đề xuất để review — chưa triển khai thay đổi giao diện.**

Baseline: `develop` tại `15dd71bbbe5bc7a3b8b94afda74930469a881dbc`, kiểm kê ngày 17/10/2026 (Asia/Ho_Chi_Minh).

## 1. Mục tiêu và phạm vi

Chuẩn bị PR nháp làm điểm theo dõi cho việc sửa giao diện FE. Bước đầu là kiểm kê màn hình đã có, xác định các điểm đứt điều hướng và chia nhỏ công việc nối lại luồng. Các commit sửa giao diện sẽ bổ sung sau khi phạm vi triển khai được duyệt.

PR khởi tạo chỉ thêm tài liệu. Không đổi route, component, dependency hay hợp đồng API. Sự tồn tại của `page.tsx` chỉ chứng minh có route trong source; không chứng minh chức năng đã chạy với backend hoặc đã được duyệt về sản phẩm.

Phạm vi triển khai đề xuất:

- Nối các màn Public, tài khoản Traveler, lập lịch trình, khám phá/đặt tour, Partner và workspace quản trị đã có trên `develop`.
- Đồng bộ menu, trạng thái đang chọn, breadcrumb/đường quay lại, nút tiếp tục và trạng thái sau khi gửi form.
- Sửa bố cục responsive, focus và trạng thái loading/empty/error trong những component thực sự được thay đổi.
- Giữ URL hiện tại, kiểm tra quyền, session restore và ranh giới demo/production của từng feature.

Ngoài phạm vi: xây màn hình mới, đưa màn Mobile-only lên Web, tự tạo endpoint hoặc quyền mới, tính lại nghiệp vụ thanh toán/hoàn tiền, thay design system, merge PR khác, triển khai lên môi trường chạy thật. Không tạo dashboard KPI giả để lấp trang tạm.

Nguồn quyết định phạm vi: SRS đã duyệt → [Web scope matrix](../docs/WEB_SCOPE_MATRIX.md) → screen spec/UI đã duyệt → task triển khai. [Engineering Convention](../docs/FRONTEND_ENGINEERING_CONVENTION.md) và [AGENTS.md](../AGENTS.md) quy định cách thực hiện. Chưa mặc định duyệt các bước triển khai bên dưới.

## 2. Kiểm kê và vấn đề đã xác nhận từ source

[Danh mục route hiện có](../docs/FE_SCREEN_INVENTORY_2026-10-17.md) liệt kê đầy đủ 61 file `app/**/page.tsx`, gồm cả redirect và trang chưa có chức năng hoàn chỉnh. Không tính API handler, dialog hoặc `src/legacy/mobile` là màn hình Web.

| Mã | Bằng chứng | Hệ quả và việc cần làm |
| --- | --- | --- |
| N01 | `signInDestination.ts` đưa Operator Approved đến `/partner`; `PartnerContextPage.tsx` ở nhánh `approvedArea` chỉ hiện thông báo đang phát triển | Điểm vào workspace chưa dẫn tới các chức năng đã có. Đề xuất thêm liên kết đến module hiện có ngay trong trang này; không tự tạo số liệu dashboard. |
| N02 | `PartnerWorkspaceNav.tsx` vô hiệu hóa tours/revenue/payouts; `OperatorTourNav.tsx` lại có link tới các route đó | Điều hướng khác nhau giữa hồ sơ và các module vận hành. Cần một danh sách đích nhất quán, vẫn kiểm tra readiness/quyền của từng module. |
| N03 | Coupon có `/partner/coupons/create` và `/partner/coupons/new`. `OPERATOR_COUPON_ROUTES.create` đã chỉ rõ `/create` là form production; `/new` là màn lịch sử dành cho demo | Mọi link production phải dùng `/create`. Không tự chọn lại canonical path, không xóa `/new` trong đợt nối luồng. |
| N04 | `AdminNavigation.tsx` có link reports, nhưng card statistical reports trong `admin/dashboard/resources/en.ts` vẫn `pendingIntegration`; Staff dashboard còn nhiều card pending | Menu/card chưa cùng mô tả readiness. Kiểm tra feature và API trước khi chỉnh trạng thái; không bật toàn bộ chỉ vì route tồn tại. |
| N05 | Admin routes users/routes import các `*UnavailableView`; chưa có route `/admin/tour-operator-applications` trên baseline | Không tạo menu dẫn tới chức năng giả hoặc suy đoán route list. Detail operator application hiện cần ID từ nguồn hợp lệ. |
| N06 | `ROUTES` dùng chung và các file `operator/*/routes.ts` cùng tồn tại; payment handoff `/bookings/[id]/pay` đã có nhưng chưa nằm trong `src/lib/routes.ts` | Chỉ bổ sung/chia sẻ helper thực sự cần ở điểm gọi; giữ feature route helper đang dùng và quy tắc encode ID/query. |

Đây là kiểm tra tĩnh trên source. Chưa khẳng định có lỗi runtime hoặc luồng backend hoàn chỉnh ở các điểm chưa chạy thử.

PR liên quan đang mở lúc kiểm kê: [#73 — pending operator application list](https://github.com/FPTUCapstone/Capstone_FE/pull/73), [#91 — production coupon APIs](https://github.com/FPTUCapstone/Capstone_FE/pull/91), [#63 — Staff active-trip access](https://github.com/FPTUCapstone/Capstone_FE/pull/63). Chỉ ghi nhận phụ thuộc; không coi mã trong các PR này là đã có trên `develop`. Kiểm tra lại trạng thái khi bắt đầu triển khai.

## 3. Bản đồ nối luồng đề xuất

Mũi tên thể hiện đích cần kiểm tra/nối, không khẳng định mọi liên kết đang thiếu. Các đoạn đã đúng chỉ cần xác minh. ID phải lấy từ bản ghi/API thật, không gắn ID mẫu vào menu. Link động mở từ list/detail/form tương ứng, không đưa thẳng lên menu toàn cục.

| Luồng | Các điểm cần nối và giữ ngữ cảnh |
| --- | --- |
| Public và tài khoản | `/` → `/pois` hoặc `/tours`; `/sign-in` ↔ `/register` → `/verify-account`; `/verify-email` giữ vai trò callback hiện tại; `/forgot-password` → đăng nhập. Giữ đích sau đăng nhập nếu flow hiện có hỗ trợ và đích nội bộ hợp lệ. |
| Traveler workspace | Menu tài khoản → `/account/profile` ↔ `/account/preferences` ↔ `/account/security` ↔ `/account/trips`; `/account` tiếp tục redirect về profile. |
| Lập lịch trình | `/plan` → `/itinerary/[id]`; `/itineraries` → itinerary đã lưu → quay lại danh sách. Truyền đúng ID, giữ query/context đã được feature hỗ trợ. |
| POI và tour | `/pois` → `/pois/[id]` → về danh sách; `/tours` → `/tours/[id]` → `/tours/[id]/book`. Giữ filter/page và lịch khởi hành được chọn. |
| Đặt tour và thanh toán | Booking → `/bookings/[id]/pay` → cổng thanh toán do backend trả về → `/checkout/result` → `/bookings/[id]/ticket` khi trạng thái backend cho phép. Nhánh hủy/lỗi/chờ xử lý phải có đường tiếp tục hợp lệ; query callback không phải bằng chứng đã thanh toán. |
| Lịch sử và đánh giá | `/account/trips` → `/account/trips/[id]/review` hoặc `/account/reviews/[kind]/[id]` theo loại bản ghi đang có → về lịch sử. Không đổi lẫn trip ID, booking ID và ticket ID. |
| Partner onboarding | Guest → `/partner/register`; Operator Pending/Rejected → `/partner/application`; Rejected → `/partner/application/resubmit` → trạng thái hồ sơ; Approved → `/partner` → các module được phép. Giữ trạng thái unresolved và quá trình session restore. |
| Partner vận hành | Workspace ↔ `/partner/profile`, `/partner/tours`, `/partner/coupons`, `/partner/bookings`, `/partner/revenue`, `/partner/payouts`. Tours list → new/edit/submit → về list; coupons list → `/create` hoặc edit → về list. Chi tiết booking/cancel/refund tiếp tục dùng dialog hiện có. |
| Administration | `/admin/login` → `/admin` hoặc `/admin/staff` theo role; menu/card → module được route guard và hợp đồng hiện tại cho phép. Tour reviews, active trips và payouts: list → detail → list; audit detail giữ cơ chế hiện tại trong list. Không tạo route detail riêng cho dialog. |

## 4. Các bước triển khai sau khi duyệt

Mỗi bước là một nhóm thay đổi review được độc lập. Danh sách file dưới đây là mục tiêu dự kiến; kiểm tra lại baseline và ownership trước khi sửa. Áp dụng TDD cho hành vi được đổi, review spec rồi review chất lượng theo `AGENTS.md`.

| Bước | Ưu tiên và việc làm | File/phạm vi dự kiến | Xác minh |
| --- | --- | --- | --- |
| 0 | Chốt baseline và ma trận entry → destination → quyền → readiness; đánh dấu edge đã đúng, thiếu, blocked | Plan này; inventory; các route trong `app/`; feature specs liên quan | Đối chiếu mọi route với source; xác nhận dependency PR, role và dữ liệu dùng thử hợp lệ. |
| 1 | Chuẩn hóa các đích đang dùng, thêm helper còn thiếu khi có caller cần; không thay đồng loạt toàn bộ routing | `src/lib/routes.ts`; `src/features/operator/{tours,coupons,bookings,finance}/routes.ts`; test helper liên quan | Test encode ID, query/filter, đích nội bộ; không tạo URL không có route. `/coupons/create` giữ canonical. |
| 2 | Nối điểm vào Partner và làm menu workspace nhất quán; xử lý N01–N03 | `src/features/auth/routing/PartnerContextPage.tsx`; `src/features/operator/common/PartnerWorkspaceNav.tsx`; `src/features/operator/tours/components/OperatorTourNav.tsx`; `src/components/layout/PartnerShell.tsx`; test tương ứng | Operator Approved đến được module đã có; Pending/Rejected không vào workspace; link production không sang `/new` hoặc tự thêm `demo=1`. Không mở quyền mới. |
| 3 | Rà và nối Public/Traveler/planner, ưu tiên CTA hoặc đường quay lại bị thiếu | `src/components/navigation/PublicNavigation.tsx`; `src/features/account/common/AccountWorkspaceNav.tsx`; `src/features/public/{landing,pois,tours}/`; `src/features/scheduling/components/`; các test cạnh component | List/detail/back giữ ngữ cảnh; refresh/deep link hoạt động; tài khoản đúng role; callback xác thực giữ hợp đồng cũ. |
| 4 | Rà luồng booking/payment/ticket/history/review; chỉ sửa edge bị thiếu hoặc sai | `src/features/bookings/components/`; `src/features/trips/components/TripHistoryPage.tsx`; `src/features/reviews/components/`; route composition liên quan trong `app/` | Guest đăng nhập rồi tiếp tục đúng flow; không tạo booking/payment lặp khi back/refresh; backend quyết định trạng thái ticket và eligibility đánh giá. |
| 5 | Đồng bộ readiness menu/card quản trị và đường list/detail/back theo quyền đã có | `src/components/navigation/AdminNavigation.tsx`; `src/features/admin/dashboard/{AdminDashboard.tsx,resources/en.ts}`; `src/features/admin/staff/{components/StaffDashboardView.tsx,resources/en.ts}`; feature detail thực sự cần sửa | Chạy riêng Staff/Administrator; không lộ chức năng sai role; module unavailable/pending không bị mô tả là đã tích hợp. List ứng tuyển chỉ nối nếu đã merge và được phép dùng. |
| 6 | Đồng bộ giao diện tại phần đã chạm: spacing, typography, trạng thái active, responsive và focus | Những component đã sửa ở bước 2–5; `app/globals.css` hoặc `src/components/ui/` chỉ khi cần dùng chung thực sự | 390/768/1280/1440 px; không tràn ngang; keyboard/focus; tên truy cập được; loading/empty/error; ảnh trước/sau cho UI đã đổi. |
| 7 | Kiểm thử tổng luồng, cập nhật docs và PR, gỡ trạng thái Draft khi đủ điều kiện review | Tests liên quan; README nếu inventory/setup đổi; mô tả PR | Toàn bộ gate ở mục 6, kiểm thử tay, bằng chứng UI, review và CI. Không tự merge hoặc deploy. |

Thứ tự: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. Mỗi bước chỉ nối những chức năng đã có và được phép; cạnh bị blocked phải ghi nguyên nhân thay vì tạo hành vi thay thế.

## 5. Tiêu chí nghiệm thu cho phần triển khai tương lai

- Mỗi màn đủ điều kiện sử dụng có ít nhất một entry point phù hợp và đường quay lại; callback, redirect và màn demo có ngoại lệ ghi rõ.
- Không có link nội bộ mới đến route không tồn tại, ID giả, `href="#"` cho điều hướng màn, hoặc dùng local state để giả lập router.
- Menu và dashboard cùng mô tả đích, trạng thái đang chọn và readiness của module.
- Điều hướng không đổi quyền backend, không vượt guard hiện có và không hiện nội dung protected trong lúc restore session.
- Back/forward, refresh và direct URL hoạt động; ID/filter/pagination/query hợp lệ được bảo toàn theo hợp đồng feature.
- Production không tự kích hoạt demo; không hiển thị mock như dữ liệu thật; module đang thiếu backend/spec vẫn có thông báo đúng trạng thái.
- Payment callback, ticket, đánh giá và các thao tác tài chính vẫn do backend quyết định; không suy ra thành công từ URL.
- Các phần UI được sửa đạt kiểm tra responsive, keyboard và trạng thái loading/empty/error.

## 6. Cách kiểm tra và quản lý PR

PR khởi tạo là tài liệu kế hoạch, nên không có ảnh giao diện trước/sau và không thêm test hành vi mới. Theo `AGENTS.md`, ngay cả PR tài liệu cũng phải chạy thành công lần lượt:

```text
npm install
npm test
npm run lint
npm run typecheck
npm run build
```

Ghi kết quả thật vào mô tả PR sau khi chạy. Không ghi một lệnh là pass khi chưa chạy hoặc đang lỗi. Kiểm tra riêng diff, link tài liệu, số route và đường dẫn source trước khi commit.

Khi triển khai UI, bổ sung test có ý nghĩa cho edge thay đổi, kiểm thử tay từng luồng ở mục 3 và ảnh trước/sau. Backend không sẵn sàng thì ghi phần nào chưa xác minh; build/test xanh không thay cho bằng chứng tích hợp.

Giữ PR ở Draft để review kế hoạch trước. Các commit sửa UI sẽ cập nhật sau theo chỉ dẫn tiếp theo của người phụ trách; bước này không tạo lịch tự động cập nhật commit. Không gộp sẵn thay đổi từ các nhánh tính năng khác vào PR kế hoạch.
