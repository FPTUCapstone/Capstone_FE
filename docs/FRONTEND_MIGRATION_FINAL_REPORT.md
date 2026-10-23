# Báo cáo migration Frontend Convention — TripMate

Ngày đối chiếu: 23/10/2026. Trạng thái tổng thể: **MIGRATION_PARTIALLY_COMPLETE**.

## 1. Kết quả thực thi và nguồn yêu cầu

Đã thực thi các thay đổi kỹ thuật đủ điều kiện trong worktree riêng, kiểm thử theo từng task và tạo commit local. Các phần phụ thuộc yêu cầu, hợp đồng Backend hoặc quyết định bảo mật vẫn được giữ lại có chủ đích. Không tuyên bố hoàn tất 100%, tích hợp thật hoặc sẵn sàng phát hành.

| Mốc | Giá trị |
|---|---|
| Baseline khởi đầu migration | `9fe58b2e7cb8a81fb5b79a667b54e18b72c13692` |
| Baseline audit lịch sử trước migration | `a4da751099b2fc092d7d7290f4d4cf0fd28f7828`; không dùng thay baseline thực thi |
| Baseline develop mới nhất đã đối chiếu | `9b9124403b6ac9b29164963bed01b04fd578c88d`; remote vẫn cùng SHA khi kiểm tra cuối |
| Nhánh | `refactor/frontend-convention-migration` |
| HEAD implementation trước commit báo cáo | `ff7fde42c2b94ff897644a788828403b6abef458` |
| Checkout gốc lúc bắt đầu | `feature/datmnt-ignore-ai-agent-skills`, `9dbb531d4957d229768526e0d0ce4e89298898e4`; trạng thái cuối xem §10 |
| Môi trường | Windows, Node `22.15.0`, npm `10.9.2`, Next `16.3.2` |

Nguồn sản phẩm được kiểm tra là **original, non-V2** `Report3_Software-Requirement-Specification.docx` có SHA-256 `22371e92506b098a9a546069038b58b75003371b3b7f85d5cfd6dd913f0d295a`. Catalogue XML có **74 hàng / 74 UC duy nhất, UC-01 đến UC-74**. File original có sẵn ở máy, không thuộc trường hợp SOURCE_NOT_AVAILABLE; chưa chứng minh byte-identical với bản Google Drive. Bản V2 local có hash `c8d927a56b7720da3f8b4df38ffdd6eecc1ebd8d315e6bc104ca41c9b163f076`, chỉ là nguồn lịch sử khi mâu thuẫn với original.

Change history original ghi thay đổi Staff/Admin ngày 11/10; screen flow, mô tả và authorization ngày 15/10; snapshot/ownership/idempotency hủy booking và refund UC-41/42 ngày 15/10; hình auth ngày 16/10/2026. Đây là chứng cứ thay đổi tài liệu, không tự giải quyết các đoạn mâu thuẫn nội bộ. UC-52 catalogue/authorization cho Staff và Admin trong khi chi tiết §3.9.3.1/BR115 còn Admin-only; FE hiện Staff-only. Active trips còn catalogue/auth Staff đối lập detail/BR111 Admin; route master và payout approval/settlement cũng cần BA xác nhận. Migration không sửa role, classification hay công thức.

README, convention và Web scope matrix có thông báo provenance theo ngày; bảng 72 UC và actor/platform cũ được đánh dấu lịch sử chờ đối soát. Chưa viết lại từng UC thành một classification mới. Tài liệu SRS chính thức không bị sửa.

PR liên quan tại lần kiểm tra cuối: #108 trip history, #112 và #113 payout records đã merged vào develop; #110 payout review, #103 tour search, #91 coupons, #73 applications list, #63 active trips còn mở. Đã tích hợp develop mới vào nhánh migration bằng commit local `42ed52a` và xác minh lại. Không merge migration vào develop/main.

## 2. Kết quả theo phase

| Phase / task | Phạm vi thực tế | Trạng thái | Commit | Xác minh |
|---|---|---|---|---|
| 0 | Baseline, provenance, PR template bắt buộc npm test | Hoàn tất phạm vi governance | e5d1ec2 | Đối chiếu original SRS, source, CI và diff tài liệu |
| Stabilization | Vòng đời timer/clipboard AuditLogDetailDrawer | Hoàn tất | 3dbd150 | Red→green; 14 focused tests; full suite hết unhandled teardown |
| 1 / S2 | Origin guard mutation payout Operator | Hoàn tất | 6b8505f | 10 test mới red; 21 green; lint/typecheck |
| 1 / S3 | Origin guard POST revenue export | Hoàn tất | 1b33bde | 4 test mới red; 14 green; lint/typecheck |
| 1 / S1, S4 | Legacy token; Staff payout | BLOCKED | — | Contract registration; actor/PR #110 chưa chốt |
| Routing prerequisite | Tên dynamic segment API review/refund thống nhất | Hoàn tất; fix sau đó cũng có upstream | a45d96b | 4 red→green; build/start; big string ID giữ nguyên |
| 2 / A1, A3 | Đối chiếu public contract và shared composites | COMPLIANT ở các import bị audit nhầm | — | Không tạo barrel hoặc adapter thừa |
| 2 / A5 external reviews | Public entry point cho Tripadvisor UI | Hoàn tất | 35a478f | 43 tests trước/sau; lint/typecheck |
| 2 / A5 legacy reviews | Public compatibility contract sau #108 | Hoàn tất giới hạn import | 05ed1e7 | 42 tests / 5 files trước/sau; lint/typecheck |
| 2 / A2, A4 | Auth transport; coupon page orchestration | BLOCKED | — | Session/config/refresh contract; PR #91 |
| 3 / U1 | Hai icon wrapper tương đương | Hoàn tất | b6d9390 | Red→green; 12 tests; lint/typecheck; ảnh responsive |
| 3 / U2 | Auth hero primitive và wrapper giữ biến thể | Hoàn tất | 03cc3c6 | 9 tests; lint/typecheck/build; 6/6 ảnh ổn định bằng pixel |
| 3 / U3 | Token normalization | DEFERRED | — | Chưa có bằng chứng semantic/computed-style tương đương |
| 4 / D1 | Tách geometry thuần khỏi scheduling form | PARTIALLY_RESOLVED | 0032d0e | Red→green; 46 tests; lint/typecheck |
| 4 / D2 | Statistical report parser | NO_LONGER_APPLICABLE | — | Service hiện không có production response parser để tách |
| 4 / D3, D4 | Payout parser; download URL policy | BLOCKED | — | Schema/tài chính và destination/redirect policy chưa duyệt |
| 4 / D5 | Phân biệt lỗi tải tour với empty success | Hoàn tất | e37a1dd | Red→green; 46 tests; lint/typecheck |
| 5 / T1 | Guard generic UI, runtime cycle, client→server-only | Hoàn tất | ff7fde4 | 21 tests (20 fixture cases + graph thực); Node 88/88; file ESLint pass |
| 5 / T2, T3 | Đánh giá formatter và thư viện tùy chọn | Đã đánh giá; adoption DEFERRED | — | Không có nhu cầu đủ chứng cứ/quyết định team để thêm dependency |
| 6 | Full checks, hai lượt review, báo cáo cuối | Hoàn tất reassessment; migration tổng thể còn partial | Commit báo cáo sau HEAD implementation | Chi tiết §6, §8, §10 |

Không cài Prettier, Zod, React Query, Zustand hay Axios. Convention mô tả hướng adoption có điều kiện; vắng các thư viện đó không tự tạo vi phạm. Không mass-format, không sửa package/lockfile hoặc CSS token để tạo cảm giác migration hoàn tất.

## 3. Kiến trúc trước và sau

Giữ 11 feature roots hiện hữu: `account`, `admin`, `auth`, `bookings`, `operator`, `payments-demo`, `public`, `reviews`, `scheduling`, `traveler`, `trips`. Không di dời toàn bộ domain theo role.

| Trước | Sau thực tế |
|---|---|
| Hai icon SVG wrapper lặp | `components/brand/BrandIcon.tsx`; hai đường import cũ re-export tương thích |
| Hai auth hero lặp, registration sticky riêng | `components/layout/AuthHeroPanel.tsx`; wrapper giữ title/description mặc định và sticky/h-screen |
| Scheduling import private Tripadvisor components | `public/pois/externalReviews.ts` chỉ export hai UI cần dùng |
| Review import sâu trips service/types/resources | `trips/legacyReviewContext.ts` contract browser-safe có ghi deprecated |
| Geometry nằm trong form lớn | `scheduling/utils/schedulingGeometry.ts`; form giữ orchestration và compatibility exports |
| Tour filter HTTP/network lỗi thành [] | Error kiểu `RevenueToursLoadError`; UI có alert an toàn và retry riêng |
| Một số cookie mutation thiếu origin guard | S2/S3 dùng policy `isSameOriginRequest` sẵn có trước cookies/upstream |
| Graph chỉ là snapshot audit | Guard AST chạy trong Node test glob hiện hữu |

Generic `src/components/ui` không import feature. Convention §3 rule 2 **cho phép các composite auth/navigation cấp cao** biết feature/session: C05–C07 từng bị đánh dấu sai khi áp luật generic UI lên toàn bộ `src/components`. Các composite đó được giữ nguyên; không dùng “giảm import” làm tiêu chí thay cho convention.

Số route source: **64 pages / 45 Route Handlers**, không thêm URL. Fix review dynamic segment là đổi tên thư mục nội bộ `[id]` thành `[bookingId]` cùng segment refund, URL không đổi; test giữ ID `9223372036854775807` dạng chuỗi. Sau tích hợp, fix production trùng upstream nên diff với develop chỉ còn regression test tương ứng.

Inventory test source cuối: **269 tệp** (Node + Vitest source; khác đơn vị với số Vitest files thực chạy). Baseline đầu có 256 tệp test, 177 client modules, 25 marked server-only và 1.250 cạnh static theo scanner cũ có cả type imports. Graph AST cuối có **554 roots / 554 modules / 1.244 all edges / 1.126 runtime edges / 184 client markers / 26 server-only markers / 0 issues**. Không lấy chênh lệch số cạnh giữa regex và AST làm thước đo giảm coupling.

Danh sách 41 tệp thay đổi so với baseline develop mới (bao gồm implementation, tests và governance; package/lockfile không đổi):

<details>
<summary>Danh sách tệp</summary>

~~~text
.github/pull_request_template.md
README.md
docs/FRONTEND_ENGINEERING_CONVENTION.md
docs/FRONTEND_MIGRATION_FINAL_REPORT.md
docs/WEB_SCOPE_MATRIX.md
scripts/checkArchitecture.cjs
src/components/BrandLogo.tsx
src/components/HeroPanel.test.tsx
src/components/HeroPanel.tsx
src/components/brand/BrandIcon.test.tsx
src/components/brand/BrandIcon.tsx
src/components/layout/AuthHeroPanel.test.tsx
src/components/layout/AuthHeroPanel.tsx
src/components/registration/BrandLogo.tsx
src/components/registration/HeroPanel.tsx
src/features/admin/audit-logs/components/AuditLogDetailDrawer.test.tsx
src/features/admin/audit-logs/components/AuditLogDetailDrawer.tsx
src/features/operator/finance/api/operatorPayoutProxy.test.ts
src/features/operator/finance/api/operatorPayoutProxy.ts
src/features/operator/finance/api/operatorRevenueExportProxy.test.ts
src/features/operator/finance/api/operatorRevenueExportProxy.ts
src/features/operator/finance/components/revenue/OperatorRevenueView.test.tsx
src/features/operator/finance/components/revenue/OperatorRevenueView.tsx
src/features/operator/finance/resources/en.ts
src/features/operator/finance/services/operatorRevenueService.test.ts
src/features/operator/finance/services/operatorRevenueService.ts
src/features/public/pois/externalReviews.ts
src/features/reviews/components/PhotoUploadPreview.tsx
src/features/reviews/components/PoiQuickFeedback.tsx
src/features/reviews/components/StarRatingInput.tsx
src/features/reviews/components/TripReviewPage.tsx
src/features/reviews/components/TripReviewView.tsx
src/features/reviews/services/reviewApi.ts
src/features/scheduling/__tests__/schedulingGeometry.test.ts
src/features/scheduling/components/CreateSchedulingRequestForm.tsx
src/features/scheduling/components/ItineraryReviewsDialog.tsx
src/features/scheduling/components/ItinerarySuggestionsDialog.tsx
src/features/scheduling/utils/schedulingGeometry.ts
src/features/trips/legacyReviewContext.ts
tests/architecture.test.cjs
tests/route-parameters.test.cjs
~~~

</details>

Form scheduling vẫn lớn; report view/service vẫn lớn. Đã tách đúng phần thuần được kiểm chứng, chưa thực hiện decomposition toàn phần. Service statistical reports hiện chứa demo fixtures/format/export, không có production parser như audit cũ suy luận từ LOC; không dựng parser hoặc integration mới.

Guard chỉ có thể kiểm tra import literal và module được đánh dấu; không chứng minh computed dynamic imports, nội bộ dependency bên ngoài, module đặc quyền chưa đánh dấu, runtime RBAC hoặc toàn bộ convention. Không tạo blanket exception cho legacy.

## 4. Ma trận C01–C33

“Trước” phản ánh audit lịch sử, không phải xác nhận mọi cáo buộc đúng. Cột sau dùng đúng taxonomy remediation được yêu cầu; COMPLIANT được giải thích riêng cho mục vốn không cần sửa.

| ID | Trước | Sau | Chứng cứ và giới hạn |
|---|---|---|---|
| C01 | MISMATCH / P0 | BLOCKED | `lib/authApi.ts` saveTokens vẫn được registration Google/VerifyEmailHandler gọi; UC-01 yêu cầu lưu token, UC-04 hoãn verification-link migration. Cần session/registration contract thay thế được duyệt. |
| C02 | MISMATCH / P0 | RESOLVED | S2/S3 guard payout effective method và POST export trước cookies/network; foreign/null/missing origin từ chối, same-origin/configured public origin theo policy có sẵn được test; không có Referer fallback. Chưa chứng minh exploit trên deployment thật. |
| C03 | MISMATCH / P1 | BLOCKED | Auth API vẫn fallback localhost khi thiếu public env; cần deployment/API-base decision. Không fail-fast module import làm hỏng build CI không env. |
| C04 | MISMATCH / P1 | BLOCKED | `lib/authApi.ts` còn phụ thuộc authSession; convention ghi legacy coupling. A2 cần S1 và ownership refresh/config trước khi tách. |
| C05 | MISMATCH / P1 | NO_LONGER_APPLICABLE | SignIn/Login/Logout composites COMPLIANT với §3.2; không phải generic `components/ui`. Audit cũ áp sai ranh giới. |
| C06 | MISMATCH / P1 | NO_LONGER_APPLICABLE | PublicNavigation là high-level composite được phép. Kích thước là chỉ báo bảo trì, không tự chứng minh dependency violation. |
| C07 | MISMATCH / P1 | NO_LONGER_APPLICABLE | AdminNavigation có auth/logout composition hợp lệ; không đổi role hoặc menu. |
| C08 | MISMATCH / P1 | BLOCKED | Coupon pages còn orchestration; PR #91 đang xử lý cùng code. Không ghi đè thay đổi đồng đội. |
| C09 | MISMATCH / P1 | RESOLVED | Sáu production review consumers dùng `legacyReviewContext.ts` explicit contract. Bare legacy lookup và integration pending vẫn giữ nguyên, không chuyển canonical API. |
| C10 | MISMATCH / P2 | RESOLVED | Hai scheduling dialogs dùng `externalReviews.ts`; attribution, props, loading và fetch implementation không đổi. |
| C11 | MISMATCH / P1 | BLOCKED | Payout service còn DTO assumptions; source global available balance/bodyless request và spec period-based chưa khớp. Không tự đặt enum/date/money bounds. |
| C12 | MISMATCH / P1 | RESOLVED | D5 giữ HTTP status/stable code; network/non-JSON/malformed khác [] hợp lệ; only consumed id/code/title được narrow; không yêu cầu unused metadata. |
| C13 | MISMATCH / P1 | DEFERRED | Payment DTO mới kiểm một số field; full approved schema cần task riêng. Chưa sửa amount/status business rules. |
| C14 | NOT_VERIFIED / P1 | NOT_VERIFIED | Refresh lặp ở nhiều proxy; rotation forwarding/concurrency ownership chưa có bằng chứng hợp đồng/live. Không tự kết luận security bug hay gom helper. |
| C15 | MISMATCH / P1 | BLOCKED | Signed download fetch vẫn dùng backend URL, redirects mặc định, chưa có destination policy/timeout riêng; cần Backend/DevOps duyệt. SSRF thực chưa được chứng minh. |
| C16 | MISMATCH / P2 | RESOLVED | BrandIcon chia sẻ implementation, compatibility default/type exports và inverse/className được test; full contextual brand logo không gộp. |
| C17 | MISMATCH / P2 | RESOLVED | AuthHeroPanel primitive; wrapper giữ khác biệt default text/sticky; 9 tests và 6/6 ảnh ổn định bằng pixel. |
| C18 | MISMATCH / P1 | PARTIALLY_RESOLVED | Geometry tách và kiểm thử; form/report lớn còn tồn tại. Cáo buộc report có production parser không đúng source hiện tại. |
| C19 | NOT_VERIFIED / P3 | NOT_VERIFIED | Feature loading/error có sẵn; chưa xác nhận unexpected render failure/retry từng route. Không scaffold error boundary hàng loạt. |
| C20 | COMPLIANT | NO_LONGER_APPLICABLE | Cơ chế seal HMAC/fingerprint/expiry Admin và memory-only shared session giữ nguyên; không có remediation cần làm ở cơ chế này. C01 là đường legacy riêng còn mở. |
| C21 | COMPLIANT | NO_LONGER_APPLICABLE | `lib/server/backend.ts` giữ HTTPS/config/path checks, timeout 15s, redirect error, no-store; không thay transport. |
| C22 | COMPLIANT | NO_LONGER_APPLICABLE | URL query serializers/allowlists của POI/tour/active trips được giữ. Suite green không thay thế browser back/refresh mọi màn hình. |
| C23 | COMPLIANT | NO_LONGER_APPLICABLE | LazyMaps dynamic ssr:false nằm trong Client Component và có fallback; WebGL/performance thực chưa đo. |
| C24 | COMPLIANT | NO_LONGER_APPLICABLE | Demo gates hiện có giữ non-production + flag + explicit intent; không bỏ gate hoặc biến fixture thành production integration. |
| C25 | MISSING_IMPLEMENTATION / P1 | PARTIALLY_RESOLVED | Upstream #108 nối canonical history source. Legacy review BFF vẫn trả integration pending; bare trip lookup cũ không còn route sau #108 và vẫn là compatibility gap. Không claim review live. |
| C26 | MISSING_IMPLEMENTATION / P2 | BLOCKED | User-account/unavailable shells có chủ đích; thiếu approved task/contracts. Migration không tự tạo tính năng từ screen inventory. |
| C27 | MISMATCH / P1 | PARTIALLY_RESOLVED | Provenance, historical notices, PR template và báo cáo hiện tại đã cập nhật; chưa reconcile tất cả 74 UC/actor/platform, không coi bảng cũ là hiện hành. |
| C28 | NOT_VERIFIED / P2 | DEFERRED | Tokens/hex hiện hữu; chưa chứng minh semantic role và computed style tương đương trên các màn hình. Không đổi palette. |
| C29 | NOT_VERIFIED / P1 | PARTIALLY_RESOLVED | Có test/UI evidence cho phần chạm và public auth responsive/keyboard/sticky; contrast/zoom/full-dialog matrix, role/live journeys chưa đủ. Không chứng nhận WCAG. |
| C30 | COMPLIANT | RESOLVED | Snapshot graph được chuyển thành guard có fixture âm/dương chạy trong npm test; giới hạn AST/static/server-only markers nêu ở §3. Không tuyên bố kiểm toàn bộ kiến trúc. |
| C31 | COMPLIANT | NO_LONGER_APPLICABLE | CI baseline hiện tại success, workflow bắt buộc checks hiện hữu. Chưa xác minh branch protection; unpushed local commits không có CI riêng. |
| C32 | NOT_VERIFIED / P0 triage | BLOCKED | Audit mới vẫn 18 package findings; cần security reachability assessment và approved upgrade. Không npm audit fix tự động. |
| C33 | MISMATCH / P0 | BLOCKED | Staff approve/reject payout còn thiếu origin guard tại các đường đã audit; phụ thuộc PR #110 và authorization reconciliation. Không coi SameSite Strict là policy origin. |

## 5. Đánh giá bảo mật

**Đã sửa:** payout mutation Operator và POST revenue export từ chối origin không hợp lệ trước truy cập session/upstream, dùng đúng policy hiện hữu; GET/read/download và hợp đồng payload/status hợp lệ được giữ. Test kiểm cả không có upstream side effect. Không thay role, công thức, idempotency hoặc tự retry financial writes.

**Còn mở:** C01 persistent legacy tokens; C03 localhost fallback; C11/C13 validation theo hợp đồng; C15 signed download destination/redirect; C33 Staff payout guard. C14 rotation/concurrency và bảo mật deployment thật là NOT_VERIFIED. Các finding này không được coi là đã xử lý chỉ vì tests pass.

`npm audit --json` chạy lại ngày 23/10, **exit 1** do advisory: **18 package findings = 3 critical + 14 high + 1 moderate**. Đây không phải 18 exploit đã chứng minh; một advisory có thể lan qua nhiều package phụ thuộc.

| Nhóm | Loại dependency | Kết quả triage và quyết định |
|---|---|---|
| next 16.3.2 — critical | Direct production runtime | Registry liệt kê Windows server, image/OG/cache/dev endpoint advisories. Windows local server có dùng trong kiểm tra, nhưng điều kiện exploit/deployment production chưa xác minh. Ưu tiên security owner đối chiếu từng advisory và bản vá tương thích. `fixAvailable:true` không đủ chọn version. |
| vitest 3.2.4 — critical; tinypool — critical; @vitest/mocker — moderate | Direct dev và transitive dev | UI/mock server/worker-option conditions cần đánh giá; luồng hiện chạy `vitest run`, không chứng minh có public test UI server. Registry gợi ý vitest 3.2.7 non-major; vẫn cần task upgrade và regression checks riêng. |
| firebase 12.18.0 — high; firestore/firestore-compat/grpc — high | Direct production + transitive | Source dùng Firebase app/auth; chưa thấy điều đó chứng minh các affected Firestore/gRPC paths reachable. Đề xuất registry firebase 9.14.0 là đổi major xuống, không áp mù. |
| eslint-config-next 16.3.2 và plugin/fast-glob/micromatch/braces — high | Direct/transitive dev tooling | Pattern/glob parsing, reachability input không tin cậy chưa xác minh. Gợi ý 14.2.35 là major downgrade lệch Next, cần quyết định compatibility. |
| sharp — high | Transitive Next production image path | Điều kiện codec/image input và lib native cần kiểm tra; không chứng minh mọi advisory reachable. |
| source-map-js — high; brace-expansion — high; js-yaml — high | Transitive build/lint; source-map-js cũng nằm chuỗi Next/PostCSS | Có đường tooling trong cây cài đặt, production runtime exposure cụ thể chưa chứng minh. Registry có bản sửa nhưng chưa chọn/update lockfile. |
| vite — high | Transitive dev test tooling | Dev server/editor/middleware conditions khác test run; không xem đây là bằng chứng production exploit. |

Dữ liệu gốc lưu ngoài Git: `final-audit.json`, `final-dependency-tree.json`. Package/lockfile không đổi; không tự thêm override hoặc downgrade.

## 6. Kiểm chứng tự động và hồi quy

### 6.1 Baseline và lần chạy cuối

Dependencies đã cài xong bằng `npm ci` (558 packages, exit 0) trước các lần kiểm tra baseline có giá trị. Lần test bị ngắt trước khi install kết thúc chỉ là diagnostic, không dùng làm kết quả pass/fail của ứng dụng.

| Mốc | Test | Lint | Typecheck | Build |
|---|---|---|---|---|
| Baseline resume | Node 63 pass; Vitest 246 files / 2.570 pass nhưng **exit 1** vì unhandled timer | exit 0 | exit 0 | exit 0 |
| Sau stabilization drawer | Node 63; Vitest 246 files / 2.572 pass, **exit 0** | Focused pass | pass | Baseline build pass |
| Sau tích hợp develop mới | Node 67; Vitest 254 files / 2.837 pass, **exit 0** | exit 0 | exit 0 | exit 0 |
| HEAD implementation cuối | Node **88/88**; Vitest **257 files / 2.863 tests**, **exit 0**, fail/skip 0 | **exit 0**, 0 errors/warnings | **exit 0** | **exit 0**, default Turbopack; compile + 60/60 static generation |

Baseline lỗi thật là clipboard feedback timeout còn chạy sau jsdom teardown (`window is not defined`). Regression tests red trước fix cho Copy lặp và completion muộn qua close/reopen; fix cleanup timer/generation thay vì sửa harness hay bỏ test. Sau fix full npm test exit 0.

Diagnostics cuối vẫn có jsdom “Not implemented: navigation (except hash changes)” ở download test và React cảnh báo html nằm dưới div khi test render RootLayout vào container. Các suites liên quan pass; không suppress stderr, không có unhandled failure như baseline drawer. Không disable test hoặc đổi exclusions có sẵn của npm test; cooldown test .tsx vẫn xuất hiện và pass trong log. Đây không phải bằng chứng hydration production lỗi.

Build dùng **`npm run build` mặc định**: không đổi bundler, bỏ font, thêm fake credentials, đổi tsconfig exclusions hay suppress warning. Lỗi Google Fonts/Turbopack Windows ở snapshot lịch sử không tái hiện trong môi trường managed hiện tại. Khi đổi dynamic segment, type generated `.next` cũ còn trỏ route đã chuyển; build chuẩn sinh lại types rồi typecheck qua. Lần integrated checks có build trước typecheck để xử lý types stale; lần cuối chạy đúng thứ tự test→lint→typecheck→build.

Docker Desktop/WSL từng được kiểm tra: engine chưa sẵn sàng, chỉ có docker-desktop distro; không xóa volume/container và không chạy backend/database stack. Không cần dùng Docker để thay thế vì default Windows Node 22 build đã qua.

CI Linux baseline đầu success tại [run 39828056005](https://github.com/FPTUCapstone/Capstone_FE/actions/runs/39828056005). Baseline mới `9b91244` có [TripMate FE CI run 39915427801](https://github.com/FPTUCapstone/Capstone_FE/actions/runs/39915427801) completed/success. Workflow Ubuntu/Node 22 chạy npm ci, test, typecheck, lint, build. **Không có GitHub CI cho các commit local chưa push**; branch protection/ruleset chưa được xác minh.

### 6.2 UI, accessibility và API

Dùng Playwright Node đã có và Chrome local, không cài dependency/browser mới. Python runtime thiếu playwright nên chuyển sang runtime Node hiện hữu; đây là thay đổi cách đo, không thay product code.

| Phạm vi | Chứng cứ | Giới hạn |
|---|---|---|
| Guest /sign-in và /register | 360/768/1440 × 900, reduced motion, không overflow ngang, headings giữ nguyên | Không có auth credentials/live sign-in |
| Brand icon U1 | 5/6 ảnh pixel-identical; desktop sign-in có diff trong vùng card animation | Không claim 6/6 cho bộ ảnh U1 |
| Hero U2 | Screenshot animations disabled tại phép chụp; 6/6 trước/sau pixel-identical; kích thước giữ nguyên | Không sửa CSS/animation sản phẩm; không kiểm mọi nội dung dài |
| Registration desktop | Sticky computed position, height 900; top sau scroll khoảng -0,5 CSS px, tolerance ≤1 px; tab qua 8 controls | Assertion đầu top===0 thất bại do subpixel, phép đo sửa tolerance; không sửa app để qua |
| Dialog / feedback | Drawer timer/copy và existing dialog tests; brand aria/currentColor/inverse; D5 role=alert và retry button | Chưa browser-audit mọi focus trap, zoom/contrast/full WCAG |
| Scheduling / external reviews | 46 form+geometry, 43 dialog tests; attribution/import contract giữ nguyên | Maps/WebGL/backend itinerary thật chưa xác minh |
| Review compatibility | 42 tests trước/sau, giữ service spies và real TripApiError fixtures | Canonical review integration không được triển khai trong task |
| Operator finance | Origin-denial/no-dispatch tests; success payload/status; D5 retry độc lập, actor race, unmount, malformed/empty | Mock transport, không gọi payout/export thật |
| Routing | Production build/start, public sign-in 200; booking API dynamic param invariant và chuỗi ID lớn | Không có credential để gọi privileged API thật |

Guest, Traveler, Operator, Staff, Administrator đều có suites hiện hữu trong full run, nhưng **test giả lập không thay UAT**. Auth/logout/refresh/expiry, role isolation/direct URL, profile/preferences persistence, discovery query/back/refresh, booking/payment return/gateway, coupon/tour/finance/payout và admin privileged actions với Backend thật đều **NOT_VERIFIED** ở cấp tích hợp. Không chạy thanh toán, hủy, refund, payout hoặc financial write thật.

Raw logs, graph/inventory snapshot và ảnh nằm ngoài Git tại thư mục artifact local của phiên: `C:/Users/asus/.codex/visualizations/2026/10/22/01a164c0-9da7-70d3-beaf-e742b9dd1184`. File chính: `resume-*.log`, `stabilized-test.log`, `integrated-*.log`, `hero-build.log`, `final-*.log`, `ui-u2-before/after-*.png`, `ui-keyboard-sticky.json`. Không commit logs, screenshots, generated build hoặc secret.

## 7. Các blocker và quyết định cần có

| Owner cần quyết định | Phạm vi chặn | Cần cung cấp trước task tiếp |
|---|---|---|
| BA + auth Backend + FE owner | S1/A2, C01/C04/C14 | Registration/verification session contract thay đường persist token; refresh rotation/concurrency/cookie ownership; account-switch/logout behavior |
| DevOps + auth owner | C03 | API base production/dev hợp lệ, policy khi thiếu config, cách kiểm build/deployment không env |
| BA / product governance | UC-52, active trips, route master, payout Staff/Admin | Approved reconciliation original catalogue/auth/detail/BR; cập nhật traceable scope matrix, không suy từ code |
| Finance Backend + BA | D3/C11, C13 | Approved DTO schema, global balance/period, money/date/enum bounds; không tự chọn công thức |
| Backend + security + DevOps | D4/C15 | Storage destinations, protocol/redirect/timeout/content policy cho signed downloads |
| Owner PR #110 | S4/C33 | Phối hợp origin guard với payout-review changes và role reconciliation |
| Owner PR #91 | A4/C08 | Hoàn tất/ổn định coupon integration trước extraction page cùng file |
| Security + maintainers | C32 | Reachability từng advisory, bản vá/upgrade compatibility và regression scope |
| QA + Backend/product | C19/C25/C26/C29 | Safe test environment, credentials/approved tasks, live role/payment/map/UAT và failure-scope matrix |
| UI owner + maintainers | U3/T2/T3 | Chứng cứ token equivalence; quyết định formatter/library có nhu cầu, config và rollout riêng |

Không có blocker môi trường toàn cục tại điểm kết thúc; các phần còn lại bị giới hạn hợp đồng hoặc phạm vi kiểm chứng, không phải full suite đang hỏng. Form decomposition lớn và payment parser vẫn là công việc tiếp theo cần scope đủ rõ; không coi extraction geometry là thay thế toàn bộ.

## 8. Commit ledger và review

Ledger first-parent của nhánh từ baseline đầu; các commit develop được nhập bởi merge không được nhận là công của migration.

| SHA | Thay đổi | Chứng cứ trước commit |
|---|---|---|
| e5d1ec2 | docs(frontend): reconcile migration baseline and governance | Original SRS/source/CI/diff review; ghi rõ baseline timer blocker |
| 3dbd150 | fix(admin): clean up audit drawer feedback timers | 14 focused + full suite exit 0; lint/typecheck |
| 6b8505f | fix(security): guard operator payout mutations by origin | 21 tests, file lint, typecheck |
| 1b33bde | fix(security): guard operator revenue export creation | 14 tests, file lint, typecheck |
| a45d96b | fix(routing): unify booking API dynamic parameter names | 4 Node tests, lint/typecheck/build/start |
| 35a478f | refactor(frontend): expose external review UI contract | 43 tests trước/sau, lint/typecheck |
| b6d9390 | refactor(ui): consolidate brand icon primitives | 12 tests, lint/typecheck, responsive screenshots |
| 42ed52a | chore(frontend): integrate current develop baseline | Merge không conflict; full 254/2.837 suite + lint/typecheck/build |
| 03cc3c6 | refactor(ui): unify authentication hero layout variants | 9 tests, lint/typecheck/build, pixel/keyboard/sticky |
| 0032d0e | refactor(scheduling): isolate request geometry calculations | 46 tests, lint/typecheck |
| 05ed1e7 | refactor(reviews): define legacy trip review public contract | 42 tests, lint/typecheck; test fixtures/spies giữ nguyên |
| e37a1dd | fix(finance): distinguish tour filter failures from empty results | 46 tests, lint/typecheck; metadata compatibility red→green |
| ff7fde4 | test(architecture): enforce frontend dependency boundaries | 21 tests (20 fixture cases + graph thực); Node 88/88; file ESLint pass |
| Commit chứa báo cáo này | docs(frontend): finalize convention migration assessment | Full gate §6; hai lượt review bổ sung bên dưới |

Mọi commit AI local có trailer `Co-Authored-By: Codex <noreply@openai.com>`. SHA của commit chứa chính báo cáo không thể nhúng tự tham chiếu vào nội dung của nó; tra `git log -1 --format=fuller` sau commit hoặc kết quả bàn giao của phiên. HEAD implementation ở §1 là SHA thực trước commit tài liệu, không giả làm SHA tài liệu cuối.

Hai lượt review riêng biệt bằng reviewer agents: (1) scope/spec/convention, (2) quality/security/regression. Đến `e37a1dd` không có Critical/Minor actionable; reviewer chất lượng chạy độc lập 8 suites / 110 tests exit 0. Lượt bổ sung T1 và báo cáo cũng không có Critical hoặc lỗi code actionable; cả hai reviewer phát hiện cùng một Minor mô tả nhầm Referer fallback, đã sửa theo helper Origin thực tế. Reviewer chất lượng chạy độc lập thêm 21/21 architecture tests. Đây là review agent và kiểm tra local, không phải approval của maintainer/human hay GitHub reviewer.

## 9. Khuyến nghị cuối

**MIGRATION_PARTIALLY_COMPLETE**: các task đủ bằng chứng đã được thực thi và commit; các mục P0 còn mở, contract/actor conflicts, partial decomposition và live verification gaps khiến chưa thể gọi technical complete hoặc fully verified.

Đề nghị developer review diff local theo từng commit cùng blocker table. Quyết định registration/session, Staff payout, storage policy và security upgrades cần ưu tiên trước release; không lấy full test xanh làm bằng chứng các blocker đã được miễn. Không tạo thêm lớp kiến trúc, đổi role hoặc triển khai chức năng mới để lấp khoảng trống tài liệu.

## 10. Trạng thái Git và bàn giao

Nhánh local: `refactor/frontend-convention-migration`. Worktree: `C:/Users/asus/.codex/worktrees/frontend-convention-migration/tripmate---intelligent-travel-atlas`. HEAD implementation: `ff7fde42c2b94ff897644a788828403b6abef458`; commit tài liệu cuối được tra như §8.

Trước commit báo cáo, working tree chỉ có chính tệp báo cáo thay đổi; bàn giao sau commit với working tree sạch, được kiểm tra lại bằng git status. Không push, không tạo PR, không merge migration vào develop/main. Có **một merge local từ origin/develop vào migration** (`42ed52a`) để tích hợp baseline tiến lên theo §15 master task; đây không phải merge giao hàng vào nhánh đích. Không rebase/reset/force-push hoặc sửa lịch sử đồng đội.

Kiểm tra read-only bàn giao tại checkout gốc thấy nhánh hiện là `develop`, HEAD `9b9124403b6ac9b29164963bed01b04fd578c88d`, có untracked `.agents/`, `audit-output/`, `skills-lock.json`, khác snapshot lúc bắt đầu. Migration không thực hiện checkout/reset/stash/add/commit các tệp đó; giữ nguyên trạng thái hiện có, không nhận là checkout gốc vẫn sạch hoặc vẫn ở nhánh ban đầu. Các worktree khác được giữ lại. Sau bàn giao, giữ nhánh/worktree để developer review; chỉ push, mở PR, merge hoặc discard khi có chỉ dẫn riêng. Pre-PR gate vẫn yêu cầu `npm install` → `npm test` → `npm run lint` → `npm run typecheck` → `npm run build` và CI/reviewer theo AGENTS; `npm ci`/local validation phiên này không tự cấp quyền tạo PR.
