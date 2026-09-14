# Implementation Plan — UC-69 Frontend: View Audit Log Details (Schema & SRS Aligned)

## Overview
This implementation plan outlines the Next.js / TypeScript frontend implementation for **UC-69: View Audit Log Details** in `Capstone_FE` (Screen #34 System Audit Log Entry Detail View), aligned 100% with DB schema and SRS requirements.

---

## Technical Directives

1. **DB Schema DTO Alignment**: `AuditLogDetailDto` matches backend DB columns directly (`id`, `actionType`, `actorUserId`, `actorEmail`, `actorFullName`, `actorRole`, `affectedEntity`, `affectedEntityId`, `beforeData`, `afterData`, `ipAddress`, `createdAtUtc`, `createdAtLocal`).
2. **Smart Payload Extraction**:
   - **Reason / Context**: Extracts `reason` or `rejectionReason` key from `afterData` or `beforeData` JSON to display a dedicated Context Panel when present (BR-119).
   - **Result**: Renders "Success" pill badge.
   - **Before / After Data**: Color-coded JSON comparison blocks (Amber for Before, Emerald for After) with copy buttons and CSS layout protection (`overflow-x-auto max-w-full whitespace-pre-wrap break-all`).
3. **Error Codes**:
   - 404 Not Found -> **`MSG129`** ("System audit log entry not found.").
   - 403 Forbidden -> **`MSG126`** ("Access denied. Administrator role required.").
   - System/Network Failure -> **`MSG127`** ("The audit log details cannot be retrieved because of a system or network failure.").

---

## Proposed Component Changes

### Component 1: Types & API Service Layer
- [MODIFY] [`auditLogAdmin.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/types/auditLogAdmin.ts): `AuditLogDetailDto` interface.
- [MODIFY] [`auditLogAdminService.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/services/auditLogAdminService.ts): `getAuditLogDetail(id)` and `devLoginAsAdmin()`.

### Component 2: Feature UI Components
- [MODIFY] [`AuditLogDetailDrawer.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogDetailDrawer.tsx): Detail view component displaying Event Info, Actor Card, Target Entity Card, Reason / Context Panel (when present in payload), color-coded JSON states, copy buttons, and `ESC` dismissal.
- [MODIFY] [`AuditLogManagementView.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogManagementView.tsx): Integrated `selectedLogId` state and `AuditLogDetailDrawer`.

### Component 3: Component Unit Tests
- [MODIFY] [`AuditLogDetailDrawer.test.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogDetailDrawer.test.tsx): Vitest unit tests.

---

## Verification Plan

### Automated Tests
- Run TypeScript typecheck: `npm run typecheck`
- Run Vitest unit tests: `npm run test`
