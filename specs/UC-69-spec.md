# UC-69 View Audit Log Details Frontend Spec

## Status

Result/Reason amendment approved by the project owner on 2026-09-18 for implementation. MSG132 catalog approval remains a separate decision.

## Scope

This specification defines the Next.js Frontend implementation for **UC-69: View Audit Log Details** (Screen #34 System Audit Log Entry Detail View).

It covers:
- Trigger component: `Actions` column in `AuditLogTable.tsx` (UC-68) with View Detail icon button (`visibility`).
- Centered Modal component: `AuditLogDetailModal.tsx` / `AuditLogDetailDrawer.tsx` rendering centered over `/admin/audit-logs`.
- API integration: `getAuditLogDetail(id)` in `auditLogAdminService.ts` fetching `GET /api/v1/admin/audit-logs/{id}`.
- Recorded audit data:
  - **Business Reason**: Render the explicit backend `reason` field only; null displays "No reason recorded". Do not infer reasons from arbitrary JSON keys.
  - **Event Result**: Render recorded `Success`/`Failure`; null displays "No recorded result". Client Platform and Affected Module are excluded from the approved amendment.
  - **State Audit Data**: Color-coded Before (Amber) & After (Emerald) JSON blocks with `overflow-x-auto max-w-full whitespace-pre-wrap break-all` layout protection and copy-to-clipboard buttons.
- Actor Info Card: Full Name (`actorFullName`), Email (`actorEmail`), Role badge (`actorRole`), User ID (`actorUserId`). System-triggered actions (`actorUserId === null`) display neutral badge `"System"`.
- Error Handling:
  - HTTP 404 / `admin.audit_log_not_found`: Displays "System audit log entry not found." (`MSG132` proposed, pending catalog approval; locked MSG129 is a success toast).
  - HTTP 403 Forbidden: Displays `MSG126` ("You do not have permission to access this function.").
  - Network/Server failure: Displays `MSG127` ("TripMate is temporarily unable to process your request. Please check your connection and try again.").

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
│   │   └── auditLogAdminService.ts         <-- getAuditLogDetail(id), authenticated session
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
  result: 'Success' | 'Failure' | null;
  reason: string | null;
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
4. Business Reason uses only the explicit `reason` field, including the null placeholder. Result displays recorded Success/Failure or the legacy null placeholder. A successfully executed rejection is Success, not Failure.
5. `beforeData` and `afterData` are formatted as color-coded JSON blocks with copy buttons, enforced with `overflow-x-auto max-w-full whitespace-pre-wrap break-all` CSS to prevent layout distortion.
6. Pressing `ESC` or clicking the backdrop overlay closes the detail view.
7. Non-existent entry ID displays "System audit log entry not found." (`MSG132` proposed; never MSG129).
8. Unit test suite passes 100% via `vitest`.
9. Both JSON blocks and their clipboard copies use the backend-masked response. The frontend must not retrieve unmasked audit payloads. Sensitive values display as `[REDACTED]`; malformed payloads may be withheld in full.
10. Failure `afterData` contains safe error metadata (`auditMetadata.errorCode`), not a successfully persisted entity snapshot. Label its block "Failure Context". Reasons support multiline text and wrapping; never render raw HTML.

## Approved FE/BE error-contract alignment (2026-09-20)

The project owner authorized correcting the four integration findings against BE `d162ba4`.

- Both audit endpoints expose ProblemDetails `errorCode` at the JSON root. Parse untrusted error responses safely.
- UC-68 list integration receives HTTP 400 with `errors` for an invalid date range. Preserve validation messages and let the administrator correct filters; do not display MSG127 or suggest retrying unchanged invalid input.
- UC-69 HTTP 401 clears the stored session through the service and redirects to `/admin/login?returnUrl=%2Fadmin%2Faudit-logs`, consistently with the list.
- Detail network/500 failures display locked MSG127, never a raw backend title or exception message. Existing 403/404 messages and stale-response protection remain applicable.
- No endpoint, schema, Result/Reason semantics, or message-catalog approval changes are included.
