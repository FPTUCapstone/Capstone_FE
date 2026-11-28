# UC-47 Lock Account Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dialog "Lock Account" của trang chi tiết user khớp SRS §3.9.1.2 (tóm tắt tài khoản, lý do định sẵn + ghi chú, ghi chú tác động, lỗi MSG123/126/127/133).

**Architecture:** Giữ `AccountModerationForm` là component có state duy nhất (toast, busy, in-flight guard, confirmation đã có) để toast thành công sống sót khi `locked` đổi sau `router.refresh()`. Thêm `LockAccountDialog` (trình bày thuần) cho nhánh lock, logic ghép/kiểm tra lý do ở file thuần `lockReason.ts`, ánh xạ lỗi lock nằm ở proxy route. Luồng unlock không đổi. Không sửa BE.

**Tech Stack:** Next.js (App Router), React client components, Vitest + Testing Library, `ModerationDialog` sẵn có.

**Spec:** `specs/UC-47-lock-user-account-dialog-spec.md` (v1.2, đã duyệt)

## Global Constraints

- Chỉ sửa `Capstone_FE`; không sửa BE/Mobile; luồng unlock và chuỗi lỗi unlock giữ nguyên.
- Hợp đồng API giữ nguyên: `POST /api/admin/users/{id}/lock` body `{ reason: string }`, `reason` đã trim, ≤ 200 ký tự (proxy và BE đều chặn >200).
- `reason` gửi đi: danh mục thường → `"<Danh mục>: <ghi chú đã trim>"` (hoặc chỉ `"<Danh mục>"` nếu ghi chú trống); danh mục `Other` → chỉ `"<ghi chú đã trim>"`, ghi chú bắt buộc.
- 4 danh mục (chốt tạm, chờ PO): `Violation of tour safety & travel regulations`, `Payment fraud or irregular chargebacks`, `Unresolved severe traveler complaints`, `Other`. Nằm trong `resources/en.ts`, không hard-code trong component.
- Chuỗi SRS nguyên văn: MSG123 `Please enter a reason.`; MSG126 `You do not have permission to access this function.`; MSG127 `TripMate is temporarily unable to process your request. Please check your connection and try again.`; MSG133 `This action is not available for the current status of the record.`; MSG189/MSG130 giữ như hiện có.
- Component client không import `server/accounts.ts` (`server-only`); `statusLabel` do server component truyền xuống.
- Không thêm dependency. Dùng lại `ModerationDialog` (focus trap, Escape, CR-05).
- Không commit/push/mở PR cho đến khi dev yêu cầu. Mã ticket Jira: chưa có (bổ sung khi commit/PR).
- Gate bắt buộc trước khi báo xong: `npm test && npm run lint && npm run typecheck && npm run build`; báo cáo trung thực mọi bước skip/giới hạn môi trường.

## Review Focus

1. Ghi chú toàn khoảng trắng với `Other` → không gửi request, hiện MSG123 (Task 1, Task 4).
2. Đổi danh mục làm chuỗi ghép >200 → ghi chú không bị cắt, `Confirm lock` bị disable, không gửi request (Task 4).
3. Lock thành công làm `locked` đổi sang `true` → toast MSG189 vẫn còn sau rerender (Task 4).
4. Lỗi server/mạng khi lock → hiện trong dialog, dialog và bản nháp được giữ; mở lại sau Cancel thì lỗi cũ biến mất (Task 4).
5. `email = null` → `—`; status hiển thị bằng `statusLabel` (không lộ `PendingContractSignature` thô) (Task 3).
6. Proxy: lỗi của unlock không đổi sau khi thêm ánh xạ cho lock (Task 2).

---

### Task 0: Workspace và baseline

**Files:**
- Tạo worktree `D:/Capstone_Project_Production/_wt/Capstone_FE_uc47`, branch `feature/uc47-lock-user-account-dialog` từ `develop` (local `develop` @ f007421).
- Chuyển hai file untracked `specs/UC-47-lock-user-account-dialog-spec.md` và `plans/UC-47-lock-user-account-dialog-plan.md` từ checkout chính sang worktree (cùng đường dẫn tương đối).

- [ ] **Step 1:** `git -C Capstone_FE worktree add ../_wt/Capstone_FE_uc47 -b feature/uc47-lock-user-account-dialog develop`; chuyển 2 file spec/plan sang worktree rồi xoá bản trong checkout chính.
- [ ] **Step 2:** Trong worktree, tạo junction `node_modules` trỏ tới `Capstone_FE/node_modules` (`cmd /c mklink /J node_modules <đường dẫn checkout chính>\node_modules`) thay vì `npm ci`. Dự phòng: nếu `next build` hoặc resolve module lỗi do junction trên Windows thì xoá junction và chạy `npm ci` trong worktree.
- [ ] **Step 3:** Baseline: chạy `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. Expected: xanh. Nếu đỏ, ghi lại lỗi có sẵn và hỏi dev trước khi làm tiếp (không bắt đầu trên baseline hỏng).

---

### Task 1: Copy và logic lý do (`en.ts`, `lockReason.ts`)

**Files:**
- Modify: `src/features/admin/user-accounts/resources/en.ts` (nhánh `moderation`)
- Create: `src/features/admin/user-accounts/lockReason.ts`
- Test: `src/features/admin/user-accounts/lockReason.test.ts`

**Interfaces:**
- Produces (`lockReason.ts`):
  - `export const MAX_LOCK_REASON_LENGTH = 200`
  - `export type LockReasonIssue = 'missing' | 'tooLong'`
  - `export function composeLockReason(category: string, note: string): string`
  - `export function lockReasonIssue(category: string, note: string): LockReasonIssue | null`
  - `export function lockNoteMaxLength(category: string): number` (200 − độ dài tiền tố `"<Danh mục>: "`; 200 khi `Other` hoặc chưa chọn)
- Produces (`en.ts`, dưới `adminUserAccountsEn.moderation`): `messages.MSG123|MSG126|MSG127|MSG133`; `lock.reasonCategoryLabel` (`Lock reason`), `lock.reasonCategoryPlaceholder` (`Select a reason`), `lock.reasonCategories` (4 danh mục, phần tử cuối là `Other`), `lock.otherCategory` (`Other`), `lock.noteLabel` (`Additional details`), `lock.notePlaceholder`, `lock.impactNote` (`Locking this account prevents any further sign-in and terminates all of its active sessions.`), `lock.reasonTooLong` (`Reason must be at most 200 characters.`), `lock.summary` (nhãn `fullName: 'Full name'`, `email: 'Email'`, `role: 'Role'`, `status: 'Status'`, `noEmail: '—'`). Bỏ `lock.reasonLabel` nếu không còn nơi nào dùng (kiểm bằng grep/typecheck).

- [ ] **Step 1: Viết test thất bại** trong `lockReason.test.ts` (đặt `const cat1 = adminUserAccountsEn.moderation.lock.reasonCategories[0]`, `const other = …otherCategory`):
  - `composeLockReason('Payment fraud or irregular chargebacks', '  chargeback x3  ')` → `'Payment fraud or irregular chargebacks: chargeback x3'`
  - `composeLockReason(cat1, '   ')` → `cat1`; `composeLockReason(other, ' spam ')` → `'spam'`
  - `lockReasonIssue('', 'x')` → `'missing'`; `lockReasonIssue(other, '   ')` → `'missing'`; `lockReasonIssue(cat1, '')` → `null`
  - `lockReasonIssue(cat1, 'x'.repeat(200))` → `'tooLong'`; `lockReasonIssue(other, 'x'.repeat(200))` → `null`; `lockReasonIssue(other, 'x'.repeat(201))` → `'tooLong'`
  - `lockNoteMaxLength(other)` → 200; `lockNoteMaxLength('')` → 200; `lockNoteMaxLength(cat1)` → `200 - cat1.length - 2`
- [ ] **Step 2:** `npx vitest run src/features/admin/user-accounts/lockReason.test.ts` → FAIL (module chưa có).
- [ ] **Step 3:** Thêm copy vào `en.ts` và cài `lockReason.ts` theo chữ ký trên (mọi so sánh `Other` qua `lock.otherCategory`).
- [ ] **Step 4:** Chạy lại file test → PASS; `npm run typecheck` xanh.

---

### Task 2: Proxy route ánh xạ lỗi lock

**Files:**
- Modify: `app/api/admin/users/[userId]/[action]/route.ts`
- Create: `app/api/admin/users/[userId]/[action]/route.test.ts` (mẫu mock tham khảo `app/api/admin/pois/route.test.ts`)

**Interfaces:**
- Consumes: `adminUserAccountsEn.moderation.messages.MSG126|MSG127|MSG133` (Task 1).
- Produces: `POST` cho `action === 'lock'`: backend 403 → `{ title: MSG126 }` status 403; 409 → `{ title: MSG133 }` 409; mọi trường hợp 503 (mạng, status không ánh xạ) → `{ title: MSG127 }` 503. 400/401/404 giữ chuỗi hiện có. `action === 'unlock'` giữ nguyên mọi chuỗi.

- [ ] **Step 1: Viết test thất bại.** Mock `@/features/admin/user-accounts/server/accounts` (`accountSession` trả `{ role: 'Staff', token: 'tok' }`, `fetchAccounts` là `vi.fn()`) và `@/lib/server/adminSession` (`isSameOriginRequest: () => true`, `jsonNoStore: (body, status = 200) => Response.json(body, { status })`). Gọi `POST(new Request('http://localhost/api/admin/users/42/lock', { method: 'POST', body: JSON.stringify({ reason: 'x' }) }), { params: Promise.resolve({ userId: '42', action: 'lock' }) })`. Test:
  - lock: backend 403 → body `{ title: MSG126 }`, status 403; 409 → MSG133/409; 500 → MSG127/503; `fetchAccounts` reject → MSG127/503; 400 → `Check the supplied reason.`; 401 → `Sign in again to continue.`; 404 → `Account unavailable.`
  - unlock (cùng cách gọi với `action: 'unlock'`): 409 → `The account cannot be updated in its current state.`; 403 → `Access denied.`; reject → `Account management is temporarily unavailable.`
  - body `reason` 201 ký tự → 400 `Enter a reason of up to 200 characters.` và `fetchAccounts` không được gọi
  - thành công → 200 `{ updated: true }`, `fetchAccounts` gọi với `('tok', '/42/lock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'x' }) })` (reason đã trim)
- [ ] **Step 2:** `npx vitest run "app/api/admin/users/[userId]/[action]/route.test.ts"` → FAIL ở các case lock.
- [ ] **Step 3:** Sửa `route.ts`: bảng tiêu đề theo `action` (lock dùng copy ở Task 1, unlock giữ bảng cũ); 503 fallback và `catch` cũng chọn chuỗi theo `action`.
- [ ] **Step 4:** Chạy lại → PASS.

---

### Task 3: `LockAccountDialog` (trình bày thuần)

**Files:**
- Create: `src/features/admin/user-accounts/components/LockAccountDialog.tsx`
- Test: `src/features/admin/user-accounts/components/LockAccountDialog.test.tsx`

**Interfaces:**
- Consumes: `composeLockReason`, `lockReasonIssue`, `lockNoteMaxLength`, `MAX_LOCK_REASON_LENGTH` (Task 1); `ModerationDialog` từ `@/features/admin/tour-reviews/components/ModerationDialog`.
- Produces:
  - `export interface LockAccountSummary { fullName: string; email: string | null; role: string; statusLabel: string }`
  - `export function LockAccountDialog(props: { open: boolean; titleId: string; descriptionId: string; account: LockAccountSummary; category: string; note: string; busy: boolean; reasonError: boolean; serverError: string; onCategoryChange: (value: string) => void; onNoteChange: (value: string) => void; onConfirm: () => void; onClose: () => void }): JSX.Element | null`
- Hành vi: tiêu đề `Lock account`, mô tả MSG130, thẻ tóm tắt (Full name / Email / Role / Status), `<select>` label `Lock reason` (option rỗng `Select a reason` + 4 danh mục), `<textarea>` label `Additional details` với `maxLength={lockNoteMaxLength(category)}`, bộ đếm `{composeLockReason(...).length}/200`, ghi chú tác động, vùng lỗi, nút `Cancel` / `Confirm lock` và nút đóng `aria-label="Close confirmation"`. MSG123 hiện (role="alert", chữ đỏ, dưới ô) khi `reasonError && lockReasonIssue(...) === 'missing'`; `reasonTooLong` hiện khi issue là `'tooLong'`; `serverError` hiện trong dialog (role="alert"). `Confirm lock` disable khi `busy` hoặc issue `'tooLong'`, **không** disable khi trống. `Cancel`, select, textarea disable khi `busy`.

- [ ] **Step 1: Viết test thất bại** (render với props mặc định, `open: true`):
  - hiển thị `Nguyen Van A`, `a@mail.com`, `Traveler`, `Active` và ghi chú tác động; `email: null` → có `—`; `statusLabel: 'Pending contract signature'` hiển thị đúng chuỗi đó
  - select có đúng 5 option (1 rỗng + 4 danh mục); `onCategoryChange`/`onNoteChange` được gọi khi thay đổi
  - `category: ''` + `reasonError: true` → thấy `Please enter a reason.`; `reasonError: false` → không thấy; `category: other, note: '   '` + `reasonError: true` → thấy MSG123; `category: cat1, reasonError: true` → không thấy
  - `category: cat1`, `note: 'x'.repeat(190)` → thấy `Reason must be at most 200 characters.` và `Confirm lock` bị disable; `category: ''` → `Confirm lock` enabled
  - `textarea.maxLength === 200 - cat1.length - 2` khi chọn `cat1`; `serverError: 'Denied 409'` hiện trong `role="alert"` bên trong dialog; `busy: true` → `Confirm lock`, `Cancel`, select, textarea đều disable
- [ ] **Step 2:** Chạy test file → FAIL.
- [ ] **Step 3:** Cài `LockAccountDialog.tsx` theo chữ ký và hành vi trên; style dùng đúng class/tokens của `AccountModerationForm` hiện tại (tham khảo `DESIGN.md`), tiêu đề/mô tả truyền qua `ModerationDialog`.
- [ ] **Step 4:** Chạy test file → PASS; `npm run lint` cho file mới.

---

### Task 4: Nối vào `AccountModerationForm` và trang chi tiết

**Files:**
- Modify: `src/features/admin/user-accounts/components/AccountModerationForm.tsx`
- Modify: `app/admin/(console)/users/[userId]/page.tsx` (truyền `account`)
- Modify (test): `src/features/admin/user-accounts/components/AccountModerationForm.test.tsx`, `app/admin/(console)/users/[userId]/page.test.tsx`

**Interfaces:**
- Consumes: `LockAccountDialog`, `LockAccountSummary` (Task 3); `composeLockReason`, `lockReasonIssue` (Task 1).
- Produces: `AccountModerationForm(props: { accountId: string; locked: boolean; account: LockAccountSummary })`. Trang truyền `account={{ fullName: detail.account.fullName, email: detail.account.email, role: detail.account.role, statusLabel }}` với `statusLabel` đã có sẵn trong `page.tsx`.
- Hành vi nhánh `locked === false` (lock): chỉ hiện nút `Lock account` (type button, mở dialog; xóa lỗi cũ và `reasonError`); thêm state `category`, `note`, `reasonError`. `Confirm lock`: nếu `lockReasonIssue(...)==='missing'` → `setReasonError(true)` và dừng; nếu `'tooLong'` → dừng; ngược lại POST `{ reason: composeLockReason(category, note) }`. Lỗi (response không ok → `problem.title` nếu là chuỗi, ngược lại MSG127; fetch reject → MSG127) hiển thị trong dialog; dialog **chỉ đóng khi response.ok**; thành công: xóa `category`/`note`/`reasonError`, `MSG189`, `router.refresh()`. Cancel/Escape/nút đóng: đóng dialog, giữ bản nháp, xóa `serverError` và `reasonError`; vẫn bị chặn khi `inFlight`. Nhánh unlock (`locked === true`) giữ nguyên toàn bộ hành vi hiện có (error bên ngoài dialog, đóng trong `finally`).

- [ ] **Step 1: Cập nhật/viết test thất bại** trong `AccountModerationForm.test.tsx`: bỏ dòng lock khỏi mảng `actions` (các test `it.each` còn lại chỉ chạy unlock, giữ nguyên); thêm `describe('lock')` dùng `account = { fullName: 'Nguyen Van A', email: null, role: 'TourOperator', statusLabel: 'Pending contract signature' }`:
  - bấm `Lock account` mở dialog có tóm tắt (`Nguyen Van A`, `—`, `Pending contract signature`) và ghi chú tác động, chưa có request
  - `Confirm lock` khi chưa chọn danh mục → thấy MSG123, dialog còn mở, `fetch` không được gọi
  - chọn `Payment fraud or irregular chargebacks` + note `' chargebacks '` → `fetch` gọi một lần với `('/api/admin/users/42/lock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Payment fraud or irregular chargebacks: chargebacks' }) })`, dialog đóng, status chứa `Account locked. The account holder has been notified.`, `refresh` gọi một lần
  - `Other` + note `' spam '` → body `{ reason: 'spam' }`; `Other` + note `'   '` → MSG123, không gửi
  - chọn `Other`, note `'x'.repeat(180)`, rồi đổi sang danh mục đầu tiên → `Confirm lock` disable, thấy `Reason must be at most 200 characters.`, note vẫn là 180 ký tự, `fetch` không được gọi
  - bấm xác nhận hai lần liên tiếp (dispatch 2 click trong `act`) → đúng một request; Escape khi đang chờ không đóng dialog
  - phản hồi lỗi `400/401/403/404/409/503` với `Response.json({ title: 'Denied N' })` → `within(dialog).getByRole('alert')` chứa `Denied N`, dialog còn mở, bản nháp còn, không có `role="status"`, `refresh` không gọi; `fetch` reject → alert trong dialog chứa MSG127
  - Cancel / Escape / nút đóng → không có request; mở lại bằng `Lock account` → bản nháp (danh mục + note) còn, lỗi cũ không còn
  - sau lock thành công rồi `rerender` với `locked={true}` → toast MSG189 còn và nút `Unlock account` có mặt
  - focus trap trong dialog (Tab từ nút cuối về nút đóng; Shift+Tab ngược lại)
  Mọi test unlock hiện có trong `AccountModerationForm.test.tsx` cũng phải truyền fixture `account` (prop bắt buộc, nếu không `npm run typecheck` lỗi).
  Trong `page.test.tsx`: file hiện dùng `renderToStaticMarkup` (HTML tĩnh, không click được). Case mới phải render kết quả của page bằng `render()` của `@testing-library/react` (kiểm tra môi trường jsdom của file/vitest config, thêm `// @vitest-environment jsdom` nếu cần), với `detail.account.status = 'PendingContractSignature'`, `email = null` (theo mẫu fixture hiện có), bấm `Lock account` và kiểm dialog hiển thị `Pending contract signature` và `—`. Các case cũ dùng static markup giữ nguyên.
- [ ] **Step 2:** `npx vitest run src/features/admin/user-accounts "app/admin/(console)/users"` → FAIL.
- [ ] **Step 3:** Sửa `AccountModerationForm.tsx` và `page.tsx` theo hành vi trên; giữ nguyên đường unlock. Nếu `copy.lock.reasonLabel` không còn dùng thì dọn trong `en.ts`.
- [ ] **Step 4:** Chạy lại tập test trên → PASS (bao gồm toàn bộ test unlock cũ không đổi).

---

### Task 5: Xác minh toàn bộ

- [ ] **Step 1:** Trong worktree: `npm test && npm run lint && npm run typecheck && npm run build`. Expected: tất cả xanh; báo cáo số test và mọi bước skip.
- [ ] **Step 2:** Kiểm tra bằng mắt: `npm run dev`, đăng nhập Staff/Admin, mở `/admin/users/{id}` của một Traveler → dialog đúng như spec (tóm tắt, chọn lý do, đếm ký tự, MSG123, lỗi 409 khi khóa tài khoản đã khóa). Nếu `.env.local` không trỏ tới backend dùng được thì ghi rõ "chưa kiểm tra bằng trình duyệt" thay vì bỏ qua.
- [ ] **Step 3:** Review nhanh toàn bộ diff với spec §5 (9 tiêu chí); báo kết quả cho dev và hỏi cách hoàn tất nhánh (merge / PR / giữ nguyên / bỏ); không tự commit hay push.
