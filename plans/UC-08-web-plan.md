# UC-08 Web Implementation Plan: Update Traveler Profile

> **Specification Reference:** [`Capstone_FE/specs/UC-08-web-spec.md`](file:///d:/study/Project-Capstone/Capstone_FE/specs/UC-08-web-spec.md)
> **Authoritative SRS Section:** Report 3 §3.2.8 (Update Traveler Profile)
> **Branch:** `feature/linhnv-update-traveler-profile`

---

## Granular Atomic Task Breakdown

### Task FE-UC08-01: Implement Next.js BFF Proxy Route
- **Status:** [DONE]
- **Target Files:**
  - `src/features/account/profile/travelerProfileProxy.ts`
  - `src/features/account/profile/travelerProfileProxy.test.ts`
  - `app/api/traveler/profile/route.ts`
- **Implementation Details:**
  - Create `travelerProfileProxy.ts` adhering to project Next.js server proxy patterns (similar to `operatorApplicationProxy.ts`):
    - Reads session refresh token or authorization header from incoming request cookies (`tripmate_refresh`).
    - Obtains active traveler access token via `/api/v1/auth/web/refresh`.
    - Dispatches upstream `GET /api/v1/traveler/profile` for GET requests.
    - Before a PUT, verifies `Origin` using the repository's same-origin helper. A missing, malformed, or cross-origin request returns a safe `403` and must not refresh a token or call Backend.
    - Dispatches upstream `PUT /api/v1/traveler/profile` with `multipart/form-data` for PUT requests.
    - Enforces a 6 MB stream bound even without `Content-Length`, while preserving the 5 MB avatar-file limit.
    - Passes through only the safe `MSG_PHONE_DUP` code on a backend `409` response.
    - Maps 401/403/500 upstream status codes into standard error responses with `MSG127` fallback.
  - Expose Next.js App Router handler in `app/api/traveler/profile/route.ts`:
    - `export async function GET(req: Request) { return proxyTravelerProfile(req); }`
    - `export async function PUT(req: Request) { return proxyTravelerProfile(req); }`
  - Add comprehensive unit tests in `travelerProfileProxy.test.ts`: missing/malformed session, Traveler/non-Traveler response handling, safe upstream error mapping, same-origin PUT acceptance, and cross-origin/missing-Origin PUT rejection without an upstream call.

---

### Task FE-UC08-02: Upgrade Traveler Profile API Client to Live Integration
- **Status:** [DONE]
- **Target Files:**
  - `src/features/account/profile/travelerProfileApi.ts`
  - `src/features/account/profile/__tests__/travelerProfileApi.test.ts`
- **Implementation Details:**
  - Update `getTravelerProfile`:
    - Calls `fetch('/api/traveler/profile')` to load live profile data from server.
    - Returns a typed loading failure for `401`, `403`, and `5xx`; it must not fall back to `LOCAL_DRAFT`, authenticated-session data, or an editable blank profile.
  - Update `updateTravelerProfile`:
    - Accepts payload including optional `avatarFile?: File | null` and `removeAvatar?: boolean`.
    - Constructs `FormData` appending `fullName`, `phoneNumber`, `dateOfBirth`, and `avatar` file.
    - Calls `PUT /api/traveler/profile`.
    - Parses the server response with `messageCode: 'MSG20'` and the updated `TravelerProfileDto`.
  - Deprecate `LOCAL_DRAFT` and `PENDING_BE_INTEGRATION` flags in favor of server response.
  - Update unit tests in `travelerProfileApi.test.ts`.

---

### Task FE-UC08-03: Update `useTravelerProfile` Hook for Avatar & Live Server Sync
- **Status:** [DONE]
- **Target Files:**
  - `src/features/account/profile/useTravelerProfile.ts`
  - `src/features/account/profile/__tests__/useTravelerProfile.test.ts`
- **Implementation Details:**
  - Add state for selected file:
    - `const [avatarFile, setAvatarFile] = useState<File | null>(null)`
    - `const [removeAvatar, setRemoveAvatar] = useState(false)`
  - Update `handleAvatarChange`:
    - Validates file type and 5MB size limit (BR-16).
    - Sets `avatarFile` and creates preview URL for UI.
    - Clears `removeAvatar` flag.
  - Update `handleAvatarRemove`:
    - Clears preview and selected `avatarFile`.
    - Sets `removeAvatar = true`.
  - Update `handleSubmit`:
    - Passes `avatarFile` and `removeAvatar` to `updateTravelerProfile`.
    - On success: sets `success = true`, `successMessage = 'MSG20' (Cập nhật hồ sơ thành công.)`.
    - Calls `onSuccess(profile)` callback.
  - Treat Phone Number as optional: validate the Vietnamese mobile expression only when its trimmed value is non-empty.
  - Show the shared catalog's `MSG_PHONE_DUP` text beside the phone field when the server rejects a duplicate.
  - Add a terminal retrieval-error state; when the initial GET fails, the hook exposes the mapped error and keeps submit/actions unavailable.
  - Update unit tests in `useTravelerProfile.test.ts`.

---

### Task FE-UC08-04: Update TravelerProfileForm UI & Remove Temporary Draft Notices
- **Status:** [DONE]
- **Target Files:**
  - `src/features/account/profile/TravelerProfileForm.tsx`
  - `src/features/account/profile/__tests__/TravelerProfileForm.test.tsx`
- **Implementation Details:**
  - Remove the temporary `Chờ tích hợp máy chủ` (pending BE integration) alert once live API client is in place.
  - When initial profile retrieval fails, render only the mapped unavailable/error state with a retry or sign-in action; do not render the editable form.
  - Render success alert with `MSG20` ("Cập nhật hồ sơ thành công.") when `success` is true.
  - Keep full validation feedback for all inputs (MSG01, MSG02, MSG04, BR-16, BR-17, BR-18).
  - Ensure image preview correctly reflects both server avatar URL and newly selected local file.
  - Update unit tests in `TravelerProfileForm.test.tsx`.

---

### Task FE-UC08-05: Verification & Quality Checks
- **Status:** [DONE]
- **Implementation Details:**
  - Run typecheck: `npm run typecheck` (must pass with 0 errors).
  - Run linter: `npm run lint` (must pass with 0 errors).
  - Run test suite: `npx vitest run src/features/account/profile` (all tests passing).
  - Add route/client tests proving a failed GET cannot render editable controls, optional blank Phone Number submits successfully, and cross-origin PUT is rejected by the proxy without a Backend request.

---

### Task FE-UC08-06: Keep the shared account menu in sync
- **Status:** [DONE]
- **Target Files:** `src/components/navigation/PublicNavigation.tsx`, its focused tests, and `TravelerProfilePage.tsx`.
- **Implementation Details:** Load the persisted Traveler avatar for the account link, retain the generic icon fallback, and notify the navigation immediately after a successful profile update. Verify refresh and stale-load ordering.
