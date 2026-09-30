# UC-50 Frontend Plan — Approve Tour Operator Application

## Objective

Deliver the Administrator detail and approval screen at `/admin/tour-operator-applications/[userId]`, using the HttpOnly Administrator session and the backend UC-50 contract.

## Approved business boundary

- Show `taxCode` as required application data; do not require or add a Tax Code file upload.
- Treat only a non-rejected `BusinessLicense` document as mandatory for approval.
- Keep rejection integration aligned with the future UC-51 success contract and record that backend dependency explicitly.
- Do not add mock data or direct browser-to-backend access.

## Implementation

### 1. Types and client API

- Keep application, document, status, approval, and error contracts in `src/types/tour-operator-application.ts`.
- Use `src/features/admin/tour-operator-applications/api/tourOperatorApplicationApi.ts` for browser calls to same-origin routes:
  - `fetchOperatorApplicationDetail(userId)`;
  - `approveOperatorApplication(userId)`;
  - `rejectOperatorApplication(userId, reason)`.

### 2. Authenticated server proxy

- Use `tourOperatorApplicationProxy.ts` and the Next.js routes under `src/app/api/admin/tour-operator-applications/[userId]/`.
- Parse route identifiers through the shared `parseApplicationId` utility. Accept only canonical positive base-10 safe integers, and reject malformed or unsafe IDs before any backend request.
- Read the HttpOnly Administrator access-token cookie on the server and forward it to backend `/api/v1/admin/tour-operator-applications/...` endpoints.
- Clear an invalid Administrator session on `401` using the shared session utility.
- Return backend status and safe response data without exposing deployment URLs.

### 3. Application detail UI

- `TourOperatorApplicationDetailView.tsx`: fetch, loading/error states, modal state, approval state update, rejection refetch, and accessible success feedback.
- `ApplicationHeader.tsx`: application status, `/admin` back link, pending-only decision buttons, and visible explanation when Business License is missing.
- `CompanyInfoCard.tsx`: legal data including Tax Code value and rejection reason.
- `DocumentsGrid.tsx`: uploaded-document cards and Business-License-only approval warning.
- `ApproveModal.tsx` and `RejectModal.tsx`: accessible decision dialogs.
- `useAccessibleDecisionDialog.ts`: initial focus, focus trap, Escape handling, focus restoration, and background scroll locking shared by both dialogs.

Use the repository Tailwind CSS utilities, including the existing `animate-fade-in` utility. Do not introduce inline deployment configuration or a new styling framework.

### 4. State correctness

- After approve success, update the local application and document states using the returned contract.
- After reject success, refetch the application detail. This makes the backend response authoritative for application status, document status, rejection reason, and decision-button visibility.
- Announce success without rendering internal message codes such as `MSG114`, `MSG115`, or `MSG116`.

### 5. Accessibility

- Give both modal containers `role="dialog"`, `aria-modal="true"`, and an accessible heading.
- Focus the first meaningful control when opened, trap Tab/Shift+Tab, close with Escape while not submitting, and return focus to the opener.
- Associate the rejection label with the textarea.
- Expose the disabled approval explanation as visible text linked with `aria-describedby`.

### 6. Tests

Add component regression coverage for the valid back-link route, Business License approval guard, safe network error text, rejection success refetch, stale-action removal, success live region, modal labels, focus behavior, Escape handling, and rejection textarea label association. Add parser and proxy regressions for partial numbers, decimals, scientific notation, non-positive IDs, leading-zero aliases, and values outside JavaScript's safe-integer range.

Existing proxy, service, route, lint, type, test, and production-build checks remain part of validation.

## Verification commands

Run from the FE repository:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

After committing, rerun the checks on the exact pushed HEAD and record the SHA and remote CI result in the PR description.

## PR evidence

The PR description must include the UC-50 summary and affected routes, pushed HEAD SHA, validation commands and results, screenshots of the pending detail view and decision dialogs, and known dependencies.

## Known dependencies

- UC-51 owns rejection processing. Until its backend is complete, the reject request can return an error even though the FE handles the future success response correctly.
- The application-list route/inbound navigation is outside UC-50 and needs a separate owner/task.
- Email notification is outside this FE scope and must not be claimed by success copy.
