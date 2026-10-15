# UC-08 Web Specification: Update Traveler Profile

> **Authoritative SRS Reference:** Report 3 §3.2.8 (Update Traveler Profile).
> **Companion Backend Specification:** [`Capstone_BE/specs/UC-08-spec.md`](file:///d:/study/Project-Capstone/Capstone_BE/specs/UC-08-spec.md).
> **Frontend Implementation Plan:** [`Capstone_FE/plans/UC-08-web-plan.md`](file:///d:/study/Project-Capstone/Capstone_FE/plans/UC-08-web-plan.md).
> **Branch:** `feature/linhnv-update-traveler-profile`.

---

## 1. Overview & Scope

Defines the responsive Web Traveler Profile management experience for `Capstone_FE` at `/account/profile`. An authenticated Traveler reviews and maintains their personal profile details (Full Name, Avatar, Phone Number, Date of Birth).

The web client communicates with the TripMate backend via a dedicated Next.js BFF proxy route (`/api/traveler/profile`) that handles session token forwarding, multipart form data handling for avatar media uploads, and standard error translation.

---

## 2. Screen Architecture & Visual Layout

### 2.1 Route & Containers
- **Page Route:** `app/account/profile/page.tsx`
- **Main Container:** `src/features/account/profile/TravelerProfilePage.tsx`
- **Form Component:** `src/features/account/profile/TravelerProfileForm.tsx`
- **Hook:** `src/features/account/profile/useTravelerProfile.ts`
- **API Client:** `src/features/account/profile/travelerProfileApi.ts`
- **Proxy Route:** `app/api/traveler/profile/route.ts`

### 2.2 Screen Elements (SRS §3.2.8 Mockup)
- **Header:**
  - Eyebrow: `HỒ SƠ CÁ NHÂN` (uppercase teal tracking)
  - Heading: `Thông tin cá nhân`
  - Subtitle: `Cập nhật thông tin định danh và liên hệ của bạn để có trải nghiệm du lịch cá nhân hóa tốt nhất.`
- **Top Feedback Alerts:**
  - Success banner: Displayed when update succeeds (`MSG20`).
  - Error banner: Displayed when submission fails (`MSG127` or validation summary).
- **Avatar Management Card (BR-16):**
  - Avatar preview circle: 80x80px rounded-full with current image or capitalized user initials fallback.
  - Buttons:
    - `[Chọn ảnh mới]` (`button` opening hidden file input `accept="image/jpeg,image/png,image/webp"`).
    - `[Xóa ảnh]` (`button` visible when avatar exists; removes preview and sets `removeAvatar: true`).
  - Constraint Note: `Định dạng cho phép: JPG, PNG, WEBP. Dung lượng tối đa: 5MB (BR-16).`
  - Inline error: Red alert text when file exceeds 5MB or has unsupported MIME type (`MSG19`).
- **Shared account menu:** For an authenticated Traveler, the account link shows the persisted avatar beside the name. It uses the existing account icon when no avatar is stored or the profile cannot be loaded. A successful profile save updates the menu without reloading; a direct page refresh reloads the persisted avatar.
- **Personal Details Form:**
  - Row 1:
    - **Họ và tên (Full Name):** Text input, required, max 100 characters (`MSG01`).
    - **Địa chỉ Email (Email Address):** Text input, read-only, with `Chỉ đọc (BR-17)` badge.
  - Row 2:
    - **Số điện thoại (Phone Number):** Optional text input, tel type; if entered, it must be 10 digits starting with `0` (`MSG04`).
    - **Ngày sinh (Date of Birth):** Date input, `max={today - 16 years}` enforcing age $\ge 16$ years (BR-18).
- **Form Action Footer:**
  - `[Hủy thay đổi]`: Resets form to server-loaded state.
  - `[Lưu thay đổi]`: Primary CTA button; triggers client validation, submits payload, displays spinner while loading.

---

## 3. Business Rules and Web Validations

| Rule | Description | Client & Server Validation |
| :--- | :--- | :--- |
| **BR-16** | **Avatar Constraints** | File size $\le 5$ MB; types: `image/jpeg`, `image/png`, `image/webp`. Shows `MSG19` on failure. |
| **BR-17** | **Read-Only Email** | Rendered with `disabled` and `readOnly`. Email is never sent as an editable field in payload. |
| **BR-18** | **Date of Birth Limit** | If entered, date must be $\le \text{today} - 16\text{ years}$. Shows `MSG02` on failure. |
| **BR-23** | **Role Immutability** | Traveler role cannot be edited. Role remains untouched. |
| **Phone Format** | **Vietnamese Mobile** | Optional. A non-empty value must be exactly 10 digits starting with `0` (`^0\d{9}$`). Shows `MSG04` on failure. |
| **Phone Uniqueness** | **Shared Users identity** | A number already owned by another account returns `409` with catalog code `MSG_PHONE_DUP`. Display the catalog message next to the phone field. |
| **Full Name** | **Required Name** | Non-empty, trimmed, 1–100 chars. Shows `MSG01` if blank. |

---

## 4. Web Error Mapping & Messaging

All feedback adheres to the TripMate locked message catalog:

| Error / Message Code | HTTP | User-Facing Message (Vietnamese) | User-Facing Message (English) |
| :--- | :--- | :--- | :--- |
| `MSG01` | 400 | Vui lòng nhập họ và tên. | This field is required. |
| `MSG02` | 400 | Định dạng không hợp lệ hoặc người dùng chưa đủ 16 tuổi. | Invalid input format. |
| `MSG04` | 400 | Số điện thoại không hợp lệ. Số điện thoại phải gồm 10 chữ số bắt đầu bằng số 0. | Invalid phone number. Phone number must be 10 digits starting with 0. |
| `MSG_PHONE_DUP` | 409 | Số điện thoại này đã được đăng ký cho tài khoản khác. | This phone number is already registered to another account. |
| `MSG19` | 400 | Kích thước tệp vượt quá 5MB hoặc định dạng hình ảnh không được hỗ trợ. | The uploaded file exceeds the maximum allowed size (5MB) or is not a supported image format. |
| `MSG20` | 200 | Cập nhật hồ sơ thành công. | Profile updated successfully. |
| `MSG127` | 500 / 503 | TripMate tạm thời không thể xử lý yêu cầu. Vui lòng thử lại sau. | TripMate is temporarily unable to process your request. Please check your connection and try again. |

---

## 5. BFF Proxy Architecture & API Integration

### 5.1 Next.js BFF Proxy Route (`app/api/traveler/profile/route.ts`)
- **GET:**
  - Extracts active traveler bearer token or refresh cookie from session.
  - Forwards request to backend `GET /api/v1/traveler/profile`.
  - Returns `200 OK` with `TravelerProfileDto`.
  - Returns a safe `401`, `403`, or `MSG127` response without exposing token or upstream internal detail.
- **PUT:**
  - Requires a same-origin request before reading the refresh cookie or forwarding a state-changing request. Missing, malformed, or cross-origin `Origin` returns `403`.
  - Accepts `multipart/form-data` containing text fields and optional `avatar` file.
  - Limits the avatar file to 5 MB. Limits the entire multipart request to 6 MB, counting fields and encoding overhead, even when `Content-Length` is absent; rejects an oversized stream before parsing or forwarding it.
  - Forwards `multipart/form-data` with `Authorization: Bearer <token>` to backend `PUT /api/v1/traveler/profile`.
  - Translates backend response or validation errors safely.

### 5.2 API Client (`src/features/account/profile/travelerProfileApi.ts`)
- Transitions from `LOCAL_DRAFT` mode to live server integration:
  - `getTravelerProfile()` $\rightarrow$ calls `/api/traveler/profile`.
  - `updateTravelerProfile(payload, avatarFile?, removeAvatar?)` $\rightarrow$ sends `FormData` to `/api/traveler/profile`.
  - Returns the backend's `messageCode` and updated `TravelerProfileDto`; the client never writes a local draft.
  - A non-`200` GET is a terminal loading state: the page shows the relevant error/redirect and does **not** render editable fields or fall back to local profile data.

---

## 6. Verification & Quality Checklist

- [ ] Route `/account/profile` renders cleanly with correct responsive design.
- [ ] Avatar upload previews selected file immediately and validates size $\le 5$ MB and MIME format (BR-16).
- [ ] Read-only email field cannot be edited (BR-17).
- [ ] Date of birth enforces 16-year minimum age (BR-18).
- [ ] Submitting updates forwards payload through Next.js proxy to backend.
- [ ] Successful update displays `MSG20` banner.
- [ ] A failed profile GET displays the mapped failure state and does not offer editing.
- [ ] Cross-origin PUT is rejected by the BFF before token refresh or backend forwarding.
- [ ] Duplicate phone returns `MSG_PHONE_DUP` beside the phone input; the menu avatar survives refresh and updates after save.
- [ ] A multipart stream larger than 6 MB without `Content-Length` is rejected before backend profile forwarding.
- [ ] TypeScript check: `npm run typecheck` (0 errors).
- [ ] Vitest unit tests: `npm run test` (all tests passing).
