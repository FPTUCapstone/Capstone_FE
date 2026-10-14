# WP-01 User Accounts & Access — Web Design

## Goal

Deliver the Administrator Web workspace structure for UC-47 (view user accounts), UC-48 (lock a user account), and UC-49 (unlock a user account), without representing unavailable Backend capabilities as live operations.

## Scope and ownership

- Platform: Next.js Web only. Mobile is out of scope because UC-47 through UC-49 are `ADMIN_WEB_ONLY` in `docs/WEB_SCOPE_MATRIX.md`.
- This work package owns the Web screens: user account directory, account detail, lock confirmation, and unlock confirmation.
- This work package does not add, change, or simulate Backend endpoints, migrations, authentication policy, or persistence.
- It does not change the shared route registry or `AdminNavigation` without the integration owner's approval. Route strings used by the new pages remain local until a shared-route change is explicitly coordinated.

## Confirmed Backend readiness

At design time, `origin/develop` has no directory, account-detail, or lock-account contract for this feature. A separate Backend feature branch contains an unlock endpoint, but it is not part of the Web branch baseline and is therefore not a dependency this feature may claim as integrated.

Consequences:

1. The directory must show an explicit unavailable state rather than synthetic account rows.
2. The detail route must show an explicit unavailable state rather than inventing an account profile.
3. Lock and unlock controls must not appear actionable until their corresponding server contract is available and verified.
4. The page copy must explain that account actions remain unavailable pending Backend integration; it must not call this a successful lock, unlock, search, or audit operation.

## User experience

### Account directory: `/admin/users`

- Only an authenticated Administrator session can open the page. A missing or invalid session redirects to the existing Admin sign-in flow. A Staff session or unauthorized role receives the existing access-denied treatment.
- The page identifies its intended operations: search accounts, inspect details, and manage lock state.
- It contains disabled search/filter controls and an unavailable-state panel while the directory API is absent. Controls explain why they are disabled.
- The unavailable state provides a return path to the Administration Dashboard (`/admin`) and avoids misleading totals, rows, or activity counts.

### Account detail: `/admin/users/[userId]`

- The route validates a positive numeric ID before rendering an account workspace.
- Without a verified detail API, it renders a dedicated unavailable state that includes the requested ID only as route context, not as invented user data.
- It includes a back link to the directory and does not render actionable lock/unlock controls.

### Lock and unlock dialogs

- Dialog components are built as presentational, accessible components for later integration: visible title, account context supplied by a parent, reason textarea, Cancel, and a clearly labelled destructive/confirm action.
- A reason is required before the confirm button becomes enabled.
- The components emit a submit intent only through a supplied callback. They do not call an endpoint, alter local account state, or display a false success state.
- Until a parent has a verified operation capability, it must render the controls disabled with explanatory copy instead of mounting an operational dialog.

## Architecture

- Route composition remains under `app/admin/(console)/users`.
- Feature-specific types, copy, presentational components, and tests live under `src/features/admin/user-accounts`.
- Pages are Server Components and use `verifyAdminSessionFromCookies`; the smallest interactive boundary is a Client Component for future lock/unlock dialog validation.
- No raw Backend URL, bearer token, or secret is sent to the browser. A later integration must use a server-side BFF route that verifies the existing sealed Admin session before forwarding an allowed request.

## Error and state model

- Missing/invalid session: redirect to Admin sign-in.
- Unauthorized role: existing access-denied UI.
- Backend contract absent: clearly labelled unavailable/pending state.
- Future integration: loading, empty, validation, 401/403/404/5xx, and idempotent mutation states are mandatory before a control is made active.

## Acceptance criteria

1. Administrator Web users can navigate to a truthful User Account Management workspace and a validated detail route.
2. The UI exposes no mock account data or fake successful mutation.
3. Search, filters, account actions, and dialogs are either safely disabled or explicitly described as pending when their Backend contract is absent.
4. Reason validation, keyboard-accessible dialog semantics, focus-visible controls, and responsive layouts are covered by automated component tests where applicable.
5. The new feature respects existing sealed Admin session handling and keeps the Server/Client boundary narrow.
6. `npm run lint`, `npm run typecheck`, applicable Vitest tests, `npm run build`, and `git diff --check` pass before review.

## Deferred dependency

Live UC-47/48/49 integration requires approved, merged Backend contracts for list, detail, lock, and unlock operations. When they exist, implement a separate integration increment with BFF routes, response mapping, server-side authorization, idempotency forwarding for mutations, and end-to-end contract tests.
