# Implementation Plan — UC-69 Frontend: View Audit Log Details (SRS Aligned)

## Overview
This implementation plan outlines the Next.js / TypeScript frontend implementation for **UC-69: View Audit Log Details** in `Capstone_FE` (Screen #34 System Audit Log Entry Detail View), aligned 100% with SRS specifications.

The feature enables Administrators to open a **Centered Modal Dialog** by clicking the View Details icon button on any audit log entry in the `/admin/audit-logs` table, displaying Entry Header, Actor Panel, Target Panel, Change Table (`Field` | `Previous Value` | `New Value`), Context Panel (Reason), and `[Back to List]` / `[Copy Event Identifier]` buttons.

---

## Technical Context & Decisions

1. **Centered Modal Layout**: Replaces side-drawer with a **Centered Modal Dialog** (`max-w-4xl`, centered on screen, glassmorphism dark theme `#00152a`, `#102a43`, `#314863`, `#71f8e4`).
2. **Clean Architecture Separation**:
   - `types/auditLogAdmin.ts`: Updated `AuditLogDetailDto` and added `FieldChangeRow` interface.
   - `services/auditLogAdminService.ts`: `getAuditLogDetail(id)` fetching `/api/v1/admin/audit-logs/{id}`.
   - `components/AuditLogDetailModal.tsx`: Centered modal dialog component implementing SRS panels, BR-03 sensitive masking, MSG128 no-change notification, MSG150 404 error handling, and `[Copy Event Identifier]` button.
   - `components/AuditLogManagementView.tsx`: Integrated `selectedLogId` state and `AuditLogDetailModal`.
3. **Change Table Parser & Sensitive Masking (BR-03, BR-130)**:
   - Parses `beforeData` & `afterData` JSON strings into structured rows: `Field`, `Previous Value`, `New Value`.
   - Automatically masks sensitive keys (`password`, `token`, `secret`, `creditCard`, `cvv`, etc.) as `***MASKED***`.
   - If no field changes exist, displays **`MSG128`** ("No field changes recorded for this entry.") inside Change Table.
4. **Context Panel (BR-119)**: Displays Supplied Reason (`reason` / `note`) when present.
5. **System Actor Presentation (BR-115)**: System-triggered actions (`actorUserId === null`) display neutral badge `"System"`.
6. **Error Message Alignment**:
   - 404 Not Found -> **`MSG150`** ("The selected audit log entry does not exist.").
   - 403 Forbidden -> **`MSG126`** ("Access denied. Administrator role required.").
   - System/Network Failure -> **`MSG127`** ("The audit log details cannot be retrieved because of a system or network failure.").

---

## Proposed Component Changes

### Component 1: Types & API Service Layer
- [MODIFY] [`auditLogAdmin.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/types/auditLogAdmin.ts): Update `AuditLogDetailDto` with SRS fields (`result`, `clientPlatform`, `affectedModule`, `reason`) and add `FieldChangeRow`.
- [MODIFY] [`auditLogAdminService.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/services/auditLogAdminService.ts): Update `getAuditLogDetail` error handling for `MSG150` 404.

### Component 2: Feature UI Components
- [NEW] [`AuditLogDetailModal.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogDetailModal.tsx): Centered modal dialog implementing SRS Screen #34 layout (Header, Actor Panel, Target Panel, Change Table, Context Panel, `[Back to List]`, `[Copy Event Identifier]`).
- [MODIFY] [`AuditLogManagementView.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogManagementView.tsx): Replace drawer with `AuditLogDetailModal`.

### Component 3: Component Unit Tests
- [NEW] [`AuditLogDetailModal.test.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogDetailModal.test.tsx): Vitest unit tests covering modal open/close, Change Table parsing, BR-03 sensitive masking, MSG128 no-change alert, MSG150 404 error state, and copy identifier button.

---

## Verification Plan

### Automated Tests
- Run TypeScript typecheck: `npm run typecheck`
- Run Vitest unit tests: `npm run test`
