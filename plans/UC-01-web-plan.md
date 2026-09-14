# UC-01 Web Implementation Plan: Register Traveler Account & Email Verification (Rev. 3)

> **Specification Reference:** [`Capstone_FE/specs/UC-01-web-spec.md`](file:///d:/FPTUCapstone/Capstone_FE/specs/UC-01-web-spec.md)
> **Mockup Reference:** [`Report3_Screens_All.html`](file:///d:/FPTUCapstone/Report3_Screens_All.html#g32)

---

## Granular Atomic Task Breakdown & Implementation Status

### FE-UC01-01: Shared Auth Layout & Responsive Split Shell
- **Status:** [COMPLETED]
- **Target Files:**
  - `src/components/layout/AuthShell.tsx`
- **Implementation Details:**
  - Built responsive split shell for unauthenticated guest flows.
  - Left visual panel: Deep navy background (`#00283a`), accent geometric highlights, eyebrow (`TRAVELER REGISTRATION`), headline (*"Plan the journey around what matters to you."*), copy, and feature badge points (`📍 Discover Central Vietnam`, `📅 Prepare future journeys`).
  - Added `singlePanel?: boolean` mode for centered verification card layout matching Report 3 §3.2.

### FE-UC01-02: Traveler Registration Page & Form Component
- **Status:** [COMPLETED]
- **Target Files:**
  - `app/register/page.tsx`
  - `src/features/traveler/registration/TravelerRegistrationPage.tsx`
  - `src/features/traveler/registration/TravelerRegistrationForm.tsx`
- **Implementation Details:**
  - Added `PAGE` category badge (`#e8f5f2` / `#006b5f`).
  - Aligned heading: *"Create your Traveler account"* and subtitle: *"Standard registration continues to Verify Account. The Traveler role is assigned automatically."*
  - Form grid:
    - Row 1: Full Name (`maxLength: 150`) & Phone Number (Optional, format `0[0-9]{9}`).
    - Row 2: Email Address (`maxLength: 256`).
    - Row 3: Password & Confirm Password (8-character complexity rules).
    - Row 4: Checkbox for Terms of Service and Privacy Policy.
  - Primary button `Register`, divider `or`, secondary button `Continue with Google`, and footer link `Already registered? Back to Sign In`.
  - Integration: Creates user in Firebase Client Auth, triggers email verification link, registers Traveler in Backend `/api/v1/auth/register`, and immediately navigates to `/verify-account?email=...`.

### FE-UC01-03: Verify Account Screen & Code Verification
- **Status:** [COMPLETED]
- **Target Files:**
  - `app/verify-account/page.tsx`
  - `src/features/traveler/registration/VerifyAccountPage.tsx`
  - `src/features/traveler/registration/VerifyAccountForm.tsx`
- **Implementation Details:**
  - Built centered card matching Report 3 §3.2 mockup at `https://tripmate.vn/verify-account`.
  - Heading: *"Verify your account"* with copy *"Enter the verification code sent to the registered Email Address. Protected Traveler functions remain unavailable until verification succeeds."*
  - Input field for `Verification Code` (placeholder `Enter verification code`).
  - Primary button `Verify` that verifies the code using Firebase `applyActionCode`, reloads user session, calls Backend `/api/v1/auth/verify-email`, saves JWT tokens to localStorage, and navigates to `/`.
  - Inline error alert for invalid or expired code (`Invalid or expired verification code. Please request a new OTP.`).
  - Action row: `Resend Code` (with 60s cooldown timer `useVerificationEmailCooldown`) `·` `Back to Sign In`.

### FE-UC01-04: Out-Of-Band Email Verification Handler
- **Status:** [COMPLETED]
- **Target Files:**
  - `app/verify-email/page.tsx`
  - `src/features/traveler/registration/VerifyEmailHandler.tsx`
- **Implementation Details:**
  - Listens for Firebase email action links (`mode=verifyEmail`, `oobCode=...`).
  - Automatically validates code, syncs verification with Backend, saves tokens, and provides a direct CTA to proceed to sign in or home.

### FE-UC01-05: API Client & Error Mapping
- **Status:** [COMPLETED]
- **Target Files:**
  - `src/lib/authApi.ts`
  - `src/lib/authErrorMapper.ts`
- **Implementation Details:**
  - Methods: `registerTraveler`, `verifyEmail`, `googleAuth`, `login`, `saveTokens`, `clearTokens`.
  - Standardized error mapping covering `MSG01`–`MSG07`, `MSG14`, `MSG_TOS`, `MSG_PHONE_DUP`, `MSG_COOLDOWN`, `MSG_UNVERIFIED`, `MSG127`.

---

## Code Review Verification Checklist
- [x] Run typecheck: `npm run typecheck` (PASSED with 0 errors).
- [x] Run linter: `npm run lint` (PASSED with 0 errors, 0 warnings).
- [x] Browser visual review: Verified `/register` and `/verify-account` against Report 3 §3.2 mockups.
