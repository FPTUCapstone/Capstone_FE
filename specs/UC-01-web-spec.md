# UC-01 Web Specification: Register Traveler Account & Email Verification (Rev. 3)

> **Canonical Reference:** Full consolidated specification located at [`Capstone_BE/specs/UC-01-spec.md`](file:///d:/FPTUCapstone/Capstone_BE/specs/UC-01-spec.md) and official Report 3 §3.2 screen mockups in [`Report3_Screens_All.html`](file:///d:/FPTUCapstone/Report3_Screens_All.html).

---

## 1. Overview

Defines the responsive Web Traveler Registration & Verification flow for `Capstone_FE` at `/register` and `/verify-account`. A Guest registers a Traveler account with standard credentials or via **Continue with Google**, receives an email verification link/code, and completes verification before protected Traveler functions unlock.

---

## 2. Routes & Screen Architecture

### 2.1 Traveler Registration (`/register`)
- **Page Route:** `app/register/page.tsx`
- **Container / Presentation:** `src/features/traveler/registration/TravelerRegistrationPage.tsx`
- **Form Component:** `src/features/traveler/registration/TravelerRegistrationForm.tsx`
- **Shell:** `src/components/layout/AuthShell.tsx` (Split layout on desktop: Left visual banner + Right form panel)
- **Visual Aside Content:**
  - Eyebrow: `Traveler registration`
  - Title: `Plan the journey around what matters to you.`
  - Description: `Create a Traveler account for approved planning, discovery and booking functions.`
  - Feature Points: `📍 Discover Central Vietnam`, `📅 Prepare future journeys`
- **Form Elements:**
  - Badge: `<span className="b1-type">PAGE</span>`
  - Title: `Create your Traveler account`
  - Subtitle: `Standard registration continues to Verify Account. The Traveler role is assigned automatically.`
  - Row 1 (2 columns): **Full Name** (`maxLength: 150`, required) & **Phone Number (Optional)** (`0[0-9]{9}`).
  - Row 2 (1 column): **Email Address** (`maxLength: 256`, required).
  - Row 3 (2 columns): **Password** (8–72 chars, upper, lower, number, special) & **Confirm Password** (must match).
  - Row 4: Checkbox `I accept the Terms of Service and Privacy Policy.` (with interactive modal popups).
  - Primary CTA: `Register` (triggers client validation, Firebase creation, and Backend registration).
  - Divider: `or`.
  - Secondary CTA: `Continue with Google` (Firebase popup with GoogleAuthProvider).
  - Footer link: `Already registered? Back to Sign In`.

### 2.2 Verify Account (`/verify-account?email={encoded}`)
- **Page Route:** `app/verify-account/page.tsx`
- **Container / Presentation:** `src/features/traveler/registration/VerifyAccountPage.tsx`
- **Form Component:** `src/features/traveler/registration/VerifyAccountForm.tsx`
- **Shell:** `AuthShell` in `singlePanel` centered mode matching Report 3 §3.2 mockup at `https://tripmate.vn/verify-account`.
- **Card Elements:**
  - Badge: `<span className="b1-type">PAGE</span>`
  - Heading: `Verify your account`
  - Copy: `Enter the verification code sent to the registered Email Address. Protected Traveler functions remain unavailable until verification succeeds.`
  - Email hint: `Sent to: {email}` (dynamically extracted from `searchParams`).
  - Input field: `Verification Code` (placeholder `Enter verification code`).
  - Action button: `Verify` (validates code via Firebase `applyActionCode`, synchronizes activation with Backend `/api/v1/auth/verify-email`, saves tokens, and redirects).
  - Inline error alert: `Invalid or expired verification code. Please request a new OTP.`
  - Action row: `Resend Code` (with active 60s cooldown timer `useVerificationEmailCooldown`) `·` `Back to Sign In`.

### 2.3 Email Action Link Landing (`/verify-email?mode=verifyEmail&oobCode=...`)
- **Page Route:** `app/verify-email/page.tsx`
- **Handler Component:** `src/features/traveler/registration/VerifyEmailHandler.tsx`
- Automatically processes the Firebase action code when the user clicks the verification link in their email inbox.

---

## 3. Web Error Mapping & Messaging

All error handling uses the single-source-of-truth mapping in [`src/lib/authErrorMapper.ts`](file:///d:/FPTUCapstone/Capstone_FE/src/lib/authErrorMapper.ts):

| Condition / Code | HTTP | User Facing Message |
|---|---|---|
| `MSG01` | 400 | This field is required. |
| `MSG02` | 400 | Invalid email format. Please enter a valid email address. |
| `MSG03` | 409 | An account with this email already exists. Please sign in or use another email. |
| `MSG04` | 400 | Invalid phone number. Phone number must be 10 digits starting with 0. |
| `MSG05` | 400 | Password must be 8–72 characters, containing uppercase, lowercase, number, and special character. |
| `MSG06` | 400 | Passwords do not match. Please re-enter. |
| `MSG07` | 201 | Account registered successfully! Please check your email for the verification code. |
| `MSG14` | 400 | Invalid or expired verification code. Please request a new OTP. |
| `MSG_TOS` | 400 | You must accept the Terms of Service and Privacy Policy to continue. |
| `MSG_PHONE_DUP` | 409 | This phone number is already registered to another account. |
| `MSG_COOLDOWN` | 429 | Please wait before requesting another code. |
| `MSG_UNVERIFIED` | 403 | Please verify your email before signing in. |
| `MSG127` | 500 | Something went wrong. Please try again later. |

---

## 4. API Client Integration

Defined in [`src/lib/authApi.ts`](file:///d:/FPTUCapstone/Capstone_FE/src/lib/authApi.ts):
- `registerTraveler(data, idToken)` $\rightarrow$ `POST /api/v1/auth/register`
- `verifyEmail(idToken)` $\rightarrow$ `POST /api/v1/auth/verify-email`
- `googleAuth(idToken)` $\rightarrow$ `POST /api/v1/auth/google`
- `login(credentials)` $\rightarrow$ `POST /api/v1/auth/login`

---

## 5. Review & Verification Checklist
- [x] TypeScript validation: `npm run typecheck` (0 errors).
- [x] ESLint analysis: `npm run lint` (0 errors, 0 warnings).
- [x] Layout and copy alignment with Report 3 §3.2 screen mockups.
