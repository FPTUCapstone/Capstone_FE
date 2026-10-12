# UC-49 Unlock User Account Implementation Plan

**Goal:** Implement accessible Screen #09 Unlock Account Confirmation dialog with lock history context (SRS 3.9.1.3), reason validation, and component tests for UC-49 without premature Backend mutations.

- [x] Define unlock status dialog resource copy and lock history labels in `src/features/admin/user-accounts/resources/en.ts`
- [x] Support unlock operation in accessible presentational Client Component `UserAccountStatusDialog` with lock history area (Lock Reason, Locked By, Locked Date), reason validation, reason categories, focus trapping, and Escape key handling
- [x] Add automated component tests verifying unlock validation, lock history area, focus trap, and Escape key
- [x] Verify typecheck, lint, and tests
