# Danh mục màn hình FE hiện có — 17/10/2026

Baseline: `develop` tại `15dd71bbbe5bc7a3b8b94afda74930469a881dbc`. Kiểm kê 61 file `app/**/page.tsx`; route group `(console)` không xuất hiện trong URL. API handler, dialog và legacy mobile không được tính thành màn hình.

Đây là kiểm kê source, chưa phải danh sách chức năng đã tích hợp backend. Quyền truy cập phải đối chiếu layout/page/feature guard và backend trước khi bật menu. Các callback, redirect và màn demo không cần xuất hiện trên menu.

Xem [kế hoạch nối màn hình](../plans/2026-10-17-fe-ui-screen-linking-plan.md) để biết luồng, thứ tự thực hiện và tiêu chí nghiệm thu.

| URL hiện có | Source route | Cách đưa vào luồng / giới hạn |
| --- | --- | --- |
| `/account` | [app/account/page.tsx](../app/account/page.tsx) | Redirect hiện có về /account/profile; không tạo màn dashboard tài khoản mới. |
| `/account/preferences` | [app/account/preferences/page.tsx](../app/account/preferences/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/account/profile` | [app/account/profile/page.tsx](../app/account/profile/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/account/reviews/[kind]/[id]` | [app/account/reviews/[kind]/[id]/page.tsx](../app/account/reviews/%5Bkind%5D/%5Bid%5D/page.tsx) | Mở từ bản ghi hợp lệ trong list/detail hoặc kết quả thao tác; không hard-code ID lên menu. |
| `/account/security` | [app/account/security/page.tsx](../app/account/security/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/account/trips/[id]/review` | [app/account/trips/[id]/review/page.tsx](../app/account/trips/%5Bid%5D/review/page.tsx) | Mở từ bản ghi hợp lệ trong list/detail hoặc kết quả thao tác; không hard-code ID lên menu. |
| `/account/trips` | [app/account/trips/page.tsx](../app/account/trips/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/admin/account/security` | [app/admin/(console)/account/security/page.tsx](../app/admin/%28console%29/account/security/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/admin/audit-logs` | [app/admin/(console)/audit-logs/page.tsx](../app/admin/%28console%29/audit-logs/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/admin/landing-content` | [app/admin/(console)/landing-content/page.tsx](../app/admin/%28console%29/landing-content/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/admin` | [app/admin/(console)/page.tsx](../app/admin/%28console%29/page.tsx) | Điểm vào Administrator; đối chiếu readiness của dashboard và quyền từng module. |
| `/admin/payouts/[payoutId]` | [app/admin/(console)/payouts/[payoutId]/page.tsx](../app/admin/%28console%29/payouts/%5BpayoutId%5D/page.tsx) | Page guard hiện yêu cầu Staff; không mở cho Administrator chỉ dựa trên namespace /admin. |
| `/admin/payouts` | [app/admin/(console)/payouts/page.tsx](../app/admin/%28console%29/payouts/page.tsx) | Page guard hiện yêu cầu Staff; không mở cho Administrator chỉ dựa trên namespace /admin. |
| `/admin/reports` | [app/admin/(console)/reports/page.tsx](../app/admin/%28console%29/reports/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/admin/routes/create` | [app/admin/(console)/routes/create/page.tsx](../app/admin/%28console%29/routes/create/page.tsx) | Source đang render UnavailableView; không coi route tồn tại là chức năng đã hoạt động. |
| `/admin/routes` | [app/admin/(console)/routes/page.tsx](../app/admin/%28console%29/routes/page.tsx) | Source đang render UnavailableView; không coi route tồn tại là chức năng đã hoạt động. |
| `/admin/settings/algorithm-parameters` | [app/admin/(console)/settings/algorithm-parameters/page.tsx](../app/admin/%28console%29/settings/algorithm-parameters/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/admin/staff` | [app/admin/(console)/staff/page.tsx](../app/admin/%28console%29/staff/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/admin/tour-operator-applications/[userId]` | [app/admin/(console)/tour-operator-applications/[userId]/page.tsx](../app/admin/%28console%29/tour-operator-applications/%5BuserId%5D/page.tsx) | Có detail; list /admin/tour-operator-applications chưa có trong baseline. Chờ dependency được merge. |
| `/admin/tours/reviews/[id]` | [app/admin/(console)/tours/reviews/[id]/page.tsx](../app/admin/%28console%29/tours/reviews/%5Bid%5D/page.tsx) | Mở từ bản ghi hợp lệ trong list/detail hoặc kết quả thao tác; không hard-code ID lên menu. |
| `/admin/tours/reviews` | [app/admin/(console)/tours/reviews/page.tsx](../app/admin/%28console%29/tours/reviews/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/admin/trips/active/[id]` | [app/admin/(console)/trips/active/[id]/page.tsx](../app/admin/%28console%29/trips/active/%5Bid%5D/page.tsx) | Mở từ bản ghi hợp lệ trong list/detail hoặc kết quả thao tác; không hard-code ID lên menu. |
| `/admin/trips/active` | [app/admin/(console)/trips/active/page.tsx](../app/admin/%28console%29/trips/active/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/admin/users/[userId]` | [app/admin/(console)/users/[userId]/page.tsx](../app/admin/%28console%29/users/%5BuserId%5D/page.tsx) | Source đang render UnavailableView; không coi route tồn tại là chức năng đã hoạt động. |
| `/admin/users` | [app/admin/(console)/users/page.tsx](../app/admin/%28console%29/users/page.tsx) | Source đang render UnavailableView; không coi route tồn tại là chức năng đã hoạt động. |
| `/admin/catalogue/points-of-interest/new` | [app/admin/catalogue/points-of-interest/new/page.tsx](../app/admin/catalogue/points-of-interest/new/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/admin/forgot-password` | [app/admin/forgot-password/page.tsx](../app/admin/forgot-password/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/admin/login` | [app/admin/login/page.tsx](../app/admin/login/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/bookings/[id]/pay` | [app/bookings/[id]/pay/page.tsx](../app/bookings/%5Bid%5D/pay/page.tsx) | Payment handoff hiện có; mở từ booking hợp lệ theo UC-28. |
| `/bookings/[id]/ticket` | [app/bookings/[id]/ticket/page.tsx](../app/bookings/%5Bid%5D/ticket/page.tsx) | Ticket sau khi backend cho phép; không lẫn ticket ID với booking ID. |
| `/checkout/result` | [app/checkout/result/page.tsx](../app/checkout/result/page.tsx) | Return từ thanh toán; backend quyết định trạng thái, không tin query thành công. |
| `/forgot-password` | [app/forgot-password/page.tsx](../app/forgot-password/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/itineraries` | [app/itineraries/page.tsx](../app/itineraries/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/itinerary/[id]` | [app/itinerary/[id]/page.tsx](../app/itinerary/%5Bid%5D/page.tsx) | Mở từ bản ghi hợp lệ trong list/detail hoặc kết quả thao tác; không hard-code ID lên menu. |
| `/` | [app/page.tsx](../app/page.tsx) | Điểm vào Public; menu/CTA đến khám phá, lập kế hoạch và tài khoản. |
| `/partner/application` | [app/partner/application/page.tsx](../app/partner/application/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/partner/application/resubmit` | [app/partner/application/resubmit/page.tsx](../app/partner/application/resubmit/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/partner/bookings` | [app/partner/bookings/page.tsx](../app/partner/bookings/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/partner/coupons/[id]/edit` | [app/partner/coupons/[id]/edit/page.tsx](../app/partner/coupons/%5Bid%5D/edit/page.tsx) | Mở từ bản ghi hợp lệ trong list/detail hoặc kết quả thao tác; không hard-code ID lên menu. |
| `/partner/coupons/create` | [app/partner/coupons/create/page.tsx](../app/partner/coupons/create/page.tsx) | Form tạo coupon production hiện có; đích canonical của OPERATOR_COUPON_ROUTES.create. |
| `/partner/coupons/new` | [app/partner/coupons/new/page.tsx](../app/partner/coupons/new/page.tsx) | Màn lịch sử/demo; không thêm vào navigation production. |
| `/partner/coupons` | [app/partner/coupons/page.tsx](../app/partner/coupons/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/partner` | [app/partner/page.tsx](../app/partner/page.tsx) | Điểm vào Operator Approved; hiện là placeholder, ưu tiên nối module đã có. |
| `/partner/payouts` | [app/partner/payouts/page.tsx](../app/partner/payouts/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/partner/profile` | [app/partner/profile/page.tsx](../app/partner/profile/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/partner/register` | [app/partner/register/page.tsx](../app/partner/register/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/partner/revenue` | [app/partner/revenue/page.tsx](../app/partner/revenue/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/partner/tours/[id]/edit` | [app/partner/tours/[id]/edit/page.tsx](../app/partner/tours/%5Bid%5D/edit/page.tsx) | Mở từ bản ghi hợp lệ trong list/detail hoặc kết quả thao tác; không hard-code ID lên menu. |
| `/partner/tours/[id]/submit` | [app/partner/tours/[id]/submit/page.tsx](../app/partner/tours/%5Bid%5D/submit/page.tsx) | Mở từ bản ghi hợp lệ trong list/detail hoặc kết quả thao tác; không hard-code ID lên menu. |
| `/partner/tours/new` | [app/partner/tours/new/page.tsx](../app/partner/tours/new/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/partner/tours` | [app/partner/tours/page.tsx](../app/partner/tours/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/plan` | [app/plan/page.tsx](../app/plan/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/pois/[id]` | [app/pois/[id]/page.tsx](../app/pois/%5Bid%5D/page.tsx) | Mở từ bản ghi hợp lệ trong list/detail hoặc kết quả thao tác; không hard-code ID lên menu. |
| `/pois` | [app/pois/page.tsx](../app/pois/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/register` | [app/register/page.tsx](../app/register/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/sign-in` | [app/sign-in/page.tsx](../app/sign-in/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/tours/[id]/book` | [app/tours/[id]/book/page.tsx](../app/tours/%5Bid%5D/book/page.tsx) | Mở từ bản ghi hợp lệ trong list/detail hoặc kết quả thao tác; không hard-code ID lên menu. |
| `/tours/[id]` | [app/tours/[id]/page.tsx](../app/tours/%5Bid%5D/page.tsx) | Mở từ bản ghi hợp lệ trong list/detail hoặc kết quả thao tác; không hard-code ID lên menu. |
| `/tours` | [app/tours/page.tsx](../app/tours/page.tsx) | Nối từ entry phù hợp theo plan; xác minh guard và readiness trước khi bật link. |
| `/verify-account` | [app/verify-account/page.tsx](../app/verify-account/page.tsx) | Bước trong đăng ký/xác minh; mở theo flow hiện có. |
| `/verify-email` | [app/verify-email/page.tsx](../app/verify-email/page.tsx) | Callback xác minh email; giữ query và ngữ cảnh actor, không đưa lên menu. |

## Điểm điều hướng cần đối chiếu

- Public: `src/components/navigation/PublicNavigation.tsx`, CTA trong `src/features/public/landing/`.
- Traveler: `src/features/account/common/AccountWorkspaceNav.tsx`, scheduling, bookings, trips và reviews.
- Partner: `PartnerWorkspaceNav.tsx`, `OperatorTourNav.tsx`, `PartnerShell.tsx`, `FinanceNavigationSlot.tsx` và `PartnerContextPage.tsx`.
- Administration: `AdminNavigation.tsx`, Admin dashboard resources và Staff dashboard resources; đối chiếu page guard từng module.
- Route helper: `src/lib/routes.ts` và `src/features/operator/{tours,coupons,bookings,finance}/routes.ts`.

Các trạng thái ở bảng chỉ phản ánh baseline đã ghi. Cập nhật kiểm kê khi bắt đầu triển khai nếu develop thay đổi. Không tự bổ sung screen từ nhánh chưa merge hoặc từ SRS vào danh mục source này.
