# Kiểm toán ownership Auth frontend

Ngày kiểm toán: 2026-10-24

Baseline: `origin/develop@69ef16fab10cbd25a9186b1592d74f0ca93ffb39` (merge commit của PR #114)

Nhánh triển khai: `refactor/auth-feature-ownership`

## Phạm vi và tiêu chí

Kiểm toán này áp dụng `AGENTS.md`, `docs/FRONTEND_ENGINEERING_CONVENTION.md`, `docs/CODEBASE_RULES.md`, `DESIGN.md` và `docs/WEB_SCOPE_MATRIX.md`. Không có route, endpoint, cookie contract, refresh contract, role policy hoặc capability mới. File SRS gốc `Report3_Software-Requirement-Specification.docx` không có trong checkout và không tìm thấy trên ổ đĩa tại thời điểm thực hiện; vì thay đổi này chỉ sắp xếp ownership của behavior hiện hữu, phạm vi sản phẩm được đối chiếu với tài liệu canonical trong repo và báo cáo migration của PR #114. Không tuyên bố đã tái xác minh nội dung SRS gốc trong lần kiểm toán này.

Tiêu chí chấp nhận:

- Route App Router chỉ giữ metadata, parsing tham số route cần thiết và composition.
- UI có business ownership nằm trong feature tương ứng; shared composite được giữ khi có nhiều feature consumer thật.
- Public và Admin tiếp tục dùng session/transport riêng đã được phê duyệt.
- Không đổi URL, query parameter, endpoint, trạng thái, redirect hoặc hình thức hiển thị.
- Dead code chỉ bị xóa khi không còn production consumer.

## Quyết định ownership trước và sau

| Khu vực / file đã kiểm tra | Consumer thực tế | Quyết định sau kiểm toán | Phân loại |
| --- | --- | --- | --- |
| `app/sign-in/page.tsx` | `/sign-in` | Route chỉ còn metadata và `PublicSignInPage`; composition hiện hành chuyển vào `features/public/auth`. | REFACTORED_VERIFIED |
| `src/components/LoginForm.tsx`, `FormField.tsx` | Trước đây chỉ `/sign-in` | Đổi tên và chuyển thành `PublicSignInForm`/`SignInField`; giữ nguyên layout public và dùng chung `useSignInEngine`. | REFACTORED_VERIFIED |
| `src/components/auth/SignInForm.tsx` | Không còn production consumer; chỉ còn page cũ và test của chính nó | Xóa sau khi chuyển 40 test behavior hữu ích sang form public đang chạy. Không tạo mega-component cho layout Admin. | REFACTORED_VERIFIED |
| `src/features/public/auth/PublicSignInPage.tsx` | `/sign-in` | Từ dead composition thành owner của composition production hiện hành. | REFACTORED_VERIFIED |
| `src/features/auth/sign-in/useSignInEngine.ts` | `PublicSignInForm` | Giữ một engine public; bỏ option Admin không còn consumer. Contract vẫn gọi `loginWithWebRecovery(..., false)`. | REFACTORED_VERIFIED |
| `app/register/page.tsx` | `/register` | Route chỉ còn metadata và `TravelerRegistrationPage`; markup production chuyển nguyên vẹn vào feature traveler. | REFACTORED_VERIFIED |
| `src/features/traveler/registration/TravelerRegistrationPage.tsx`, `TravelerRegistrationForm.tsx` | `/register` | Page sở hữu composition traveler; form/validation/registration tiếp tục ở role feature. | REFACTORED_VERIFIED |
| `app/verify-account/page.tsx`, `app/verify-email/page.tsx` | `/verify-account`, `/verify-email` | Dùng composition và resolver của `features/auth/verification`; giữ mode, `oobCode`, `continueUrl` và handler operator-mobile. | REFACTORED_VERIFIED |
| `VerifyAccountForm`, `VerifyAccountPage`, `VerifyEmailHandler` | Cả Traveler và TourOperator verification | Chuyển từ `features/traveler/registration` sang `features/auth/verification` vì đây là capability dùng chung. | REFACTORED_VERIFIED |
| `VerificationPageShell`, `verificationFlow` | `/verify-email` | Tách presentation và flow resolution khỏi route; resolver ưu tiên `flow` hợp lệ trực tiếp rồi mới đọc `continueUrl`, giống behavior cũ. | REFACTORED_VERIFIED |
| `features/operator/application/OperatorMobileVerifyEmailHandler.tsx` | `flow=operator-mobile` | Giữ trong feature operator; route inject handler, shared auth không phụ thuộc ngược vào operator. | COMPLIANT_UNCHANGED |
| `app/forgot-password/page.tsx`, `features/public/auth/PublicPasswordRecoveryPage.tsx` | `/forgot-password` | Route đã mỏng; page public giữ layout riêng. | COMPLIANT_UNCHANGED |
| `components/auth/PasswordRecoveryFlow.tsx` | Public recovery và Admin recovery | Giữ shared composite ngoài `features/auth`: có hai consumer thuộc hai product area, chứa UI orchestration dùng chung và phụ thuộc xuống auth recovery service + UI primitives. Convention cho phép shared auth composite này. | COMPLIANT_UNCHANGED |
| `features/auth/recovery/webRecovery.ts` | Public/Admin recovery và public sign-in recovery | Giữ capability service dùng chung; Backend tiếp tục là password authority duy nhất. | COMPLIANT_UNCHANGED |
| `app/admin/login/page.tsx`, `features/admin/auth/*` | `/admin/login`, Admin shell/API session | Giữ nguyên feature Admin, BFF `/api/admin/session` và sealed HttpOnly session. Không hợp nhất với public sign-in engine. | COMPLIANT_UNCHANGED |
| `features/auth/session/*` | Public session restoration, route/session consumers | Giữ nguyên restore-once, in-memory context, cookie refresh/logout contract. | COMPLIANT_UNCHANGED |
| `features/auth/google/GoogleConsentModal.tsx` | Public Google sign-in | Shared auth consent UI có một capability rõ ràng, không chứa role route implementation. | COMPLIANT_UNCHANGED |
| `features/auth/routing/signInDestination.ts` | Public sign-in redirect | Giữ shared post-auth destination policy vì nó quyết định destination cho nhiều role từ authoritative context. | COMPLIANT_UNCHANGED |
| `PartnerRouteGuard`, `partnerRouteDecision` | Các route `/partner/*` | Chuyển từ `features/auth/routing` sang `features/operator/access`; vẫn phụ thuộc vào shared auth session theo chiều hợp lệ. | REFACTORED_VERIFIED |
| `PartnerContextPage.tsx` và test | Không có production import | Xóa dead prototype sau khi kiểm tra toàn repo; không phải route runtime. | REFACTORED_VERIFIED |
| `features/operator/application/*` | `/partner/register`, application flow | Giữ registration và application UI theo role; chỉ đổi import API base trung lập. | COMPLIANT_UNCHANGED |
| `src/lib/authApi.ts` | Auth transport và nhiều legacy import | Giữ file và public contract để tránh churn; `getApiBase` được tách sang `src/lib/apiBase.ts` và re-export tương thích. | LEGACY_COMPATIBILITY_RETAINED |
| `account`, `operator`, `public/pois`, `scheduling` API clients | Non-auth feature transports | Chuyển import URL resolver từ `authApi` sang `apiBase`, loại bỏ dependency giả vào auth transport. | REFACTORED_VERIFIED |
| `components/LogoutButton.tsx`, `navigation/PublicNavigation.tsx` | Shell/operator control và public navigation menu | Giữ hai UI surface riêng. Chúng dùng cùng `webLogout` + `AuthStorage`; error/display semantics khác nhau nên chưa có shared hook đủ ổn định để tách mà không đổi behavior. | LEGACY_COMPATIBILITY_RETAINED |
| `features/traveler/registration/TravelerRegistrationForm.tsx` Google registration | `/register` Google path | Vẫn gọi legacy `googleAuth` rồi `saveTokens`; chưa có Backend web-cookie contract được phê duyệt cho registration. Không coi việc tách `apiBase` là xử lý security này. | BLOCKED_CONTRACT |

`components/layout/AuthShell.tsx` cũng được giữ ngoài `features/auth`: đây là reusable presentation shell được cả Admin và auth pages dùng, không sở hữu transport/session policy và không kéo dependency từ feature hoặc `app`.

## Duplicate và dependency

`LoginForm` và `SignInForm` trước đây dùng cùng engine nhưng không phải hai layout production song song: `LoginForm` là consumer thật của `/sign-in`, còn `SignInForm` chỉ còn trong composition không được route dùng. Behavior test của component cũ đã được chuyển sang form production trước khi xóa. Admin tiếp tục dùng `AdminSignInForm` riêng vì transport, session boundary, copy và return URL policy đều khác.

Dependency sau thay đổi tuân theo:

```text
app route
  -> feature page/composition
    -> feature UI/hook
      -> feature/shared service
        -> neutral transport helper
```

Guard tĩnh sau review báo 561 module, 1.246 edge tổng, 1.128 runtime edge và 0 issue. Không có feature import từ `app`, không có cycle runtime mới, generic UI không kéo feature/service và client module không chạm server-only module.

## Regression và bằng chứng UI

Baseline sạch trước sửa: `npm ci`, `npm test` (260 file Vitest, 2.908 test), `npm run lint`, `npm run typecheck`, `npm run build` đều đạt.

TDD theo scope:

- Route composition và sign-in: 11 file, 71 test đạt; 40 test behavior được chuyển từ dead form sang `PublicSignInForm`.
- Partner access: 2 file, 62 test đạt.
- API base/auth transport: 3 file, 35 test đạt.
- Các test hiện hữu tiếp tục bao phủ Admin sign-in, Google sign-in, password recovery, traveler/operator registration, verification, session restoration, logout, role redirect, direct refresh, validation, loading và error states trong full suite.

Playwright + axe được chạy trên baseline và nhánh hiện tại cho `/sign-in`, `/register`, `/verify-account`, `/verify-email?mode=verifyEmail&oobCode=invalid-test-code` tại 360×800, 768×1024 và 1440×1000:

- 12/12 trường hợp trả HTTP 200.
- 12/12 không có horizontal overflow; title, `main`, control count và label count không đổi.
- 9/12 ảnh PNG có hash SHA-256 giống hệt. Ba ảnh desktop chỉ khác Next.js dev indicator; phần nội dung auth trùng nhau khi kiểm tra trực quan.
- Axe trước và sau cho cùng kết quả: contrast hiện hữu trên các token/copy và `h1` nằm trong hero bị ẩn ở mobile/tablet. Đây là nợ baseline, không phải regression của migration; không sửa trong PR ownership để tránh đổi giao diện ngoài scope.
- Request lỗi duy nhất trong cả hai lần đo là `ERR_CONNECTION_REFUSED` từ dependency ngoài ứng dụng trong môi trường local; không có thay đổi endpoint auth trong diff.

## Giới hạn và phần việc tách riêng

- Google registration token persistence cần một Backend contract web-cookie rõ ràng trước khi migration; trạng thái hiện tại là `BLOCKED_CONTRACT`.
- Contrast và heading mobile/tablet nên được xử lý trong một task accessibility có visual approval riêng.
- SRS gốc không có trong môi trường hiện tại, vì vậy việc đọc trực tiếp tài liệu này là `NOT_VERIFIED`; không có quyết định scope sản phẩm mới dựa trên khoảng trống đó.
