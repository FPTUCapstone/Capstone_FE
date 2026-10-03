# UC-69 View Audit Log Details Frontend Spec

## Status

Approved & Aligned with SRS, DB Schema & Clean Architecture

## Scope

This specification defines the Next.js Frontend implementation for **UC-69: View Audit Log Details** (Screen #34 System Audit Log Entry Detail View).

It covers:
- Trigger component: `Actions` column in `AuditLogTable.tsx` (UC-68) with View Detail icon button (`visibility`).
- Centered Modal component: `AuditLogDetailModal.tsx` / `AuditLogDetailDrawer.tsx` rendering centered over `/admin/audit-logs`.
- API integration: `getAuditLogDetail(id)` in `auditLogAdminService.ts` fetching `GET /api/v1/admin/audit-logs/{id}`.
- Smart JSON Payload Extraction:
  - **Reason / Context Panel**: Extracts `reason` or `rejectionReason` key from `afterData` or `beforeData` JSON payload to display a dedicated Context Panel when present (BR-119).
  - **Event Result**: Displays "Success" pill badge for recorded entries.
  - **State Audit Data**: Color-coded Before (Amber) & After (Emerald) JSON blocks with `overflow-x-auto max-w-full whitespace-pre-wrap break-all` layout protection and copy-to-clipboard buttons.
- Actor Info Card: Full Name (`actorFullName`), Email (`actorEmail`), Role badge (`actorRole`), User ID (`actorUserId`). System-triggered actions (`actorUserId === null`) display neutral badge `"System"`.
- Error Handling:
  - HTTP 404 / `admin.audit_log_not_found`: Displays `MSG129` ("System audit log entry not found.").
  - HTTP 403 Forbidden: Displays `MSG126` ("Access denied. Administrator role required.").
  - Network/Server failure: Displays `MSG127` ("The audit log details cannot be retrieved because of a system or network failure.").

---

## Actor

- **Administrator**

---

## Component Architecture

```text
src/
├── features/admin/audit-logs/
│   ├── components/
│   │   ├── AuditLogManagementView.tsx      <-- Holds selectedLogId state & renders AuditLogDetailDrawer
│   │   ├── AuditLogTable.tsx               <-- Triggers onViewDetail callback from Actions column button
│   │   ├── AuditLogDetailDrawer.tsx        <-- Main UC-69 Detail Modal/Drawer Component
│   │   └── AuditLogDetailDrawer.test.tsx   <-- Vitest Unit Test Suite
│   ├── services/
│   │   └── auditLogAdminService.ts         <-- getAuditLogDetail(id) & devLoginAsAdmin helpers
│   └── types/
│       └── auditLogAdmin.ts                <-- AuditLogDetailDto TypeScript interface matching DB schema
```

---

## API Contract Integration

### Endpoint
```http
GET /api/v1/admin/audit-logs/{id}
Authorization: Bearer <Admin_JWT>
```

### TypeScript Data Models

```typescript
export interface AuditLogDetailDto {
  id: number;
  actionType: string;
  actorUserId: number | null;
  actorEmail: string | null;
  actorFullName: string;
  actorRole: UserRole | null;
  affectedEntity: string;
  affectedEntityId: number | null;
  beforeData: string | null;
  afterData: string | null;
  ipAddress: string | null;
  createdAtUtc: string;
  createdAtLocal: string;
}
```

---

## Acceptance Criteria

1. Clicking "View Details" on any audit log row opens the detail view overlay without navigating away from `/admin/audit-logs`.
2. Detailed information is retrieved from `GET /api/v1/admin/audit-logs/{id}`.
3. System-triggered logs (`actorUserId === null`) gracefully render the `"System"` actor badge.
4. If `afterData` or `beforeData` contains a `reason` or `rejectionReason` key, a dedicated "Reason / Context" panel is displayed.
5. `beforeData` and `afterData` are formatted as color-coded JSON blocks with copy buttons, enforced with `overflow-x-auto max-w-full whitespace-pre-wrap break-all` CSS to prevent layout distortion.
6. Pressing `ESC` or clicking the backdrop overlay closes the detail view.
7. Non-existent entry ID displays **`MSG129`** ("System audit log entry not found.").
8. Unit test suite passes 100% via `vitest`.
