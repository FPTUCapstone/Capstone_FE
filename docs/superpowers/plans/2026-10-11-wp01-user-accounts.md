# WP-01 User Accounts & Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build truthful Next.js Web shells for the UC-47–49 administrator account-management workspace while its Backend contracts are unavailable.

**Architecture:** App Router pages verify the sealed Admin session on the server and compose feature-scoped components under `src/features/admin/user-accounts`. The feature renders only unavailable/pending states, with no mock account records or mutation calls; a small Client Component provides reusable reason-validation semantics for a future operation dialog.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-11-wp01-user-accounts-design.md`

## Global Constraints

- Web-only scope; do not modify Backend or Flutter Mobile repositories.
- Do not add mock persistence, synthetic account data, raw Backend URLs, bearer tokens, or secrets.
- Keep pages Server Components; use Client Components only for interactive reason validation.
- Preserve sealed Admin session verification and existing unauthorized/access-denied behavior.
- Do not edit `src/lib/routes.ts` or `src/components/navigation/AdminNavigation.tsx` without integration-owner approval.
- Use English resource-backed copy and preserve responsive, keyboard-accessible UI.
- Required final validation: applicable Vitest tests, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`.

## Review Focus

- Invalid, zero, negative, decimal, or non-numeric detail IDs must not render a fictional account workspace.
- A Staff session must receive access denied (Administrator only); a non-admin role must fail closed.
- Pending UI must never expose enabled buttons that claim to search, lock, unlock, or save data.
- A whitespace-only reason must keep a future operation submit control disabled.
- Missing Backend contracts must be communicated as unavailable, not as an empty user directory or successful operation.

---

### Task 1: Feature copy, unavailable directory, and server route

**Files:**
- Create: `src/features/admin/user-accounts/resources/en.ts`
- Create: `src/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView.tsx`
- Create: `src/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView.test.tsx`
- Create: `app/admin/(console)/users/page.tsx`

**Interfaces:**
- Consumes: `verifyAdminSessionFromCookies`, existing Admin login route, and Administration Dashboard route.
- Produces: `UserAccountDirectoryUnavailableView` and the authenticated `/admin/users` route used by Task 2.

- [ ] **Step 1: Write the failing component tests**

Test that the view renders English resource copy, disabled search/filter/action controls, the Backend-pending explanation, and a link back to `/admin`; assert that it contains no synthetic user rows or numeric account totals.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npx vitest run src/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView.test.tsx`

Expected: FAIL because the feature module does not exist.

- [ ] **Step 3: Implement the feature copy, unavailable view, and `/admin/users` Server Component route**

`UserAccountDirectoryUnavailableView(): JSX.Element` renders the read-only directory shell. `app/admin/(console)/users/page.tsx` verifies the sealed Admin session, redirects unauthenticated users to the existing Admin sign-in route, and renders the view for the allowed session roles.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npx vitest run src/features/admin/user-accounts/components/UserAccountDirectoryUnavailableView.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the task**

```bash
git add app/admin/(console)/users/page.tsx src/features/admin/user-accounts
git commit -m "feat(web): add user account directory shell"
```

### Task 2: Validated detail route and unavailable account workspace

**Files:**
- Create: `src/features/admin/user-accounts/components/UserAccountDetailUnavailableView.tsx`
- Create: `src/features/admin/user-accounts/components/UserAccountDetailUnavailableView.test.tsx`
- Create: `app/admin/(console)/users/[userId]/page.tsx`

**Interfaces:**
- Consumes: Task 1 resource copy and authenticated Admin-route conventions.
- Produces: a detail route that safely represents a requested ID without presenting account data.

- [ ] **Step 1: Write the failing detail view and route-validation tests**

Test the unavailable detail view renders the numeric requested ID only as context, provides a back link to `/admin/users`, and has no enabled lock/unlock actions. Test a route helper or page input normalizer accepts only positive safe integer strings and rejects `0`, `-1`, `1.5`, `abc`, and unsafe integers.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npx vitest run src/features/admin/user-accounts/components/UserAccountDetailUnavailableView.test.tsx`

Expected: FAIL because the detail view and ID validator do not exist.

- [ ] **Step 3: Implement detail view and `/admin/users/[userId]` Server Component route**

Export `parseUserAccountRouteId(value: string): number | null` from a feature-local server-safe helper. The route redirects unauthenticated sessions, calls `notFound()` for invalid IDs, and otherwise renders `UserAccountDetailUnavailableView({ userId })` without fabricated profile fields.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npx vitest run src/features/admin/user-accounts/components/UserAccountDetailUnavailableView.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the task**

```bash
git add app/admin/(console)/users/[userId]/page.tsx src/features/admin/user-accounts
git commit -m "feat(web): add safe user account detail shell"
```

### Task 3: Accessible future operation dialog with reason validation

**Files:**
- Create: `src/features/admin/user-accounts/components/UserAccountStatusDialog.tsx`
- Create: `src/features/admin/user-accounts/components/UserAccountStatusDialog.test.tsx`

**Interfaces:**
- Consumes: resource copy from Task 1.
- Produces: `UserAccountStatusDialog(props: UserAccountStatusDialogProps): JSX.Element` for future verified lock/unlock integration.

- [ ] **Step 1: Write failing interaction tests**

Test a closed dialog renders nothing; an open lock or unlock dialog has an accessible title and textarea; whitespace-only reasons keep Confirm disabled; a non-empty reason enables Confirm and invokes `onConfirm` with the trimmed reason; Cancel invokes `onCancel` without confirmation.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npx vitest run src/features/admin/user-accounts/components/UserAccountStatusDialog.test.tsx`

Expected: FAIL because the dialog does not exist.

- [ ] **Step 3: Implement the minimal Client Component dialog**

`UserAccountStatusDialogProps` contains `isOpen`, `operation: 'lock' | 'unlock'`, `accountLabel`, `onCancel`, and `onConfirm(reason: string)`. The dialog uses semantic modal attributes, focus-visible controls, and local state only; it does not perform fetches, mutate account state, or display a success message.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npx vitest run src/features/admin/user-accounts/components/UserAccountStatusDialog.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run feature and repository validation, then commit**

Run: `npx vitest run src/features/admin/user-accounts && npm run lint && npm run typecheck && npm run build && git diff --check`

Expected: all commands pass with no formatting, type, or build errors.

```bash
git add src/features/admin/user-accounts
git commit -m "feat(web): add account status dialog foundation"
```

## Plan self-review

- Spec coverage: Tasks 1–2 implement the truthful directory/detail unavailable states; Task 3 implements the required presentational dialog validation. Backend integration is deliberately excluded by the approved spec.
- Type consistency: Task 2 exports `parseUserAccountRouteId`; no later task consumes it. Task 3 defines the only dialog interface and no page mounts it before Backend readiness.
- Review-focus coverage: invalid IDs are tested in Task 2; disabled pending controls in Task 1–2; whitespace reason and callback behavior in Task 3; role/session behavior follows existing server-session patterns and receives page-level coverage if the existing harness permits it.
- Proportion: three independently testable tasks match the three UI responsibilities and do not prescribe unnecessary implementation details.
