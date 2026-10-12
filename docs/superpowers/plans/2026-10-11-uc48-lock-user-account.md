# UC-48 Lock User Account Implementation Plan

**Goal:** Implement accessible Screen #08 Lock Account Confirmation dialog with reason validation, reason categories, BR-117 policy callout, and focus restoration for UC-48 without premature Backend mutations.

- [x] Define lock status dialog resource copy in `src/features/admin/user-accounts/resources/en.ts`
- [x] Implement accessible presentational Client Component `UserAccountStatusDialog` for lock operation with focus trap, reason validation, reason category, BR-117 indefinite lock policy callout, and focus restoration
- [x] Add automated component tests verifying disabled confirm on empty reason, reason and category callback emission, focus trap, and Escape key
- [x] Verify typecheck, lint, and tests
