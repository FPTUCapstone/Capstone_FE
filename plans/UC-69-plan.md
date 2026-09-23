# Implementation Plan — UC-69 Frontend: View Audit Log Details (Schema & SRS Aligned)

## Overview
This plan describes **UC-69: View Audit Log Details** against the current API contract. The project owner approved the Result/Reason amendment on 2026-09-18. MSG132 catalog approval remains separate.

---

## Technical Directives

1. **DB Schema DTO Alignment**: `AuditLogDetailDto` matches backend DB columns directly (`id`, `actionType`, `actorUserId`, `actorEmail`, `actorFullName`, `actorRole`, `affectedEntity`, `affectedEntityId`, `beforeData`, `afterData`, `result`, `reason`, `ipAddress`, `createdAtUtc`, `createdAtLocal`).
2. **Recorded Audit Data**:
   - **Business Reason**: Read only explicit `reason`; null renders "No reason recorded". Remove JSON reason extraction.
   - **Result**: Render nullable Success/Failure through a shared feature badge; null renders "No recorded result". Do not infer legacy outcomes.
   - **Before / After Data**: Color-coded JSON comparison blocks (Amber for Before, Emerald for After) with copy buttons and CSS layout protection (`overflow-x-auto max-w-full whitespace-pre-wrap break-all`).
3. **Error Codes**:
   - 404 Not Found -> "System audit log entry not found." (`MSG132` proposed, pending catalog approval; not MSG129).
   - 403 Forbidden -> **`MSG126`** ("You do not have permission to access this function.").
   - System/Network Failure -> **`MSG127`** ("TripMate is temporarily unable to process your request. Please check your connection and try again.").

---

## Proposed Component Changes

### Component 1: Types & API Service Layer
- [MODIFY] [`auditLogAdmin.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/types/auditLogAdmin.ts): `AuditLogDetailDto` interface.
- [MODIFY] [`auditLogAdminService.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/services/auditLogAdminService.ts): `getAuditLogDetail(id)` using the authenticated session. No development login bypass.

### Component 2: Feature UI Components
- [MODIFY] [`AuditLogDetailDrawer.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogDetailDrawer.tsx): Detail view component displaying Event Info, Actor Card, Target Entity Card, Business Reason panel and recorded Result badge, color-coded JSON states, copy buttons, and `ESC` dismissal.
- [MODIFY] [`AuditLogManagementView.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogManagementView.tsx): Integrated `selectedLogId` state and `AuditLogDetailDrawer`.

### Component 3: Component Unit Tests
- [MODIFY] [`AuditLogDetailDrawer.test.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogDetailDrawer.test.tsx): Vitest unit tests.

---

## Verification Plan

### Automated Tests
- Run TypeScript typecheck: `npm run typecheck`
- Run Vitest unit tests: `npm run test`

## Approved amendment execution

1. Add `AuditLogResultReason.test.tsx` before implementation: Success/Failure/null, explicit reason/null, no legacy JSON inference, list column and Failure Context label.
2. Update `auditLogAdmin.ts` with `result: 'Success' | 'Failure' | null` in both DTOs and `reason: string | null` in detail.
3. Add `AuditLogResultBadge.tsx` shared by drawer and table. Show Business Reason even when null. Label failure afterData as Failure Context because it stores safe error metadata rather than saved state.
4. Keep service requests and auth unchanged. No new route, Result filter, Client Platform or Affected Module.
5. Run focused Vitest, lint, typecheck and production build. Review requirements first, then code quality.

## Approved error-contract correction (2026-09-20)

1. Add failing service tests for root-level ProblemDetails codes, HTTP 400 validation errors, malformed responses and HTTP 401 session cleanup; add UI regressions for list validation and detail 401/500/network failures.
2. Update `services/auditLogAdminService.ts` to normalize the existing backend error contract.
3. Update `AuditLogManagementView.tsx` to distinguish correctable filter validation from server failure; update `AuditLogDetailDrawer.tsx` to redirect expired sessions and keep server errors on MSG127.
4. Preserve existing successful data rendering, 403/404 behavior, and guards against stale responses. Update affected test mocks for App Router navigation.
5. Review spec compliance and code quality; run focused tests, full `npm test`, lint, typecheck and build. Report local results separately from remote CI; do not claim merge readiness without remote evidence.
