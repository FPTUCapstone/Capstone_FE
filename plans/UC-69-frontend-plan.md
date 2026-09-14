# Implementation Plan — UC-69 Frontend: View Audit Log Details

## Overview
This implementation plan outlines the Next.js / TypeScript frontend implementation for **UC-69: View Audit Log Details** in `Capstone_FE` (Screen #34 System Audit Log Entry Detail Drawer).

The feature enables Administrators to open a slide-over detail drawer by clicking the View Details icon button on any audit log entry in the `/admin/audit-logs` table, fetching comprehensive event details from `GET /api/v1/admin/audit-logs/{id}`.

---

## Technical Context & Decisions

1. **Framework & Styling**: Next.js App Router, TypeScript, TailwindCSS, custom glassmorphism modal styling (`#00152a`, `#102a43`, `#314863`, `#71f8e4`).
2. **Clean Architecture Separation**:
   - `types/auditLogAdmin.ts`: Added `AuditLogDetailDto` interface.
   - `services/auditLogAdminService.ts`: Centralized `getAuditLogDetail(id)` API service function fetching `/api/v1/admin/audit-logs/{id}` with Bearer token authentication.
   - `components/AuditLogDetailDrawer.tsx`: Standalone drawer modal component with backdrop blur, loading spinner, error state handling (`MSG129` for 404, `MSG126` for 403, `MSG127` for system/network failures), and `ESC` key press listener.
   - `components/AuditLogManagementView.tsx`: Integrated `selectedLogId` state and `AuditLogDetailDrawer`.
3. **Table Integration**: `AuditLogTable.tsx` passes `onViewDetail` callback from the `Actions` column eye icon button.
4. **State Audit Data Formatting & Layout Protection**:
   - `beforeData` & `afterData` strings parsed & formatted with `JSON.stringify(parsed, null, 2)` inside dark code blocks.
   - Enforced `<pre>` CSS rules (`overflow-x-auto max-w-full whitespace-pre-wrap break-words break-all`) to guarantee that long URLs (e.g. Cloudinary/S3 image links) or base64/token strings never cause horizontal drawer overflow or distort the layout boundaries.
   - Interactive "Copy" button for quick clipboard copying.
   - Graceful fallbacks when prior or post states are null (`(No prior state record)`, `(No post state record)`).
5. **System Actor Presentation**: `actorUserId === null` gracefully displays neutral badge `"System"`.
6. **Timezone & Local Formatting (CR-07)**: Uses `createdAtLocal` formatted string directly from backend (GMT+7 `dd/MM/yyyy HH:mm:ss`) alongside UTC ISO string.


---

## Proposed Component Changes

### Component 1: Types & API Service Layer
- [MODIFY] [`auditLogAdmin.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/types/auditLogAdmin.ts): Added `AuditLogDetailDto` interface.
- [MODIFY] [`auditLogAdminService.ts`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/services/auditLogAdminService.ts): Added `getAuditLogDetail(id: number)` API client function.

### Component 2: Feature UI Components
- [NEW] [`AuditLogDetailDrawer.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogDetailDrawer.tsx): Side-drawer component displaying detailed audit entry information, formatted JSON states, copy buttons, and `ESC` dismissal.
- [MODIFY] [`AuditLogManagementView.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogManagementView.tsx): Wired `selectedLogId` state and rendered `AuditLogDetailDrawer`.

### Component 3: Component Unit Tests
- [NEW] [`AuditLogDetailDrawer.test.tsx`](file:///d:/study/Project-Capstone/Capstone_FE/src/features/admin/audit-logs/components/AuditLogDetailDrawer.test.tsx): Vitest test suite covering drawer open/close, data rendering, 404 error state (`MSG129`), and close button handlers.

---

## Verification Plan

### Automated Tests
- Run TypeScript typecheck: `npm run typecheck`
- Run Vitest unit tests: `npm run test`

### Manual Verification
- Login as Administrator and navigate to `/admin/audit-logs`.
- Click the eye icon on any row in the audit log table.
- Verify drawer slides open with loading state, then populates Event Info, Actor Details, Target Object, and Before/After JSON states.
- Click "Copy" button to verify clipboard copy functionality.
- Press `ESC` or click backdrop overlay to verify drawer dismissal.
